import { describe, expect, it } from 'vitest';
import { KOTTER_PARTE_A, type PreguntaKotter } from '../../config/formularios/kotter';
import { REGLAS } from '../../config/reglas';
import { agruparPorRol, calcularBrechas, nivelPaso, puntajeRespuesta, puntajesPorPaso } from './kotter';
import { filaKotter, personasRol } from './pruebas/fabricas';

const MINIMO = REGLAS.anonimato.minimoKotter;
const pregunta = (id: string): PreguntaKotter => {
  const p = KOTTER_PARTE_A.find((q) => q.id === id);
  if (!p) throw new Error(`Pregunta ${id} no existe`);
  return p;
};
const b12: PreguntaKotter = { id: 'B1.2', paso: 1, texto: '', tipo: 'proporcion' };
const b41: PreguntaKotter = { id: 'B4.1', paso: 4, texto: '', tipo: 'comunicaciones' };

describe('conversión de respuestas (Instrumento 2 §2.4)', () => {
  it('escala: 1–5 tal cual; "No sé" no suma', () => {
    expect(puntajeRespuesta(pregunta('A1.1'), '4', null)).toBe(4);
    expect(puntajeRespuesta(pregunta('A1.1'), 'NS', null)).toBeNull();
  });

  it('Sí con evidencia = 5; No = 1', () => {
    expect(puntajeRespuesta(pregunta('A2.1'), 'si', 'Gerente de operaciones')).toBe(5);
    expect(puntajeRespuesta(pregunta('A2.1'), 'no', null)).toBe(1);
  });

  it('un "Sí" sin evidencia se registra como "No"', () => {
    expect(puntajeRespuesta(pregunta('A2.1'), 'si', null)).toBe(1);
    expect(puntajeRespuesta(pregunta('A2.1'), 'si', '   ')).toBe(1);
  });

  it('preguntas de alerta (A5.3, A5.4) se invierten: No = 5; Sí = 1', () => {
    expect(puntajeRespuesta(pregunta('A5.3'), 'no', null)).toBe(5);
    expect(puntajeRespuesta(pregunta('A5.4'), 'si', 'Bodega, temor a carga')).toBe(1);
  });

  it('proporciones (B1.2, B3.2): 1 · 2 · 4 · 5', () => {
    expect(['menos_25', '25_50', '51_75', 'mas_75'].map((r) => puntajeRespuesta(b12, r, null))).toEqual([1, 2, 4, 5]);
  });

  it('B4.1: 1 · 2 · 4 · 5', () => {
    expect(['ninguna', 'menos_mitad', 'mitad_o_mas', 'todas'].map((r) => puntajeRespuesta(b41, r, null))).toEqual([
      1, 2, 4, 5,
    ]);
  });

  it('A8.3: 5 · 3 · 2 · 1 y "No conozco" no suma', () => {
    const respuestas = ['sostuvieron', 'en_parte', 'abandonaron', 'no_implementaron', 'no_conozco'];
    expect(respuestas.map((r) => puntajeRespuesta(pregunta('A8.3'), r, null))).toEqual([5, 3, 2, 1, null]);
  });

  it('las abiertas no suman', () => {
    expect(puntajeRespuesta(pregunta('A5.2'), 'Sistemas lentos', null)).toBeNull();
  });
});

describe('puntaje y nivel del paso', () => {
  it('promedia escala y respuestas convertidas del mismo paso', () => {
    const filas = [
      filaKotter('a', 'direccion', 'A2.1', 'si', 'Gerente'), // 5
      filaKotter('a', 'direccion', 'A2.2', '2'), // 2
      filaKotter('a', 'direccion', 'A2.3', 'NS'), // no suma
    ];
    expect(puntajesPorPaso(filas, KOTTER_PARTE_A)[2]).toBe(3.5);
  });

  it('niveles: bajo < 3,0 ≤ medio < 4,0 ≤ alto', () => {
    expect(nivelPaso(2.9, REGLAS.kotter)).toBe('bajo');
    expect(nivelPaso(3.0, REGLAS.kotter)).toBe('medio');
    expect(nivelPaso(3.9, REGLAS.kotter)).toBe('medio');
    expect(nivelPaso(4.0, REGLAS.kotter)).toBe('alto');
  });
});

describe('grupos por rol y brecha', () => {
  it('todos los roles con 3 o más: modo completo, dirección vs. cada rol', () => {
    const filas = [
      ...personasRol('direccion', 3, 'A1.1', '5'),
      ...personasRol('lider_area', 3, 'A1.1', '3'),
      ...personasRol('equipo_cambio', 3, 'A1.1', '4'),
    ];
    const agrupacion = agruparPorRol(filas, MINIMO);
    expect(agrupacion.modo).toBe('completo');

    const brechas = calcularBrechas(agrupacion, KOTTER_PARTE_A, REGLAS.kotter.brechaAlerta);
    expect(brechas).toEqual([
      expect.objectContaining({ paso: 1, grupoA: 'direccion', grupoB: 'lider_area', diferencia: 2, alerta: true }),
      expect.objectContaining({ paso: 1, grupoA: 'direccion', grupoB: 'equipo_cambio', diferencia: 1, alerta: true }),
    ]);
  });

  it('dirección con menos de 3 → se une al equipo de cambio y la brecha es aproximada', () => {
    const filas = [
      ...personasRol('direccion', 1, 'A1.1', '5'),
      ...personasRol('lider_area', 3, 'A1.1', '3'),
      ...personasRol('equipo_cambio', 2, 'A1.1', '5'),
    ];
    const agrupacion = agruparPorRol(filas, MINIMO);
    expect(agrupacion.modo).toBe('aproximado');
    expect(agrupacion.faltanRespuestasDireccion).toBe(true);
    expect(agrupacion.grupos.map((g) => g.id)).toEqual(['coalicion', 'lider_area']);

    const [brecha] = calcularBrechas(agrupacion, KOTTER_PARTE_A, REGLAS.kotter.brechaAlerta);
    expect(brecha).toMatchObject({ grupoA: 'coalicion', grupoB: 'lider_area', diferencia: 2, aproximada: true });
  });

  it('coalición todavía con menos de 3 → solo total', () => {
    const filas = [...personasRol('direccion', 1), ...personasRol('lider_area', 5), ...personasRol('equipo_cambio', 1)];
    expect(agruparPorRol(filas, MINIMO).modo).toBe('solo_total');
  });

  it('líderes de área con menos de 3 → sin brecha, solo total', () => {
    const filas = [...personasRol('direccion', 4), ...personasRol('lider_area', 2), ...personasRol('equipo_cambio', 4)];
    const agrupacion = agruparPorRol(filas, MINIMO);
    expect(agrupacion.modo).toBe('solo_total');
    expect(calcularBrechas(agrupacion, KOTTER_PARTE_A, REGLAS.kotter.brechaAlerta)).toEqual([]);
  });

  it('una brecha menor a 1 punto no genera alerta', () => {
    const filas = [
      ...personasRol('direccion', 3, 'A1.1', '4'),
      ...personasRol('lider_area', 3, 'A1.1', '3'),
    ].map((f, i) => (i === 0 ? { ...f, respuesta_original: '3' } : f)); // dirección 3,67 vs líderes 3
    const [brecha] = calcularBrechas(agruparPorRol(filas, MINIMO), KOTTER_PARTE_A, REGLAS.kotter.brechaAlerta);
    expect(brecha?.alerta).toBe(false);
  });
});
