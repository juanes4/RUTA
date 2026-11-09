import { NO_SE, ORDEN_ADKAR, type Dimension, type FilaRespuesta } from '../modelo/tipos';
import { esNumeroValido, promedio, proporcion } from './estadistica';

/**
 * Indicadores ADKAR del buzón 1 (CONTEXTO §6, etapa 1).
 * El puntaje de una dimensión es el promedio de las respuestas válidas de
 * sus preguntas; "No sé" no entra al promedio y se cuenta aparte.
 */

export interface ResumenDimension {
  /** null si la dimensión no tiene respuestas válidas. */
  promedio: number | null;
  validas: number;
  noSe: number;
  favorables: number;
}

export type PerfilAdkar = Record<Dimension, ResumenDimension>;

function esDimensionAdkar(dimension: string): dimension is Dimension {
  return (ORDEN_ADKAR as readonly string[]).includes(dimension);
}

export function resumirAdkar(
  filas: readonly FilaRespuesta[],
  valorFavorableMinimo: number,
): PerfilAdkar {
  const valores = new Map<Dimension, number[]>(ORDEN_ADKAR.map((d) => [d, []]));
  const noSe = new Map<Dimension, number>(ORDEN_ADKAR.map((d) => [d, 0]));

  for (const fila of filas) {
    if (!esDimensionAdkar(fila.dimension)) continue;
    if (fila.valor === NO_SE) {
      noSe.set(fila.dimension, (noSe.get(fila.dimension) ?? 0) + 1);
    } else if (esNumeroValido(fila.valor)) {
      valores.get(fila.dimension)?.push(fila.valor);
    }
  }

  const perfil = {} as PerfilAdkar;
  for (const dimension of ORDEN_ADKAR) {
    const lista = valores.get(dimension) ?? [];
    perfil[dimension] = {
      promedio: promedio(lista),
      validas: lista.length,
      noSe: noSe.get(dimension) ?? 0,
      favorables: lista.filter((v) => v >= valorFavorableMinimo).length,
    };
  }
  return perfil;
}

/**
 * Punto de bloqueo: primera dimensión, en el orden C → D → K → H → R, con
 * promedio menor al umbral. Las dimensiones sin respuestas válidas no se
 * evalúan. Devuelve null si ninguna está bajo el umbral.
 */
export function puntoDeBloqueo(
  promedios: Readonly<Record<Dimension, number | null>>,
  umbral: number,
): Dimension | null {
  for (const dimension of ORDEN_ADKAR) {
    const valor = promedios[dimension];
    if (valor !== null && valor < umbral) return dimension;
  }
  return null;
}

export function promediosDe(perfil: PerfilAdkar): Record<Dimension, number | null> {
  const resultado = {} as Record<Dimension, number | null>;
  for (const dimension of ORDEN_ADKAR) resultado[dimension] = perfil[dimension].promedio;
  return resultado;
}

/** % favorable: respuestas 4 y 5 ÷ total válido. */
export function porcentajeFavorable(resumen: ResumenDimension): number | null {
  return proporcion(resumen.favorables, resumen.validas);
}

/** % "No sé" sobre todas las respuestas de la dimensión (válidas + "No sé"). */
export function porcentajeNoSe(resumen: ResumenDimension): number | null {
  return proporcion(resumen.noSe, resumen.validas + resumen.noSe);
}

/** Suma las cinco dimensiones en un solo resumen (para el % general). */
export function totalAdkar(perfil: PerfilAdkar): ResumenDimension {
  const total = { validas: 0, noSe: 0, favorables: 0, sumaValores: 0 };
  for (const dimension of ORDEN_ADKAR) {
    const r = perfil[dimension];
    total.validas += r.validas;
    total.noSe += r.noSe;
    total.favorables += r.favorables;
    total.sumaValores += (r.promedio ?? 0) * r.validas;
  }
  return {
    promedio: proporcion(total.sumaValores, total.validas),
    validas: total.validas,
    noSe: total.noSe,
    favorables: total.favorables,
  };
}
