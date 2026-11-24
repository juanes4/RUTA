/**
 * Capa de agentes de IA (PLAN §8). Hoy solo la usa la etapa T2 (preguntas del simulador y resumen
 * para el líder). Mientras `habilitada` sea false no se muestra ningún botón ni texto de IA.
 * El servidor además necesita GEMINI_API_KEY en .env (ver .env.example); sin clave, la pantalla lo avisa.
 */
export const CONFIG_IA = {
  habilitada: true,
  /** Ningún dato de grupos más pequeños que esto llega a un agente. */
  minimoPersonasPorGrupo: 5, // igual que MIN_GRUPO_TERMOMETRO y minimoGrupoIA() en el servidor
  /** Textos abiertos reales solo a modelos locales o con contrato de datos (Ley 1581). */
  permitirTextosAbiertosEnIaPublica: false,
} as const;
