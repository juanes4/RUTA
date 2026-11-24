import type { EstrategiaFoda } from '../../config/formularios/reconocer';
import type { Cuadrante, FilaFoda } from '../modelo/tipos';

/** R3. FODA matemático: suma de puntajes por cuadrante y balance interno y externo. */

export type TotalesFoda = Record<Cuadrante, number>;

export function totalesFoda(items: readonly FilaFoda[]): TotalesFoda {
  const totales: TotalesFoda = { F: 0, O: 0, D: 0, A: 0 };
  for (const i of items) totales[i.cuadrante] += i.puntaje;
  return totales;
}

export interface ResultadoFoda {
  totales: TotalesFoda;
  /** Fortalezas − Debilidades. */
  interno: number;
  /** Oportunidades − Amenazas. */
  externo: number;
  /** null mientras no haya ningún ítem. Un balance en 0 cuenta como favorable. */
  estrategia: EstrategiaFoda | null;
}

export function evaluarFoda(items: readonly FilaFoda[]): ResultadoFoda {
  const totales = totalesFoda(items);
  const interno = totales.F - totales.D;
  const externo = totales.O - totales.A;
  const estrategia: EstrategiaFoda | null =
    items.length === 0 ? null : interno >= 0 ? (externo >= 0 ? 'FO' : 'FA') : externo >= 0 ? 'DO' : 'DA';
  return { totales, interno, externo, estrategia };
}
