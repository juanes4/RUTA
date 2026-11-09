import type { Sentido } from '../modelo/tipos';
import { EPSILON } from './estadistica';

/**
 * Semáforo (PLAN §6). Margen relativo a la meta [PROPUESTA], salvo cuando
 * el indicador trae su propio umbral de alerta (Kotter parte B).
 */

export type EstadoSemaforo = 'en_meta' | 'atencion' | 'intervenir';

/** Siempre con palabra, nunca solo color. */
export const PALABRA_SEMAFORO: Readonly<Record<EstadoSemaforo, string>> = {
  en_meta: 'En meta',
  atencion: 'Atención',
  intervenir: 'Intervenir',
};

export interface CriterioSemaforo {
  meta: number;
  sentido: Sentido;
  alerta?: { umbral: number; incluye: boolean };
}

function cumpleMeta(valor: number, { meta, sentido }: CriterioSemaforo): boolean {
  return sentido === 'mayor_mejor' ? valor >= meta - EPSILON : valor <= meta + EPSILON;
}

function enAlertaPropia(valor: number, sentido: Sentido, alerta: { umbral: number; incluye: boolean }): boolean {
  if (sentido === 'mayor_mejor') {
    return alerta.incluye ? valor <= alerta.umbral + EPSILON : valor < alerta.umbral - EPSILON;
  }
  return alerta.incluye ? valor >= alerta.umbral - EPSILON : valor > alerta.umbral + EPSILON;
}

function fueraDelMargen(valor: number, { meta, sentido }: CriterioSemaforo, margen: number): boolean {
  return sentido === 'mayor_mejor'
    ? valor < meta * (1 - margen) - EPSILON
    : valor > meta * (1 + margen) + EPSILON;
}

export function evaluarSemaforo(valor: number, criterio: CriterioSemaforo, margen: number): EstadoSemaforo {
  if (cumpleMeta(valor, criterio)) return 'en_meta';
  const intervenir = criterio.alerta
    ? enAlertaPropia(valor, criterio.sentido, criterio.alerta)
    : fueraDelMargen(valor, criterio, margen);
  return intervenir ? 'intervenir' : 'atencion';
}
