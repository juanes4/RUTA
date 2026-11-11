import { describe, expect, it } from 'vitest';
import { filasDeEncuesta } from './buzon1';
import { filasDeChequeo } from './kotter';

describe('filasDeEncuesta', () => {
  it('guarda "No sé" como nulo y omite lo que quedó en blanco', () => {
    const filas = filasDeEncuesta(
      {
        area: 'Bodega',
        turno: '',
        antiguedad_rango: '',
        escala: { b1_03: '4', b1_04: 'NS' },
        seleccion: { b1_aprender: ['Video corto', 'Taller en grupo'] },
        abiertas: { b1_falla: '  ' },
      },
      'p1',
      '2026-11-09',
    );
    expect(filas.map((f) => [f.pregunta_id, f.valor, f.no_se])).toEqual([
      ['b1_03', 4, false],
      ['b1_04', null, true],
      ['b1_aprender', 'Video corto', false],
      ['b1_aprender', 'Taller en grupo', false],
    ]);
  });
});

describe('filasDeChequeo', () => {
  it('guarda la respuesta tal como se dio, con su paso y evidencia', () => {
    const filas = filasDeChequeo(
      {
        'A1.1': { respuesta: 'NS', evidencia: '' },
        'A1.3': { respuesta: 'si', evidencia: ' Costos ' },
        'A2.2': { respuesta: '', evidencia: '' },
      },
      'direccion',
      'p1',
      '2026-11-09',
    );
    expect(filas.map((f) => [f.pregunta_id, f.paso, f.respuesta_original, f.evidencia])).toEqual([
      ['A1.1', 1, 'NS', null],
      ['A1.3', 1, 'si', 'Costos'],
    ]);
  });
});
