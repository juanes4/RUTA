import type { Sentido } from '../lib/modelo/tipos';

/**
 * Metas iniciales del documento (U5 del documento maestro y CONTEXTO §6).
 * Son valores por defecto: cada empresa las ajusta en la Etapa 0 (paso 0.3).
 * Los porcentajes se guardan como fracción (0,9 = 90 %).
 */

export type UnidadMeta = 'porcentaje' | 'escala_1_5';

/** Umbral de alerta propio de un indicador (p. ej. Kotter parte B). */
export interface UmbralAlerta {
  umbral: number;
  /** true si el umbral mismo ya está en alerta ("2 o más"); false si es estricto ("menos de 75 %"). */
  incluye: boolean;
}

export interface DefinicionMeta {
  id: string;
  nombre: string;
  etapa: 'R' | 'U';
  meta: number;
  sentido: Sentido;
  unidad: UnidadMeta;
  alerta?: UmbralAlerta;
  /** Qué mide y cómo se calcula (columna "Fórmula / proceso" de CONTEXTO §6). */
  queMide: string;
  /** De dónde sale el dato (columna "Dato" de CONTEXTO §6). */
  fuenteDato: string;
  /** Fuente teórica. */
  fuente: string;
}

export const METAS: readonly DefinicionMeta[] = [
  {
    id: 'participacion',
    queMide: 'Respuestas del buzón 1 ÷ afectados del área.',
    nombre: 'Participación',
    etapa: 'R',
    meta: 0.7,
    sentido: 'mayor_mejor',
    unidad: 'porcentaje',
    fuenteDato: 'Buzón 1 y afectados por área (Etapa 0)',
    fuente: 'Instrumento 1; U5',
  },
  {
    id: 'cobertura_actores',
    queMide: 'Actores del mapa con una acción asignada ÷ total de actores.',
    nombre: 'Cobertura de actores',
    etapa: 'R',
    meta: 1,
    sentido: 'mayor_mejor',
    unidad: 'porcentaje',
    fuenteDato: 'Mapa de actores (R3)',
    fuente: 'Mendelow (1991), adaptado',
  },
  {
    id: 'utilizacion',
    queMide: 'Usan lo nuevo ÷ total, en cada ciclo.',
    nombre: 'Utilización',
    etapa: 'U',
    meta: 0.9,
    sentido: 'mayor_mejor',
    unidad: 'porcentaje',
    fuenteDato: 'Registro de uso por ciclo',
    fuente: 'Prosci, ultimate utilization',
  },
  {
    id: 'uso_residual',
    queMide: 'Hechos con el formato viejo ÷ total, en cada ciclo.',
    nombre: 'Uso residual de lo viejo',
    etapa: 'U',
    meta: 0.1,
    sentido: 'menor_mejor',
    unidad: 'porcentaje',
    fuenteDato: 'Registro de uso por ciclo',
    fuente: 'Prosci (opt-out), adaptado',
  },
  {
    id: 'competencia',
    queMide: 'Hechos sin error ÷ total revisado en la auditoría de muestra.',
    nombre: 'Competencia',
    etapa: 'U',
    meta: 0.95,
    sentido: 'mayor_mejor',
    unidad: 'porcentaje',
    fuenteDato: 'Auditoría de muestra',
    fuente: 'Prosci, proficiency',
  },
  {
    id: 'dudas_atendidas',
    queMide: 'Dudas resueltas en 2 días o menos ÷ total de dudas.',
    nombre: 'Dudas atendidas en 2 días o menos',
    etapa: 'U',
    meta: 0.9,
    sentido: 'mayor_mejor',
    unidad: 'porcentaje',
    fuenteDato: 'Muro de dudas',
    fuente: 'Propuesta del equipo',
  },
  {
    id: 'conducta_lideres',
    queMide: 'Promedio de Kotter parte B y de "mi jefe usa lo nuevo", de 1 a 5.',
    nombre: 'Conducta de líderes',
    etapa: 'U',
    meta: 4.0,
    sentido: 'mayor_mejor',
    unidad: 'escala_1_5',
    fuenteDato: 'Pulso completo (pregunta 11) y Kotter parte B',
    fuente: 'Kotter (1996); Instrumento 2',
  },
  {
    id: 'preparacion',
    queMide: 'Promedio de cada dimensión ADKAR en el pulso completo, de 1 a 5.',
    nombre: 'Preparación (promedio por dimensión)',
    etapa: 'U',
    meta: 3.75,
    sentido: 'mayor_mejor',
    unidad: 'escala_1_5',
    fuenteDato: 'Pulso completo',
    fuente: 'Instrumento 1',
  },
];

export function buscarMeta(id: string): DefinicionMeta | undefined {
  return METAS.find((m) => m.id === id);
}
