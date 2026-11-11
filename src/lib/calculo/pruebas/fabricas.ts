/**
 * Constructores de filas SOLO para pruebas. La app nunca usa datos
 * inventados (PLAN §2); estas filas no se importan fuera de *.test.ts.
 */
import type { FilaKotter, FilaRespuesta, RolKotter } from '../../modelo/tipos';

export function filaBuzon1(
  persona: string,
  dimension: FilaRespuesta['dimension'],
  valor: number | 'NS',
  extra: Partial<FilaRespuesta> = {},
): FilaRespuesta {
  return {
    id_respuesta: persona,
    instrumento: 'buzon1',
    momento: 'base',
    fecha: '2026-11-01',
    area: 'Producción',
    turno: 'Día',
    antiguedad_rango: '1-3 años',
    pregunta_id: `p_${dimension}`,
    dimension,
    valor: valor === 'NS' ? null : valor,
    no_se: valor === 'NS',
    ...extra,
  };
}

/** n personas distintas en un área, cada una con una respuesta. */
export function personasEnArea(area: string, n: number, valor = 4): FilaRespuesta[] {
  return Array.from({ length: n }, (_, i) => filaBuzon1(`${area}-${i}`, 'C', valor, { area }));
}

export function filaKotter(
  persona: string,
  rol: RolKotter,
  pregunta_id: string,
  respuesta_original: string,
  evidencia: string | null = null,
): FilaKotter {
  return {
    id_respuesta: persona,
    fecha: '2026-11-01',
    parte: 'A',
    periodo: 'diagnostico',
    rol,
    paso: null,
    pregunta_id,
    respuesta_original,
    evidencia,
  };
}

/** n personas de un rol que responden lo mismo en una pregunta. */
export function personasRol(rol: RolKotter, n: number, pregunta_id = 'A1.1', respuesta = '4'): FilaKotter[] {
  return Array.from({ length: n }, (_, i) => filaKotter(`${rol}-${i}`, rol, pregunta_id, respuesta));
}
