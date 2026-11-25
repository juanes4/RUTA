import { ajustesSimulados, diagnosticoParaComparar, validarAjustes } from './ajustes.mjs';
import { enmascarar, prepararBuzon } from './anonimizar.mjs';
import { BUZON_PRUEBA, EMPRESA_PRUEBA, esRespuestaDePrueba } from './buzonPrueba.mjs';
import { ESQUEMA_CLASIFICACION, ESQUEMA_DOSSIER, ESQUEMA_LIENZO, ESQUEMA_SINTESIS_BUZON, ESQUEMA_TRIAJE } from './esquemas.mjs';
import { configGemini, ErrorGemini, generar } from './gemini.mjs';
import { construirInforme, validarClasificacion } from './informe.mjs';
import { INSTRUCCION_CLASIFICAR, INSTRUCCION_DOSSIER, INSTRUCCION_EXTRAER_LIENZO, INSTRUCCION_LIENZO, INSTRUCCION_SINTESIS_BUZON, INSTRUCCION_TRIAJE, instruccionSistema } from './prompt.mjs';
import { NOMBRE_TEMA, OTRO } from './taxonomia.mjs';
import { clasificarSimulado, dossierSimulado, ErrorSimulado, extraerLienzoSimulado, lienzoSimulado, triajeSimulado } from './simulado.mjs';

/** El cuerpo del copiloto lleva el buzón y la conversación: más grande que el del resto de la API. */
export const LIMITE_CUERPO_COPILOTO = 400_000;
const MAX_FILAS = 2_000;
const MAX_MENSAJES = 120;
const MAX_TEXTO = 8_000;

/**
 * El buzón se clasifica en lotes en paralelo: la respuesta de Gemini es una fila
 * por respuesta y pregunta, y escribir una sola salida larga es lo que más
 * demora. Pocos lotes, para no chocar con el límite de solicitudes por minuto.
 */
const MAX_LOTES = 6;
const MINIMO_POR_LOTE = 12;
/** Textos por tema que van a la síntesis: suficientes para resumir, sin alargar la solicitud. */
const MAX_TEXTOS_POR_TEMA = 30;

/** Parte las filas en lotes parecidos. */
export function enLotes(filas, maxLotes = MAX_LOTES, minimo = MINIMO_POR_LOTE) {
  const cantidad = Math.max(1, Math.min(maxLotes, Math.ceil(filas.length / minimo)));
  const tamano = Math.ceil(filas.length / cantidad);
  const lotes = [];
  for (let i = 0; i < filas.length; i += tamano) lotes.push(filas.slice(i, i + tamano));
  return lotes;
}

/** Lo que recibe la síntesis: por tema, cuántas lo mencionan y algunos textos de P1 y P2; y P3 con su id. */
function entradaSintesis(clasificacion, filasEnviadas) {
  const porId = new Map(filasEnviadas.map((f) => [f.id, f]));
  const temas = {};
  const vistas = new Set();
  for (const c of clasificacion) {
    const fila = porId.get(c?.id);
    if (!fila || (c.pregunta !== 'p1' && c.pregunta !== 'p2') || !String(fila[c.pregunta] ?? '').trim()) continue;
    if (vistas.has(`${c.id}|${c.pregunta}`)) continue;
    vistas.add(`${c.id}|${c.pregunta}`);
    for (const codigo of new Set(c.temas ?? [])) {
      if (codigo === OTRO || !NOMBRE_TEMA[codigo]) continue;
      temas[codigo] ??= { tema: NOMBRE_TEMA[codigo], menciones_p1: 0, menciones_p2: 0, intensidad_fuerte: 0, p1: [], p2: [] };
      const t = temas[codigo];
      t[`menciones_${c.pregunta}`] += 1;
      if (Number(c.intensidad) === 3) t.intensidad_fuerte += 1;
      // Los textos que permiten reconocer a alguien no se mandan a resumir.
      if (!c.identificable && t[c.pregunta].length < MAX_TEXTOS_POR_TEMA) t[c.pregunta].push(fila[c.pregunta]);
    }
  }
  const p3 = filasEnviadas.filter((f) => String(f.p3 ?? '').trim()).map((f) => ({ id: f.id, texto: f.p3 }));
  return { temas, p3 };
}

/** Interruptor de datos reales: solo con RUTA_IA_DATOS_REALES=permitido salen respuestas reales hacia Gemini. */
export const datosRealesPermitidos = (env = process.env) => String(env.RUTA_IA_DATOS_REALES ?? '').trim() === 'permitido';

class ErrorPeticion extends Error {
  constructor(mensaje, estado = 400, extra = {}) {
    super(mensaje);
    this.estado = estado;
    this.extra = extra;
  }
}

const texto = (v, max = MAX_TEXTO) => String(v ?? '').slice(0, max);

/** Enmascara todas las cadenas de un objeto (lienzo, triaje, informe, empresa). Se aplica siempre. */
function enmascararTodo(valor) {
  if (typeof valor === 'string') return enmascarar(valor).texto;
  if (Array.isArray(valor)) return valor.map(enmascararTodo);
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, enmascararTodo(v)]));
  return valor;
}

function leerFilas(buzon) {
  if (!Array.isArray(buzon)) throw new ErrorPeticion('Falta el buzón.');
  if (buzon.length > MAX_FILAS) throw new ErrorPeticion(`El buzón tiene más de ${MAX_FILAS} respuestas.`);
  return buzon.map((f, i) => ({
    id: texto(f?.id, 80) || `fila-${i + 1}`,
    fecha: texto(f?.fecha, 10),
    area: texto(f?.area, 120),
    grupo: texto(f?.grupo, 60),
    p1: texto(f?.p1),
    p2: texto(f?.p2),
    p3: texto(f?.p3),
  }));
}

function leerMensajes(mensajes) {
  if (!Array.isArray(mensajes)) throw new ErrorPeticion('Falta la conversación.');
  return mensajes.slice(-MAX_MENSAJES).map((m) => ({ rol: m?.rol === 'copiloto' ? 'copiloto' : 'usuario', texto: enmascarar(texto(m?.texto)).texto }));
}

/** Bloqueo: sin contrato de datos, solo el buzón de prueba puede salir hacia Gemini. */
function verificarBuzon(filas, env) {
  if (datosRealesPermitidos(env)) return;
  const reales = filas.filter((f) => !esRespuestaDePrueba(f)).length;
  if (reales > 0) {
    throw new ErrorPeticion(
      `Este buzón tiene ${reales} respuestas que no son del buzón de prueba. Hasta tener un contrato de datos, el servidor solo envía a Gemini el buzón de prueba (RUTA_IA_DATOS_REALES no está en "permitido"). Puedes usar el modo simulado o cargar el buzón de prueba.`,
      403,
      { bloqueado: true },
    );
  }
}

/** Ejecuta con Gemini o con el modo simulado. Si Gemini no está o falla, el error dice que el simulado está disponible. */
async function conModo(modo, gemini, simulado) {
  if (modo === 'simulado') {
    try {
      return { modo: 'simulado', resultado: simulado() };
    } catch (e) {
      if (e instanceof ErrorSimulado) throw new ErrorPeticion(e.message, 422);
      throw e;
    }
  }
  try {
    return { modo: 'gemini', resultado: await gemini() };
  } catch (e) {
    if (e instanceof ErrorGemini) throw new ErrorPeticion(e.message, e.estado, { puedeSimular: true });
    throw e;
  }
}

/** Resumen del informe que acompaña al lienzo, el triaje y el dossier (agregado: sin respuestas individuales). */
const resumenInforme = (informe) =>
  informe
    ? {
        participacion: informe.participacion,
        respondidas: informe.respondidas,
        temas: informe.temas,
        alertas: informe.alertas,
        revision: informe.revision,
        diferencias: { grupo: informe.diferencias?.grupo?.diferencias ?? [], area: informe.diferencias?.area?.diferencias ?? [] },
        propuestas: informe.propuestas,
        lectura: informe.lectura,
      }
    : null;

function leerContexto(c) {
  return enmascararTodo({
    empresa: { nombre: texto(c?.empresa?.nombre, 200), sector: texto(c?.empresa?.sector, 200), que_cambia: texto(c?.empresa?.que_cambia, 1000) },
    areas: Array.isArray(c?.areas) ? c.areas.slice(0, 100).map((a) => ({ area: texto(a?.area, 120), afectados: Number(a?.afectados) || 0 })) : [],
    lienzo: c?.lienzo ?? null,
    triaje: c?.triaje ?? null,
    ruta: texto(c?.ruta, 200),
    informe: resumenInforme(c?.informe),
  });
}

/**
 * Rutas del Copiloto de Reconocimiento (etapa R). Solo para líderes.
 * Cada respuesta dice con qué modo se hizo ("gemini" o "simulado").
 */
export function rutasCopiloto({ sesionDe, enviar, leerJson, env = process.env, generarImpl = generar }) {
  const exigirLider = (req, res) => {
    const u = sesionDe(req);
    if (!u) enviar(res, 401, { error: 'Inicia sesión.' });
    else if (u.rol !== 'lider') enviar(res, 403, { error: 'El copiloto es solo para el equipo de gestión del cambio (rol líder).' });
    return u?.rol === 'lider' ? u : null;
  };

  const atender = (fn) => async (req, res) => {
    if (!exigirLider(req, res)) return;
    try {
      const cuerpo = req.method === 'POST' ? await leerJson(req, LIMITE_CUERPO_COPILOTO) : {};
      // El registro anota qué modelo de Gemini respondió (puede ser uno de respaldo).
      const registro = {};
      const resultado = await fn(cuerpo, registro);
      enviar(res, 200, registro.modelo ? { ...resultado, modelo: registro.modelo } : resultado);
    } catch (e) {
      if (e instanceof ErrorPeticion) return enviar(res, e.estado, { error: e.message, ...e.extra });
      throw e;
    }
  };

  const llamar = (registro, tarea, contexto, contenidos, esquema) =>
    generarImpl({ sistema: instruccionSistema(tarea, contexto), contenidos, esquema, env, registro });

  return {
    'GET /api/copiloto/estado': atender(async () => {
      const { configurado, modelo, modelos, faltan } = configGemini(env);
      return { gemini: { configurado, modelo, respaldos: modelos.slice(1), faltan }, datosReales: datosRealesPermitidos(env) };
    }),

    'GET /api/copiloto/buzon-prueba': atender(async () => ({ empresa: EMPRESA_PRUEBA, filas: BUZON_PRUEBA })),

    /** Paso 1: clasificación (Gemini o referencia) e informe calculado en código. */
    'POST /api/copiloto/buzon': atender(async ({ modo, buzon, areas, contexto }, registro) => {
      const filas = leerFilas(buzon);
      if (filas.length === 0) throw new ErrorPeticion('El buzón está vacío: registra o carga respuestas en R5.');
      // El lienzo y el triaje ya existen: el buzón se compara con ellos y propone ajustes.
      const ctx = leerContexto(contexto);
      const listaAreas = Array.isArray(areas) ? areas.map((a) => ({ area: texto(a?.area, 120), afectados: Number(a?.afectados) || 0 })) : [];
      const preparado = prepararBuzon(filas);
      const { modo: usado, resultado } = await conModo(
        modo,
        async () => {
          verificarBuzon(filas, env);
          // 1) Clasificar por lotes, en paralelo.
          const lotes = await Promise.all(
            enLotes(preparado.filas).map((lote) =>
              llamar(registro, INSTRUCCION_CLASIFICAR, { respuestas: lote }, [{ rol: 'usuario', texto: 'Clasifica todas las respuestas de esta tabla.' }], ESQUEMA_CLASIFICACION),
            ),
          );
          const clasificadas = lotes.flatMap((r) => r?.clasificacion ?? []);
          // 2) Sintetizar con el buzón ya clasificado y compararlo con el diagnóstico (una salida corta).
          const r = await llamar(
            registro,
            INSTRUCCION_SINTESIS_BUZON,
            { ...entradaSintesis(clasificadas, preparado.filas), diagnostico: diagnosticoParaComparar(ctx) },
            [{ rol: 'usuario', texto: 'Sintetiza el buzón.' }],
            ESQUEMA_SINTESIS_BUZON,
          );
          // Vuelve de los ids cortos (R01…) a los ids del buzón.
          const original = (id) => preparado.idOriginal.get(id) ?? id;
          return {
            clasificacion: clasificadas.map((c) => ({ ...c, id: original(c.id) })),
            sintesis: Object.fromEntries((r?.sintesis ?? []).map((s) => [s.codigo, s.frase])),
            propuestas: (r?.propuestas ?? []).map((p) => ({ idea: p.idea, ids: (p.ids ?? []).map(original) })),
            lectura: r?.lectura ?? [],
            ajustes: r?.ajustes ?? null,
          };
        },
        () => clasificarSimulado(filas),
      );
      const informe = construirInforme({ filas, areas: listaAreas, ...resultado });
      // Para auditar: el texto ya enmascarado, sin área ni grupo.
      const textoDe = new Map(preparado.filas.map((f, i) => [filas[i].id, f]));
      const clasificacion = validarClasificacion(resultado.clasificacion, filas).map((c) => ({ id: c.id, pregunta: c.pregunta, texto: textoDe.get(c.id)[c.pregunta], temas: c.temas, otro: c.otro, sentimiento: c.sentimiento, intensidad: c.intensidad, revision: c.revision, identificable: c.identificable }),
      );
      const ajustes = validarAjustes(usado === 'gemini' ? resultado.ajustes : ajustesSimulados(informe, ctx), ctx);
      return { modo: usado, informe, clasificacion, enmascarados: preparado.enmascarados, ajustes };
    }),

    /** Paso 2: un turno de la entrevista del lienzo. */
    'POST /api/copiloto/lienzo': atender(async ({ modo, mensajes, contexto }, registro) => {
      const conversacion = leerMensajes(mensajes);
      if (conversacion[0]?.rol !== 'usuario') throw new ErrorPeticion('La conversación debe empezar con un mensaje de la persona.');
      const ctx = leerContexto(contexto);
      const { modo: usado, resultado } = await conModo(
        modo,
        () => llamar(registro, INSTRUCCION_LIENZO, ctx, conversacion),
        () => lienzoSimulado(conversacion),
      );
      return { modo: usado, texto: resultado };
    }),

    /** Paso 2: ficha del cambio en JSON, para el botón "Pasar a R1". */
    'POST /api/copiloto/extraer-lienzo': atender(async ({ modo, mensajes, contexto }, registro) => {
      const conversacion = leerMensajes(mensajes);
      if (conversacion.length < 2) throw new ErrorPeticion('Todavía no hay conversación del lienzo.');
      const ctx = leerContexto(contexto);
      const transcripcion = conversacion.map((m) => `${m.rol === 'copiloto' ? 'Copiloto' : 'Persona'}: ${m.texto}`).join('\n\n');
      const { modo: usado, resultado } = await conModo(
        modo,
        () => llamar(registro, INSTRUCCION_EXTRAER_LIENZO, ctx, [{ rol: 'usuario', texto: `Conversación del lienzo:\n\n${transcripcion}` }], ESQUEMA_LIENZO),
        () => extraerLienzoSimulado(conversacion),
      );
      return { modo: usado, lienzo: resultado };
    }),

    /** Paso 3: propuesta de puntajes. La suma y el semáforo los calcula la app. */
    'POST /api/copiloto/triaje': atender(async ({ modo, contexto }, registro) => {
      const ctx = leerContexto(contexto);
      const { modo: usado, resultado } = await conModo(
        modo,
        () => llamar(registro, INSTRUCCION_TRIAJE, ctx, [{ rol: 'usuario', texto: 'Propón el triaje del cambio.' }], ESQUEMA_TRIAJE),
        () => triajeSimulado(ctx),
      );
      return { modo: usado, propuesta: resultado };
    }),

    /** Paso 4: resumen, recomendaciones, vocero y preguntas de los jefes. El resto del dossier lo arma la app. */
    'POST /api/copiloto/dossier': atender(async ({ modo, contexto }, registro) => {
      const ctx = leerContexto(contexto);
      const { modo: usado, resultado } = await conModo(
        modo,
        () => llamar(registro, INSTRUCCION_DOSSIER, ctx, [{ rol: 'usuario', texto: 'Escribe las partes del dossier que te corresponden.' }], ESQUEMA_DOSSIER),
        () => dossierSimulado(ctx),
      );
      return { modo: usado, dossier: resultado };
    }),
  };
}
