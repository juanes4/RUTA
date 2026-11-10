import type { FilaActor, Influencia, Postura } from '../modelo/tipos';
import { proporcion } from './estadistica';

/** Cobertura de actores: actores con acción ÷ total (CONTEXTO §6). */
export function coberturaActores(actores: readonly FilaActor[]): number | null {
  return proporcion(actores.filter((a) => a.accion.trim().length > 0).length, actores.length);
}

/** Cuántos actores hay en una celda de la matriz influencia × postura. */
export function contarEnMatriz(actores: readonly FilaActor[], influencia: Influencia, postura: Postura): number {
  return actores.filter((a) => a.influencia === influencia && a.postura === postura).length;
}
