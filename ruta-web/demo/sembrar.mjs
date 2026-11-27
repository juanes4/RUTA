/**
 * Recorre la metodología RUTA completa con el caso ficticio de Bancolombia (demo/casoBancolombia.mjs),
 * usando la API real de la app y Gemini en cada herramienta de IA. Nada se escribe a mano en la base:
 * todo pasa por los mismos endpoints que usa el navegador, con las mismas reglas.
 *
 *   node demo/sembrar.mjs              continúa donde quedó (cada paso terminado queda en demo/salida/progreso.json)
 *   node demo/sembrar.mjs --desde-cero borra la base de la demo y el progreso, y empieza de nuevo
 *
 * Resultado:
 *   - server/data/demo-bancolombia.db   base SQLite de la demo (usuarios, buzón en la app, etapas T y A, Coach, preguntas IA)
 *   - public/demo/bancolombia.json      lo que vive en el navegador (etapas 0, R y U, copiloto, chats) para la página de carga
 *
 * Si Gemini falla (saturado, sin cuota, error), se reintenta con espera creciente. Nunca se acepta el modo simulado
 * ni el motor local: el paso se repite hasta que la respuesta venga de Gemini.
 */
import { randomUUID } from 'node:crypto';
import { createServer as crearHttp } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as crearVite, loadEnv } from 'vite';
import * as caso from './casoBancolombia.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DB_DEMO = resolve(RAIZ, 'server/data/demo-bancolombia.db');
const PROGRESO = resolve(RAIZ, 'demo/salida/progreso.json');
const REGISTRO = resolve(RAIZ, 'demo/salida/registro.log');
const SALIDA_NAVEGADOR = resolve(RAIZ, 'public/demo/bancolombia.json');

process.chdir(RAIZ);
mkdirSync(dirname(PROGRESO), { recursive: true });
mkdirSync(dirname(SALIDA_NAVEGADOR), { recursive: true });

if (process.argv.includes('--desde-cero')) {
  for (const f of [DB_DEMO, `${DB_DEMO}-wal`, `${DB_DEMO}-shm`, PROGRESO, REGISTRO]) rmSync(f, { force: true });
}

const log = (...partes) => {
  const linea = partes.join(' ');
  console.log(linea);
  writeFileSync(REGISTRO, `${new Date().toISOString()}  ${linea}\n`, { flag: 'a' });
};
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Entorno: las mismas variables que usa la app (GEMINI_*, RUTA_*) ---------- */

const env = loadEnv('development', RAIZ, ['GEMINI_', 'RUTA_']);
for (const [k, v] of Object.entries(env)) process.env[k] ??= v;
process.env.RUTA_DB = DB_DEMO;
if (!process.env.GEMINI_API_KEY) throw new Error('Falta GEMINI_API_KEY en ruta-web/.env');
// El buzón de este caso es inventado (ninguna respuesta es de una persona real): solo en este proceso se autoriza enviarlo a Gemini.
const envApi = { ...env, RUTA_IA_DATOS_REALES: 'permitido' };

const { abrirBase } = await import('../server/db.mjs');
const { crearApi } = await import('../server/api.mjs');
const { hashClave } = await import('../server/clave.mjs');
const { preguntasDe } = await import('../server/simulador.mjs');

const db = await abrirBase(DB_DEMO);
const api = crearApi(db, { env: envApi });
const servidor = crearHttp((req, res) => {
  api(req, res)
    .then((atendida) => {
      if (!atendida) {
        res.writeHead(404);
        res.end();
      }
    })
    .catch((e) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e?.message ?? e) }));
    });
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;

/* ---------- Lógica del navegador (TypeScript) cargada tal cual con Vite ---------- */

const vite = await crearVite({
  root: RAIZ,
  configFile: false,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
});
const L = await vite.ssrLoadModule('/src/lib/copiloto/logica.ts');
const N = await vite.ssrLoadModule('/src/lib/copiloto/normalizar.ts');
const { REGLAS } = await vite.ssrLoadModule('/src/config/reglas.ts');
const { DATOS_VACIOS } = await vite.ssrLoadModule('/src/lib/modelo/proyecto.ts');
const { fusionarBuzon1 } = await vite.ssrLoadModule('/src/lib/captura/buzon1Csv.ts');
const { resumirLiderazgo } = await vite.ssrLoadModule('/src/lib/calculo/liderazgo.ts');

/* ---------- Cliente HTTP con sesión ---------- */

class ErrorHttp extends Error {
  constructor(estado, mensaje) {
    super(`HTTP ${estado}: ${mensaje}`);
    this.estado = estado;
  }
}

class Cliente {
  constructor(usuario) {
    this.usuario = usuario;
    this.cookie = '';
  }
  async entrar() {
    const r = await fetch(`${BASE}/api/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ usuario: this.usuario, clave: caso.CLAVE_DEMO }),
    });
    if (!r.ok) throw new ErrorHttp(r.status, `no se pudo entrar como ${this.usuario}`);
    this.cookie = (r.headers.get('set-cookie') ?? '').split(';')[0];
    this.datos = (await r.json()).usuario;
    return this;
  }
  async pedir(metodo, ruta, cuerpo) {
    const r = await fetch(`${BASE}${ruta}`, {
      method: metodo,
      headers: { cookie: this.cookie, ...(cuerpo !== undefined ? { 'content-type': 'application/json' } : {}) },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
    const datos = await r.json().catch(() => null);
    if (!r.ok) throw new ErrorHttp(r.status, datos?.error ?? r.statusText);
    return datos;
  }
  get = (ruta) => this.pedir('GET', ruta);
  post = (ruta, cuerpo) => this.pedir('POST', ruta, cuerpo ?? {});
}

/** Llama a una herramienta de IA hasta que responda Gemini (no el modo simulado ni el motor local). */
async function conIA(nombre, fn, esDeGemini, maxIntentos = 15) {
  for (let i = 1; ; i++) {
    const t0 = Date.now();
    try {
      const r = await fn();
      const seg = ((Date.now() - t0) / 1000).toFixed(1);
      if (esDeGemini(r)) {
        log(`    ✓ ${nombre} · Gemini respondió en ${seg} s${r?.modelo ? ` (${r.modelo})` : ''}`);
        return r;
      }
      log(`    ↻ ${nombre}: la respuesta no vino de Gemini (intento ${i}); se repite.`);
    } catch (e) {
      log(`    ↻ ${nombre}: ${e.message} (intento ${i}); se repite.`);
    }
    if (i >= maxIntentos) throw new Error(`${nombre}: Gemini no respondió después de ${i} intentos. Vuelve a correr el script: continúa desde este paso.`);
    await esperar(Math.min(60, 5 * i) * 1000);
  }
}

/* ---------- Progreso (para continuar si algo falla) ---------- */

const estado = existsSync(PROGRESO)
  ? JSON.parse(readFileSync(PROGRESO, 'utf8'))
  : {
      hechos: [],
      proyecto: null,
      datos: null,
      extras: { coach: null, asistenteA: [], resumenT2: null },
    };
const guardar = () => writeFileSync(PROGRESO, JSON.stringify(estado, null, 2));

async function paso(nombre, fn) {
  if (estado.hechos.includes(nombre)) {
    log(`• ${nombre} (ya estaba hecho)`);
    return;
  }
  log(`• ${nombre}`);
  await fn();
  estado.hechos.push(nombre);
  guardar();
}

const contexto = () => L.contextoCopiloto(estado.proyecto, estado.datos, REGLAS.triaje);
const nombresAreas = caso.AREAS.map((a) => a.area);

/* ================================================================== */
/* Usuarios                                                           */
/* ================================================================== */

await paso('Usuarios de la demo', async () => {
  const insertar = db.prepare('INSERT OR IGNORE INTO usuarios (usuario, nombre, rol, clave_hash) VALUES (?, ?, ?, ?)');
  for (const u of caso.USUARIOS_EXTRA) insertar.run(u.usuario, u.nombre, 'empleado', hashClave(caso.CLAVE_DEMO));
  log(`    ${db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n} usuarios (1 líder y 8 colaboradores), clave ${caso.CLAVE_DEMO}`);
});

const clientes = {};
for (const u of caso.TODOS) clientes[u] = await new Cliente(u).entrar();
const lider = clientes.lider;

/* ================================================================== */
/* Etapa 0                                                            */
/* ================================================================== */

await paso('Etapa 0 · 0.1 Empresa y cambio · 0.2 Áreas y afectados', async () => {
  estado.proyecto = {
    id: caso.ID_PROYECTO,
    creado: '2026-07-01T13:00:00.000Z',
    actualizado: '2026-07-01T13:00:00.000Z',
    empresa: { ...caso.EMPRESA },
    segmentacion: { areas: caso.AREAS.map((a) => ({ ...a })) },
  };
  estado.datos = structuredClone(DATOS_VACIOS);
});

/* ================================================================== */
/* Etapa R · Copiloto de Reconocimiento                               */
/* ================================================================== */

await paso('R1 · Entrevista del lienzo con el copiloto (Gemini)', async () => {
  const cop = estado.datos.copiloto;
  cop.modoLienzo = 'gemini';
  const veces = estado.vecesBloque ?? (estado.vecesBloque = {});
  const turno = async (texto) => {
    cop.mensajesLienzo.push({ rol: 'usuario', texto });
    guardar();
    const r = await conIA(
      `lienzo, turno ${cop.mensajesLienzo.length}`,
      () => lider.post('/api/copiloto/lienzo', { modo: 'gemini', mensajes: cop.mensajesLienzo, contexto: contexto() }),
      (x) => x?.modo === 'gemini' && typeof x.texto === 'string' && x.texto.trim().length > 0,
    );
    cop.mensajesLienzo.push({ rol: 'copiloto', texto: r.texto });
    guardar();
    return r.texto;
  };

  // Si quedó a medias con el último mensaje de la persona sin respuesta, se pide la respuesta otra vez.
  if (cop.mensajesLienzo.at(-1)?.rol === 'usuario') cop.mensajesLienzo.pop();
  let ultimo = cop.mensajesLienzo.at(-1)?.texto ?? (await turno(caso.INICIO_LIENZO));
  let cerrado = cop.mensajesLienzo.some((m) => m.rol === 'usuario' && m.texto === caso.CIERRE_LIENZO);

  for (let i = 0; i < 24 && !cerrado; i++) {
    const muestraFicha = /pasar a r1/i.test(ultimo) || /ficha del cambio/i.test(ultimo);
    const bloque = /bloque\s*(\d)\s*de\s*7/i.exec(ultimo)?.[1];
    if (muestraFicha && (veces[7] ?? 0) > 0) {
      ultimo = await turno(caso.CIERRE_LIENZO);
      cerrado = true;
      break;
    }
    const n = Number(bloque ?? 0);
    if (!caso.RESPUESTAS_LIENZO[n]) {
      // Mensaje fuera del flujo (por ejemplo, una aclaración): se pide seguir con el bloque pendiente.
      ultimo = await turno('Sigamos con el siguiente bloque del lienzo, por favor.');
      continue;
    }
    const k = (veces[n] = (veces[n] ?? 0) + 1) - 1;
    const respuesta = k === 0 ? caso.RESPUESTAS_LIENZO[n].principal : k === 1 ? caso.RESPUESTAS_LIENZO[n].complemento : caso.REPREGUNTA_AGOTADA;
    log(`    bloque ${n} · ${k === 0 ? 'respuesta' : k === 1 ? 'complemento a la repregunta' : 'cierre del bloque'}`);
    ultimo = await turno(respuesta);
  }
  log(`    conversación del lienzo: ${cop.mensajesLienzo.length} mensajes`);
});

await paso('R1 · Pasar la ficha del cambio a R1 (Gemini extrae la ficha)', async () => {
  const r = await conIA(
    'extraer ficha del lienzo',
    () => lider.post('/api/copiloto/extraer-lienzo', { modo: 'gemini', mensajes: estado.datos.copiloto.mensajesLienzo, contexto: contexto() }),
    (x) => x?.modo === 'gemini' && x.lienzo,
  );
  const ficha = N.normalizarPropuestaLienzo(r.lienzo);
  const { lienzo, cambios } = L.aplicarLienzo(estado.datos.lienzo, ficha);
  estado.datos.lienzo = lienzo;
  estado.datos.copiloto.estadosLienzo = ficha.estados;
  log(`    campos llenados en R1: ${cambios.map((c) => c.campo).join(', ')}`);
});

await paso('R2 · Triaje propuesto por el copiloto y pasado a R2 (Gemini)', async () => {
  const r = await conIA(
    'triaje',
    () => lider.post('/api/copiloto/triaje', { modo: 'gemini', contexto: contexto() }),
    (x) => x?.modo === 'gemini' && x.propuesta,
  );
  const propuesta = N.normalizarPropuestaTriaje(r.propuesta);
  if (!propuesta) throw new Error('El triaje no vino en el formato esperado.');
  estado.datos.copiloto.triaje = { propuesta, modo: r.modo, ...(r.modelo ? { modelo: r.modelo } : {}), fecha: '2026-07-03T15:00:00.000Z' };
  estado.datos.triaje = L.aplicarTriaje(estado.datos.triaje, propuesta);
  log(`    ruta del triaje: ${L.rutaDeTriaje(estado.datos.triaje, REGLAS.triaje).texto}`);
});

await paso('R3 · FODA del cambio', async () => {
  estado.datos.foda = caso.FODA.map((f) => ({ id: randomUUID(), ...f }));
});

await paso('R4 · Mapa de actores', async () => {
  estado.datos.actores = caso.ACTORES.map((a) => ({ id: randomUUID(), ...a }));
});

await paso('R5 · Buzón en la app: abrir, responder (8 colaboradores, anónimo) y cerrar', async () => {
  const ids = caso.EMPLEADOS.map((u) => clientes[u].datos.id);
  await lider.post('/api/buzon/abrir', { buzon: caso.ID_PROYECTO, empresa: caso.EMPRESA.nombre, areas: nombresAreas, convocados: ids });
  for (const [u, i] of Object.entries(caso.BUZON_EN_APP)) {
    const f = caso.BUZON[i];
    await clientes[u].post('/api/buzon/responder', { buzon: caso.ID_PROYECTO, area: f.area, grupo: f.grupo, p1: f.p1, p2: f.p2, p3: f.p3 });
  }
  await lider.post('/api/buzon/cerrar', { buzon: caso.ID_PROYECTO });
  // Fechas de la escucha inicial (julio de 2026) en lugar de la fecha en que corre el script.
  const anonimas = db.prepare('SELECT id FROM buzon_anonimas WHERE buzon_id = ?').all(caso.ID_PROYECTO);
  anonimas.forEach((a, i) => db.prepare('UPDATE buzon_anonimas SET fecha = ? WHERE buzon_id = ? AND id = ?').run(caso.FECHAS_BUZON[i % caso.FECHAS_BUZON.length], caso.ID_PROYECTO, a.id));
  db.prepare('UPDATE buzones_app SET abierto_en = ?, cerrado_en = ? WHERE buzon_id = ?').run(caso.BUZON_ABIERTO_EN, caso.BUZON_CERRADO_EN, caso.ID_PROYECTO);
  const e = await lider.get(`/api/buzon/estado?buzon=${caso.ID_PROYECTO}`);
  log(`    buzón en la app: ${e.estado}, ${e.respuestas} de ${e.convocados} convocados respondieron`);
});

await paso('R5 · Traer las respuestas de la app y digitar las de papel', async () => {
  const { filas } = await lider.get(`/api/buzon/respuestas?buzon=${caso.ID_PROYECTO}`);
  const desdeApp = L.filasDesdeCopiloto(filas, estado.proyecto.segmentacion.areas);
  if (desdeApp.areasFaltantes.length) throw new Error(`Áreas que no están en la Etapa 0: ${desdeApp.areasFaltantes.join(', ')}`);
  const enApp = new Set(Object.values(caso.BUZON_EN_APP));
  const papel = caso.BUZON.map((f, i) => ({ f, i }))
    .filter(({ i }) => !enApp.has(i))
    .map(({ f, i }) => ({ id: randomUUID(), fecha: caso.FECHAS_BUZON[i % caso.FECHAS_BUZON.length], area: f.area, grupo: f.grupo, falla: f.p1, preocupa: f.p2, harias: f.p3 }));
  estado.datos.buzon1 = fusionarBuzon1(fusionarBuzon1(estado.datos.buzon1, desdeApp.filas), papel);
  log(`    R5: ${desdeApp.filas.length} respuestas de la app + ${papel.length} en papel = ${estado.datos.buzon1.length}`);
});

await paso('R · Copiloto: análisis del buzón (Gemini clasifica, sintetiza y propone ajustes)', async () => {
  const r = await conIA(
    'análisis del buzón',
    () =>
      lider.post('/api/copiloto/buzon', {
        modo: 'gemini',
        buzon: L.filasParaCopiloto(estado.datos.buzon1),
        areas: estado.proyecto.segmentacion.areas,
        contexto: contexto(),
      }),
    (x) => x?.modo === 'gemini' && x.informe,
    10,
  );
  const resultado = N.normalizarResultadoBuzon(r);
  if (!resultado) throw new Error('El informe del buzón no vino en el formato esperado.');
  estado.datos.copiloto.informe = { resultado, fecha: '2026-07-20T15:00:00.000Z', decididos: [] };
  const t = resultado.informe.temas.slice(0, 4).map((x) => `${x.tema} (${x.total})`).join(', ');
  log(`    temas principales: ${t}`);
  log(`    enmascarados: ${JSON.stringify(resultado.enmascarados)} · revisión humana: ${resultado.informe.revision.map((x) => `${x.nombre} ${x.cantidad}`).join(', ') || 'ninguna'}`);
});

await paso('R · Aceptar los ajustes que propone el buzón (riesgos a R1, puntajes a R2)', async () => {
  const inf = estado.datos.copiloto.informe;
  const { riesgos, triaje } = inf.resultado.ajustes;
  const antes = L.rutaDeTriaje(estado.datos.triaje, REGLAS.triaje).texto;
  estado.datos.lienzo = L.aplicarRiesgos(estado.datos.lienzo, riesgos);
  estado.datos.triaje = L.aplicarAjustesTriaje(estado.datos.triaje, triaje);
  inf.decididos = [...new Set([...inf.decididos, ...riesgos.map(L.claveAjuste), ...triaje.map(L.claveAjuste)])];
  log(`    ${riesgos.length} riesgos pasados a R1 y ${triaje.length} ajustes de puntaje en R2 · triaje: ${antes} → ${L.rutaDeTriaje(estado.datos.triaje, REGLAS.triaje).texto}`);
});

await paso('R · Copiloto: dossier de reconocimiento para la etapa U (Gemini)', async () => {
  const r = await conIA(
    'dossier',
    () => lider.post('/api/copiloto/dossier', { modo: 'gemini', contexto: contexto() }),
    (x) => x?.modo === 'gemini' && x.dossier,
  );
  const partes = N.normalizarPartesDossier(r.dossier);
  if (!partes) throw new Error('El dossier no vino en el formato esperado.');
  estado.datos.copiloto.dossier = { partes, modo: r.modo, ...(r.modelo ? { modelo: r.modelo } : {}), fecha: '2026-07-21T15:00:00.000Z' };
  log(`    vocero recomendado: ${partes.vocero.perfil}`);
});

/* ================================================================== */
/* Etapa U                                                            */
/* ================================================================== */

await paso('U1 · Encuestas de liderazgo · U2 Narrativa · U3 Soporte · U4 Empatía', async () => {
  estado.datos.liderazgo = caso.LIDERAZGO.map((l) => ({ id: randomUUID(), ...l }));
  estado.datos.narrativa = { ...caso.NARRATIVA };
  estado.datos.soporte = structuredClone(caso.SOPORTE);
  estado.datos.empatia = structuredClone(caso.EMPATIA);
});

await paso('U3 · Coach de Comunicación para Líderes (Gemini) y escalamiento', async () => {
  const lideres = resumirLiderazgo(estado.datos.liderazgo);
  const vocero = lideres.find((l) => l.lider_id === estado.datos.narrativa.vocero) ?? lideres[0];
  const chat = estado.extras.coach ?? (estado.extras.coach = { mensajes: [], modoEnsayo: false, guardadosIds: {} });
  const d = estado.datos;
  for (const texto of caso.COACH.turnos.slice(chat.mensajes.filter((m) => m.role === 'user').length)) {
    const historial = chat.mensajes.map(({ role, text }) => ({ role, text }));
    const r = await conIA(
      `coach: «${texto.slice(0, 50)}…»`,
      () =>
        lider.post('/api/coach/chat', {
          message: texto,
          history: historial,
          liderConfig: { area: caso.COACH.area, estiloU1: vocero.dominantes[0], liderId: vocero.lider_id },
          documentosOficiales: {
            empresa: estado.proyecto.empresa,
            r1Lienzo: d.lienzo,
            u2Narrativa: d.narrativa,
            u3Soporte: d.soporte,
            u4Empatia: d.empatia,
            r5Buzon: d.buzon1,
            adicionales: '',
          },
        }),
      (x) => typeof x?.reply === 'string' && x.reply.trim().length > 0,
    );
    const normal = texto.toLowerCase();
    if (/quiero practicar|practicar|modo ensayo|ensayar/.test(normal)) chat.modoEnsayo = true;
    chat.mensajes.push({ id: randomUUID(), role: 'user', text: texto });
    const idCoach = randomUUID();
    chat.mensajes.push({ id: idCoach, role: 'model', text: r.reply, escalamiento: r.escalamiento ?? null });
    if (/^terminar\b|terminar ensayo|salir del ensayo/.test(normal)) chat.modoEnsayo = false;
    if (r.escalamiento) {
      const e = r.escalamiento;
      await lider.post('/api/coach/escalamientos', {
        fecha: e.fecha,
        area: e.area || caso.COACH.area,
        pregunta: e.pregunta,
        tipo: 'sin_respuesta_oficial',
        estado: e.estado || 'pendiente',
        respuesta_oficial: e.respuesta_oficial ?? null,
      });
      chat.guardadosIds[idCoach] = true;
      log(`    escalamiento guardado: «${e.pregunta.slice(0, 80)}»`);
    }
    guardar();
  }
});

/* ================================================================== */
/* Etapa T                                                            */
/* ================================================================== */

const limitar = (n) => Math.max(1, Math.min(5, n));
const variacion = (u, i) => ((caso.TODOS.indexOf(u) * 7 + i * 3) % 3) - 1; // -1, 0 o 1, siempre igual para la misma persona

await paso('T1 · Encuesta de pulso al cierre de cada sesión (9 personas, 3 sesiones)', async () => {
  for (const u of caso.TODOS) {
    for (const [i, s] of caso.SESIONES_PULSO.entries()) {
      const [c, ut, co] = s.base.map((b, j) => limitar(b + (variacion(u, i + j) > 0 && b < 5 ? 1 : variacion(u, i + j) < 0 && j === 2 ? -1 : 0)));
      await clientes[u].post('/api/registros', { tipo: 'pulso', datos: { sesion: s.sesion, claridad: c, utilidad: ut, confianza: co } });
    }
  }
});

await paso('T2 · Preguntas del simulador generadas con IA (Gemini) y aprobación del líder', async () => {
  for (const videoId of [...caso.VIDEOS_APROBAR, ...caso.VIDEOS_BORRADOR]) {
    await conIA(
      `preguntas IA para ${videoId}`,
      () => lider.post('/api/ia/preguntas/generar', { videoId, contexto: caso.CONTEXTO_VIDEOS[videoId] }),
      (x) => x?.borrador?.preguntas?.length === 3,
    );
  }
  for (const videoId of caso.VIDEOS_APROBAR) await lider.post('/api/ia/preguntas/aprobar', { videoId });
  log(`    aprobadas: ${caso.VIDEOS_APROBAR.join(', ')} · en borrador para revisar en vivo: ${caso.VIDEOS_BORRADOR.join(', ')}`);
});

await paso('T2 · Micro-cursos vistos y simulador respondido por cada persona', async () => {
  for (const u of caso.TODOS) {
    const plan = caso.SIMULADOR[u];
    const videos = u === 'lider' ? [...caso.VIDEOS_EMPLEADO, ...caso.VIDEOS_LIDER] : caso.VIDEOS_EMPLEADO;
    for (const [i, videoId] of videos.entries()) {
      await clientes[u].post('/api/vistas', { videoId });
      const preguntas = preguntasDe(db, videoId);
      const aciertos = plan.aciertos[i] ?? 3;
      const respuestas = preguntas.map((p, j) => (j < aciertos ? p.correcta : (p.correcta + 1) % p.opciones.length));
      await clientes[u].post('/api/simulador', { videoId, respuestas, seguridad: plan.seguridad[i] ?? 4 });
    }
  }
});

await paso('T2 · Resumen para el líder (Gemini)', async () => {
  const r = await conIA('resumen del equipo T2', () => lider.post('/api/ia/resumen', {}), (x) => x?.origen === 'ia' && x.texto);
  estado.extras.resumenT2 = { texto: r.texto, origen: r.origen, fecha: '2026-09-05T15:00:00.000Z' };
});

await paso('T3 · Escalera de autonomía: votos y acuerdos (2 ciclos)', async () => {
  const momentos = [
    [1, 'inicio'],
    [1, 'cierre'],
    [2, 'inicio'],
    [2, 'cierre'],
  ];
  for (const u of caso.TODOS) {
    for (const [i, [ciclo, momento]] of momentos.entries()) {
      await clientes[u].post('/api/registros', { tipo: 'voto', datos: { ciclo, momento, nivel: caso.VOTOS[u][i] } });
    }
  }
  for (const a of caso.ACUERDOS) await lider.post('/api/registros', { tipo: 'acuerdo', datos: a });
});

await paso('T3 · Termómetro de apropiación (anónimo, 9 respuestas por ciclo)', async () => {
  for (const ciclo of [1, 2]) {
    for (const [i, respuestas] of caso.TERMOMETRO[ciclo].entries()) {
      await clientes[caso.TODOS[i]].post('/api/registros', { tipo: 'termometro', datos: { ciclo, respuestas } });
    }
  }
});

await paso('T3 · Dinámicas de equipo con su hoja de trabajo', async () => {
  for (const d of caso.DINAMICAS) await lider.post('/api/registros', { tipo: 'dinamica', datos: d });
});

await paso('T4 · Victorias tempranas: méritos (FIMT + MRMT) y balance de cada ciclo', async () => {
  for (const m of caso.MERITOS) await lider.post('/api/registros', { tipo: 'merito', datos: m });
  for (const b of caso.BALANCES) await lider.post('/api/registros', { tipo: 'balance', datos: b });
});

/* ================================================================== */
/* Etapa A                                                            */
/* ================================================================== */

await paso('A1 · Auditorías de adopción (Día 30, 60 y 90)', async () => {
  for (const a of caso.AUDITORIAS) await lider.post('/api/etapa-a/auditoria', { ...a, metas: caso.METAS_A });
});

await paso('A2 · Mapa de viaje del colaborador (9 personas, 2 periodos)', async () => {
  for (const [periodo, porPersona] of Object.entries(caso.VIAJE)) {
    for (const [u, [respuestas, comentario]] of Object.entries(porPersona)) {
      await clientes[u].post('/api/etapa-a/viaje', { periodo, area: caso.AREA_DE[u], comentario, respuestas });
    }
  }
});

await paso('A · Asistente de la Etapa A (Gemini): diagnóstico, cruce con T, curva y consulta libre', async () => {
  const mensajes = estado.extras.asistenteA;
  let seq = 1_790_000_000_000 + mensajes.length;
  const hechas = mensajes.filter((m) => m.autor === 'asistente').length;
  for (const c of caso.ASISTENTE_A.slice(hechas)) {
    const historial = mensajes
      .filter((m) => m.autor !== 'error')
      .slice(-4)
      .map((m) => ({ autor: m.autor, texto: m.autor === 'usuario' ? m.texto : `${m.datos.titulo}: ${m.datos.resumen}` }));
    const r = await conIA(
      `asistente A · ${c.visible.slice(0, 50)}`,
      () => lider.post('/api/etapa-a/asistente', { accion: c.accion, ...(c.accion === 'libre' ? { mensaje: c.visible } : {}), pasoActual: c.pasoActual, historial }),
      (x) => x?.motor === 'gemini',
    );
    mensajes.push({ id: seq++, autor: 'usuario', texto: c.visible });
    mensajes.push({ id: seq++, autor: 'asistente', datos: r });
    guardar();
  }
});

/* ================================================================== */
/* Fechas del relato (el piloto ocurre entre julio y noviembre de 2026) */
/* ================================================================== */

await paso('Fechas del relato en la base (julio a noviembre de 2026)', async () => {
  const fijar = (tipo, fecha, filtro = () => true) => {
    for (const f of db.prepare('SELECT id, datos FROM registros WHERE tipo = ?').all(tipo)) {
      const d = JSON.parse(f.datos);
      if (filtro(d)) db.prepare('UPDATE registros SET creado_en = ? WHERE id = ?').run(typeof fecha === 'function' ? fecha(d, f.id) : fecha, f.id);
    }
  };
  const sesiones = Object.fromEntries(caso.SESIONES_PULSO.map((s, i) => [s.sesion, ['2026-08-18 16:00:00', '2026-08-27 15:30:00', '2026-09-08 09:00:00'][i]]));
  fijar('pulso', (d) => sesiones[d.sesion]);
  const momento = { '1-inicio': '2026-08-24 14:00:00', '1-cierre': '2026-09-18 14:00:00', '2-inicio': '2026-09-21 14:00:00', '2-cierre': '2026-10-16 14:00:00' };
  fijar('voto', (d) => momento[`${d.ciclo}-${d.momento}`]);
  fijar('acuerdo', (d) => momento[`${d.ciclo}-${d.momento}`]);
  fijar('termometro', (d) => (d.ciclo === 1 ? '2026-09-18 15:00:00' : '2026-10-16 15:00:00'));
  const dinamicas = ['2026-09-02 10:00:00', '2026-09-11 10:00:00', '2026-10-07 10:00:00', '2026-10-14 10:00:00'];
  db.prepare("SELECT id FROM registros WHERE tipo = 'dinamica' ORDER BY id").all().forEach((f, i) => db.prepare('UPDATE registros SET creado_en = ? WHERE id = ?').run(dinamicas[i] ?? dinamicas.at(-1), f.id));
  fijar('merito', (d) => `${d.fecha} 16:00:00`);
  fijar('balance', (d) => (d.ciclo === 1 ? '2026-09-19 11:00:00' : '2026-10-17 11:00:00'));
  fijar('auditoria_a', (d) => `${d.fecha} 14:00:00`);
  fijar('viaje_a', (d) => (d.periodo === 'Ciclo 1' ? '2026-09-19 10:00:00' : '2026-11-16 10:00:00'));
  db.prepare("UPDATE vistas SET visto_en = '2026-08-25 10:00:00'").run();
  db.prepare("UPDATE simulacros SET hecho_en = '2026-08-25 10:20:00'").run();
  db.prepare("UPDATE preguntas_ia SET creado_en = '2026-08-14 09:00:00'").run();
  estado.proyecto.actualizado = '2026-11-16T15:00:00.000Z';
});

/* ================================================================== */
/* Lo que vive en el navegador                                        */
/* ================================================================== */

await paso('Archivo para el navegador (public/demo/bancolombia.json)', async () => {
  const idLider = clientes.lider.datos.id;
  const salida = {
    version: 1,
    generado: new Date().toISOString(),
    aviso: 'Caso ficticio con fines académicos. No representa información real de Bancolombia ni de sus colaboradores.',
    proyecto: estado.proyecto,
    datos: estado.datos,
    localStorage: {
      [`ruta:coach-u3:v1:${estado.proyecto.id}`]: estado.extras.coach,
      [`ruta:asistente-a:v1:${idLider}`]: estado.extras.asistenteA,
      'ruta:resumen-t2:v1': estado.extras.resumenT2,
    },
  };
  writeFileSync(SALIDA_NAVEGADOR, JSON.stringify(salida));
  log(`    ${SALIDA_NAVEGADOR} (${(JSON.stringify(salida).length / 1024).toFixed(0)} KB)`);
});

db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
log('✔ Caso Bancolombia completo. Inicia la demo con: npm run demo');
await vite.close();
servidor.close();
process.exit(0);
