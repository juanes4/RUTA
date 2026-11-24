import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import { DATOS_VACIOS } from '../modelo/proyecto';
import type { RespuestaBuzon1 } from '../modelo/tipos';
import { crearProyecto } from '../proyecto/crearProyecto';
import { construirTablero } from './construirTablero';

const proyecto = {
  ...crearProyecto('2026-11-01T00:00:00Z', 'p1'),
  segmentacion: {
    areas: [
      { area: 'Bodega', afectados: 4 },
      { area: 'Calidad', afectados: 0 },
    ],
  },
};

const respuesta = (id: string, area: string): RespuestaBuzon1 => ({ id, fecha: '2026-11-01', area, falla: 'x', preocupa: '', harias: '' });

describe('tablero', () => {
  it('sin datos no inventa resultados', () => {
    const t = construirTablero(proyecto, DATOS_VACIOS, REGLAS);
    expect(t.triaje).toMatchObject({ total: null, nivel: null, alcance: null });
    expect(t.foda.estrategia).toBeNull();
    expect(t.buzon.total).toBe(0);
    expect(t.liderazgo).toEqual({ lideres: 0, porEstilo: { A: 0, B: 0, C: 0, D: 0 }, voceros: [] });
  });

  it('calcula la participación del buzón por área y en total', () => {
    const t = construirTablero(proyecto, { ...DATOS_VACIOS, buzon1: [respuesta('1', 'Bodega'), respuesta('2', 'Bodega'), respuesta('3', 'Calidad')] }, REGLAS);
    expect(t.buzon.areas.map((a) => [a.area, a.respondentes, a.participacion])).toEqual([
      ['Bodega', 2, 0.5],
      ['Calidad', 1, null],
    ]);
    expect(t.buzon.total).toBe(0.75);
  });

  it('lleva el triaje y su alcance', () => {
    const triaje = { ...DATOS_VACIOS.triaje, impacto_personas: 3 as const, elementos: ['sistemas' as const], riesgo_operativo: 3 as const, alcance: 'piloto' as const };
    expect(construirTablero(proyecto, { ...DATOS_VACIOS, triaje }, REGLAS).triaje).toMatchObject({ total: 7, nivel: 'amarillo', alcance: 'piloto' });
  });
});
