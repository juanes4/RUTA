import type { Connect } from 'vite';
import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { crearApi } from './server/api.mjs';
import { abrirBase } from './server/db.mjs';

/**
 * Monta la API (/api/*, con SQLite) dentro del servidor de Vite, así
 * `npm run dev` y `npm run preview` levantan todo con un solo comando.
 */
function apiRuta(): Plugin {
  const montar = async (servidor: { middlewares: Connect.Server }) => {
    const api = crearApi(await abrirBase());
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

export default defineConfig({
  plugins: [react(), apiRuta()],
  test: {
    include: ['src/**/*.test.ts', 'server/**/*.test.mjs'],
  },
});
