import { describe, expect, it } from 'vitest';
import { calcularMapaColaborador, clasificarExperiencia } from './mapaColaborador';
import type { FilaRespuesta } from '../modelo/tipos';

describe('clasificarExperiencia', () => {
  it('clasifica según umbrales de favorabilidad', () => {
    expect(clasificarExperiencia(null)).toBe('pendiente');
    expect(clasificarExperiencia(0.82)).toBe('promotor');
    expect(clasificarExperiencia(0.7)).toBe('promotor');
    expect(clasificarExperiencia(0.47)).toBe('adaptacion');
    expect(clasificarExperiencia(0.35)).toBe('riesgo');
  });
});

describe('calcularMapaColaborador', () => {
  it('devuelve las 4 fases con valores pendientes si no hay respuestas', () => {
    const fases = calcularMapaColaborador([]);
    expect(fases).toHaveLength(4);
    expect(fases[0]?.valor).toBeNull();
    expect(fases[0]?.categoria).toBe('pendiente');
    expect(fases[1]?.valor).toBeNull();
    expect(fases[2]?.valor).toBeNull();
    expect(fases[3]?.valor).toBeCloseTo(0.8);
    expect(fases[3]?.categoria).toBe('promotor');
  });

  it('calcula la favorabilidad de buzón 1 en escala 1 a 5', () => {
    const respuestas: FilaRespuesta[] = [
      {
        id_respuesta: '1',
        instrumento: 'buzon1',
        momento: 'base',
        fecha: '2026-01-01',
        area: 'Ventas',
        turno: 'M',
        antiguedad_rango: '1-3',
        pregunta_id: 'p1',
        dimension: 'C',
        valor: 5, // 5 en escala 1-5 = 100% ( (5-1)/4 = 1.0 )
      },
      {
        id_respuesta: '2',
        instrumento: 'buzon1',
        momento: 'base',
        fecha: '2026-01-01',
        area: 'Ventas',
        turno: 'M',
        antiguedad_rango: '1-3',
        pregunta_id: 'p2',
        dimension: 'C',
        valor: 3, // 3 en escala 1-5 = 50% ( (3-1)/4 = 0.5 )
      },
    ];

    const fases = calcularMapaColaborador(respuestas);
    // Promedio de 5 y 3 = 4 -> (4-1)/4 = 0.75 (75%)
    expect(fases[0]?.valor).toBeCloseTo(0.75);
    expect(fases[0]?.categoria).toBe('promotor');
  });
});
