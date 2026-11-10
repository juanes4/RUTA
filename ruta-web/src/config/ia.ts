/**
 * Capa de agentes de IA (PLAN §8). Apagada: no entra el 13 de noviembre.
 * Mientras `habilitada` sea false no se muestra ningún botón ni texto de IA.
 */
export const CONFIG_IA = {
  habilitada: false,
  /** Ningún dato de grupos más pequeños que esto llega a un agente. */
  minimoPersonasPorGrupo: 5,
  /** Textos abiertos reales solo a modelos locales o con contrato de datos (Ley 1581). */
  permitirTextosAbiertosEnIaPublica: false,
} as const;
