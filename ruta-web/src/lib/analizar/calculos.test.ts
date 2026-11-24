import { describe, expect, it } from 'vitest';
import { INDICADORES_TABLERO_A } from '../../config/analizar';
import {
  clasificarCarita,
  deltaIndicadorA,
  formatearMetaA,
  formatearValorA,
  opcionPredominante,
  posicionEnEscalaA,
  resumirSemaforosA,
  semaforoIndicadorA,
  textoBrechaMetaA,
} from './calculos';

const porId = (id: string) => INDICADORES_TABLERO_A.find((i) => i.id === id)!;

describe('Etapa A1 · Semáforo de auditorías (margen relativo 15 %)', () => {
  it('mayor_mejor (Autonomía, meta 80 %): verde >= 80, amarillo 68..79.9, rojo < 68', () => {
    const autonomia = porId('autonomia');
    expect(semaforoIndicadorA(80, 80, autonomia)).toBe('en_meta');
    expect(semaforoIndicadorA(92, 80, autonomia)).toBe('en_meta');
    expect(semaforoIndicadorA(79.9, 80, autonomia)).toBe('atencion');
    expect(semaforoIndicadorA(68, 80, autonomia)).toBe('atencion');
    expect(semaforoIndicadorA(67.9, 80, autonomia)).toBe('intervenir');
    expect(semaforoIndicadorA(null, 80, autonomia)).toBeNull();
  });

  it('mayor_mejor escala 1 a 5 (Apropiación, meta 4,0): verde >= 4, amarillo 3,4..3,99, rojo < 3,4', () => {
    const apropiacion = porId('apropiacion');
    expect(semaforoIndicadorA(4.0, 4, apropiacion)).toBe('en_meta');
    expect(semaforoIndicadorA(3.4, 4, apropiacion)).toBe('atencion');
    expect(semaforoIndicadorA(3.39, 4, apropiacion)).toBe('intervenir');
  });

  it('menor_mejor (Regreso a lo anterior, meta 5 %): verde <= 5, amarillo 5,01..5,75, rojo > 5,75', () => {
    const regreso = porId('regreso_anterior');
    expect(semaforoIndicadorA(3, 5, regreso)).toBe('en_meta');
    expect(semaforoIndicadorA(5, 5, regreso)).toBe('en_meta');
    expect(semaforoIndicadorA(5.5, 5, regreso)).toBe('atencion');
    expect(semaforoIndicadorA(6.2, 5, regreso)).toBe('intervenir');
  });

  it('resume conteos y cumplimiento de una auditoría', () => {
    const resumen = resumirSemaforosA(
      {
        autonomia: 85, // en_meta
        uso_sostenido: 90, // en_meta
        regreso_anterior: 5.5, // atencion
        traspaso: 70, // intervenir (< 85)
        apropiacion: 4.2, // en_meta
      },
      {},
    );
    expect(resumen).toEqual({
      enMeta: 3,
      atencion: 1,
      intervenir: 1,
      sinDato: 3,
      evaluados: 5,
      porcentajeCumplimiento: 60,
    });
  });

  it('formatea valores y metas según la unidad', () => {
    expect(formatearValorA(85, 'porcentaje')).toBe('85 %');
    expect(formatearValorA(4.2, 'escala_5')).toBe('4,2 / 5');
    expect(formatearValorA(null, 'porcentaje')).toBe('—');
    expect(formatearMetaA(5, porId('regreso_anterior'))).toBe('< 5 %');
    expect(formatearMetaA(4, porId('apropiacion'))).toBe('≥ 4,0 / 5');
  });

  it('calcula posición en escala, brecha contra meta y delta entre auditorías', () => {
    expect(posicionEnEscalaA(4, 'escala_5')).toBe(80);
    expect(posicionEnEscalaA(85, 'porcentaje')).toBe(85);
    expect(textoBrechaMetaA(85, 80, porId('autonomia'))).toBe('+5 % sobre meta');
    expect(textoBrechaMetaA(3, 5, porId('regreso_anterior'))).toBe('2 % bajo el tope');
    expect(deltaIndicadorA(85, 78, porId('autonomia'))).toEqual({ texto: '↑ +7 %', favorable: true });
    expect(deltaIndicadorA(3, 6, porId('regreso_anterior'))).toEqual({ texto: '↓ -3 %', favorable: true });
    expect(deltaIndicadorA(8, 4, porId('regreso_anterior'))).toEqual({ texto: '↑ +4 %', favorable: false });
  });
});

describe('Etapa A2 · Mapa de viaje del colaborador (caritas y prioridades)', () => {
  it('clasifica caritas en los umbrales exactos del documento', () => {
    expect(clasificarCarita(3.0)).toBe('feliz');
    expect(clasificarCarita(2.5)).toBe('feliz');
    expect(clasificarCarita(2.49)).toBe('neutra');
    expect(clasificarCarita(1.8)).toBe('neutra');
    expect(clasificarCarita(1.79)).toBe('preocupada');
    expect(clasificarCarita(1.0)).toBe('preocupada');
    expect(clasificarCarita(null)).toBeNull();
  });

  it('identifica la opción predominante en preguntas de prioridad', () => {
    const top = opcionPredominante(9, { a: 2, b: 5, c: 1 });
    expect(top).toMatchObject({ letra: 'B', cantidad: 5, porcentaje: 63 });
    expect(opcionPredominante(9, { a: 0, b: 0, c: 0 })).toBeNull();
  });
});
