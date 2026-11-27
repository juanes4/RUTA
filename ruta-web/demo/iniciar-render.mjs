/**
 * Arranque de la demo publicada en Render (caso ficticio de Bancolombia):
 *
 *   npm run demo:render      (Start Command de Render, después de `npm install && npm run build`)
 *
 * - Copia demo/render/demo-bancolombia.db a server/data/: cada reinicio vuelve al caso original.
 * - Sirve la versión compilada (dist/) con la API, en el puerto que asigna Render.
 * - Sin clave: quien entra sin sesión queda como `lider` (RUTA_DEMO_USUARIO). Solo para la demo, nunca con datos reales.
 * - Acepta el dominio de Render (RENDER_EXTERNAL_HOSTNAME) además de los de RUTA_HOSTS.
 * - GEMINI_API_KEY y GEMINI_MODEL se definen en el panel de Render; no van en el repositorio.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = resolve(RAIZ, 'demo/render/demo-bancolombia.db');
const DB = resolve(RAIZ, 'server/data/demo-render.db');
const PUERTO = Number(process.env.PORT) || 10000;

if (!existsSync(resolve(RAIZ, 'dist/index.html'))) {
  console.error('Falta la versión compilada. Corre primero: npm run build');
  process.exit(1);
}

mkdirSync(dirname(DB), { recursive: true });
copyFileSync(ORIGEN, DB);

process.chdir(RAIZ);
process.env.RUTA_DB = DB;
// Todo el buzón de esta base es inventado: se puede volver a analizar con Gemini.
process.env.RUTA_IA_DATOS_REALES ??= 'permitido';
process.env.RUTA_DEMO_USUARIO ??= 'lider';
const hosts = [process.env.RUTA_HOSTS, process.env.RENDER_EXTERNAL_HOSTNAME].filter(Boolean).join(',');
if (hosts) process.env.RUTA_HOSTS = hosts;

const servidor = await preview({
  root: RAIZ,
  configFile: resolve(RAIZ, 'vite.config.ts'),
  preview: { host: '0.0.0.0', port: PUERTO, strictPort: true, open: false },
});
console.log('\n  Demo RUTA · caso Bancolombia (ficticio) · ingreso sin clave como «%s»', process.env.RUTA_DEMO_USUARIO);
servidor.printUrls();
