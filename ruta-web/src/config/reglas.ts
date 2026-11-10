/**
 * Umbrales de cálculo y decisión. Ninguno va fijo en el código: todo
 * componente o función de cálculo los recibe desde aquí.
 * Fuente de cada valor entre paréntesis.
 */
export const REGLAS = {
  adkar: {
    /** Punto de bloqueo: primera dimensión con promedio menor a este valor (CONTEXTO §3, R6). */
    umbralBloqueo: 3.0,
    /** Respuestas que cuentan como favorables (CONTEXTO §6: 4 y 5). */
    valorFavorableMinimo: 4,
    /** Alerta de falta de información: % "No sé" mayor a este valor (CONTEXTO §6). */
    alertaNoSe: 0.2,
  },
  /** Escala de las preguntas de los buzones (CONTEXTO §5). */
  escala: { minimo: 1, maximo: 5 },
  foda: {
    /** Los ítems más votados pasan al backlog de la etapa 2 (CONTEXTO §3, R2). */
    itemsAlBacklog: 5,
  },
  anonimato: {
    /** Mínimo de personas por grupo para colaboradores (Instrumento 1). */
    minimoColaboradores: 5,
    /** Mínimo de personas por grupo de rol en Kotter (Instrumento 2, confidencialidad). */
    minimoKotter: 3,
  },
  semaforo: {
    /** Margen relativo a la meta para "Atención" [PROPUESTA] (PLAN §6). */
    margen: 0.15,
  },
  kotter: {
    /** Nivel bajo: 1,0 a 2,9 → puntaje menor a este valor (Instrumento 2 §2.5). */
    limiteBajo: 3.0,
    /** Nivel medio: 3,0 a 3,9 → puntaje menor a este valor (Instrumento 2 §2.5). */
    limiteMedio: 4.0,
    /** Brecha entre roles que genera alerta (Instrumento 2 §2.5). */
    brechaAlerta: 1.0,
    /** Pasos base de la regla de secuencia (Instrumento 2 §2.5). */
    pasosBase: [1, 2, 3] as const,
  },
  decisionR7: {
    /** Más de esta fracción de grupos bloqueados en Conciencia → postergar [PROPUESTA] (PLAN §6). */
    fraccionMayoriaGrupos: 0.5,
    /** Con este número de pasos bajos o más → postergar (Instrumento 2 §2.5). */
    pasosBajosParaPostergar: 3,
  },
} as const;

export type Reglas = typeof REGLAS;
