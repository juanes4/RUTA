import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import { evaluarSemaforo } from './semaforo';

const MARGEN = REGLAS.semaforo.margen;

describe('semáforo con margen relativo', () => {
  const utilizacion = { meta: 0.9, sentido: 'mayor_mejor' as const };
  const usoResidual = { meta: 0.1, sentido: 'menor_mejor' as const };

  it('mayor es mejor: meta 90 % → amarillo desde 76,5 %', () => {
    expect(evaluarSemaforo(0.9, utilizacion, MARGEN)).toBe('en_meta');
    expect(evaluarSemaforo(0.765, utilizacion, MARGEN)).toBe('atencion');
    expect(evaluarSemaforo(0.764, utilizacion, MARGEN)).toBe('intervenir');
  });

  it('menor es mejor: meta 10 % → amarillo hasta 11,5 %', () => {
    expect(evaluarSemaforo(0.1, usoResidual, MARGEN)).toBe('en_meta');
    expect(evaluarSemaforo(0.115, usoResidual, MARGEN)).toBe('atencion');
    expect(evaluarSemaforo(0.116, usoResidual, MARGEN)).toBe('intervenir');
  });

  it('cambiar el margen cambia el resultado sin tocar nada más', () => {
    expect(evaluarSemaforo(0.8, utilizacion, 0.15)).toBe('atencion');
    expect(evaluarSemaforo(0.8, utilizacion, 0.05)).toBe('intervenir');
  });
});

describe('semáforo con alerta propia (Kotter parte B)', () => {
  it('"menos de 75 %" es estricto: 75 % todavía es Atención', () => {
    const reuniones = { meta: 0.9, sentido: 'mayor_mejor' as const, alerta: { umbral: 0.75, incluye: false } };
    expect(evaluarSemaforo(0.75, reuniones, MARGEN)).toBe('atencion');
    expect(evaluarSemaforo(0.74, reuniones, MARGEN)).toBe('intervenir');
  });

  it('"2 o más" incluye el umbral', () => {
    const estancados = { meta: 0, sentido: 'menor_mejor' as const, alerta: { umbral: 2, incluye: true } };
    expect(evaluarSemaforo(0, estancados, MARGEN)).toBe('en_meta');
    expect(evaluarSemaforo(1, estancados, MARGEN)).toBe('atencion');
    expect(evaluarSemaforo(2, estancados, MARGEN)).toBe('intervenir');
  });
});
