import type { AlcanceDespliegue, ElementoOrganizacion, PuntajeTriaje } from '../modelo/tipos';
import {
  COPILOTO_VACIO,
  type AjustesBuzon,
  type BloqueFicha,
  type CriterioAjustable,
  type DatosCopiloto,
  type EstadoBloque,
  type FilaClasificacion,
  type InformeBuzon,
  type MensajeCopiloto,
  type ModoCopiloto,
  type PartesDossier,
  type PropuestaLienzo,
  type PropuestaTriaje,
  type ResultadoBuzon,
  type SegmentacionInforme,
} from './tipos';

/**
 * Repara lo que el copiloto guardó en el navegador. Lo que viene del modelo
 * (o de una versión anterior de la app) puede llegar incompleto; sin esto,
 * un campo que falta tumbaba toda la página al dibujarla.
 */

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : {});
const txt = (v: unknown): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : '');
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const numONulo = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const lista = <T>(v: unknown, f: (x: unknown) => T | null): T[] => (Array.isArray(v) ? v.map(f).filter((x): x is T => x !== null) : []);
const textos = (v: unknown): string[] => lista(v, (x) => txt(x) || null);
const fecha = (v: unknown): string => txt(v) || new Date(0).toISOString();
const modo = (v: unknown): ModoCopiloto => (v === 'gemini' ? 'gemini' : 'simulado');

const BLOQUES: readonly BloqueFicha[] = ['urgencia', 'afectados', 'vision', 'cambios', 'beneficios', 'criterios', 'riesgos'];
const ESTADOS: readonly EstadoBloque[] = ['completo', 'por_verificar', 'por_completar'];
const ELEMENTOS: readonly ElementoOrganizacion[] = ['estrategia', 'estructura', 'sistemas', 'habilidades', 'liderazgo', 'valores'];
const ALCANCES: readonly (AlcanceDespliegue | 'sin_dato')[] = ['piloto', 'departamento', 'organizacion', 'sin_dato'];

export const puntaje = (v: unknown): PuntajeTriaje | null => (v === 1 || v === 2 || v === 3 ? v : null);

function estados(v: unknown): Record<BloqueFicha, EstadoBloque> {
  const o = obj(v);
  return Object.fromEntries(BLOQUES.map((b) => [b, ESTADOS.includes(o[b] as EstadoBloque) ? (o[b] as EstadoBloque) : 'por_completar'])) as Record<BloqueFicha, EstadoBloque>;
}

export function normalizarPropuestaLienzo(v: unknown): PropuestaLienzo {
  const o = obj(v);
  return {
    urgencia: lista(o.urgencia, (x) => ({ motivo: txt(obj(x).motivo), dato: txt(obj(x).dato) })),
    afectados: txt(o.afectados),
    vision: txt(o.vision),
    que_cambia: txt(o.que_cambia),
    que_no_cambia: txt(o.que_no_cambia),
    beneficios: lista(o.beneficios, (x) => ({ grupo: txt(obj(x).grupo), beneficio: txt(obj(x).beneficio) })),
    criterios: lista(o.criterios, (x) => ({ criterio: txt(obj(x).criterio), meta: txt(obj(x).meta) })),
    riesgos: textos(o.riesgos),
    intentos_previos: textos(o.intentos_previos),
    estados: estados(o.estados),
  };
}

const criterio = (v: unknown) => {
  const o = obj(v);
  return { puntaje: puntaje(o.puntaje), justificacion: txt(o.justificacion), fuente: txt(o.fuente), cambiaria: txt(o.cambiaria) };
};

export function normalizarPropuestaTriaje(v: unknown): PropuestaTriaje | null {
  const o = obj(v);
  if (Object.keys(o).length === 0) return null;
  const c = obj(o.complejidad);
  return {
    impacto_personas: criterio(o.impacto_personas),
    complejidad: {
      elementos: [...new Set(lista(c.elementos, (x) => (ELEMENTOS.includes(x as ElementoOrganizacion) ? (x as ElementoOrganizacion) : null)))],
      justificacion: txt(c.justificacion),
      fuente: txt(c.fuente),
      cambiaria: txt(c.cambiaria),
    },
    riesgo_operativo: criterio(o.riesgo_operativo),
    alcance: ALCANCES.includes(o.alcance as AlcanceDespliegue) ? (o.alcance as AlcanceDespliegue | 'sin_dato') : 'sin_dato',
    por_que_ahora: txt(o.por_que_ahora),
    poblacion_afectada: txt(o.poblacion_afectada),
    dimension_tecnica: txt(o.dimension_tecnica),
  };
}

export function normalizarPartesDossier(v: unknown): PartesDossier | null {
  const o = obj(v);
  if (Object.keys(o).length === 0) return null;
  const vocero = obj(o.vocero);
  return {
    resumen: txt(o.resumen),
    recomendaciones: lista(o.recomendaciones, (x) => (txt(obj(x).texto) ? { texto: txt(obj(x).texto), fuente: txt(obj(x).fuente) } : null)),
    vocero: { perfil: txt(vocero.perfil), motivo: txt(vocero.motivo), fuente: txt(vocero.fuente) },
    preguntas_jefes: textos(o.preguntas_jefes),
  };
}

function segmentacion(v: unknown): SegmentacionInforme {
  const o = obj(v);
  return {
    diferencias: lista(o.diferencias, (x) => {
      const d = obj(x);
      return { segmento: txt(d.segmento), respuestas: num(d.respuestas), codigo: txt(d.codigo), tema: txt(d.tema), pctSegmento: num(d.pctSegmento), pctResto: num(d.pctResto) };
    }),
    visibles: lista(o.visibles, (x) => ({ segmento: txt(obj(x).segmento), respuestas: num(obj(x).respuestas) })),
    ocultos: textos(o.ocultos),
  };
}

function informe(v: unknown): InformeBuzon {
  const o = obj(v);
  const p = obj(o.participacion);
  const r = obj(o.respondidas);
  const a = obj(o.alertas);
  const d = obj(o.diferencias);
  return {
    participacion: { respuestas: num(p.respuestas), personas: numONulo(p.personas), porcentaje: numONulo(p.porcentaje) },
    respondidas: { p1: num(r.p1), p2: num(r.p2), p3: num(r.p3) },
    temas: lista(o.temas, (x) => {
      const t = obj(x);
      return { codigo: txt(t.codigo), tema: txt(t.tema), p1: num(t.p1), p2: num(t.p2), pctP1: numONulo(t.pctP1), pctP2: numONulo(t.pctP2), total: num(t.total), sintesis: txt(t.sintesis) };
    }),
    otrosTemas: lista(o.otrosTemas, (x) => ({ nombre: txt(obj(x).nombre), menciones: num(obj(x).menciones) })),
    diferencias: { grupo: segmentacion(d.grupo), area: segmentacion(d.area) },
    propuestas: lista(o.propuestas, (x) => ({ idea: txt(obj(x).idea), menciones: num(obj(x).menciones) })),
    alertas: {
      intensas: lista(a.intensas, (x) => ({ tema: txt(obj(x).tema), casos: num(obj(x).casos) })),
      transversales: lista(a.transversales, (x) => {
        const t = obj(x);
        return { tema: txt(t.tema), dimension: t.dimension === 'area' ? ('area' as const) : ('grupo' as const), segmentos: num(t.segmentos) };
      }),
    },
    revision: lista(o.revision, (x) => ({ tipo: txt(obj(x).tipo), nombre: txt(obj(x).nombre), cantidad: num(obj(x).cantidad) })),
    sentimientos: Object.fromEntries(Object.entries(obj(o.sentimientos)).map(([k, n]) => [k, num(n)])),
    lectura: textos(o.lectura),
    limites: textos(o.limites),
    clasificadas: num(o.clasificadas),
  };
}

function ajustes(v: unknown): AjustesBuzon {
  const o = obj(v);
  return {
    riesgos: lista(o.riesgos, (x) => {
      const r = obj(x);
      return txt(r.riesgo) ? { riesgo: txt(r.riesgo), fuente: txt(r.fuente) } : null;
    }),
    triaje: lista(o.triaje, (x) => {
      const a = obj(x);
      const criterio = a.criterio === 'impacto_personas' || a.criterio === 'riesgo_operativo' ? (a.criterio as CriterioAjustable) : null;
      const p = puntaje(a.puntaje);
      return criterio && p ? { criterio, puntaje: p, motivo: txt(a.motivo), fuente: txt(a.fuente) } : null;
    }),
  };
}

export function normalizarResultadoBuzon(v: unknown): ResultadoBuzon | null {
  const o = obj(v);
  if (!o.informe) return null;
  const e = obj(o.enmascarados);
  return {
    modo: modo(o.modo),
    ...(txt(o.modelo) ? { modelo: txt(o.modelo) } : {}),
    informe: informe(o.informe),
    clasificacion: lista(o.clasificacion, (x): FilaClasificacion => {
      const c = obj(x);
      return {
        id: txt(c.id),
        pregunta: c.pregunta === 'p2' || c.pregunta === 'p3' ? c.pregunta : 'p1',
        texto: txt(c.texto),
        temas: textos(c.temas),
        otro: txt(c.otro),
        sentimiento: txt(c.sentimiento),
        intensidad: num(c.intensidad),
        revision: txt(c.revision),
        identificable: Boolean(c.identificable),
      };
    }),
    enmascarados: { correo: num(e.correo), telefono: num(e.telefono), cedula: num(e.cedula), persona: num(e.persona) },
    ajustes: ajustes(o.ajustes),
  };
}

/** Todo lo guardado del copiloto, con la forma que la interfaz espera. Lo que no se puede reparar se descarta. */
export function normalizarCopiloto(v: unknown): DatosCopiloto {
  const o = obj(v);
  const inf = obj(o.informe);
  const tri = obj(o.triaje);
  const dos = obj(o.dossier);
  const resultado = normalizarResultadoBuzon(inf.resultado);
  const propuesta = normalizarPropuestaTriaje(tri.propuesta);
  const partes = normalizarPartesDossier(dos.partes);
  return {
    ...COPILOTO_VACIO,
    buzonFormsId: txt(o.buzonFormsId),
    informe: resultado ? { resultado, fecha: fecha(inf.fecha), decididos: textos(inf.decididos) } : null,
    mensajesLienzo: lista(o.mensajesLienzo, (x): MensajeCopiloto | null => {
      const m = obj(x);
      return txt(m.texto) ? { rol: m.rol === 'copiloto' ? 'copiloto' : 'usuario', texto: txt(m.texto) } : null;
    }),
    modoLienzo: o.modoLienzo === 'gemini' || o.modoLienzo === 'simulado' ? o.modoLienzo : null,
    estadosLienzo: o.estadosLienzo ? estados(o.estadosLienzo) : null,
    triaje: propuesta ? { propuesta, modo: modo(tri.modo), ...(txt(tri.modelo) ? { modelo: txt(tri.modelo) } : {}), fecha: fecha(tri.fecha) } : null,
    dossier: partes ? { partes, modo: modo(dos.modo), ...(txt(dos.modelo) ? { modelo: txt(dos.modelo) } : {}), fecha: fecha(dos.fecha) } : null,
  };
}
