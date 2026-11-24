/**
 * Umbrales de cálculo. Ninguno va fijo en el código: todo componente o
 * función de cálculo los recibe desde aquí. Fuente: RUTA_ANDI_R_U.md.
 */
export const REGLAS = {
  triaje: {
    /** Puntaje total de 3 a 4: cambio ágil o estándar (semáforo verde). */
    verdeHasta: 4,
    /** Puntaje total de 5 a 7: cambio moderado (amarillo). De 8 a 9: cambio mayor (rojo). */
    amarilloHasta: 7,
    /** Complejidad organizacional: 1 elemento = 1 punto; 2 o 3 = 2 puntos; 4 o más = 3 puntos. */
    elementosMedio: 2,
    elementosAlto: 4,
  },
  foda: {
    /** Puntaje de cada ítem del FODA matemático. */
    escala: { minimo: 1, maximo: 5 },
  },
  anonimato: {
    /** Mínimo de respuestas de un área para mostrar sus textos del buzón separados. */
    minimoColaboradores: 5,
  },
} as const;

export type Reglas = typeof REGLAS;
