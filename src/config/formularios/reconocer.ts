import type { Cuadrante, Estrategia, Influencia, Postura } from '../../lib/modelo/tipos';

/** R1: el lienzo pide 3 motivos de urgencia, cada uno con su dato (CONTEXTO §3). */
export const LIENZO = { motivosUrgencia: 3 } as const;

/** R7: la decisión se registra con los tres riesgos principales (PLAN §6). */
export const DECISION_R7 = { riesgos: 3 } as const;

/** Opciones de los formularios R2 y R3 (CONTEXTO §3 y §7). */

export const CUADRANTES: readonly { valor: Cuadrante; nombre: string; escala: string }[] = [
  { valor: 'F', nombre: 'Fortaleza', escala: '5 = muy presente' },
  { valor: 'O', nombre: 'Oportunidad', escala: '5 = muy presente' },
  { valor: 'D', nombre: 'Debilidad', escala: '5 = muy grave' },
  { valor: 'A', nombre: 'Amenaza', escala: '5 = muy grave' },
];

export const INFLUENCIAS: readonly { valor: Influencia; nombre: string }[] = [
  { valor: 'alta', nombre: 'Alta' },
  { valor: 'media', nombre: 'Media' },
  { valor: 'baja', nombre: 'Baja' },
];

export const POSTURAS: readonly { valor: Postura; nombre: string }[] = [
  { valor: 'se_opone', nombre: 'Se opone' },
  { valor: 'neutral', nombre: 'Neutral' },
  { valor: 'apoya', nombre: 'Apoya' },
];

export const ESTRATEGIAS: readonly { valor: Estrategia; nombre: string }[] = [
  { valor: 'educar', nombre: 'Educar' },
  { valor: 'hacer_participe', nombre: 'Hacer partícipe' },
  { valor: 'apoyar', nombre: 'Apoyar' },
  { valor: 'negociar', nombre: 'Negociar' },
];
