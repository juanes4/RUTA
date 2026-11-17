import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import type { Dimension } from '../modelo/tipos';
import { decidirR7, type ResultadoR7 } from './decisionR7';
import type { PuntajesPorPaso } from './kotter';

const reglas = { ...REGLAS.kotter, ...REGLAS.decisionR7 };

/** Todos los pasos en nivel alto salvo los indicados. */
function kotter(cambios: Partial<PuntajesPorPaso> = {}): PuntajesPorPaso {
  return { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, ...cambios };
}

function decision(puntajesKotter: PuntajesPorPaso, bloqueosPorGrupo: (Dimension | null)[]): ResultadoR7 {
  return decidirR7({ puntajesKotter, bloqueosPorGrupo }, reglas);
}

describe('decisión R7', () => {
  it('lanzar: pasos en nivel medio o alto y ningún grupo bloqueado en C ni D', () => {
    expect(decision(kotter({ 4: 3.2 }), [null, 'K', 'H'])).toMatchObject({ decision: 'lanzar' });
  });

  it('postergar: algún paso de 1 a 3 en nivel bajo (dirección no alineada)', () => {
    expect(decision(kotter({ 2: 2.9 }), [null])).toMatchObject({ decision: 'postergar' });
  });

  it('postergar: 3 o más pasos bajos aunque los pasos 1 a 3 estén bien', () => {
    expect(decision(kotter({ 4: 2, 5: 2, 6: 2 }), [null])).toMatchObject({ decision: 'postergar' });
  });

  it('postergar: más del 50 % de los grupos bloqueados en Conciencia', () => {
    expect(decision(kotter(), ['C', 'C', null])).toMatchObject({ decision: 'postergar' });
  });

  it('exactamente el 50 % en Conciencia no es mayoría → lanzar con ajustes', () => {
    expect(decision(kotter(), ['C', null])).toMatchObject({ decision: 'lanzar_con_ajustes' });
  });

  it('lanzar con ajustes: 1 o 2 pasos posteriores al 3 en nivel bajo', () => {
    expect(decision(kotter({ 6: 2.5, 8: 1.5 }), [null])).toMatchObject({ decision: 'lanzar_con_ajustes' });
  });

  it('lanzar con ajustes: algún grupo bloqueado en Deseo', () => {
    expect(decision(kotter(), ['D', null, null])).toMatchObject({ decision: 'lanzar_con_ajustes' });
  });

  it('postergar gana sobre lanzar con ajustes', () => {
    expect(decision(kotter({ 1: 2 }), ['D'])).toMatchObject({ decision: 'postergar' });
  });

  it('sin datos de Kotter o sin grupos válidos no decide', () => {
    const resultado = decision(kotter({ 5: null }), []);
    expect(resultado.estado).toBe('datos_insuficientes');
    if (resultado.estado === 'datos_insuficientes') expect(resultado.faltantes).toHaveLength(2);
  });
});
