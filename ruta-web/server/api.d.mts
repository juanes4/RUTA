import type { IncomingMessage, ServerResponse } from 'node:http';
export function crearApi(
  db: unknown,
  opciones?: {
    seguro?: boolean;
    /** Variables de entorno (GEMINI_API_KEY, GEMINI_MODEL, RUTA_IA_DATOS_REALES). Por defecto, process.env. */
    env?: Record<string, string | undefined>;
    /** Reemplaza la llamada a Gemini (pruebas). */
    generarImpl?: (p: unknown) => Promise<unknown>;
  },
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
