import { LETRAS_LIDERAZGO } from '../../config/formularios/liderazgo';
import type { FilaLiderazgo, LetraLiderazgo } from '../modelo/tipos';

/** U1. Encuesta de liderazgo: la letra con mayoría define el estilo (RUTA_ANDI_R_U.md). */

export type Conteos = Record<LetraLiderazgo, number>;

export function contarLetras(respuestas: readonly LetraLiderazgo[]): Conteos {
  const conteos: Conteos = { A: 0, B: 0, C: 0, D: 0 };
  for (const letra of respuestas) conteos[letra] += 1;
  return conteos;
}

/** Letras con el mayor conteo. Un empate devuelve todas: la herramienta no desempata. */
export function estilosDominantes(conteos: Conteos): LetraLiderazgo[] {
  const maximo = Math.max(...LETRAS_LIDERAZGO.map((l) => conteos[l]));
  return maximo > 0 ? LETRAS_LIDERAZGO.filter((l) => conteos[l] === maximo) : [];
}

export interface ResumenLider {
  lider_id: string;
  encuestas: number;
  /** Promedio por letra si el líder respondió más de una vez. */
  conteos: Conteos;
  dominantes: LetraLiderazgo[];
}

export function resumirLiderazgo(filas: readonly FilaLiderazgo[]): ResumenLider[] {
  const lideres = [...new Set(filas.map((f) => f.lider_id))];
  return lideres.map((lider_id) => {
    const propias = filas.filter((f) => f.lider_id === lider_id);
    const conteos = contarLetras([]);
    for (const letra of LETRAS_LIDERAZGO) {
      conteos[letra] = propias.reduce((suma, f) => suma + f[`conteo_${letra}`], 0) / propias.length;
    }
    return { lider_id, encuestas: propias.length, conteos, dominantes: estilosDominantes(conteos) };
  });
}

/**
 * Líderes sugeridos como voceros: primero los de estilo C (vocero ideal) y
 * luego los de B (viabilidad alta), sin repetir a quien empata en ambos.
 */
export function vocerosSugeridos(lideres: readonly ResumenLider[]): ResumenLider[] {
  const conC = lideres.filter((l) => l.dominantes.includes('C'));
  const conB = lideres.filter((l) => l.dominantes.includes('B') && !l.dominantes.includes('C'));
  return [...conC, ...conB];
}

/** Cuántos líderes tienen cada estilo como dominante (un empate cuenta en ambos). */
export function lideresPorEstilo(lideres: readonly ResumenLider[]): Conteos {
  return contarLetras(lideres.flatMap((l) => l.dominantes));
}
