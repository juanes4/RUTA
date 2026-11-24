/** Semáforo de los indicadores de la Etapa A: compara cada valor con su meta. */

export type Sentido = 'mayor_mejor' | 'menor_mejor';

const EPSILON = 1e-9;

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

/** Color del componente Semaforo que corresponde a cada estado. */
export const COLOR_SEMAFORO = { en_meta: 'verde', atencion: 'amarillo', intervenir: 'rojo' } as const;
