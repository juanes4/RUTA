import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import {
  porcentajeFavorable,
  porcentajeNoSe,
  promediosDe,
  puntoDeBloqueo,
  resumirAdkar,
} from './adkar';
import { filaBuzon1 } from './pruebas/fabricas';

const UMBRAL = REGLAS.adkar.umbralBloqueo;
const FAVORABLE = REGLAS.adkar.valorFavorableMinimo;

describe('punto de bloqueo', () => {
  it('reproduce el ejemplo del documento: turno noche bloqueado en Deseo', () => {
    // CONTEXTO §8: C 3,6 · D 2,6 · K 2,1 · H 2,8 · R 3,1
    expect(puntoDeBloqueo({ C: 3.6, D: 2.6, K: 2.1, H: 2.8, R: 3.1 }, UMBRAL)).toBe('D');
  });

  it('respeta el orden C → D → K → H → R aunque otra dimensión sea más baja', () => {
    expect(puntoDeBloqueo({ C: 2.9, D: 1.0, K: 1.0, H: 1.0, R: 1.0 }, UMBRAL)).toBe('C');
  });

  it('3,0 exacto no bloquea (la regla es "menor a 3,0")', () => {
    expect(puntoDeBloqueo({ C: 3.0, D: 3.0, K: 3.0, H: 3.0, R: 3.0 }, UMBRAL)).toBeNull();
  });

  it('salta las dimensiones sin respuestas válidas', () => {
    expect(puntoDeBloqueo({ C: null, D: 3.5, K: 2.0, H: 4, R: 4 }, UMBRAL)).toBe('K');
  });
});

describe('resumen ADKAR', () => {
  it('"No sé" no entra al promedio y se cuenta aparte', () => {
    const perfil = resumirAdkar(
      [filaBuzon1('a', 'C', 4), filaBuzon1('b', 'C', 2), filaBuzon1('c', 'C', 'NS')],
      FAVORABLE,
    );
    expect(perfil.C.promedio).toBe(3);
    expect(perfil.C.validas).toBe(2);
    expect(perfil.C.noSe).toBe(1);
  });

  it('% favorable = respuestas 4 y 5 ÷ total válido', () => {
    const perfil = resumirAdkar(
      [filaBuzon1('a', 'D', 5), filaBuzon1('b', 'D', 4), filaBuzon1('c', 'D', 3), filaBuzon1('d', 'D', 'NS')],
      FAVORABLE,
    );
    expect(porcentajeFavorable(perfil.D)).toBeCloseTo(2 / 3);
    expect(porcentajeNoSe(perfil.D)).toBeCloseTo(1 / 4);
  });

  it('ignora las preguntas de diagnóstico del proceso', () => {
    const perfil = resumirAdkar([filaBuzon1('a', 'proceso', 1)], FAVORABLE);
    expect(promediosDe(perfil)).toEqual({ C: null, D: null, K: null, H: null, R: null });
  });
});
