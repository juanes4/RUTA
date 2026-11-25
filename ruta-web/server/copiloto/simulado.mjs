import { BUZON_PRUEBA, CLASIFICACION_PRUEBA, IDEAS_PRUEBA, LECTURA_PRUEBA, esRespuestaDePrueba, huellaTexto } from './buzonPrueba.mjs';

/**
 * Modo simulado: respuestas fijas o por reglas, sin llamar a Gemini. Sirve
 * para la demo cuando no hay clave o la API falla. Todo lo que produce dice
 * que es simulado; los conteos los sigue calculando informe.mjs.
 */

export class ErrorSimulado extends Error {}

const AVISO = '_Modo simulado: respuesta preparada por reglas, sin Gemini._';

/* ---------- Paso 1 · Clasificación de referencia ---------- */

const SINTESIS = {
  SOB: 'Se trabaja al límite (horas extra, turnos pesados, poca gente) y temen que el arranque sume carga.',
  CAP: 'Piden aprender en la práctica y dentro del turno; temen que nadie les explique el sistema a tiempo.',
  REC: 'Equipos, señal y programas que fallan hoy; temen que el sistema nuevo herede esas fallas.',
  COA: 'La información entre producción, bodega, despacho y ventas no fluye o llega tarde.',
  COD: 'Las decisiones llegan sin explicación y sienten que no se les pregunta.',
  EMP: 'Pocas respuestas, pero muy intensas: temen que el sistema sea la excusa para despedir.',
  OBS: 'Personas que dudan de poder aprender el sistema a tiempo.',
  HIS: 'Recuerdan cambios que se lanzaron y se abandonaron, como el sistema de turnos.',
  DES: 'Dudan de lo que se promete y temen que el sistema se use para controlarlos o culparlos.',
  PRO: 'Reprocesos, doble digitación, conteos repetidos y pasos que no agregan valor.',
};

const huellaFila = (f) => [f.p1, f.p2, f.p3].map(huellaTexto).join('␟');
const ID_PRUEBA = new Map(BUZON_PRUEBA.map((f) => [huellaFila(f), f.id]));

/** Clasificación de referencia del buzón de prueba, con los ids del buzón que se envió. */
export function clasificarSimulado(filas) {
  if (!filas.every(esRespuestaDePrueba)) {
    throw new ErrorSimulado('El modo simulado solo trae la clasificación del buzón de prueba. Carga ese buzón o configura Gemini.');
  }
  const deReferencia = new Map(filas.map((f) => [ID_PRUEBA.get(huellaFila(f)), f.id]));
  const clasificacion = CLASIFICACION_PRUEBA.filter((c) => deReferencia.has(c.id)).map((c) => ({ ...c, id: deReferencia.get(c.id) }));
  const ideas = new Map();
  for (const c of clasificacion.filter((x) => x.pregunta === 'p3' && x.idea)) ideas.set(c.idea, [...(ideas.get(c.idea) ?? []), c.id]);
  return {
    clasificacion,
    sintesis: SINTESIS,
    propuestas: [...ideas].map(([clave, ids]) => ({ idea: IDEAS_PRUEBA[clave], ids })),
    lectura: LECTURA_PRUEBA,
  };
}

/* ---------- Paso 2 · Entrevista del lienzo por libreto ---------- */

const BLOQUES = [
  { id: 'urgencia', nombre: 'Urgencia', pregunta: '¿Cuáles son los 3 motivos para cambiar ahora? Para cada uno, dame una cifra o un hecho verificable y el periodo.' },
  { id: 'afectados', nombre: 'Afectados', pregunta: '¿A quién le cambia el trabajo y cuánto? Dime los grupos, cuántas personas más o menos y si el cambio es leve, medio o fuerte.' },
  { id: 'vision', nombre: 'Visión', pregunta: '¿Cómo será el día a día cuando funcione? Una frase sobre una tarea concreta que se pueda observar.' },
  { id: 'cambios', nombre: 'Qué cambia y qué no', pregunta: '¿Qué tareas cambian y cuáles se mantienen? Al menos 2 que cambian y 1 que se mantiene.' },
  { id: 'beneficios', nombre: 'Beneficios por grupo', pregunta: '¿Qué gana cada grupo afectado? Un beneficio concreto para cada grupo del bloque 2.' },
  { id: 'criterios', nombre: 'Criterios de éxito', pregunta: '¿Cómo sabremos que funcionó? Al menos un indicador con línea base, meta y plazo.' },
  { id: 'riesgos', nombre: 'Riesgos', pregunta: '¿Qué puede salir mal y qué intentos previos fallaron?' },
];

const REPREGUNTA = {
  urgencia: 'Para que el equipo lo crea, necesito datos: ¿cuánto cuesta hoy el problema (pedidos atrasados, errores de inventario, clientes perdidos) y en qué periodo? Si no tienes la cifra, una estimación sirve y la marcamos para verificar.',
  afectados: '"Todos" no me deja planear el acompañamiento. ¿Qué áreas o cargos, cuántas personas en cada uno y cuánto les cambia (leve, medio o fuerte)?',
  vision: 'Eso describe a la empresa, no el día a día. ¿Qué hará distinto un auxiliar de bodega un martes cualquiera cuando el sistema funcione?',
  cambios: 'Me falta lo que se mantiene. Decirlo baja la incertidumbre: ¿qué tareas siguen igual?',
  beneficios: 'Ese beneficio es para la empresa. ¿Qué gana cada grupo afectado en su trabajo diario (menos reprocesos, menos horas extra, menos búsquedas)?',
  criterios: '¿Con qué número lo vamos a medir? Dame la línea base de hoy, la meta y el plazo; por ejemplo, exactitud del inventario del 70 % al 95 % en 6 meses.',
  riesgos: 'En el buzón aparecen miedo a despidos, fatiga por cambios anteriores y fallas de equipos. ¿Cuáles de esos incluimos y qué pasó con los intentos anteriores?',
};

/** Respuesta débil según la tabla del Paso 2. */
export function esDebil(bloque, respuesta) {
  const t = huellaTexto(respuesta);
  if (t.length < 15) return true;
  switch (bloque) {
    case 'urgencia':
      return !/\d/.test(t) || /moderniz/.test(t);
    case 'afectados':
      return /^(a )?todos\b/.test(t) || !/\d/.test(t);
    case 'vision':
      return /lider(es)? del sector|mejor empresa|moderniz|ser los mejores/.test(t);
    case 'cambios':
      return !/(no cambia|se mantiene|sigue igual|siguen igual|se conserva|igual que)/.test(t);
    case 'beneficios':
      return !/(operari|auxiliar|bodega|despacho|produccion|administra|jefe|lider|equipo|cada grupo)/.test(t);
    case 'criterios':
      return !/\d/.test(t) || /que la gente lo use/.test(t);
    case 'riesgos':
      return /no vemos|ningun riesgo|^nada/.test(t);
    default:
      return false;
  }
}

const esEstimacion = (t) => /(aprox|mas o menos|como unos|como unas|estimo|calculo|mas o menos|alrededor de|cerca de)/.test(huellaTexto(t));
const ENCABEZADO = /Bloque (\d) de 7/;

/** Recorre la conversación y devuelve, por bloque, las respuestas y cuántas repreguntas hubo. */
function leerConversacion(mensajes) {
  const bloques = BLOQUES.map((b) => ({ ...b, respuestas: [], preguntas: 0 }));
  let actual = null;
  let fichaMostrada = false;
  for (const m of mensajes) {
    if (m.rol === 'copiloto') {
      if (m.texto.includes('Ficha del cambio')) fichaMostrada = true;
      const n = Number(m.texto.match(ENCABEZADO)?.[1]);
      actual = n >= 1 && n <= 7 ? bloques[n - 1] : actual;
      if (actual && n) actual.preguntas += 1;
    } else if (actual) {
      actual.respuestas.push(m.texto);
    }
  }
  return { bloques, actual, fichaMostrada };
}

function estadoDe(b) {
  const utiles = b.respuestas.filter((r) => !esDebil(b.id, r));
  if (utiles.length === 0) return 'por_completar';
  return utiles.some(esEstimacion) ? 'por_verificar' : 'completo';
}

const contenidoDe = (b) => {
  const utiles = b.respuestas.filter((r) => !esDebil(b.id, r));
  return (utiles.length ? utiles : b.respuestas.slice(-1)).join(' ').trim();
};

const ETIQUETA_ESTADO = { completo: 'Completo', por_verificar: 'Por verificar', por_completar: 'Por completar' };

export function lienzoSimulado(mensajes) {
  const { bloques, actual, fichaMostrada } = leerConversacion(mensajes);
  const preguntar = (b, previo = '') => {
    const n = BLOQUES.findIndex((x) => x.id === b.id) + 1;
    return `**Paso 1 de 4 · Lienzo · Bloque ${n} de 7**\n\n${previo}${b.pregunta}\n\n${AVISO}`;
  };

  if (fichaMostrada) {
    return `**Paso 1 de 4 · Lienzo**\n\nEn modo simulado no ajusto la ficha conversando. Usa **Pasar a R1** y corrige lo que haga falta en el formulario del lienzo.\n\n${AVISO}`;
  }
  if (!actual) return preguntar(bloques[0], 'Empecemos por la urgencia. ');

  const ultima = actual.respuestas.at(-1) ?? '';
  const repreguntas = actual.preguntas - 1;
  if (esDebil(actual.id, ultima) && repreguntas < 2) {
    const n = BLOQUES.findIndex((x) => x.id === actual.id) + 1;
    return `**Paso 1 de 4 · Lienzo · Bloque ${n} de 7**\n\n${REPREGUNTA[actual.id]}\n\n${AVISO}`;
  }
  const previo = esDebil(actual.id, ultima) ? 'Lo dejo como **por completar** y seguimos. ' : esEstimacion(ultima) ? 'Anotado como estimación, **por verificar**. ' : 'Anotado. ';
  const indice = bloques.indexOf(actual);
  if (indice < bloques.length - 1) return preguntar(bloques[indice + 1], previo);

  const filas = bloques.map((b) => `| ${b.nombre} | ${contenidoDe(b).replace(/\|/g, '/').replace(/\n/g, ' ') || '—'} | ${ETIQUETA_ESTADO[estadoDe(b)]} |`);
  return [
    `**Paso 1 de 4 · Lienzo · Ficha del cambio**`,
    '',
    `${previo}Esta es la ficha con lo que me dijiste. Revisa los bloques por completar o por verificar.`,
    '',
    '| Bloque | Contenido | Estado |',
    '|---|---|---|',
    ...filas,
    '',
    'Si está conforme, usa **Pasar a R1** para llevarla al formulario del lienzo.',
    '',
    AVISO,
  ].join('\n');
}

/** Ficha del cambio a partir de la conversación por libreto (mismo formato que ESQUEMA_LIENZO). */
export function extraerLienzoSimulado(mensajes) {
  const { bloques } = leerConversacion(mensajes);
  const b = Object.fromEntries(bloques.map((x) => [x.id, x]));
  const contenido = (id) => (estadoDe(b[id]) === 'por_completar' ? '' : contenidoDe(b[id]));
  const partes = (texto) =>
    texto
      .split(/\n|;|\.\s+(?=\p{Lu})/u)
      .map((t) => t.trim().replace(/\.$/, ''))
      .filter(Boolean);
  // El dato es la parte del motivo que empieza en la primera cifra ("30 % cada mes").
  const datoDe = (motivo) => {
    const i = motivo.search(/\d/);
    return i < 0 ? '' : motivo.slice(i).trim();
  };
  // "Cambia X; se mantiene Y" → qué cambia y qué no.
  const [cambia, ...mantiene] = contenido('cambios').split(/[;.]?\s*(?=(?:se mantiene|se mantienen|no cambia|no cambian|sigue igual|siguen igual)\b)/i);
  return {
    urgencia: partes(contenido('urgencia')).slice(0, 3).map((motivo) => ({ motivo, dato: datoDe(motivo) })),
    afectados: contenido('afectados'),
    vision: contenido('vision'),
    que_cambia: (cambia ?? '').trim().replace(/[;,]$/, ''),
    que_no_cambia: mantiene.join(' ').trim(),
    beneficios: contenido('beneficios') ? [{ grupo: 'Grupos afectados', beneficio: contenido('beneficios') }] : [],
    criterios: contenido('criterios') ? [{ criterio: contenido('criterios'), meta: contenido('criterios').match(/[^,.]*\d[^,.]*/)?.[0].trim() ?? '' }] : [],
    riesgos: partes(contenido('riesgos')),
    intentos_previos: [],
    estados: Object.fromEntries(bloques.map((x) => [x.id, estadoDe(x)])),
  };
}

/* ---------- Paso 3 · Triaje por reglas ---------- */

const textoLienzo = (l) =>
  huellaTexto(
    [
      ...(l?.urgencia ?? []).flatMap((u) => [u.motivo, u.dato]),
      l?.afectados,
      l?.vision,
      l?.que_cambia,
      l?.que_no_cambia,
      ...(l?.beneficios ?? []).map((x) => x.beneficio),
      ...(l?.riesgos ?? []),
      ...(l?.intentos_previos ?? []),
    ].join(' '),
  );

export function triajeSimulado({ lienzo, informe }) {
  const t = textoLienzo(lienzo);
  const temas = new Set((informe?.temas ?? []).map((x) => x.codigo));
  const intensas = (informe?.alertas?.intensas ?? []).map((a) => a.tema);
  const seguridad = (informe?.revision ?? []).some((r) => r.tipo === 'seguridad_salud');

  const cargos = /(cargo|rol|redefin|nuevo puesto|estructura)/.test(t);
  const herramientas = /(sistema|software|herramienta|lector|pistola|wms|capacit)/.test(t) || temas.has('REC') || temas.has('CAP');
  const impacto = cargos ? 3 : herramientas ? 2 : 1;

  const elementos = [
    /(estrategia|cliente|mercado|competencia)/.test(t) && 'estrategia',
    cargos && 'estructura',
    /(sistema|software|wms|lector|pistola|herramienta|tecnolog)/.test(t) && 'sistemas',
    (/(capacit|aprend|habilidad|formacion)/.test(t) || temas.has('CAP')) && 'habilidades',
    (/(lider|jefe|supervis)/.test(t) || temas.has('COD')) && 'liderazgo',
    (/(cultura|valores|confianza)/.test(t) || temas.has('DES')) && 'valores',
  ].filter(Boolean);

  const antecedentes = (lienzo?.intentos_previos ?? []).some((x) => x.trim() && !/^ningun/.test(huellaTexto(x))) || temas.has('HIS');
  const miedo = intensas.some((x) => /empleo|desconfianza|cambios anteriores/i.test(x));
  const riesgo = antecedentes || miedo || seguridad ? 3 : 2;

  const regla = 'Regla del modo simulado';
  return {
    impacto_personas: {
      puntaje: impacto,
      justificacion:
        impacto === 3
          ? 'El lienzo menciona redefinición de cargos o de estructura.'
          : impacto === 2
            ? 'El cambio trae herramientas y flujos nuevos que exigen capacitación, sin redefinir cargos según el lienzo.'
            : 'El lienzo no menciona herramientas nuevas ni cambios de rol.',
      fuente: `Lienzo (bloques 2 y 4) y buzón · ${regla}`,
      cambiaria: 'Que el cambio redefina cargos o elimine puestos subiría el puntaje a 3.',
    },
    complejidad: {
      elementos,
      justificacion: elementos.length ? `Elementos encontrados: ${elementos.join(', ')}.` : 'No se encontraron elementos impactados en el lienzo.',
      fuente: `Lienzo y temas principales del buzón · ${regla}`,
      cambiaria: 'Confirmar si el cambio toca la estrategia o la estructura podría sumar elementos.',
    },
    riesgo_operativo: {
      puntaje: riesgo,
      justificacion:
        riesgo === 3
          ? 'Hay antecedentes de cambios fallidos o alertas fuertes en el buzón (miedo al empleo, desconfianza o riesgos de seguridad).'
          : 'No aparecen antecedentes de fracasos ni alertas fuertes; un fallo causaría retrasos manejables.',
      fuente: `Lienzo (bloque 7) y alertas del buzón · ${regla}`,
      cambiaria: 'Un plan de contingencia probado y un historial positivo bajarían el puntaje.',
    },
    alcance: /(toda la (empresa|organizacion)|todas las areas)/.test(t) ? 'organizacion' : /piloto/.test(t) ? 'piloto' : 'sin_dato',
    por_que_ahora: (lienzo?.urgencia ?? []).map((u) => [u.motivo, u.dato].filter(Boolean).join(': ')).join('; '),
    poblacion_afectada: lienzo?.afectados ?? '',
    dimension_tecnica: elementos.includes('sistemas') ? 'Afecta herramientas tecnológicas y procesos de trabajo.' : '',
  };
}

/* ---------- Paso 4 · Recomendaciones por reglas ---------- */

const PREGUNTAS_POR_TEMA = {
  EMP: '¿Van a despedir gente por el sistema nuevo?',
  OBS: '¿Qué pasa si no aprendo a manejarlo a tiempo?',
  SOB: '¿De dónde vamos a sacar tiempo para aprender si no damos abasto?',
  CAP: '¿Cuándo y en qué horario nos van a capacitar?',
  HIS: '¿Qué va a ser distinto esta vez frente al cambio anterior?',
  DES: '¿El sistema es para controlarnos o para ayudarnos?',
  REC: '¿Van a arreglar los equipos antes de arrancar?',
  COA: '¿Las otras áreas también van a usar el sistema?',
  COD: '¿Por qué se escogió este sistema y quién lo decidió?',
  PRO: '¿Se acaba el papel o vamos a hacer las dos cosas?',
};

export function dossierSimulado({ empresa, informe, ruta }) {
  const temas = informe?.temas ?? [];
  const intensas = informe?.alertas?.intensas ?? [];
  const nombres = new Set([...temas.map((t) => t.codigo)]);
  const miedoEmpleo = intensas.some((a) => /empleo/i.test(a.tema));
  const desconfianza = nombres.has('DES') || nombres.has('HIS');
  const distancia = nombres.has('COD') || intensas.some((a) => /dirección/i.test(a.tema));
  const recomendaciones = [];
  if (miedoEmpleo) {
    recomendaciones.push({
      texto: 'La narrativa debe responder primero qué pasa con los puestos, con lo que la dirección haya aprobado decir. Sin esa respuesta el resto del mensaje no se escucha.',
      fuente: 'Buzón, alertas de intensidad 3 (miedo a perder el empleo)',
    });
  }
  if (desconfianza) {
    recomendaciones.push({
      texto: 'Explicar qué será distinto frente a los cambios anteriores y comprometer solo lo que se pueda cumplir.',
      fuente: 'Buzón, temas de desconfianza y cambios anteriores fallidos',
    });
  }
  for (const t of temas.slice(0, 2)) {
    recomendaciones.push({ texto: `Atender "${t.tema.toLowerCase()}" en el plan de lanzamiento: ${t.sintesis || 'es de los temas más mencionados'}.`, fuente: `Buzón, P1 y P2 (${t.total} menciones)` });
  }
  const grupos = informe?.diferencias?.area?.diferencias ?? [];
  if (grupos[0]) {
    recomendaciones.push({
      texto: `Dar más acompañamiento a ${grupos[0].segmento}: menciona "${grupos[0].tema.toLowerCase()}" mucho más que el resto.`,
      fuente: `Buzón, diferencias por área (${grupos[0].pctSegmento} % frente a ${grupos[0].pctResto} %)`,
    });
  }
  const perfil = desconfianza || miedoEmpleo ? 'Participativo o transformacional' : 'Directivo con apoyo participativo';
  return {
    resumen: [
      `${empresa?.nombre || 'La empresa'} prepara este cambio: ${empresa?.que_cambia || 'por describir'}.`,
      ruta ? `El triaje asigna la ruta ${ruta}.` : 'El triaje aún no está completo.',
      temas[0] ? `Lo más mencionado en el buzón es ${temas[0].tema.toLowerCase()}${temas[1] ? ` y ${temas[1].tema.toLowerCase()}` : ''}.` : '',
      miedoEmpleo ? 'El miedo a perder el empleo aparece con intensidad alta aunque en pocas respuestas.' : '',
    ]
      .filter(Boolean)
      .join(' '),
    recomendaciones: recomendaciones.slice(0, 5),
    vocero: {
      perfil: distancia ? `${perfil}, reforzado por un líder cercano a la operación` : perfil,
      motivo: distancia ? 'El buzón muestra distancia con la dirección: el mensaje debe llegar también por alguien en quien la operación confía.' : 'Hay que escuchar y responder preocupaciones antes de pedir adopción.',
      fuente: 'Buzón, temas de comunicación con la dirección y desconfianza',
    },
    preguntas_jefes: temas.map((t) => PREGUNTAS_POR_TEMA[t.codigo]).filter(Boolean).concat(miedoEmpleo ? [PREGUNTAS_POR_TEMA.EMP] : []).filter((p, i, a) => a.indexOf(p) === i).slice(0, 6),
  };
}
