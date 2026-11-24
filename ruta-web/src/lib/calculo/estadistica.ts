/** Utilidades numéricas compartidas por el módulo de cálculo. */

/** División que devuelve null en lugar de NaN o Infinity. */
export function proporcion(parte: number, total: number): number | null {
  return total > 0 ? parte / total : null;
}
