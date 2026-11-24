import type { Connect } from 'vite';
import { loadEnv } from 'vite';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { crearApi } from './server/api.mjs';
import { abrirBase } from './server/db.mjs';
import { avisarEntorno } from './server/entorno.mjs';

/**
 * Monta la API (/api/*, con SQLite) dentro del servidor de Vite, así
 * `npm run dev` y `npm run preview` levantan todo con un solo comando.
 *
 * Las variables del servidor (GEMINI_API_KEY, GEMINI_MODEL,
 * RUTA_IA_DATOS_REALES, RUTA_BUZON_API_KEY) se leen del entorno o de
 * ruta-web/.env (ver .env.example). Solo las usa la API: Vite pasa al
 * navegador únicamente las que empiezan con VITE_ (envPrefix), y aquí no hay
 * ninguna. Al arrancar se avisa qué falta, sin mostrar valores.
 */
function apiRuta(env: Record<string, string>, publicas: Record<string, string>): Plugin {
  const montar = async (servidor: { middlewares: Connect.Server }) => {
    // De las variables públicas solo se revisan los nombres (una clave con prefijo VITE_ sería visible en el navegador).
    avisarEntorno({ ...publicas, ...env });
    const api = crearApi(await abrirBase(), { env });
    servidor.middlewares.use((req, res, next) => {
      api(req, res).then((atendida) => atendida || next(), next);
    });
  };
  return {
    name: 'ruta-api',
    configureServer: (servidor) => montar(servidor),
    configurePreviewServer: (servidor) => montar(servidor),
  };
}

export default defineConfig(({ mode }) => {
  // Solo las variables del servidor (GEMINI_*, RUTA_*), del entorno o de ruta-web/.env.
  const env = loadEnv(mode, process.cwd(), ['GEMINI_', 'RUTA_']);
  /** Hosts extra (por ejemplo, el de un túnel para que Apps Script llegue al endpoint del buzón). */
  const hosts = (env.RUTA_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  return {
    // Lo único que llega al navegador: variables con prefijo VITE_. Nunca pongas una clave con ese prefijo.
    envPrefix: 'VITE_',
    plugins: [react(), apiRuta(env, loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_', 'PUBLIC_', 'REACT_APP_']))],
    server: hosts.length ? { allowedHosts: hosts } : {},
    preview: hosts.length ? { allowedHosts: hosts } : {},
    test: {
      include: ['src/**/*.test.ts', 'server/**/*.test.mjs'],
    },
  };
});
