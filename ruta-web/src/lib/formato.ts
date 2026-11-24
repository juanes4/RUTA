const PORCENTAJE = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 1 });
const DECIMAL = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/** 0,7 → "70 %". */
export const formatearPorcentaje = (valor: number): string => PORCENTAJE.format(valor);

/** 2,5 → "2,5"; 3 → "3". */
export const formatearNumero = (valor: number): string => DECIMAL.format(valor);

/** 3 → "+3"; −2 → "−2"; 0 → "0". */
export const conSigno = (valor: number): string => (valor > 0 ? `+${DECIMAL.format(valor)}` : DECIMAL.format(valor));
