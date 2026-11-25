export const VARIABLES: readonly { nombre: string; sinElla: string; opcional?: boolean }[];
export function revisarEntorno(env?: Record<string, string | undefined>): { faltan: string[]; avisos: string[] };
export function avisarEntorno(env?: Record<string, string | undefined>, salida?: Pick<Console, 'info' | 'warn'>): void;
