import { KOTTER_PARTE_A } from '../../config/formularios/kotter';
import type { FilaKotter, RolKotter } from '../modelo/tipos';

export interface RespuestaKotter {
  respuesta: string;
  evidencia: string;
}

/** Momento del chequeo parte A: antes de lanzar (CONTEXTO §5). */
export const PERIODO_PARTE_A = 'antes_de_lanzar';

/** Convierte un chequeo digitado en filas de la tabla `kotter`. Lo que quedó en blanco no genera fila. */
export function filasDeChequeo(
  respuestas: Readonly<Record<string, RespuestaKotter>>,
  rol: RolKotter,
  id_respuesta: string,
  fecha: string,
): FilaKotter[] {
  return KOTTER_PARTE_A.flatMap((pregunta) => {
    const dada = respuestas[pregunta.id];
    const respuesta = dada?.respuesta.trim() ?? '';
    if (!respuesta) return [];
    return [
      {
        id_respuesta,
        fecha,
        parte: 'A' as const,
        periodo: PERIODO_PARTE_A,
        rol,
        paso: pregunta.paso,
        pregunta_id: pregunta.id,
        respuesta_original: respuesta,
        evidencia: dada?.evidencia.trim() || null,
      },
    ];
  });
}
