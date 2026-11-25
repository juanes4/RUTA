/**
 * Capa de agentes de IA (PLAN §8). La usan el Copiloto de Reconocimiento
 * (etapa R), el coach de líderes (U3), la IA de T2 (preguntas del simulador y
 * resumen para el líder) y el asistente de la Etapa A (motor híbrido: analítico
 * local + Gemini opcional). Gemini se usa siempre desde el servidor y solo con
 * datos agregados y anonimizados (Ley 1581). El servidor necesita
 * GEMINI_API_KEY en .env (ver .env.example); sin clave, cada pantalla lo avisa.
 * Mientras `habilitada` sea false no se muestra ningún botón ni texto de IA.
 */
export const CONFIG_IA = {
  habilitada: true,
  /** Ningún dato de grupos más pequeños que esto se muestra por separado ni llega a un agente. */
  minimoPersonasPorGrupo: 5, // igual que MIN_GRUPO_TERMOMETRO y minimoGrupoIA() en el servidor
  /**
   * Textos abiertos reales solo con contrato de datos (Ley 1581). Quien decide
   * es el servidor: sin RUTA_IA_DATOS_REALES=permitido solo envía a Gemini el
   * buzón de prueba, y el enmascarado se aplica siempre. Este valor solo
   * cambia los avisos de la interfaz.
   */
  permitirTextosAbiertosEnIaPublica: false,
} as const;
