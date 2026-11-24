import type { IncomingMessage, ServerResponse } from 'node:http';
export function crearApi(
  db: unknown,
  opciones?: { seguro?: boolean; coachResponder?: (params: unknown) => Promise<string> },
): (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;
