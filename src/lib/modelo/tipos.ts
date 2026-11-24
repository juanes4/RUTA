/**
 * Modelo de datos (CONTEXTO §7, formato largo: una fila por dato).
 * Los nombres de campo siguen el documento (snake_case) para que el CSV
 * se lea y se escriba sin traducción de columnas.
 */

/** Dimensiones ADKAR en español: Conciencia, Deseo, Conocimiento, Habilidad, Refuerzo. */
export type Dimension = 'C' | 'D' | 'K' | 'H' | 'R';

/** Orden en que se busca el punto de bloqueo (PLAN §6). */
export const ORDEN_ADKAR: readonly Dimension[] = ['C', 'D', 'K', 'H', 'R'];

export const NOMBRE_DIMENSION: Readonly<Record<Dimension, string>> = {
  C: 'Conciencia',
  D: 'Deseo',
  K: 'Conocimiento',
  H: 'Habilidad',
  R: 'Refuerzo',
};

export type Instrumento = 'buzon1' | 'buzon2' | 'pulso_completo' | 'verificacion';

export type Momento = 'base' | `ciclo_${number}` | 'dia30' | 'dia60' | 'dia90';

/**
 * Tabla `respuestas`. "No sé" se guarda como `valor: null` con
 * `no_se: true` (CONTEXTO §5): no entra al promedio y se cuenta aparte.
 */
export interface FilaRespuesta {
  id_respuesta: string;
  instrumento: Instrumento;
  momento: Momento;
  fecha: string;
  area: string;
  turno: string;
  antiguedad_rango: string;
  pregunta_id: string;
  dimension: Dimension | 'proceso' | 'otra';
  valor: number | string | null;
  no_se: boolean;
}

/** Roles de la pregunta R0 del Instrumento 2. */
export type RolKotter = 'direccion' | 'lider_area' | 'equipo_cambio';

export const NOMBRE_ROL_KOTTER: Readonly<Record<RolKotter, string>> = {
  direccion: 'Alta dirección o patrocinador',
  lider_area: 'Líder de un área afectada',
  equipo_cambio: 'Miembro del equipo de cambio',
};

export type PasoKotter = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/**
 * Tabla `kotter`. Ajuste de PLAN §5: se agregan `id_respuesta`, `rol`,
 * `periodo`, `respuesta_original` y `evidencia`. Se guarda la respuesta tal
 * como se dio; la conversión a puntaje la hace el módulo de cálculo.
 */
export interface FilaKotter {
  id_respuesta: string;
  fecha: string;
  parte: 'A' | 'B';
  periodo: string;
  rol: RolKotter;
  paso: PasoKotter | null;
  pregunta_id: string;
  respuesta_original: string;
  evidencia: string | null;
}

/** Tabla `uso`. */
export interface FilaUso {
  fecha: string;
  ciclo: number;
  grupo: string;
  transacciones_nuevo: number;
  transacciones_antiguo: number;
  registros_con_error: number;
}

export type Cuadrante = 'F' | 'O' | 'D' | 'A';

/** Tabla `foda`. `id` se agrega para poder editar y quitar ítems. */
export interface FilaFoda {
  id: string;
  item: string;
  cuadrante: Cuadrante;
  evidencia: string;
  puntaje_inicial: number;
  puntaje_dia90: number | null;
  votos: number;
}

export type Influencia = 'baja' | 'media' | 'alta';
export type Postura = 'se_opone' | 'neutral' | 'apoya';
export type Estrategia = 'educar' | 'hacer_participe' | 'apoyar' | 'negociar';
export type NivelCompromiso = 'desconoce' | 'se_resiste' | 'neutral' | 'apoya' | 'lidera';

/** Tabla `actores`. `id` se agrega para poder quitar filas. */
export interface FilaActor {
  id: string;
  actor: string;
  descripcion?: string;
  necesidades?: string;
  poder?: 'alto' | 'bajo';
  interes?: 'alto' | 'bajo';
  compromiso_actual?: NivelCompromiso;
  compromiso_deseado?: NivelCompromiso;
  n_personas: number;
  influencia: Influencia;
  postura: Postura;
  motivo: string;
  estrategia: Estrategia | null;
  accion: string;
  responsable: string;
  fecha: string;
}

/** Una respuesta anónima del buzón diagnóstico R5. */
export interface FilaEscuchaInicial {
  id: string;
  falla_proceso: string;
  preocupacion: string;
  mejora: string;
}

export type PuntajeTriaje = 1 | 2 | 3;
export type AlcanceTriaje = 'piloto' | 'departamento' | 'organizacion';

/** Evaluación inicial de una iniciativa, antes de definir su despliegue. */
export interface TriajeCambio {
  motivo_ahora: string;
  consecuencia_no_cambiar: string;
  poblacion_afectada: string;
  dimension_tecnica: string;
  alcance: AlcanceTriaje;
  impacto_personas: PuntajeTriaje;
  complejidad_organizacional: PuntajeTriaje;
  riesgo_operativo: PuntajeTriaje;
}

/** Narrativa de cambio preparada para comunicarse en la etapa U2. */
export interface NarrativaCambio {
  portavoz_codigo: string;
  de_donde_venimos: string;
  hacia_donde_vamos: string;
  como_sera_el_camino: string;
}

/** Mapa de empatía de un grupo, completado después de comunicar el cambio. */
export interface FilaEmpatia {
  id: string;
  grupo: string;
  que_oye: string;
  que_ve: string;
  piensa_siente: string;
  dice_hace: string;
  dolores: string;
  necesidades_ganancias: string;
}

export type LetraLiderazgo = 'A' | 'B' | 'C' | 'D';
export type RespondenteLiderazgo = 'auto' | 'equipo';

/** Tabla `liderazgo`. `id` identifica cada encuesta registrada. */
export interface FilaLiderazgo {
  id: string;
  lider_id: string;
  respondente: RespondenteLiderazgo;
  conteo_A: number;
  conteo_B: number;
  conteo_C: number;
  conteo_D: number;
}

export type Sentido = 'mayor_mejor' | 'menor_mejor';
