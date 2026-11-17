import type { Dimension } from '../../lib/modelo/tipos';

/**
 * Buzón 1, escucha inicial (CONTEXTO §5). Escala 1 = totalmente en
 * desacuerdo a 5 = totalmente de acuerdo.
 */

export interface PreguntaEscala {
  id: string;
  texto: string;
  dimension: Dimension | 'proceso';
}

export interface PreguntaSeleccion {
  id: string;
  texto: string;
  maximo: number;
  opciones: readonly string[];
}

export interface PreguntaAbierta {
  id: string;
  texto: string;
}

export const BUZON1_ESCALA: readonly PreguntaEscala[] = [
  { id: 'b1_01', texto: 'El proceso actual funciona bien', dimension: 'proceso' },
  { id: 'b1_02', texto: 'El proceso actual me genera errores o trabajo repetido', dimension: 'proceso' },
  { id: 'b1_03', texto: 'Entiendo por qué la empresa quiere hacer este cambio', dimension: 'C' },
  { id: 'b1_04', texto: 'Entiendo por qué se hace ahora y no después', dimension: 'C' },
  { id: 'b1_05', texto: 'Sé qué cambia y qué no cambia en mi trabajo', dimension: 'C' },
  { id: 'b1_06', texto: 'Creo que el cambio mejorará mi trabajo', dimension: 'D' },
  { id: 'b1_07', texto: 'Quiero participar en el cambio', dimension: 'D' },
  { id: 'b1_08', texto: 'Sé a quién acudir si tengo dudas', dimension: 'K' },
  { id: 'b1_09', texto: 'Me siento capaz de aprender lo nuevo', dimension: 'H' },
  { id: 'b1_10', texto: 'Esta empresa suele cumplir lo que promete en los cambios', dimension: 'R' },
];

export const BUZON1_SELECCION: readonly PreguntaSeleccion[] = [
  {
    id: 'b1_preocupacion',
    texto: 'Mi mayor preocupación es',
    maximo: 2,
    opciones: [
      'Perder el empleo',
      'Mayor carga de trabajo',
      'No saber usarlo',
      'Sentirme vigilado',
      'Que se abandone como otros cambios',
      'No me preocupa nada',
      'Otra',
    ],
  },
  {
    id: 'b1_aprender',
    texto: 'Prefiero aprender con',
    maximo: 2,
    opciones: [
      'Práctica en mi puesto',
      'Taller en grupo',
      'Video corto',
      'Guía de una página',
      'Un compañero que me enseñe',
    ],
  },
];

export const BUZON1_ABIERTAS: readonly PreguntaAbierta[] = [
  { id: 'b1_falla', texto: '¿Qué es lo que más falla hoy en este proceso?' },
  { id: 'b1_preocupa', texto: '¿Qué te preocupa del cambio?' },
  { id: 'b1_harias', texto: 'Si tú decidieras, ¿qué harías?' },
];
