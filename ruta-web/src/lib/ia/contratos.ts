/**
 * Contratos para agentes de IA (PLAN §8). Solo interfaces: no hay
 * implementación en esta versión. Un agente futuro (lector de documentos o
 * acompañante del proceso) implementa `ProveedorIA` y recibe un
 * `ContextoIA` ya agregado y anonimizado.
 */

export type UsoIA =
  | 'leer_documento' //       lienzo, narrativa, documento maestro
  | 'clasificar_abiertas' //  respuestas del buzón 1 hacia el mapa de empatía
  | 'explicar_indicador' //   por qué el triaje dio una ruta
  | 'sugerir_acciones' //     estrategias de acompañamiento (U4)
  | 'preparar_retrospectiva';

/** Solo datos agregados de grupos con el mínimo de personas; nunca respuestas individuales. */
export interface ContextoIA {
  uso: UsoIA;
  /** Resultados ya calculados por `lib/calculo` (triaje, FODA, actores, liderazgo). */
  agregados: Record<string, unknown>;
  /** Texto de documentos de la empresa, solo si el proveedor lo permite. */
  documentos?: string[];
}

export interface RespuestaIA {
  texto: string;
  /** El agente recomienda; una persona decide (PLAN §8). */
  esRecomendacion: true;
}

export interface ProveedorIA {
  readonly nombre: string;
  /** true si es un modelo local o un proveedor con contrato de tratamiento de datos. */
  readonly admiteDatosReales: boolean;
  responder(contexto: ContextoIA): Promise<RespuestaIA>;
}
