import type { Proyecto } from '../modelo/proyecto';

/** Duración del ciclo por defecto: 2 semanas (documento maestro, etapa 2). */
export const DIAS_POR_CICLO_POR_DEFECTO = 14;

/** Un proyecto nuevo arranca vacío: la Etapa 0 lo completa. */
export function crearProyecto(ahora: string, id: string): Proyecto {
  return {
    id,
    creado: ahora,
    actualizado: ahora,
    empresa: {
      nombre: '',
      sector: '',
      total_colaboradores: null,
      que_cambia: '',
      fecha_lanzamiento: '',
    },
    segmentacion: { areas: [], turnos: [], rangos_antiguedad: [] },
    metas: {},
    uso: { unidad: null, dias_por_ciclo: DIAS_POR_CICLO_POR_DEFECTO },
  };
}
