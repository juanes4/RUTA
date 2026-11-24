import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { avisarEntorno, revisarEntorno, VARIABLES } from './entorno.mjs';

const SECRETO = 'valor-super-secreto-123';

describe('revisión de variables al iniciar', () => {
  it('avisa qué falta, sin mostrar ningún valor', () => {
    const lineas = [];
    const salida = { info: (t) => lineas.push(t), warn: (t) => lineas.push(t) };
    avisarEntorno({ GEMINI_API_KEY: SECRETO, RUTA_IA_DATOS_REALES: 'si' }, salida);
    const texto = lineas.join('\n');
    expect(texto).toContain('Falta GEMINI_MODEL');
    expect(texto).toContain('Falta RUTA_BUZON_API_KEY');
    expect(texto).not.toContain('Falta GEMINI_API_KEY');
    expect(texto).toContain('distinto de "permitido"');
    expect(texto).not.toContain(SECRETO);
    expect(texto).not.toContain('"si"');
  });

  it('con todo configurado no hay avisos', () => {
    const env = Object.fromEntries(VARIABLES.map((v) => [v.nombre, v.nombre === 'RUTA_IA_DATOS_REALES' ? 'permitido' : SECRETO]));
    expect(revisarEntorno(env)).toEqual({ faltan: [], avisos: [] });
  });

  it('alerta si una clave tiene un prefijo público como VITE_', () => {
    const { avisos } = revisarEntorno({ VITE_GEMINI_API_KEY: SECRETO, VITE_TITULO: 'RUTA' });
    expect(avisos.some((a) => a.startsWith('VITE_GEMINI_API_KEY'))).toBe(true);
    expect(avisos.some((a) => a.startsWith('VITE_TITULO'))).toBe(false);
    expect(avisos.join(' ')).not.toContain(SECRETO);
  });

  it('.env.example lista todas las variables y no trae valores', () => {
    const ejemplo = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
    const asignaciones = ejemplo.split('\n').filter((l) => /^[A-Z_]+=/.test(l));
    for (const v of VARIABLES) expect(asignaciones).toContain(`${v.nombre}=`);
    expect(asignaciones.every((l) => l.endsWith('='))).toBe(true);
  });
});
