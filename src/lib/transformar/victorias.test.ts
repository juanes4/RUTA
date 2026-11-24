import { describe, expect, it } from 'vitest';
import { CRITERIOS_MRMT } from '../../config/transformar';
import { clasificarMerito, criteriosSinEvidencia, escalonMayoritario, promedioDe, totalMrmt, type PuntajeCriterio } from './victorias';

const todos = (puntaje: number | null, evidencia = 'x'): Record<string, PuntajeCriterio> =>
  Object.fromEntries(CRITERIOS_MRMT.map((c) => [c.id, { puntaje, evidencia }]));

describe('matriz de valoración (MRMT)', () => {
  it('tiene ocho criterios en tres dimensiones', () => {
    expect(CRITERIOS_MRMT).toHaveLength(8);
    expect(new Set(CRITERIOS_MRMT.map((c) => c.dimension)).size).toBe(3);
  });

  it('suma de 8 a 40 y espera a que estén los ocho', () => {
    expect(totalMrmt(todos(1))).toBe(8);
    expect(totalMrmt(todos(5))).toBe(40);
    const incompleto = todos(3);
    incompleto['iniciativa'] = { puntaje: null, evidencia: '' };
    expect(totalMrmt(incompleto)).toBeNull();
  });

  it('clasifica con los cortes del documento', () => {
    expect(clasificarMerito(40)).toBe('destacado');
    expect(clasificarMerito(32)).toBe('destacado');
    expect(clasificarMerito(31)).toBe('favorable');
    expect(clasificarMerito(24)).toBe('favorable');
    expect(clasificarMerito(23)).toBe('desarrollo');
    expect(clasificarMerito(8)).toBe('desarrollo');
  });

  it('un 4 o un 5 sin evidencia se señala; un 3 no la necesita', () => {
    expect(criteriosSinEvidencia(todos(4, ' '))).toHaveLength(8);
    expect(criteriosSinEvidencia(todos(3, ''))).toHaveLength(0);
    expect(criteriosSinEvidencia(todos(5, 'Informe'))).toHaveLength(0);
  });
});

describe('escalera de autonomía', () => {
  it('el escalón mayoritario es el de más votos; con empate no hay mayoría', () => {
    expect(escalonMayoritario([1, 4, 2, 0])).toBe(2);
    expect(escalonMayoritario([3, 3, 0, 0])).toBeNull();
    expect(escalonMayoritario([0, 0, 0, 0])).toBeNull();
  });

  it('promedia con dos decimales', () => {
    expect(promedioDe([4, 5, 4])).toBe(4.33);
    expect(promedioDe([])).toBeNull();
  });
});
