import { contarPersonas } from './estadistica';

/**
 * Agrupación con anonimato (PLAN §6, "Grupos").
 * Los grupos con menos del mínimo de personas se suman a "Otros"; si
 * "Otros" tampoco llega al mínimo, se oculta.
 */

export const GRUPO_OTROS = 'Otros';

export interface FilaConPersona {
  id_respuesta: string;
}

export interface Grupo<T extends FilaConPersona> {
  nombre: string;
  personas: number;
  filas: T[];
  /** true si es la suma de grupos pequeños. */
  esOtros: boolean;
}

export interface ResultadoAgrupacion<T extends FilaConPersona> {
  grupos: Grupo<T>[];
  /** Personas que no aparecen en ningún grupo visible. */
  personasOcultas: number;
}

function agruparPor<T>(filas: readonly T[], clave: (fila: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const fila of filas) {
    const k = clave(fila);
    const lista = mapa.get(k);
    if (lista) lista.push(fila);
    else mapa.set(k, [fila]);
  }
  return mapa;
}

export function agruparConAnonimato<T extends FilaConPersona>(
  filas: readonly T[],
  clave: (fila: T) => string,
  minimo: number,
): ResultadoAgrupacion<T> {
  const grupos: Grupo<T>[] = [];
  const pequenos: T[] = [];

  for (const [nombre, filasGrupo] of agruparPor(filas, clave)) {
    const personas = contarPersonas(filasGrupo);
    if (personas >= minimo) grupos.push({ nombre, personas, filas: filasGrupo, esOtros: false });
    else pequenos.push(...filasGrupo);
  }

  const personasPequenos = contarPersonas(pequenos);
  if (personasPequenos >= minimo) {
    grupos.push({ nombre: GRUPO_OTROS, personas: personasPequenos, filas: pequenos, esOtros: true });
    return { grupos, personasOcultas: 0 };
  }
  return { grupos, personasOcultas: personasPequenos };
}

/**
 * Combinación de varias claves (p. ej. área × turno). Solo se permite si
 * cada celda tiene al menos el mínimo; si no, devuelve null y la vista
 * vuelve a la agrupación simple.
 */
export function agruparCombinado<T extends FilaConPersona>(
  filas: readonly T[],
  claves: readonly ((fila: T) => string)[],
  minimo: number,
): Grupo<T>[] | null {
  const claveCompuesta = (fila: T) => claves.map((c) => c(fila)).join(' · ');
  const grupos: Grupo<T>[] = [];
  for (const [nombre, filasGrupo] of agruparPor(filas, claveCompuesta)) {
    const personas = contarPersonas(filasGrupo);
    if (personas < minimo) return null;
    grupos.push({ nombre, personas, filas: filasGrupo, esOtros: false });
  }
  return grupos;
}
