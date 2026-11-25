/**
 * Variables de entorno del servidor. Se leen del entorno o del archivo
 * ruta-web/.env (no se sube al repositorio; ver .env.example). Ninguna clave
 * se escribe en el código, ninguna llega al navegador y ningún valor se
 * imprime: la revisión de arranque solo dice qué falta.
 */

export const VARIABLES = [
  { nombre: 'GEMINI_API_KEY', sinElla: 'el copiloto solo funciona en modo simulado' },
  { nombre: 'GEMINI_MODEL', sinElla: 'el copiloto solo funciona en modo simulado' },
  { nombre: 'GEMINI_API_KEY_RESPALDO', opcional: true, sinElla: 'si la clave principal falla no hay otra que probar' },
  { nombre: 'GEMINI_MODELOS_RESPALDO', opcional: true, sinElla: 'si GEMINI_MODEL falla no hay otros modelos que probar' },
  { nombre: 'RUTA_IA_DATOS_REALES', sinElla: 'solo se envía a Gemini el buzón de prueba (datos reales bloqueados)' },
];

/** Prefijos que Vite u otros frameworks exponen al navegador. Una clave nunca debe llevarlos. */
const PREFIJOS_PUBLICOS = ['VITE_', 'NEXT_PUBLIC_', 'PUBLIC_', 'REACT_APP_'];
const PARECE_SECRETO = /(KEY|SECRET|TOKEN|CLAVE|PASSWORD|GEMINI)/i;

const definida = (env, nombre) => String(env[nombre] ?? '').trim() !== '';

/**
 * Revisa las variables sin leer ni devolver sus valores.
 * @returns {{ faltan: string[], avisos: string[] }}
 */
export function revisarEntorno(env = process.env) {
  // Las opcionales (como la clave de respaldo) no generan aviso si faltan.
  const faltan = VARIABLES.filter((v) => !v.opcional && !definida(env, v.nombre)).map((v) => v.nombre);
  const avisos = VARIABLES.filter((v) => faltan.includes(v.nombre)).map((v) => `Falta ${v.nombre}: ${v.sinElla}.`);
  if (definida(env, 'RUTA_IA_DATOS_REALES') && String(env.RUTA_IA_DATOS_REALES).trim() !== 'permitido') {
    avisos.push('RUTA_IA_DATOS_REALES tiene un valor distinto de "permitido": los datos reales siguen bloqueados.');
  }
  const publicas = Object.keys(env).filter((k) => PREFIJOS_PUBLICOS.some((p) => k.startsWith(p)) && PARECE_SECRETO.test(k.slice(k.indexOf('_') + 1)));
  for (const k of publicas) avisos.push(`${k} tiene un prefijo público y parece una clave: el navegador podría verla. Quita el prefijo.`);
  return { faltan, avisos };
}

/** Avisa en la consola qué variables faltan, sin mostrar ningún valor. */
export function avisarEntorno(env = process.env, salida = console) {
  const { avisos } = revisarEntorno(env);
  if (avisos.length === 0) return salida.info('[ruta] Variables del servidor: todas configuradas.');
  salida.warn(`[ruta] Revisa las variables del servidor (ruta-web/.env, ver .env.example):\n${avisos.map((a) => `  - ${a}`).join('\n')}`);
}
