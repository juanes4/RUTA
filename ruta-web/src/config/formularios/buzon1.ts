import type { RespuestaBuzon1 } from '../../lib/modelo/tipos';

/**
 * R5. Buzón 1: escucha inicial (RUTA_ANDI_R_U.md). Corto, sencillo y con
 * preguntas abiertas. No informa el cambio: es diagnóstico.
 */

export type CampoBuzon1 = keyof Pick<RespuestaBuzon1, 'falla' | 'preocupa' | 'harias'>;

export interface PreguntaBuzon1 {
  campo: CampoBuzon1;
  /** Código con el que empieza el título de la pregunta en Google Forms. */
  codigo: string;
  texto: string;
}

export const PREGUNTAS_BUZON1: readonly PreguntaBuzon1[] = [
  { campo: 'falla', codigo: 'P1', texto: '¿Qué es lo que más falla hoy en este proceso?' },
  { campo: 'preocupa', codigo: 'P2', texto: '¿Qué te preocupa del cambio?' },
  { campo: 'harias', codigo: 'P3', texto: 'Si tú decidieras, ¿qué harías? (Mejorar)' },
];
