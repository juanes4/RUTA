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

/** Valor que representa "No sé": no entra al promedio y se cuenta aparte. */
export const NO_SE = 'NS' as const;
export type NoSe = typeof NO_SE;

/** Tabla `respuestas`. */
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
  valor: number | NoSe | string;
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

export type Sentido = 'mayor_mejor' | 'menor_mejor';
