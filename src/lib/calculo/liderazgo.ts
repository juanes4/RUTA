import { LETRAS_LIDERAZGO } from '../../config/formularios/liderazgo';
import type { FilaLiderazgo, LetraLiderazgo, RespondenteLiderazgo } from '../modelo/tipos';

/** Encuesta de liderazgo: se cuenta A/B/C/D sobre el total de preguntas (CONTEXTO §3, R4). */

export type Conteos = Record<LetraLiderazgo, number>;

export function contarLetras(respuestas: readonly LetraLiderazgo[]): Conteos {
  const conteos: Conteos = { A: 0, B: 0, C: 0, D: 0 };
  for (const letra of respuestas) conteos[letra] += 1;
  return conteos;
}

const conteoDe = (fila: FilaLiderazgo, letra: LetraLiderazgo): number => fila[`conteo_${letra}`];

export interface VistaLider {
  encuestas: number;
  /** Promedio de respuestas por letra; null si la vista no se puede mostrar. */
  conteos: Conteos | null;
  dominantes: LetraLiderazgo[];
}

export interface ResumenLider {
  lider_id: string;
  auto: VistaLider;
  equipo: VistaLider;
}

/** Letras con el mayor conteo. Un empate devuelve todas: la herramienta no desempata. */
export function estilosDominantes(conteos: Conteos): LetraLiderazgo[] {
  const maximo = Math.max(...LETRAS_LIDERAZGO.map((l) => conteos[l]));
  return maximo > 0 ? LETRAS_LIDERAZGO.filter((l) => conteos[l] === maximo) : [];
}

function vista(filas: readonly FilaLiderazgo[], minimo: number): VistaLider {
  if (filas.length === 0 || filas.length < minimo) return { encuestas: filas.length, conteos: null, dominantes: [] };
  const conteos = contarLetras([]);
  for (const letra of LETRAS_LIDERAZGO) {
    conteos[letra] = filas.reduce((suma, f) => suma + conteoDe(f, letra), 0) / filas.length;
  }
  return { encuestas: filas.length, conteos, dominantes: estilosDominantes(conteos) };
}

/**
 * Resumen por líder. La autoevaluación se muestra siempre; la versión del
 * equipo solo con el mínimo de personas, para que nadie sea identificable.
 */
export function resumirLiderazgo(filas: readonly FilaLiderazgo[], minimoEquipo: number): ResumenLider[] {
  const lideres = [...new Set(filas.map((f) => f.lider_id))];
  const de = (lider: string, r: RespondenteLiderazgo) => filas.filter((f) => f.lider_id === lider && f.respondente === r);
  return lideres.map((lider_id) => ({
    lider_id,
    auto: vista(de(lider_id, 'auto'), 1),
    equipo: vista(de(lider_id, 'equipo'), minimoEquipo),
  }));
}
