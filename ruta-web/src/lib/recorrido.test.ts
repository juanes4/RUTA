import { describe, expect, it } from 'vitest';
import { RECORRIDO } from '../contenido/pasos';
import { fasesDelRecorrido } from './recorrido';

describe('recorrido del Inicio', () => {
  const fases = fasesDelRecorrido(RECORRIDO);

  it('cada verbo aparece una sola vez y conserva sus pasos', () => {
    expect(fases.map((f) => [f.verbo, f.pasos.length])).toEqual([
      ['Entender', 3],
      ['Comunicar', 2],
      ['Escuchar', 1],
      ['Decidir', 1],
      ['Acompañar', 2],
      ['Comprobar', 1],
    ]);
  });

  it('numera todo el recorrido y cuenta la posición dentro de cada etapa', () => {
    const pasos = fases.flatMap((f) => f.pasos);
    expect(pasos.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(pasos.map((p) => p.posicionEnEtapa)).toEqual([0, 1, 2, 3, 4, 5, 6, 0, 1, 0]);
  });
});
