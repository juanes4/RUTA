import type { IncomingMessage, ServerResponse } from 'node:http';
export function crearApi(
  db: unknown,
  opciones?: { seguro?: boolean; ia?: { apiKey?: string; modelo?: string; fetchFn?: typeof fetch } },
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
