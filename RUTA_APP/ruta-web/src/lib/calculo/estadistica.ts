/** Utilidades numéricas compartidas por el módulo de cálculo. */

/** Tolerancia para comparar umbrales sin errores de coma flotante. */
export const EPSILON = 1e-9;

export function promedio(valores: readonly number[]): number | null {
  if (valores.length === 0) return null;
  return valores.reduce((suma, v) => suma + v, 0) / valores.length;
}

/** División que devuelve null en lugar de NaN o Infinity. */
export function proporcion(parte: number, total: number): number | null {
  return total > 0 ? parte / total : null;
}

export function esNumeroValido(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor);
}

/** Cuenta personas distintas (no filas) en datos de formato largo. */
export function contarPersonas(filas: readonly { id_respuesta: string }[]): number {
  return new Set(filas.map((f) => f.id_respuesta)).size;
}
