import { describe, expect, it } from 'vitest';
import { LIENZO_VACIO, type Lienzo } from '../modelo/proyecto';
import { BLOQUES_LIENZO, bloquesFaltantes, conFilasDeUrgencia, limpiarLienzo } from './lienzo';

const COMPLETO: Lienzo = {
  urgencia: [
    { motivo: 'a', dato: '1' },
    { motivo: 'b', dato: '2' },
    { motivo: 'c', dato: '3' },
  ],
  afectados: 'Bodega',
  vision: 'Una frase',
  que_cambia: 'El registro',
  que_no_cambia: 'Los turnos',
  beneficios: [{ grupo: 'Bodega', beneficio: 'Menos errores' }],
  riesgos: ['Falla del sistema'],
  intentos_previos: ['Ninguno'],
};

describe('bloquesFaltantes', () => {
  it('un lienzo vacío tiene todos los bloques pendientes', () => {
    expect(bloquesFaltantes(LIENZO_VACIO, 3)).toEqual(BLOQUES_LIENZO);
  });

  it('un lienzo con todo no tiene pendientes', () => {
    expect(bloquesFaltantes(COMPLETO, 3)).toEqual([]);
  });

  it('la urgencia exige los 3 motivos, cada uno con su dato', () => {
    const sinDato = { ...COMPLETO, urgencia: [...COMPLETO.urgencia.slice(0, 2), { motivo: 'c', dato: ' ' }] };
    expect(bloquesFaltantes(sinDato, 3)).toEqual(['urgencia']);
  });

  it('qué cambia y qué no cambia son un solo bloque que pide ambos', () => {
    expect(bloquesFaltantes({ ...COMPLETO, que_no_cambia: '' }, 3)).toEqual(['cambios']);
  });
});

describe('edición del lienzo', () => {
  it('completa las filas de urgencia sin tocar las que existen', () => {
    const { urgencia } = conFilasDeUrgencia({ ...LIENZO_VACIO, urgencia: [{ motivo: 'a', dato: '1' }] }, 3);
    expect(urgencia).toHaveLength(3);
    expect(urgencia[0]).toEqual({ motivo: 'a', dato: '1' });
  });

  it('al limpiar quita espacios y beneficios en blanco', () => {
    const limpio = limpiarLienzo({ ...LIENZO_VACIO, vision: '  x ', beneficios: [{ grupo: ' ', beneficio: '' }, { grupo: 'A ', beneficio: 'b' }] });
    expect(limpio.vision).toBe('x');
    expect(limpio.beneficios).toEqual([{ grupo: 'A', beneficio: 'b' }]);
  });
});
