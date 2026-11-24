/**
 * Capa de agentes de IA (PLAN §8).
 * Activa en la Etapa A con motor híbrido (analítico local + Gemini API opcional),
 * enviando únicamente datos agregados y anonimizados (Ley 1581).
 */
export const CONFIG_IA = {
  habilitada: true,
  /** Ningún dato de grupos más pequeños que esto llega a un agente. */
  minimoPersonasPorGrupo: 5,
  /** Textos abiertos reales solo a modelos locales o con contrato de datos (Ley 1581). */
  permitirTextosAbiertosEnIaPublica: false,
} as const;
