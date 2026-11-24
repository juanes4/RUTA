import {
  INDICADORES_TABLERO_A,
  MARGEN_SEMAFORO_A,
  PREGUNTAS_VIAJE,
  type EstadoCarita,
  type IdIndicadorA,
  type IndicadorAuditoria,
  type UnidadIndicadorA,
} from '../../config/analizar';
import { evaluarSemaforo, type EstadoSemaforo } from './semaforo';

const EPSILON = 1e-9;

/** Evalúa el semáforo de un indicador del Tablero del equipo (A1) con margen relativo del 15 %. */
export function semaforoIndicadorA(
  valor: number | null | undefined,
  meta: number,
  indicador: Pick<IndicadorAuditoria, 'sentido'>,
): EstadoSemaforo | null {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return null;
  return evaluarSemaforo(valor, { meta, sentido: indicador.sentido }, MARGEN_SEMAFORO_A);
}

/** Formatea un valor del tablero A1 según su unidad (% o escala de 5). */
export function formatearValorA(valor: number | null | undefined, unidad: UnidadIndicadorA): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
  if (unidad === 'escala_5') return `${valor.toFixed(1).replace('.', ',')} / 5`;
  const texto = Number.isInteger(valor) ? String(valor) : valor.toFixed(1).replace('.', ',');
  return `${texto} %`;
}

/** Formatea la meta con su operador direccional (≥ o ≤). */
export function formatearMetaA(meta: number, indicador: Pick<IndicadorAuditoria, 'unidad' | 'sentido'>): string {
  const prefijo = indicador.sentido === 'menor_mejor' ? '< ' : '≥ ';
  return `${prefijo}${formatearValorA(meta, indicador.unidad)}`;
}

/** Porcentaje visual de progreso hacia la meta (0 a 100) para barras de apoyo. */
export function progresoHaciaMetaA(
  valor: number | null | undefined,
  meta: number,
  indicador: Pick<IndicadorAuditoria, 'unidad' | 'sentido' | 'max'>,
): number {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return 0;
  if (indicador.sentido === 'menor_mejor') {
    if (valor <= meta) return 100;
    const exceso = valor - meta;
    return Math.max(8, Math.round(100 - Math.min(100, (exceso / Math.max(meta, 1)) * 50)));
  }
  const base = indicador.unidad === 'escala_5' ? 5 : 100;
  return Math.max(0, Math.min(100, Math.round((valor / base) * 100)));
}

/** Posición normalizada (0 a 100) en una escala común para el gráfico comparativo Valor vs. Meta. */
export function posicionEnEscalaA(valor: number, unidad: UnidadIndicadorA): number {
  const base = unidad === 'escala_5' ? 5 : 100;
  return Math.max(0, Math.min(100, Math.round((valor / base) * 1000) / 10));
}

/**
 * Texto humano de la brecha frente a la meta (ej. «+5 % sobre meta» o «-0,4 bajo meta»).
 * Para indicadores menor_mejor (Regreso a lo anterior), estar por debajo de la meta es positivo.
 */
export function textoBrechaMetaA(
  valor: number | null | undefined,
  meta: number,
  indicador: Pick<IndicadorAuditoria, 'unidad' | 'sentido'>,
): string | null {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return null;
  const diff = Math.round((valor - meta) * 100) / 100;
  const sufijo = indicador.unidad === 'escala_5' ? ' pts' : ' %';
  const fmt = (n: number) => (Number.isInteger(n) ? String(Math.abs(n)) : Math.abs(n).toFixed(1).replace('.', ','));

  if (Math.abs(diff) < EPSILON) return 'En la meta exacta';
  if (indicador.sentido === 'menor_mejor') {
    return diff < 0 ? `${fmt(diff)}${sufijo} bajo el tope` : `+${fmt(diff)}${sufijo} sobre el tope`;
  }
  return diff > 0 ? `+${fmt(diff)}${sufijo} sobre meta` : `-${fmt(diff)}${sufijo} para la meta`;
}

/** Variación frente a la auditoría inmediatamente anterior, indicando si la dirección es favorable. */
export function deltaIndicadorA(
  actual: number | null | undefined,
  anterior: number | null | undefined,
  indicador: Pick<IndicadorAuditoria, 'unidad' | 'sentido'>,
): { texto: string; favorable: boolean | null } | null {
  if (
    actual === null ||
    actual === undefined ||
    anterior === null ||
    anterior === undefined ||
    !Number.isFinite(actual) ||
    !Number.isFinite(anterior)
  ) {
    return null;
  }
  const diff = Math.round((actual - anterior) * 100) / 100;
  if (Math.abs(diff) < EPSILON) return { texto: 'Sin cambio', favorable: null };
  const sufijo = indicador.unidad === 'escala_5' ? '' : ' %';
  const abs = Number.isInteger(diff) ? String(Math.abs(diff)) : Math.abs(diff).toFixed(1).replace('.', ',');
  const flecha = diff > 0 ? '↑' : '↓';
  const signo = diff > 0 ? '+' : '-';
  const favorable = indicador.sentido === 'mayor_mejor' ? diff > 0 : diff < 0;
  return { texto: `${flecha} ${signo}${abs}${sufijo}`, favorable };
}

export interface ResumenSemaforosA {
  enMeta: number;
  atencion: number;
  intervenir: number;
  sinDato: number;
  evaluados: number;
  porcentajeCumplimiento: number | null;
}

/** Cuenta cuántos indicadores están en cada estado de semáforo para una auditoría. */
export function resumirSemaforosA(
  valores: Partial<Record<IdIndicadorA, number | null>>,
  metas: Partial<Record<IdIndicadorA, number>>,
): ResumenSemaforosA {
  let enMeta = 0;
  let atencion = 0;
  let intervenir = 0;
  let sinDato = 0;

  for (const ind of INDICADORES_TABLERO_A) {
    const estado = semaforoIndicadorA(valores[ind.id], metas[ind.id] ?? ind.metaInicial, ind);
    if (estado === 'en_meta') enMeta += 1;
    else if (estado === 'atencion') atencion += 1;
    else if (estado === 'intervenir') intervenir += 1;
    else sinDato += 1;
  }

  const evaluados = enMeta + atencion + intervenir;
  return {
    enMeta,
    atencion,
    intervenir,
    sinDato,
    evaluados,
    porcentajeCumplimiento: evaluados ? Math.round((enMeta / evaluados) * 100) : null,
  };
}

/** Clasifica el promedio del Mapa del colaborador (A2) en carita visual. */
export function clasificarCarita(promedio: number | null | undefined): EstadoCarita | null {
  if (promedio === null || promedio === undefined || !Number.isFinite(promedio)) return null;
  if (promedio >= 2.5 - EPSILON) return 'feliz';
  if (promedio >= 1.8 - EPSILON) return 'neutra';
  return 'preocupada';
}

export function formatearPromedioViaje(promedio: number | null | undefined): string {
  if (promedio === null || promedio === undefined || !Number.isFinite(promedio)) return '—';
  return promedio.toFixed(2).replace('.', ',');
}

export interface ConteosPregunta {
  a: number;
  b: number;
  c: number;
}

/** Devuelve la opción más elegida para una pregunta (útil en preguntas de prioridades). */
export function opcionPredominante(
  indicePregunta: number,
  conteos: ConteosPregunta,
): { letra: 'A' | 'B' | 'C'; texto: string; cantidad: number; porcentaje: number } | null {
  const total = conteos.a + conteos.b + conteos.c;
  if (total === 0) return null;
  const pregunta = PREGUNTAS_VIAJE[indicePregunta];
  if (!pregunta) return null;

  const candidatos = [
    { opcion: pregunta.opciones[0], cantidad: conteos.a },
    { opcion: pregunta.opciones[1], cantidad: conteos.b },
    { opcion: pregunta.opciones[2], cantidad: conteos.c },
  ].sort((x, y) => y.cantidad - x.cantidad);

  const ganador = candidatos[0];
  if (!ganador) return null;
  return {
    letra: ganador.opcion.letra,
    texto: ganador.opcion.texto,
    cantidad: ganador.cantidad,
    porcentaje: Math.round((ganador.cantidad / total) * 100),
  };
}
