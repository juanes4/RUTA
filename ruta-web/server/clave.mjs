import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/** Formato guardado: scrypt$sal$hash (hex). Nunca se guarda la clave en claro. */
export function hashClave(clave) {
  const sal = randomBytes(16).toString('hex');
  const hash = scryptSync(clave, sal, 64).toString('hex');
  return `scrypt$${sal}$${hash}`;
}

export function verificarClave(clave, guardada) {
  const [tipo, sal, hash] = String(guardada).split('$');
  if (tipo !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'hex');
  const real = scryptSync(clave, sal, esperado.length);
  return timingSafeEqual(esperado, real);
}
