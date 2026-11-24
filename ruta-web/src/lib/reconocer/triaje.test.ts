import { describe, expect, it } from 'vitest';
import { puntajeTriaje, resumirTriaje } from './triaje';

describe('triaje del cambio', () => {
  it.each([
    [1, 1, 1, 'agil_estandar'],
    [1, 1, 2, 'agil_estandar'],
    [1, 2, 2, 'moderado'],
    [2, 3, 2, 'moderado'],
    [3, 3, 2, 'mayor'],
    [3, 3, 3, 'mayor'],
  ] as const)('clasifica puntajes %i + %i + %i', (impacto, complejidad, riesgo, ruta) => {
    expect(
      resumirTriaje({
        impacto_personas: impacto,
        complejidad_organizacional: complejidad,
        riesgo_operativo: riesgo,
      }).ruta,
    ).toBe(ruta);
  });

  it('solo acepta puntajes enteros de 1 a 3', () => {
    expect(puntajeTriaje('1')).toBe(1);
    expect(puntajeTriaje('3')).toBe(3);
    expect(puntajeTriaje('0')).toBeNull();
    expect(puntajeTriaje('4')).toBeNull();
    expect(puntajeTriaje('2.5')).toBeNull();
  });
});
