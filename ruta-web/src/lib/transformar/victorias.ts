import { CRITERIOS_MRMT, type Clasificacion } from '../../config/transformar';

export const PUNTAJE_MINIMO = CRITERIOS_MRMT.length; // 8
export const PUNTAJE_MAXIMO = CRITERIOS_MRMT.length * 5; // 40
/** Desde este puntaje el mérito se puede publicar (mérito favorable o destacado). */
export const PUNTAJE_PARA_PUBLICAR = 24;

export interface PuntajeCriterio {
  puntaje: number | null;
  evidencia: string;
}

/** Suma de los ocho criterios; null mientras falte alguno por calificar. */
export function totalMrmt(criterios: Readonly<Record<string, PuntajeCriterio>>): number | null {
  let total = 0;
  for (const c of CRITERIOS_MRMT) {
    const p = criterios[c.id]?.puntaje;
    if (p === null || p === undefined) return null;
    total += p;
  }
  return total;
}

/** Matriz de reconocimiento: 32 a 40 destacado, 24 a 31 favorable, 8 a 23 en desarrollo. */
export function clasificarMerito(total: number): Clasificacion {
  if (total >= 32) return 'destacado';
  if (total >= PUNTAJE_PARA_PUBLICAR) return 'favorable';
  return 'desarrollo';
}

/** Criterios con 4 o 5 que no tienen evidencia anotada (el documento la exige). */
export function criteriosSinEvidencia(criterios: Readonly<Record<string, PuntajeCriterio>>): string[] {
  return CRITERIOS_MRMT.filter((c) => {
    const f = criterios[c.id];
    return f?.puntaje !== null && f?.puntaje !== undefined && f.puntaje >= 4 && !f.evidencia.trim();
  }).map((c) => c.criterio);
}

/** Escalón con más votos; null si no hay votos o hay empate (el equipo lo define hablando). */
export function escalonMayoritario(niveles: readonly number[]): number | null {
  const max = Math.max(...niveles);
  if (max <= 0) return null;
  const ganadores = niveles.flatMap((n, i) => (n === max ? [i + 1] : []));
  return ganadores.length === 1 ? (ganadores[0] ?? null) : null;
}

export const promedioDe = (nums: readonly number[]): number | null =>
  nums.length === 0 ? null : Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;

export const formatoPromedio = (n: number | null): string => (n === null ? '—' : n.toFixed(1).replace('.', ','));
