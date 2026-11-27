import { FASES_VIAJE_CONFIG, INDICADORES_TABLERO_A, PREGUNTAS_VIAJE, type EstadoCarita, type IdFaseViaje } from '../../config/analizar';
import { ETAPAS } from '../../config/etapas';
import { ESCALERA } from '../../config/transformar';
import { opcionPredominante, resumirSemaforosA, semaforoIndicadorA } from '../analizar/calculos';
import type {
  Acuerdo,
  BalanceCiclo,
  CicloTermometro,
  Historial,
  Merito,
  RegistroAuditoriaA,
  RegistroDinamica,
  RegistroPulso,
  RespuestaTableroA,
  RespuestaViajeA,
} from '../api';
import type { DatosProyecto, Proyecto } from '../modelo/proyecto';
import { resumenPaso } from '../reconocer/resumenPaso';
import type { Tablero } from './construirTablero';

/** Respuestas crudas que llegan de los endpoints de Etapa T y Etapa A. */
export interface DatosBrutosServidor {
  pulsos: RegistroPulso[];
  historialT2: Historial | null;
  acuerdosT3: Acuerdo[];
  termometroT3: { minimo: number; ciclos: CicloTermometro[] } | null;
  dinamicasT3: RegistroDinamica[];
  meritosT4: Merito[];
  balancesT4: BalanceCiclo[];
  tableroA: RespuestaTableroA | null;
  viajeA: RespuestaViajeA | null;
}

export const SERVIDOR_VACIO: DatosBrutosServidor = {
  pulsos: [],
  historialT2: null,
  acuerdosT3: [],
  termometroT3: null,
  dinamicasT3: [],
  meritosT4: [],
  balancesT4: [],
  tableroA: null,
  viajeA: null,
};

export interface MetricasServidor {
  t1: {
    respuestas: number;
    sesiones: number;
    claridad: number | null;
    utilidad: number | null;
    confianza: number | null;
    promedioGeneral: number | null;
  };
  t2: {
    videosTotales: number;
    coberturaPorcentaje: number | null;
    simuladoresHechos: number;
    tasaAprobacion: number | null;
    seguridadPromedio: number | null;
    sobreconfianza: number;
    necesitaApoyo: number;
  };
  t3: {
    ultimoAcuerdo: { ciclo: number; momento: 'inicio' | 'cierre'; nivel: number; nombre: string; meta: number | null } | null;
    termometroPromedio: number | null;
    termometroCiclo: number | null;
    termometroRespuestas: number;
    dinamicasHechas: number;
  };
  t4: {
    totalMeritos: number;
    publicados: number;
    ultimoPublicado: string | null;
    balances: number;
  };
  a1: {
    totalAuditorias: number;
    ultima: RegistroAuditoriaA | null;
    periodo: string | null;
    cumplimiento: number | null;
    deltaCumplimiento: number | null;
    enMeta: number;
    atencion: number;
    intervenir: number;
    evaluados: number;
    criticos: string[];
    evolucion: { id: number; periodo: string; fecha: string; cumplimiento: number }[];
  };
  a2: {
    totalRespuestas: number;
    promedioGeneral: number | null;
    porcentajeGeneral: number | null;
    caritaGeneral: EstadoCarita | null;
    fases: { id: IdFaseViaje; titulo: string; subtitulo: string; promedio: number | null; porcentaje: number; carita: EstadoCarita | null }[];
    faseCritica: { id: IdFaseViaje; titulo: string; promedio: number; porcentaje: number; carita: EstadoCarita | null } | null;
    prioridadMejora: { texto: string; porcentaje: number } | null;
  };
}

export interface PilarTransformacion {
  id: string;
  etapa: 'T' | 'A';
  pasoId: string;
  etapaId: string;
  nombre: string;
  subtitulo: string;
  porcentaje: number | null;
  valorTexto: string;
  metaTexto: string;
  color: string;
}

export interface AlertaEjecutiva {
  id: string;
  severidad: 'peligro' | 'atencion' | 'info';
  etiqueta: string;
  titulo: string;
  detalle: string;
  etapaId: string;
  pasoId: string;
}

export type EstadoPaso = 'completo' | 'en_curso' | 'sin_empezar';

export interface FilaAvancePaso {
  etapaId: string;
  etapaLetra: string;
  etapaNombre: string;
  color: string;
  pasoId: string;
  titulo: string;
  texto: string;
  estado: EstadoPaso;
}

export interface ResumenAvanceGlobal {
  pasos: FilaAvancePaso[];
  completos: number;
  enCurso: number;
  total: number;
  porcentaje: number;
  porEtapa: {
    id: string;
    letra: string;
    nombre: string;
    color: string;
    activos: number;
    total: number;
    porcentaje: number;
  }[];
}

const promedio = (nums: number[]): number | null =>
  nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : null;

const plural = (n: number, s: string, p: string) => `${n} ${n === 1 ? s : p}`;

/** Consolida las métricas reales de Etapa T y Etapa A a partir de las respuestas de la API. */
export function construirMetricasServidor(bruto: DatosBrutosServidor): MetricasServidor {
  // T1: Encuesta de pulso
  const claridad = promedio(bruto.pulsos.map((p) => p.claridad));
  const utilidad = promedio(bruto.pulsos.map((p) => p.utilidad));
  const confianza = promedio(bruto.pulsos.map((p) => p.confianza));
  const promedioT1 =
    claridad !== null && utilidad !== null && confianza !== null ? promedio([claridad, utilidad, confianza]) : null;
  const sesionesT1 = new Set(bruto.pulsos.map((p) => p.sesion)).size;

  // T2: Capacitación y simuladores
  const videos = bruto.historialT2?.videos ?? [];
  const totalPosibles = videos.reduce((acc, v) => acc + (bruto.historialT2?.verTodos ? v.elegibles : 1), 0);
  const totalVistas = videos.reduce((acc, v) => acc + v.vistas.length, 0);
  const coberturaPorcentaje = totalPosibles > 0 ? Math.min(100, Math.round((totalVistas / totalPosibles) * 100)) : null;

  const simuladores = videos.flatMap((v) => v.vistas.map((s) => s.simulador).filter((x): x is NonNullable<typeof x> => x !== null));
  const aprobados = simuladores.filter((s) => s.aprobado).length;
  const tasaAprobacion = simuladores.length > 0 ? Math.round((aprobados / simuladores.length) * 100) : null;
  const seguridadPromedio = promedio(simuladores.map((s) => s.seguridad));
  const sobreconfianza = simuladores.filter((s) => s.brecha === 'sobreconfianza').length;
  const necesitaApoyo = simuladores.filter((s) => s.brecha === 'necesita_apoyo').length;

  // T3: Escalera, termómetro y dinámicas
  const ultimoAcRaw = bruto.acuerdosT3[0] ?? bruto.tableroA?.sugeridosT.ultimoAcuerdo ?? null;
  const ultimoAcuerdo = ultimoAcRaw
    ? {
        ciclo: ultimoAcRaw.ciclo,
        momento: ultimoAcRaw.momento,
        nivel: ultimoAcRaw.nivel,
        nombre: ESCALERA.find((e) => e.nivel === ultimoAcRaw.nivel)?.nombre ?? `Nivel ${ultimoAcRaw.nivel}`,
        meta: ultimoAcRaw.meta ?? null,
      }
    : null;

  const ciclosTerm = bruto.termometroT3?.ciclos ?? [];
  const ultimoTermVisible = [...ciclosTerm].reverse().find((c) => c.promedio !== null) ?? null;
  const sugAprop = bruto.tableroA?.sugeridosT.apropiacion ?? null;
  const termometroPromedio = ultimoTermVisible?.promedio ?? sugAprop?.valor ?? null;
  const termometroCiclo = ultimoTermVisible?.ciclo ?? sugAprop?.ciclo ?? null;
  const termometroRespuestas =
    ultimoTermVisible?.respuestas ?? sugAprop?.respuestas ?? ciclosTerm.reduce((a, c) => a + c.respuestas, 0);

  // T4: Victorias tempranas
  const publicadosList = bruto.meritosT4.filter((m) => m.publicar);
  const ultimoPublicado = publicadosList[0]?.publicacion?.titulo ?? null;
  const balancesCount = Math.max(bruto.balancesT4.length, bruto.tableroA?.balancesT.length ?? 0);

  // A1: Auditorías de adopción
  const auditorias = bruto.tableroA?.auditorias ?? [];
  const ultima = auditorias[0] ?? null;
  const previa = auditorias[1] ?? null;
  const resumenUlt = ultima ? resumirSemaforosA(ultima.valores, ultima.metas) : null;
  const resumenPrev = previa ? resumirSemaforosA(previa.valores, previa.metas) : null;
  const deltaCumplimiento =
    resumenUlt?.porcentajeCumplimiento !== null &&
    resumenUlt?.porcentajeCumplimiento !== undefined &&
    resumenPrev?.porcentajeCumplimiento !== null &&
    resumenPrev?.porcentajeCumplimiento !== undefined
      ? resumenUlt.porcentajeCumplimiento - resumenPrev.porcentajeCumplimiento
      : null;

  const criticos = ultima
    ? INDICADORES_TABLERO_A.filter((ind) => {
        const estado = semaforoIndicadorA(ultima.valores[ind.id], ultima.metas[ind.id] ?? ind.metaInicial, ind);
        return estado === 'intervenir';
      }).map((i) => i.nombre)
    : [];

  const evolucion = [...auditorias]
    .reverse()
    .map((a) => {
      const r = resumirSemaforosA(a.valores, a.metas);
      return { id: a.id, periodo: a.periodo, fecha: a.fecha, cumplimiento: r.porcentajeCumplimiento ?? 0 };
    });

  // A2: Mapa de viaje del colaborador
  const resViaje = bruto.viajeA?.resumenEquipo ?? null;
  const fases = FASES_VIAJE_CONFIG.map((cfg) => {
    const f = resViaje?.fases.find((x) => x.id === cfg.id);
    return {
      id: cfg.id,
      titulo: cfg.titulo,
      subtitulo: cfg.subtitulo,
      promedio: f?.promedio ?? null,
      porcentaje: f?.porcentaje ?? 0,
      carita: f?.carita ?? null,
    };
  });
  const fasesValidas = fases.filter((f): f is typeof f & { promedio: number } => f.promedio !== null);
  const faseCritica = fasesValidas.length > 0 ? [...fasesValidas].sort((a, b) => a.promedio - b.promedio)[0] ?? null : null;

  const p10 = resViaje?.preguntas[9];
  const topP10 = resViaje && resViaje.totalRespuestas > 0 && p10 ? opcionPredominante(9, p10.conteos) : null;

  return {
    t1: {
      respuestas: bruto.pulsos.length,
      sesiones: sesionesT1,
      claridad,
      utilidad,
      confianza,
      promedioGeneral: promedioT1,
    },
    t2: {
      videosTotales: videos.length,
      coberturaPorcentaje,
      simuladoresHechos: simuladores.length,
      tasaAprobacion,
      seguridadPromedio,
      sobreconfianza,
      necesitaApoyo,
    },
    t3: {
      ultimoAcuerdo,
      termometroPromedio,
      termometroCiclo,
      termometroRespuestas,
      dinamicasHechas: bruto.dinamicasT3.length,
    },
    t4: {
      totalMeritos: bruto.meritosT4.length,
      publicados: publicadosList.length,
      ultimoPublicado,
      balances: balancesCount,
    },
    a1: {
      totalAuditorias: auditorias.length,
      ultima,
      periodo: ultima?.periodo ?? null,
      cumplimiento: resumenUlt?.porcentajeCumplimiento ?? null,
      deltaCumplimiento,
      enMeta: resumenUlt?.enMeta ?? 0,
      atencion: resumenUlt?.atencion ?? 0,
      intervenir: resumenUlt?.intervenir ?? 0,
      evaluados: resumenUlt?.evaluados ?? 0,
      criticos,
      evolucion,
    },
    a2: {
      totalRespuestas: resViaje?.totalRespuestas ?? 0,
      promedioGeneral: resViaje?.promedioGeneral ?? null,
      porcentajeGeneral: resViaje?.porcentajeGeneral ?? null,
      caritaGeneral: resViaje?.caritaGeneral ?? null,
      fases,
      faseCritica,
      prioridadMejora: topP10 ? { texto: topP10.texto, porcentaje: topP10.porcentaje } : null,
    },
  };
}

/** Los 5 grandes pilares de transformación (Kirkpatrick T1–T3 + Sostenibilidad A1–A2) normalizados 0–100 %. */
export function calcularPilaresTransformacion(m: MetricasServidor): PilarTransformacion[] {
  const pctT1 = m.t1.promedioGeneral !== null ? Math.round((m.t1.promedioGeneral / 5) * 100) : null;
  const pctT3 =
    m.t3.termometroPromedio !== null
      ? Math.round((m.t3.termometroPromedio / 5) * 100)
      : m.t3.ultimoAcuerdo
        ? Math.round((m.t3.ultimoAcuerdo.nivel / 4) * 100)
        : null;

  const textoT3 =
    m.t3.termometroPromedio !== null
      ? `${m.t3.termometroPromedio.toFixed(1).replace('.', ',')} / 5`
      : m.t3.ultimoAcuerdo
        ? `Nivel ${m.t3.ultimoAcuerdo.nivel} (${m.t3.ultimoAcuerdo.nombre})`
        : 'Sin dato';

  return [
    {
      id: 'reaccion',
      etapa: 'T',
      pasoId: 'T1',
      etapaId: 'etapa-t',
      nombre: 'Reacción y claridad',
      subtitulo: 'Nivel 1 Kirkpatrick · Pulso T1',
      porcentaje: pctT1,
      valorTexto: m.t1.promedioGeneral !== null ? `${m.t1.promedioGeneral.toFixed(1).replace('.', ',')} / 5` : 'Sin dato',
      metaTexto: 'Meta ≥ 4,0',
      color: 'var(--pastel-mint)',
    },
    {
      id: 'aprendizaje',
      etapa: 'T',
      pasoId: 'T2',
      etapaId: 'etapa-t',
      nombre: 'Dominio práctico',
      subtitulo: 'Nivel 2 Kirkpatrick · Simulador T2',
      porcentaje: m.t2.tasaAprobacion,
      valorTexto: m.t2.tasaAprobacion !== null ? `${m.t2.tasaAprobacion} %` : 'Sin dato',
      metaTexto: 'Meta ≥ 80 %',
      color: 'var(--pastel-mint)',
    },
    {
      id: 'apropiacion',
      etapa: 'T',
      pasoId: 'T3',
      etapaId: 'etapa-t',
      nombre: 'Apropiación y autonomía',
      subtitulo: 'Nivel 3 Kirkpatrick · Termómetro y Escalera T3',
      porcentaje: pctT3,
      valorTexto: textoT3,
      metaTexto: 'Meta 4,0 / 5',
      color: 'var(--pastel-mint)',
    },
    {
      id: 'adopcion',
      etapa: 'A',
      pasoId: 'A1',
      etapaId: 'etapa-a',
      nombre: 'Adopción operativa',
      subtitulo: 'Tablero del equipo · Auditoría A1',
      porcentaje: m.a1.cumplimiento,
      valorTexto: m.a1.cumplimiento !== null ? `${m.a1.cumplimiento} % (${m.a1.enMeta}/${m.a1.evaluados})` : 'Sin dato',
      metaTexto: '8 indicadores',
      color: 'var(--pastel-cream)',
    },
    {
      id: 'experiencia',
      etapa: 'A',
      pasoId: 'A2',
      etapaId: 'etapa-a',
      nombre: 'Experiencia del colaborador',
      subtitulo: 'Mapa de viaje punta a punta · A2',
      porcentaje: m.a2.porcentajeGeneral,
      valorTexto: m.a2.promedioGeneral !== null ? `${m.a2.promedioGeneral.toFixed(2).replace('.', ',')} / 3,00` : 'Sin dato',
      metaTexto: 'Meta ≥ 2,50',
      color: 'var(--pastel-cream)',
    },
  ];
}

/** Detecta las alertas de mayor valor ejecutivo en todo R–U–T–A para orientar acción inmediata. */
export function generarAlertasEjecutivas(tablero: Tablero | null, m: MetricasServidor): AlertaEjecutiva[] {
  const alertas: AlertaEjecutiva[] = [];

  if (m.a1.intervenir > 0) {
    alertas.push({
      id: 'a1-rojos',
      severidad: 'peligro',
      etiqueta: 'A1 · Intervenir',
      titulo: `${plural(m.a1.intervenir, 'indicador en rojo', 'indicadores en rojo')} (${m.a1.periodo ?? 'última auditoría'})`,
      detalle: `Desviación > 15 % en: ${m.a1.criticos.join(', ')}.`,
      etapaId: 'etapa-a',
      pasoId: 'A1',
    });
  }

  if (m.a2.faseCritica && m.a2.faseCritica.carita === 'preocupada') {
    alertas.push({
      id: 'a2-friccion',
      severidad: 'peligro',
      etiqueta: 'A2 · Fricción',
      titulo: `Bloqueo en «${m.a2.faseCritica.titulo}» (${m.a2.faseCritica.porcentaje} %)`,
      detalle: m.a2.prioridadMejora
        ? `Prioridad #1 del equipo: ${m.a2.prioridadMejora.texto.toLowerCase()} (${m.a2.prioridadMejora.porcentaje} %).`
        : 'Revisa el desglose por pregunta en el Mapa del Colaborador.',
      etapaId: 'etapa-a',
      pasoId: 'A2',
    });
  }

  if (m.t2.sobreconfianza > 0) {
    alertas.push({
      id: 't2-sobreconfianza',
      severidad: 'atencion',
      etiqueta: 'T2 · Seguridad',
      titulo: `${plural(m.t2.sobreconfianza, 'caso de sobreconfianza', 'casos de sobreconfianza')} en capacitación`,
      detalle: 'Alta seguridad declarada pero reprobación práctica en el simulador.',
      etapaId: 'etapa-t',
      pasoId: 'T2',
    });
  }

  if (tablero && tablero.triaje.nivel === 'rojo') {
    alertas.push({
      id: 'r2-mayor',
      severidad: 'peligro',
      etiqueta: 'R2 · Triaje',
      titulo: `Cambio mayor (${tablero.triaje.total}/9 puntos)`,
      detalle: 'Exige acompañamiento intensivo y monitoreo cercano en cada ciclo.',
      etapaId: 'etapa-r',
      pasoId: 'R2',
    });
  }

  if (tablero && tablero.actores.conBrecha > 0) {
    const nombres = tablero.actores.prioridades
      .slice(0, 2)
      .map((p) => p.actor)
      .join(', ');
    alertas.push({
      id: 'r4-brecha',
      severidad: 'atencion',
      etiqueta: 'R4 · Actores',
      titulo: `${plural(tablero.actores.conBrecha, 'actor con brecha', 'actores con brecha')} de compromiso`,
      detalle: nombres ? `Priorizar gestión con: ${nombres}.` : 'Revisa la matriz de compromiso actual vs. deseado.',
      etapaId: 'etapa-r',
      pasoId: 'R4',
    });
  }

  if (m.a1.atencion > 0 && alertas.length < 4) {
    alertas.push({
      id: 'a1-amarillos',
      severidad: 'atencion',
      etiqueta: 'A1 · Atención',
      titulo: `${plural(m.a1.atencion, 'indicador a menos de 15 %', 'indicadores a menos de 15 %')} de su meta`,
      detalle: 'Requieren refuerzo preventivo antes del siguiente corte.',
      etapaId: 'etapa-a',
      pasoId: 'A1',
    });
  }

  if (alertas.length === 0) {
    alertas.push({
      id: 'sin-alertas',
      severidad: 'info',
      etiqueta: 'Pulso estable',
      titulo: 'Sin alertas críticas activas',
      detalle:
        m.a1.ultima || m.a2.totalRespuestas > 0
          ? 'Los indicadores evaluados se mantienen en rango saludable.'
          : 'Registra el triaje (R2), una auditoría (A1) o respuestas del viaje (A2) para activar alertas tempranas.',
      etapaId: m.a1.ultima ? 'etapa-a' : 'etapa-r',
      pasoId: m.a1.ultima ? 'A1' : 'R2',
    });
  }

  return alertas.slice(0, 4);
}

/** Calcula el avance completo de los 15 pasos (R1–R5, U1–U4, T1–T4, A1–A2). */
export function calcularAvanceGlobal(
  proyecto: Proyecto | null,
  datos: DatosProyecto,
  m: MetricasServidor,
): ResumenAvanceGlobal {
  const etapasRuta = ETAPAS.filter((e) => e.id !== 'etapa-0' && e.activa);

  const evaluarPaso = (pasoId: string): { texto: string; estado: EstadoPaso } => {
    if (pasoId.startsWith('R') || pasoId.startsWith('U')) {
      const txt = resumenPaso(pasoId, proyecto, datos);
      if (txt === 'Sin empezar') return { texto: txt, estado: 'sin_empezar' };
      if (txt === 'Completo' || pasoId === 'R3' || pasoId === 'R4' || pasoId === 'R5' || pasoId === 'U1') {
        return { texto: txt, estado: 'completo' };
      }
      return { texto: txt, estado: 'en_curso' };
    }

    switch (pasoId) {
      case 'T1':
        return m.t1.respuestas > 0
          ? { texto: `${plural(m.t1.respuestas, 'pulso', 'pulsos')} en ${plural(m.t1.sesiones, 'sesión', 'sesiones')}`, estado: 'completo' }
          : { texto: 'Sin empezar', estado: 'sin_empezar' };
      case 'T2':
        if (m.t2.simuladoresHechos > 0) {
          return { texto: `${m.t2.tasaAprobacion ?? 0} % aprobación (${plural(m.t2.simuladoresHechos, 'simulador', 'simuladores')})`, estado: 'completo' };
        }
        return m.t2.coberturaPorcentaje && m.t2.coberturaPorcentaje > 0
          ? { texto: `${m.t2.coberturaPorcentaje} % videos vistos`, estado: 'en_curso' }
          : { texto: 'Sin empezar', estado: 'sin_empezar' };
      case 'T3': {
        const piezas: string[] = [];
        if (m.t3.ultimoAcuerdo) piezas.push(`Nivel ${m.t3.ultimoAcuerdo.nivel}`);
        if (m.t3.termometroPromedio !== null) piezas.push(`Termómetro ${m.t3.termometroPromedio.toFixed(1).replace('.', ',')}`);
        if (m.t3.dinamicasHechas > 0) piezas.push(plural(m.t3.dinamicasHechas, 'dinámica', 'dinámicas'));
        if (piezas.length === 0) return { texto: 'Sin empezar', estado: 'sin_empezar' };
        return { texto: piezas.join(' · '), estado: m.t3.ultimoAcuerdo && m.t3.termometroPromedio !== null ? 'completo' : 'en_curso' };
      }
      case 'T4':
        if (m.t4.totalMeritos === 0 && m.t4.balances === 0) return { texto: 'Sin empezar', estado: 'sin_empezar' };
        return {
          texto: `${plural(m.t4.publicados, 'mérito publicado', 'méritos publicados')}${m.t4.balances > 0 ? ` · ${plural(m.t4.balances, 'balance', 'balances')}` : ''}`,
          estado: m.t4.publicados > 0 ? 'completo' : 'en_curso',
        };
      case 'A1':
        if (!m.a1.ultima) return { texto: 'Sin empezar', estado: 'sin_empezar' };
        return {
          texto: `${m.a1.periodo}: ${m.a1.enMeta} de ${m.a1.evaluados} en meta (${m.a1.cumplimiento ?? 0} %)`,
          estado: m.a1.intervenir === 0 && m.a1.atencion === 0 ? 'completo' : 'en_curso',
        };
      case 'A2':
        if (m.a2.totalRespuestas === 0) return { texto: 'Sin empezar', estado: 'sin_empezar' };
        return {
          texto: `${plural(m.a2.totalRespuestas, 'respuesta', 'respuestas')} · ${m.a2.porcentajeGeneral ?? 0} %`,
          estado: m.a2.caritaGeneral === 'feliz' ? 'completo' : 'en_curso',
        };
      default:
        return { texto: 'Sin empezar', estado: 'sin_empezar' };
    }
  };

  const pasos: FilaAvancePaso[] = etapasRuta.flatMap((etapa) =>
    etapa.pasos.map((p) => {
      const ev = evaluarPaso(p.id);
      return {
        etapaId: etapa.id,
        etapaLetra: etapa.letra,
        etapaNombre: etapa.nombre,
        color: etapa.color ?? 'var(--bg-soft)',
        pasoId: p.id,
        titulo: p.titulo,
        texto: ev.texto,
        estado: ev.estado,
      };
    }),
  );

  const completos = pasos.filter((p) => p.estado === 'completo').length;
  const enCurso = pasos.filter((p) => p.estado === 'en_curso').length;
  const total = pasos.length;
  // Un paso en curso cuenta medio punto en el porcentaje global para reflejar progreso real.
  const porcentaje = total > 0 ? Math.round(((completos + enCurso * 0.5) / total) * 100) : 0;

  const porEtapa = etapasRuta.map((etapa) => {
    const sub = pasos.filter((p) => p.etapaId === etapa.id);
    const activos = sub.filter((p) => p.estado !== 'sin_empezar').length;
    const puntos = sub.reduce((acc, p) => acc + (p.estado === 'completo' ? 1 : p.estado === 'en_curso' ? 0.5 : 0), 0);
    return {
      id: etapa.id,
      letra: etapa.letra,
      nombre: etapa.nombre,
      color: etapa.color ?? 'var(--bg-soft)',
      activos,
      total: sub.length,
      porcentaje: sub.length > 0 ? Math.round((puntos / sub.length) * 100) : 0,
    };
  });

  return { pasos, completos, enCurso, total, porcentaje, porEtapa };
}

/** Helper de texto legible para la pregunta P10 (prioridad de mejora) si existe. */
export const TITULO_PRIORIDAD_P10 = PREGUNTAS_VIAJE[9]?.texto ?? 'Prioridad de mejora';
