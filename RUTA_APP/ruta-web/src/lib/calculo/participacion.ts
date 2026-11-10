import type { AreaAfectada } from '../modelo/proyecto';
import type { FilaRespuesta } from '../modelo/tipos';
import { contarPersonas, proporcion } from './estadistica';

/** Participación = respuestas ÷ afectados (CONTEXTO §6, meta 70 %). */

export interface ParticipacionArea {
  area: string;
  respondentes: number;
  afectados: number;
  /** null si el área no tiene afectados registrados en la Etapa 0. */
  participacion: number | null;
}

export function participacionPorArea(
  filas: readonly FilaRespuesta[],
  areas: readonly AreaAfectada[],
): ParticipacionArea[] {
  return areas.map(({ area, afectados }) => {
    const respondentes = contarPersonas(filas.filter((f) => f.area === area));
    return { area, respondentes, afectados, participacion: proporcion(respondentes, afectados) };
  });
}

export function participacionTotal(filas: readonly FilaRespuesta[], areas: readonly AreaAfectada[]): number | null {
  const afectados = areas.reduce((suma, a) => suma + a.afectados, 0);
  return proporcion(contarPersonas(filas), afectados);
}
