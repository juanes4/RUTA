import { describe, expect, it } from 'vitest';
import { cumplimientoMeta, filasIndicadores, hallazgos, type EntradaHallazgos } from './perspectivas';

const metas = { autonomia: 80, uso_sostenido: 90, regreso_anterior: 5, traspaso: 100, participacion: 80, comunicacion: 90, apropiacion: 4, recaidas: 90 };

describe('cumplimiento de la meta', () => {
  it('mayor es mejor: valor ÷ meta', () => {
    expect(cumplimientoMeta(72, 80, { sentido: 'mayor_mejor' })).toBe(90);
  });
  it('menor es mejor: meta ÷ valor, con tope', () => {
    expect(cumplimientoMeta(10, 5, { sentido: 'menor_mejor' })).toBe(50);
    expect(cumplimientoMeta(0, 5, { sentido: 'menor_mejor' })).toBe(120);
  });
  it('sin valor no inventa', () => {
    expect(cumplimientoMeta(null, 80, { sentido: 'mayor_mejor' })).toBeNull();
  });
});

describe('filas de indicadores', () => {
  // La API entrega la auditoría más reciente primero.
  const auditorias = [
    { periodo: 'Día 60', metas, valores: { autonomia: 60, uso_sostenido: 90 } },
    { periodo: 'Día 30', metas, valores: { autonomia: 40, uso_sostenido: 70 } },
  ];

  it('toma la primera y la última auditoría y ordena de la más lejana a la más cercana a la meta', () => {
    const filas = filasIndicadores(auditorias);
    expect(filas[0]).toMatchObject({ id: 'autonomia', inicial: 40, actual: 60, cumplimientoActual: 75, estado: 'intervenir', serie: [40, 60] });
    expect(filas[1]).toMatchObject({ id: 'uso_sostenido', estado: 'en_meta' });
    expect(filas.at(-1)?.actual).toBeNull();
  });
});

describe('hallazgos', () => {
  const base: EntradaHallazgos = {
    periodoActual: 'Día 60',
    indicadores: filasIndicadores([
      { periodo: 'Día 60', metas, valores: { autonomia: 60, uso_sostenido: 90 } },
      { periodo: 'Día 30', metas, valores: { autonomia: 40, uso_sostenido: 70 } },
    ]),
    temas: [
      { tema: 'Sobrecarga', p1: 2, p2: 3, total: 5 },
      { tema: 'Procesos ineficientes', p1: 8, p2: 1, total: 9 },
    ],
    respuestasBuzon: 20,
    actores: [{ actor: 'Asesores', brecha: 2 }],
    fases: [
      { titulo: 'Antes', promedio: 2.4 },
      { titulo: 'Durante', promedio: 1.6 },
    ],
    periodoFases: 'Ciclo 1',
    apropiacion: { anterior: 3.2, actual: 4.1, meta: 4 },
    simulador: { alineado: 8, sobreconfianza: 2 },
  };

  it('ordena por prioridad: actuar, vigilar y va bien', () => {
    const h = hallazgos(base, 10);
    const orden = h.map((x) => x.prioridad);
    expect(orden).toEqual([...orden].sort((a, b) => ['actuar', 'vigilar', 'bien'].indexOf(a) - ['actuar', 'vigilar', 'bien'].indexOf(b)));
    expect(h[0]).toMatchObject({ prioridad: 'actuar', etapa: 'A' });
    expect(h.some((x) => x.titulo.includes('Procesos ineficientes'))).toBe(true);
    expect(h.some((x) => x.prioridad === 'bien' && x.etapa === 'T')).toBe(true);
  });

  it('respeta el máximo y no inventa hallazgos sin datos', () => {
    expect(hallazgos(base, 3)).toHaveLength(3);
    const vacio = hallazgos({ ...base, indicadores: [], temas: [], actores: [], fases: [], apropiacion: { anterior: null, actual: null, meta: 4 }, simulador: null });
    expect(vacio).toEqual([]);
  });
});
