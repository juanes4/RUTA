import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import { DATOS_VACIOS } from '../modelo/proyecto';
import { crearProyecto } from '../proyecto/crearProyecto';
import { construirTablero } from './construirTablero';
import {
  calcularAvanceGlobal,
  calcularPilaresTransformacion,
  construirMetricasServidor,
  generarAlertasEjecutivas,
  SERVIDOR_VACIO,
  type DatosBrutosServidor,
} from './metricasEjecutivas';

describe('metricasEjecutivas del tablero', () => {
  it('con datos vacíos no inventa cifras y devuelve 15 pasos sin empezar', () => {
    const m = construirMetricasServidor(SERVIDOR_VACIO);
    expect(m.t1.promedioGeneral).toBeNull();
    expect(m.t2.tasaAprobacion).toBeNull();
    expect(m.a1.cumplimiento).toBeNull();
    expect(m.a2.porcentajeGeneral).toBeNull();

    const pilares = calcularPilaresTransformacion(m);
    expect(pilares).toHaveLength(5);
    expect(pilares.every((p) => p.porcentaje === null)).toBe(true);

    const avance = calcularAvanceGlobal(null, DATOS_VACIOS, m);
    expect(avance.total).toBe(15);
    expect(avance.porcentaje).toBe(0);
    expect(avance.porEtapa.map((e) => e.letra)).toEqual(['R', 'U', 'T', 'A']);
  });

  it('consolida métricas reales de T1–T4 y A1–A2, calcula pilares y detecta alertas críticas', () => {
    const bruto: DatosBrutosServidor = {
      pulsos: [
        { id: 1, sesion: 'S1', claridad: 4, utilidad: 5, confianza: 4, nombre: 'Líder', creadoEn: '2026-11-01 10:00:00' },
        { id: 2, sesion: 'S1', claridad: 5, utilidad: 4, confianza: 5, nombre: 'Ana', creadoEn: '2026-11-01 10:05:00' },
      ],
      historialT2: {
        verTodos: true,
        videos: [
          {
            id: 'emp-1',
            titulo: 'Video 1',
            youtubeId: 'abc',
            audiencia: 'empleado',
            elegibles: 4,
            vistas: [
              {
                usuarioId: 1,
                nombre: 'Ana',
                rol: 'empleado',
                vistoEn: '2026-11-02 10:00:00',
                simulador: { aciertos: 3, total: 3, aprobado: true, seguridad: 5, brecha: 'alineado', mensaje: '' },
              },
              {
                usuarioId: 2,
                nombre: 'Luis',
                rol: 'empleado',
                vistoEn: '2026-11-02 11:00:00',
                simulador: { aciertos: 1, total: 3, aprobado: false, seguridad: 5, brecha: 'sobreconfianza', mensaje: '' },
              },
            ],
          },
        ],
      },
      acuerdosT3: [{ id: 1, ciclo: 1, momento: 'cierre', nivel: 3, meta: 4, creadoEn: '2026-11-05 10:00:00' }],
      termometroT3: { minimo: 5, ciclos: [{ ciclo: 1, respuestas: 6, promedio: 4.2, porAfirmacion: [4, 4, 4, 4, 5] }] },
      dinamicasT3: [{ id: 1, dinamica: 'parejas', ciclo: 1, hoja: {}, nombre: 'Líder', creadoEn: '2026-11-04 10:00:00' }],
      meritosT4: [
        {
          id: 1,
          creadoEn: '2026-11-06 10:00:00',
          publicar: true,
          publicacion: { titulo: 'Sin papel', logramos: 'x', protagonistas: 'y', importancia: 'z', mensaje: 'w', autorizacion: true },
        },
      ],
      balancesT4: [{ id: 1, ciclo: 1, meritos: 'a', factores: 'b', dificultades: 'c', nombre: 'Líder', creadoEn: '2026-11-07 10:00:00' }],
      tableroA: {
        auditorias: [
          {
            id: 2,
            periodo: 'Día 90',
            fecha: '2026-11-23',
            equipo: 'Planta',
            observaciones: '',
            valores: {
              autonomia: 85,
              uso_sostenido: 94,
              regreso_anterior: 6, // intervenir (> 5.75)
              traspaso: 90, // atencion
              participacion: 91,
              comunicacion: 96,
              apropiacion: 4.2,
              recaidas: 93,
            },
            metas: {
              autonomia: 80,
              uso_sostenido: 90,
              regreso_anterior: 5,
              traspaso: 100,
              participacion: 80,
              comunicacion: 90,
              apropiacion: 4,
              recaidas: 90,
            },
            registradoPor: 'Líder',
            creadoEn: '2026-11-23 18:00:00',
          },
          {
            id: 1,
            periodo: 'Día 30',
            fecha: '2026-10-01',
            equipo: 'Planta',
            observaciones: '',
            valores: {
              autonomia: 50,
              uso_sostenido: 70,
              regreso_anterior: 12,
              traspaso: 50,
              participacion: 85,
              comunicacion: 92,
              apropiacion: 3.2,
              recaidas: 75,
            },
            metas: {
              autonomia: 80,
              uso_sostenido: 90,
              regreso_anterior: 5,
              traspaso: 100,
              participacion: 80,
              comunicacion: 90,
              apropiacion: 4,
              recaidas: 90,
            },
            registradoPor: 'Líder',
            creadoEn: '2026-10-01 18:00:00',
          },
        ],
        metasActuales: {
          autonomia: 80,
          uso_sostenido: 90,
          regreso_anterior: 5,
          traspaso: 100,
          participacion: 80,
          comunicacion: 90,
          apropiacion: 4,
          recaidas: 90,
        },
        sugeridosT: { apropiacion: { valor: 4.2, ciclo: 1, respuestas: 6 }, ultimoAcuerdo: null, sesionesPulso: 1 },
        balancesT: [],
      },
      viajeA: {
        periodo: 'todos',
        periodosDisponibles: ['Últimos 3 meses'],
        resumenEquipo: {
          totalRespuestas: 4,
          promedioGeneral: 2.28,
          porcentajeGeneral: 76,
          caritaGeneral: 'neutra',
          fases: [
            { id: 'antes', promedio: 2.6, porcentaje: 87, carita: 'feliz', preguntas: [] },
            { id: 'durante', promedio: 1.5, porcentaje: 50, carita: 'preocupada', preguntas: [] },
            { id: 'actual', promedio: 2.4, porcentaje: 80, carita: 'neutra', preguntas: [] },
            { id: 'mejorar', promedio: 2.6, porcentaje: 87, carita: 'feliz', preguntas: [] },
          ],
          preguntas: Array.from({ length: 12 }, (_, i) => ({
            indice: i,
            conteos: i === 9 ? { a: 3, b: 1, c: 0 } : { a: 2, b: 1, c: 1 },
            promedio: 2.25,
            porcentaje: 75,
            carita: 'neutra' as const,
          })),
        },
        propias: [],
        comentarios: [],
      },
    };

    const m = construirMetricasServidor(bruto);
    expect(m.t1.promedioGeneral).toBe(4.5);
    expect(m.t2.coberturaPorcentaje).toBe(50);
    expect(m.t2.tasaAprobacion).toBe(50);
    expect(m.t2.sobreconfianza).toBe(1);
    expect(m.t3.ultimoAcuerdo?.nombre).toBe('Autónomo');
    expect(m.t3.termometroPromedio).toBe(4.2);
    expect(m.t4.ultimoPublicado).toBe('Sin papel');
    expect(m.a1.cumplimiento).toBe(75);
    expect(m.a1.deltaCumplimiento).toBe(50);
    expect(m.a1.criticos).toEqual(['Regreso a lo anterior']);
    expect(m.a2.faseCritica?.id).toBe('durante');
    expect(m.a2.prioridadMejora?.porcentaje).toBe(75);

    const proyecto = crearProyecto('2026-11-01T00:00:00Z', 'p1');
    const tablero = construirTablero(proyecto, DATOS_VACIOS, REGLAS);
    const alertas = generarAlertasEjecutivas(tablero, m);
    expect(alertas.map((a) => a.id)).toContain('a1-rojos');
    expect(alertas.map((a) => a.id)).toContain('a2-friccion');
    expect(alertas.map((a) => a.id)).toContain('t2-sobreconfianza');

    const avance = calcularAvanceGlobal(proyecto, DATOS_VACIOS, m);
    expect(avance.completos).toBeGreaterThanOrEqual(3);
    expect(avance.porcentaje).toBeGreaterThan(20);
  });
});
