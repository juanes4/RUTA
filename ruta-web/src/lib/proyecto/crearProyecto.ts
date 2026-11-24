import type { Proyecto } from '../modelo/proyecto';

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
    segmentacion: { areas: [] },
  };
}
