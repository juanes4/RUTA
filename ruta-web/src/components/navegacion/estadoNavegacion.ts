import { anclaPaso, type Etapa } from '../../config/etapas';

/** Lógica pura de la navegación: qué etapa está activa, contadores y avance de la línea. */

export interface EstadoNodo {
  etapa: Etapa;
  esActual: boolean;
  pasosVistos: number;
  totalPasos: number;
}

export interface EstadoNavegacion {
  nodos: EstadoNodo[];
  /** 0 a 1: hasta dónde se llena la línea (hasta el nodo de la etapa actual). */
  progreso: number;
}

export function calcularEstadoNavegacion(
  etapas: readonly Etapa[],
  idEtapaActual: string | null,
  anclasVistas: ReadonlySet<string>,
): EstadoNavegacion {
  const nodos = etapas.map((etapa) => ({
    etapa,
    esActual: etapa.activa && etapa.id === idEtapaActual,
    pasosVistos: etapa.pasos.filter((p) => anclasVistas.has(anclaPaso(p.id))).length,
    totalPasos: etapa.pasos.length,
  }));
  const indiceActual = nodos.findIndex((n) => n.esActual);
  const tramos = Math.max(etapas.length - 1, 1);
  return { nodos, progreso: indiceActual <= 0 ? 0 : indiceActual / tramos };
}
