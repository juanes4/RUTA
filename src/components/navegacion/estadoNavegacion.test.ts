import { describe, expect, it } from 'vitest';
import { anclaPaso, ETAPAS } from '../../config/etapas';
import { calcularEstadoNavegacion } from './estadoNavegacion';

describe('estado de la navegación', () => {
  it('muestra las 5 etapas con contadores 0/4, R 0/7, U 0/5 y T 0/2', () => {
    const { nodos } = calcularEstadoNavegacion(ETAPAS, null, new Set());
    expect(nodos.map((n) => `${n.etapa.letra} ${n.pasosVistos}/${n.totalPasos}`)).toEqual([
      '0 0/4',
      'R 0/7',
      'U 0/5',
      'T 0/2',
      'A 0/0',
    ]);
  });

  it('solo A sigue sin definir', () => {
    expect(ETAPAS.filter((e) => e.activa).map((e) => e.letra)).toEqual(['0', 'R', 'U', 'T']);
  });

  it('el contador avanza con los pasos vistos', () => {
    const vistos = new Set([anclaPaso('R1'), anclaPaso('R2'), anclaPaso('U1')]);
    const { nodos } = calcularEstadoNavegacion(ETAPAS, 'etapa-r', vistos);
    expect(nodos[1]).toMatchObject({ esActual: true, pasosVistos: 2 });
    expect(nodos[2]).toMatchObject({ esActual: false, pasosVistos: 1 });
  });

  it('la línea se llena hasta la etapa actual', () => {
    expect(calcularEstadoNavegacion(ETAPAS, 'etapa-0', new Set()).progreso).toBe(0);
    expect(calcularEstadoNavegacion(ETAPAS, 'etapa-u', new Set()).progreso).toBe(0.5);
    expect(calcularEstadoNavegacion(ETAPAS, 'etapa-t', new Set()).progreso).toBe(0.75);
  });

  it('una etapa vacía nunca es la actual', () => {
    const { nodos } = calcularEstadoNavegacion(ETAPAS, 'etapa-a', new Set());
    expect(nodos.some((n) => n.esActual)).toBe(false);
  });
});
