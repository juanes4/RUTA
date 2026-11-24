import type { AreaAfectada } from '../modelo/proyecto';
import type { RespuestaBuzon1 } from '../modelo/tipos';
import { proporcion } from './estadistica';

/** Participación del buzón 1 = respuestas ÷ afectados del área (Etapa 0). */

export interface ParticipacionArea {
  area: string;
  respondentes: number;
  afectados: number;
  /** null si el área no tiene afectados registrados en la Etapa 0. */
  participacion: number | null;
}

export function participacionPorArea(respuestas: readonly RespuestaBuzon1[], areas: readonly AreaAfectada[]): ParticipacionArea[] {
  return areas.map(({ area, afectados }) => {
    const respondentes = respuestas.filter((r) => r.area === area).length;
    return { area, respondentes, afectados, participacion: proporcion(respondentes, afectados) };
  });
}

export function participacionTotal(respuestas: readonly RespuestaBuzon1[], areas: readonly AreaAfectada[]): number | null {
  const afectados = areas.reduce((suma, a) => suma + a.afectados, 0);
  const nombres = new Set(areas.map((a) => a.area));
  return proporcion(respuestas.filter((r) => nombres.has(r.area)).length, afectados);
}
