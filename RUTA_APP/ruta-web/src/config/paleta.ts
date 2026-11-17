/**
 * Pasteles de DESIGN.md ("Tarjetas pastel"). Solo se referencian las
 * variables de tokens.css; ningún color nuevo.
 */
export const PASTELES = [
  'var(--pastel-lavender)',
  'var(--pastel-mint)',
  'var(--pastel-cream)',
  'var(--pastel-blue)',
] as const;

export type Pastel = (typeof PASTELES)[number];

/** Alterna los pasteles para que tarjetas vecinas no sean idénticas (DESIGN.md, "Evitar"). */
export function pastelPorIndice(indice: number): Pastel {
  return PASTELES[indice % PASTELES.length] as Pastel;
}

/** Gris azulado de DESIGN.md (fondo de página), usado como segundo tono de la etapa R. */
export const GRIS = 'var(--bg-page)';

/** Fondo de una tarjeta: un pastel o el gris de DESIGN.md. */
export type Fondo = Pastel | typeof GRIS;
