import type { FilaFoda } from '../modelo/tipos';

/** Ítems con votos, de más a menos votados: los primeros pasan al backlog (CONTEXTO §3, R2). */
export function masVotados(items: readonly FilaFoda[], cantidad: number): FilaFoda[] {
  return items
    .filter((i) => i.votos > 0)
    .sort((a, b) => b.votos - a.votos)
    .slice(0, cantidad);
}

/** Variación del FODA: día 90 − inicial (CONTEXTO §6). null hasta que se registre el día 90. */
export function variacionFoda(item: FilaFoda): number | null {
  return item.puntaje_dia90 === null ? null : item.puntaje_dia90 - item.puntaje_inicial;
}
