/**
 * Inicia la app con la base del caso ficticio de Bancolombia, aparte de la base de pruebas:
 *
 *   npm run demo
 *
 * - Base: server/data/demo-bancolombia.db (la crea demo/sembrar.mjs).
 * - Puerto 5180: otro origen, así el navegador guarda los datos de la demo aparte de los de `npm run dev` (5173).
 * - Abre la página que carga el caso en el navegador (/demo/cargar-bancolombia.html). Si ya está cargado, solo lleva a la app.
 */
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DB = resolve(RAIZ, 'server/data/demo-bancolombia.db');
const PUERTO = Number(process.env.RUTA_PUERTO_DEMO) || 5180;

if (!existsSync(DB) || !existsSync(resolve(RAIZ, 'public/demo/bancolombia.json'))) {
  console.error('Todavía no está generado el caso. Corre primero: npm run demo:sembrar');
  process.exit(1);
}

process.chdir(RAIZ);
process.env.RUTA_DB = DB;
// Todo el buzón de la base de la demo es inventado: se puede volver a analizar con Gemini en vivo.
process.env.RUTA_IA_DATOS_REALES = 'permitido';

const servidor = await createServer({
  root: RAIZ,
  configFile: resolve(RAIZ, 'vite.config.ts'),
  server: { port: PUERTO, strictPort: true, open: '/demo/cargar-bancolombia.html' },
});
await servidor.listen();
console.log('\n  Caso Bancolombia (ficticio) · base de la demo:', DB);
servidor.printUrls();
console.log('  Carga del caso en el navegador: http://localhost:%d/demo/cargar-bancolombia.html\n', PUERTO);
