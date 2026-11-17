import { describe, expect, it } from 'vitest';
import { borradorDecision, validarDecision } from './decision';

describe('registro de la decisión R7', () => {
  it('un borrador nuevo tiene una casilla por riesgo y la fecha dada', () => {
    const b = borradorDecision(null, 3, '2026-11-09');
    expect(b.riesgos).toEqual(['', '', '']);
    expect(b.fecha).toBe('2026-11-09');
    expect(b.decision).toBe('');
  });

  it('recupera lo guardado', () => {
    const guardada = { decision: 'lanzar' as const, fecha: '2026-11-01', responsable: 'Gerencia', riesgos: ['a', 'b', 'c'] };
    expect(borradorDecision(guardada, 3, '2026-11-09')).toEqual(guardada);
  });

  it('exige decisión, fecha, responsable y los tres riesgos', () => {
    expect(validarDecision({ decision: '', fecha: '', responsable: ' ', riesgos: ['a', '', ''] }, 3)).toHaveLength(4);
  });

  it('acepta un registro completo', () => {
    expect(validarDecision({ decision: 'postergar', fecha: '2026-11-09', responsable: 'Gerencia', riesgos: ['a', 'b', 'c'] }, 3)).toEqual([]);
  });
});
