import { describe, expect, it } from 'vitest';
import { resumirUsoPorCiclo } from './calculoUsoCiclos';
import type { FilaUso } from '../modelo/tipos';

describe('resumirUsoPorCiclo', () => {
  it('devuelve array vacío si no hay filas', () => {
    expect(resumirUsoPorCiclo([])).toEqual([]);
  });

  it('agrupa por ciclo y calcula proporciones correctamente', () => {
    const uso: FilaUso[] = [
      { fecha: '2026-01-01', ciclo: 2, grupo: 'A', transacciones_nuevo: 30, transacciones_antiguo: 10, registros_con_error: 0 },
      { fecha: '2026-01-01', ciclo: 1, grupo: 'A', transacciones_nuevo: 10, transacciones_antiguo: 90, registros_con_error: 0 },
      { fecha: '2026-01-02', ciclo: 2, grupo: 'B', transacciones_nuevo: 50, transacciones_antiguo: 10, registros_con_error: 0 },
    ];

    const resultado = resumirUsoPorCiclo(uso);

    expect(resultado).toHaveLength(2);
    const c1 = resultado[0]!;
    const c2 = resultado[1]!;

    // Ciclo 1
    expect(c1.ciclo).toBe(1);
    expect(c1.transaccionesNuevo).toBe(10);
    expect(c1.transaccionesAntiguo).toBe(90);
    expect(c1.totalTransacciones).toBe(100);
    expect(c1.tasaAdopcion).toBeCloseTo(0.1);
    expect(c1.tasaResidual).toBeCloseTo(0.9);

    // Ciclo 2
    expect(c2.ciclo).toBe(2);
    expect(c2.transaccionesNuevo).toBe(80);
    expect(c2.transaccionesAntiguo).toBe(20);
    expect(c2.totalTransacciones).toBe(100);
    expect(c2.tasaAdopcion).toBeCloseTo(0.8);
    expect(c2.tasaResidual).toBeCloseTo(0.2);
  });
});
