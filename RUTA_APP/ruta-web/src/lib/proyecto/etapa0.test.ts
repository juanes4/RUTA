import { describe, expect, it } from 'vitest';
import { ajustesDeMetas, normalizarSegmentacion, resolverMetas, validarAreas } from './etapa0';

describe('Etapa 0: grupos y afectados', () => {
  it('rechaza áreas sin nombre, repetidas o con afectados inválidos', () => {
    const errores = validarAreas([
      { area: 'Bodega', afectados: 18 },
      { area: ' bodega ', afectados: 3 },
      { area: '', afectados: 5 },
      { area: 'Calidad', afectados: -1 },
    ]);
    expect(errores.map((e) => e.campo)).toEqual(['area-1', 'area-2', 'afectados-3']);
  });

  it('limpia espacios y repetidos en turnos y rangos', () => {
    const resultado = normalizarSegmentacion({
      areas: [{ area: ' Bodega ', afectados: 18 }],
      turnos: ['Día', ' día ', '', 'Noche'],
      rangos_antiguedad: [],
    });
    expect(resultado).toEqual({ areas: [{ area: 'Bodega', afectados: 18 }], turnos: ['Día', 'Noche'], rangos_antiguedad: [] });
  });
});

describe('Etapa 0: metas', () => {
  it('sin ajustes usa las metas del documento', () => {
    const utilizacion = resolverMetas({}).find((m) => m.id === 'utilizacion');
    expect(utilizacion).toMatchObject({ meta: 0.9, ajustada: false });
  });

  it('una meta ajustada reemplaza la del documento', () => {
    const utilizacion = resolverMetas({ utilizacion: 0.8 }).find((m) => m.id === 'utilizacion');
    expect(utilizacion).toMatchObject({ meta: 0.8, valorPorDefecto: 0.9, ajustada: true });
  });

  it('solo se guardan las metas que cambian', () => {
    expect(ajustesDeMetas({ utilizacion: 0.9, competencia: 0.9 })).toEqual({ competencia: 0.9 });
  });
});
