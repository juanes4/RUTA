import { describe, expect, it } from 'vitest';
import { normalizarAPorcentaje, prepararBarrasAdkar, prepararBarrasIndicadores } from './calculoBarras';
import type { FilaIndicador } from './construirTablero';

describe('normalizarAPorcentaje', () => {
  it('convierte fracciones a porcentajes 0-100', () => {
    expect(normalizarAPorcentaje(0.7, 'porcentaje')).toBe(70);
    expect(normalizarAPorcentaje(1.0, 'porcentaje')).toBe(100);
    expect(normalizarAPorcentaje(null, 'porcentaje')).toBeNull();
  });

  it('convierte escala 1-5 a porcentaje sobre 5', () => {
    expect(normalizarAPorcentaje(4.0, 'escala_1_5')).toBe(80);
    expect(normalizarAPorcentaje(5.0, 'escala_1_5')).toBe(100);
    expect(normalizarAPorcentaje(2.5, 'escala_1_5')).toBe(50);
  });
});

describe('prepararBarrasIndicadores', () => {
  it('transforma filas a elementos de barra con metas y valores', () => {
    const filas: FilaIndicador[] = [
      {
        meta: {
          id: 'participacion',
          nombre: 'Participación',
          etapa: 'R',
          meta: 0.7,
          valorPorDefecto: 0.7,
          ajustada: false,
          sentido: 'mayor_mejor',
          unidad: 'porcentaje',
          queMide: '',
          fuenteDato: '',
          fuente: '',
        },
        valor: 0.75,
        motivo: null,
        estado: 'en_meta',
      },
    ];

    const barras = prepararBarrasIndicadores(filas);
    expect(barras).toHaveLength(1);
    const b0 = barras[0]!;
    expect(b0.id).toBe('participacion');
    expect(b0.porcentajeValor).toBe(75);
    expect(b0.porcentajeMeta).toBe(70);
    expect(b0.estado).toBe('en_meta');
  });
});

describe('prepararBarrasAdkar', () => {
  it('genera las 5 dimensiones ADKAR', () => {
    const barras = prepararBarrasAdkar([]);
    expect(barras).toHaveLength(5);
    expect(barras.map((b) => b.id)).toEqual(['C', 'D', 'K', 'H', 'R']);
    expect(barras[0]!.porcentajeMeta).toBe(60); // 3.0 / 5 = 60%
  });
});
