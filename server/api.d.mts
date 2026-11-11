import type { IncomingMessage, ServerResponse } from 'node:http';
export function crearApi(
  db: unknown,
  opciones?: { seguro?: boolean },
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
