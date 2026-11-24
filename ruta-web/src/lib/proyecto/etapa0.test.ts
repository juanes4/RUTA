import { describe, expect, it } from 'vitest';
import { normalizarSegmentacion, validarAreas } from './etapa0';

describe('Etapa 0: áreas y afectados', () => {
  it('rechaza áreas sin nombre, repetidas o con afectados inválidos', () => {
    const errores = validarAreas([
      { area: 'Bodega', afectados: 18 },
      { area: ' bodega ', afectados: 3 },
      { area: '', afectados: 5 },
      { area: 'Calidad', afectados: -1 },
    ]);
    expect(errores.map((e) => e.campo)).toEqual(['area-1', 'area-2', 'afectados-3']);
  });

  it('limpia espacios en los nombres', () => {
    expect(normalizarSegmentacion({ areas: [{ area: ' Bodega ', afectados: 18 }] })).toEqual({ areas: [{ area: 'Bodega', afectados: 18 }] });
  });
});
