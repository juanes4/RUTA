import type { DecisionR7 } from '../calculo/decisionR7';
import type { FilaActor, FilaFoda, FilaKotter, FilaLiderazgo, FilaRespuesta, FilaUso } from './tipos';

/**
 * Datos de la Etapa 0 (PLAN §4, pasos 0.1 a 0.4, propuesta de software
 * por validar con administrativa). Sin datos personales.
 */

/** 0.1 Empresa y cambio. */
export interface Empresa {
  nombre: string;
  sector: string;
  total_colaboradores: number | null;
  que_cambia: string;
  fecha_lanzamiento: string;
}

/** 0.2 Un área con su número de personas afectadas (base de la participación). */
export interface AreaAfectada {
  area: string;
  afectados: number;
}

/** 0.2 Grupos y afectados. */
export interface Segmentacion {
  areas: AreaAfectada[];
  turnos: string[];
  rangos_antiguedad: string[];
}

/** 0.3 Metas: solo se guardan las que la empresa cambió frente a `config/metas.ts`. */
export type MetasAjustadas = Record<string, number>;

/** Unidades de uso que lista el documento (CONTEXTO §7, reglas de procesamiento). */
export type UnidadUso = 'transacciones' | 'casos' | 'cargos' | 'equipos';

/** 0.4 Dato de uso. */
export interface ConfiguracionUso {
  unidad: UnidadUso | null;
  dias_por_ciclo: number;
}

export interface Proyecto {
  id: string;
  creado: string;
  actualizado: string;
  empresa: Empresa;
  segmentacion: Segmentacion;
  metas: MetasAjustadas;
  uso: ConfiguracionUso;
}

export interface MotivoUrgencia {
  motivo: string;
  dato: string;
}

export interface BeneficioGrupo {
  grupo: string;
  beneficio: string;
}

/**
 * R1. Lienzo del cambio (CONTEXTO §3 y §12.5). Es interno: lo usa el equipo
 * de cambio, no se muestra a colaboradores y no alimenta el tablero. Los
 * criterios de éxito no se guardan aquí: son las metas del paso 0.3.
 */
export interface Lienzo {
  urgencia: MotivoUrgencia[];
  afectados: string;
  vision: string;
  que_cambia: string;
  que_no_cambia: string;
  beneficios: BeneficioGrupo[];
  riesgos: string[];
  intentos_previos: string[];
}

export const LIENZO_VACIO: Lienzo = {
  urgencia: [],
  afectados: '',
  vision: '',
  que_cambia: '',
  que_no_cambia: '',
  beneficios: [],
  riesgos: [],
  intentos_previos: [],
};

/** R7. Lo que decidió una persona (PLAN §6); la herramienta solo recomienda. */
export interface RegistroDecision {
  decision: DecisionR7;
  fecha: string;
  responsable: string;
  riesgos: string[];
}

/** Todo lo que se captura para un proyecto. */
export interface DatosProyecto {
  respuestas: FilaRespuesta[];
  kotter: FilaKotter[];
  uso: FilaUso[];
  foda: FilaFoda[];
  actores: FilaActor[];
  liderazgo: FilaLiderazgo[];
  lienzo: Lienzo;
  decision: RegistroDecision | null;
}

export const DATOS_VACIOS: DatosProyecto = {
  respuestas: [],
  kotter: [],
  uso: [],
  foda: [],
  actores: [],
  liderazgo: [],
  lienzo: LIENZO_VACIO,
  decision: null,
};
