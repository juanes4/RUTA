import { NIVELES_COMPROMISO } from '../../config/formularios/reconocer';
import type { FilaActor, NivelAB, NivelCompromiso } from '../modelo/tipos';

/** R4. Mapa de actores: matriz poder × interés y brecha de compromiso. */

const posicion = (nivel: NivelCompromiso) => NIVELES_COMPROMISO.findIndex((n) => n.valor === nivel);

/**
 * Brecha = posiciones entre C (hoy) y D (deseado). 0: no hay brecha. Mientras
 * más lejos estén, mayor el esfuerzo de comunicación y acompañamiento.
 * Negativa si hoy está más arriba de lo que se necesita. null sin C o D.
 */
export function brechaCompromiso(actor: FilaActor): number | null {
  if (!actor.compromiso_actual || !actor.compromiso_deseado) return null;
  return posicion(actor.compromiso_deseado) - posicion(actor.compromiso_actual);
}

/** Actores en una celda de la matriz poder × interés. */
export function actoresEnCuadrante(actores: readonly FilaActor[], poder: NivelAB, interes: NivelAB): FilaActor[] {
  return actores.filter((a) => a.poder === poder && a.interes === interes);
}

export interface ResumenActores {
  total: number;
  /** Con poder e interés asignados. */
  evaluados: number;
  /** Con C y D marcados. */
  conCompromiso: number;
  /** Con brecha positiva: hay que moverlos hacia donde deben estar. */
  conBrecha: number;
  /** El mayor esfuerzo pendiente, de mayor a menor brecha. */
  prioridades: { actor: string; brecha: number }[];
}

export function resumirActores(actores: readonly FilaActor[]): ResumenActores {
  const brechas = actores.map((a) => ({ actor: a.actor, brecha: brechaCompromiso(a) }));
  const positivas = brechas.filter((b): b is { actor: string; brecha: number } => b.brecha !== null && b.brecha > 0);
  return {
    total: actores.length,
    evaluados: actores.filter((a) => a.poder && a.interes).length,
    conCompromiso: brechas.filter((b) => b.brecha !== null).length,
    conBrecha: positivas.length,
    prioridades: [...positivas].sort((a, b) => b.brecha - a.brecha),
  };
}
