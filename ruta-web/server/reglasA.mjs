/**
 * Reglas de la etapa A (Analizar — documento de metodología).
 * Funciones puras sin base de datos para poder probarlas de forma aislada.
 * Las constantes de texto y preguntas en el cliente están en src/config/analizar.ts.
 */

export const MARGEN_SEMAFORO_A = 0.15;

export const INDICADORES_A = [
  { id: 'autonomia', metaInicial: 80, unidad: 'porcentaje', sentido: 'mayor_mejor', min: 0, max: 100 },
  { id: 'uso_sostenido', metaInicial: 90, unidad: 'porcentaje', sentido: 'mayor_mejor', min: 0, max: 100 },
  { id: 'regreso_anterior', metaInicial: 5, unidad: 'porcentaje', sentido: 'menor_mejor', min: 0, max: 100 },
  { id: 'traspaso', metaInicial: 100, unidad: 'porcentaje', sentido: 'mayor_mejor', min: 0, max: 100 },
  { id: 'participacion', metaInicial: 80, unidad: 'porcentaje', sentido: 'mayor_mejor', min: 0, max: 100 },
  { id: 'comunicacion', metaInicial: 90, unidad: 'porcentaje', sentido: 'mayor_mejor', min: 0, max: 100 },
  { id: 'apropiacion', metaInicial: 4, unidad: 'escala_5', sentido: 'mayor_mejor', min: 1, max: 5 },
  { id: 'recaidas', metaInicial: 90, unidad: 'porcentaje', sentido: 'mayor_mejor', min: 0, max: 100 },
];

export const IDS_INDICADORES_A = INDICADORES_A.map((i) => i.id);

export const FASES_VIAJE = ['antes', 'durante', 'actual', 'mejorar'];
export const TOTAL_PREGUNTAS_VIAJE = 12;
export const PERIODOS_VIAJE = ['Últimos 3 meses', 'Ciclo 1', 'Ciclo 2', 'Ciclo 3', 'Cierre (Día 90)'];

const EPSILON = 1e-9;

export class ErrorDatosA extends Error {}

const exigir = (condicion, mensaje) => {
  if (!condicion) throw new ErrorDatosA(mensaje);
  return condicion;
};

const texto = (v, max, { obligatorio = true } = {}) => {
  if (typeof v !== 'string') return obligatorio ? null : '';
  const t = v.trim();
  if (obligatorio && !t) return null;
  return t.slice(0, max);
};

const numeroEnRango = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const redondear2 = (n) => Math.round(n * 100) / 100;

/**
 * Semáforo de A1:
 * - en_meta (verde): cumple la meta.
 * - atencion (amarillo): está a menos de 15 % de alcanzarla.
 * - intervenir (rojo): desviación mayor al 15 %.
 */
export function evaluarSemaforoA(valor, meta, sentido, margen = MARGEN_SEMAFORO_A) {
  if (sentido === 'mayor_mejor') {
    if (valor >= meta - EPSILON) return 'en_meta';
    return valor < meta * (1 - margen) - EPSILON ? 'intervenir' : 'atencion';
  }
  if (valor <= meta + EPSILON) return 'en_meta';
  return valor > meta * (1 + margen) + EPSILON ? 'intervenir' : 'atencion';
}

/**
 * Clasificación visual de la carita en el Mapa del Colaborador (A2):
 * - 2.50 a 3.00 -> feliz (verde)
 * - 1.80 a 2.49 -> neutra (amarilla)
 * - 1.00 a 1.79 -> preocupada (roja)
 */
export function clasificarCarita(promedio) {
  if (promedio === null || promedio === undefined) return null;
  if (promedio >= 2.5 - EPSILON) return 'feliz';
  if (promedio >= 1.8 - EPSILON) return 'neutra';
  return 'preocupada';
}

/** Valida una auditoría periódica del tablero del equipo (A1). */
export function validarAuditoria(d) {
  const periodo = exigir(texto(d.periodo, 60), 'Escribe el periodo o hito de la auditoría (por ejemplo, «Día 30» o «Ciclo 2»).');
  const fecha = exigir(texto(d.fecha, 10), 'Indica la fecha de la auditoría.');
  exigir(/^\d{4}-\d{2}-\d{2}$/.test(fecha), 'La fecha debe tener formato AAAA-MM-DD.');
  const equipo = texto(d.equipo, 100, { obligatorio: false });
  const observaciones = texto(d.observaciones, 1000, { obligatorio: false });

  const valores = {};
  const metas = {};
  let conAlMenosUno = false;

  for (const ind of INDICADORES_A) {
    const rawMeta = d.metas?.[ind.id];
    const meta = rawMeta === undefined || rawMeta === null || rawMeta === '' ? ind.metaInicial : Number(rawMeta);
    exigir(numeroEnRango(meta, ind.min, ind.max), `La meta de «${ind.id}» debe estar entre ${ind.min} y ${ind.max}.`);
    metas[ind.id] = redondear2(meta);

    const rawValor = d.valores?.[ind.id];
    if (rawValor === undefined || rawValor === null || rawValor === '') {
      valores[ind.id] = null;
    } else {
      const num = Number(rawValor);
      exigir(numeroEnRango(num, ind.min, ind.max), `El valor de «${ind.id}» debe estar entre ${ind.min} y ${ind.max}.`);
      valores[ind.id] = redondear2(num);
      conAlMenosUno = true;
    }
  }

  exigir(conAlMenosUno, 'Registra el valor actual de al menos un indicador antes de guardar la auditoría.');
  return { periodo, fecha, equipo, observaciones, valores, metas };
}

/**
 * Valida una respuesta del Mapa de viaje del colaborador (A2).
 * `respuestas`: arreglo de 12 enteros en {1, 2, 3} (A=3, B=2, C=1).
 */
export function validarViaje(d) {
  const periodo = exigir(texto(d.periodo, 60), 'Selecciona el periodo de evaluación.');
  const area = texto(d.area, 80, { obligatorio: false });
  const comentario = texto(d.comentario, 500, { obligatorio: false });
  exigir(
    Array.isArray(d.respuestas) &&
      d.respuestas.length === TOTAL_PREGUNTAS_VIAJE &&
      d.respuestas.every((r) => Number.isInteger(r) && r >= 1 && r <= 3),
    'Responde las 12 preguntas del mapa de viaje (opciones A, B o C).',
  );
  return { periodo, area, comentario, respuestas: d.respuestas };
}

/**
 * Agrega un conjunto de respuestas del Mapa de viaje (A2) por fase y por pregunta.
 * Cada elemento en `entradas` tiene `{ respuestas: number[] }`.
 */
export function resumirViaje(entradas) {
  const totalRespuestas = entradas.length;
  const preguntas = Array.from({ length: TOTAL_PREGUNTAS_VIAJE }, (_, idx) => {
    const conteos = { a: 0, b: 0, c: 0 };
    let suma = 0;
    for (const e of entradas) {
      const v = e.respuestas[idx];
      if (v === 3) conteos.a += 1;
      else if (v === 2) conteos.b += 1;
      else if (v === 1) conteos.c += 1;
      suma += v;
    }
    const promedio = totalRespuestas ? redondear2(suma / totalRespuestas) : null;
    return {
      indice: idx,
      conteos,
      promedio,
      porcentaje: promedio === null ? null : Math.round((promedio / 3) * 100),
      carita: clasificarCarita(promedio),
    };
  });

  const fases = FASES_VIAJE.map((id, fIdx) => {
    const inicio = fIdx * 3;
    const grupo = preguntas.slice(inicio, inicio + 3);
    let suma = 0;
    let n = 0;
    for (const e of entradas) {
      for (let q = inicio; q < inicio + 3; q++) {
        suma += e.respuestas[q];
        n += 1;
      }
    }
    const promedio = n ? redondear2(suma / n) : null;
    return {
      id,
      promedio,
      porcentaje: promedio === null ? null : Math.round((promedio / 3) * 100),
      carita: clasificarCarita(promedio),
      preguntas: grupo,
    };
  });

  const promedioGeneral = totalRespuestas
    ? redondear2(fases.reduce((acc, f) => acc + (f.promedio ?? 0), 0) / fases.length)
    : null;

  return {
    totalRespuestas,
    promedioGeneral,
    porcentajeGeneral: promedioGeneral === null ? null : Math.round((promedioGeneral / 3) * 100),
    caritaGeneral: clasificarCarita(promedioGeneral),
    fases,
    preguntas,
  };
}
