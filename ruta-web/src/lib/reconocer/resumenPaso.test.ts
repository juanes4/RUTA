import { describe, expect, it } from 'vitest';
import { DATOS_VACIOS } from '../modelo/proyecto';
import { crearProyecto } from '../proyecto/crearProyecto';
import { resumenPaso } from './resumenPaso';

const proyecto = crearProyecto('2026-11-01T00:00:00Z', 'p1');

describe('resumen de cada paso en el índice', () => {
  it('sin empresa o sin datos, todo está sin empezar', () => {
    for (const paso of ['R1', 'R2', 'R3', 'R4', 'R5', 'U1', 'U2', 'U3', 'U4']) {
      expect(resumenPaso(paso, null, DATOS_VACIOS)).toBe('Sin empezar');
      expect(resumenPaso(paso, proyecto, DATOS_VACIOS)).toBe('Sin empezar');
    }
  });

  it('cuenta el avance parcial y el completo', () => {
    expect(resumenPaso('R2', proyecto, { ...DATOS_VACIOS, triaje: { ...DATOS_VACIOS.triaje, impacto_personas: 2 } })).toBe('1 de 6 respuestas');
    expect(resumenPaso('U3', proyecto, { ...DATOS_VACIOS, soporte: { mensajes: ['a'], preguntas: [{ pregunta: 'p', respuesta: 'r' }], pautas: ['b'] } })).toBe('Completo');
    expect(resumenPaso('U4', proyecto, { ...DATOS_VACIOS, empatia: { ...DATOS_VACIOS.empatia, oye: ['x'] } })).toBe('1 de 6 cuadrantes');
  });
});
