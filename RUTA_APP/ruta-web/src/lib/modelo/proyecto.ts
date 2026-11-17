import type { FilaKotter, FilaRespuesta, FilaUso } from './tipos';

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

/** Todo lo que se captura para un proyecto. */
export interface DatosProyecto {
  respuestas: FilaRespuesta[];
  kotter: FilaKotter[];
  uso: FilaUso[];
}

export const DATOS_VACIOS: DatosProyecto = { respuestas: [], kotter: [], uso: [] };
