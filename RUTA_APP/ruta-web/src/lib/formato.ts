import type { UnidadMeta } from '../config/metas';

const PORCENTAJE = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 1 });
const ESCALA = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 2 });

/** 0,7 → "70 %"; 3,75 → "3,75". */
export function formatearValor(valor: number, unidad: UnidadMeta): string {
  return unidad === 'porcentaje' ? PORCENTAJE.format(valor) : ESCALA.format(valor);
}
