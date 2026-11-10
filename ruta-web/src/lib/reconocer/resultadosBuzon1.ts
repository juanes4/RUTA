import type { PreguntaSeleccion } from '../../config/formularios/buzon1';
import type { Reglas } from '../../config/reglas';
import {
  porcentajeFavorable,
  porcentajeNoSe,
  promediosDe,
  puntoDeBloqueo,
  resumirAdkar,
  type PerfilAdkar,
} from '../calculo/adkar';
import { contarPersonas } from '../calculo/estadistica';
import { agruparConAnonimato } from '../calculo/grupos';
import { participacionPorArea, type ParticipacionArea } from '../calculo/participacion';
import type { DatosProyecto, Proyecto } from '../modelo/proyecto';
import { ORDEN_ADKAR, type Dimension, type FilaRespuesta } from '../modelo/tipos';

/** Todo lo que muestra R6, ya calculado (PLAN §4). */

export interface GrupoAdkar {
  nombre: string;
  personas: number;
  esOtros: boolean;
  perfil: PerfilAdkar;
  bloqueo: Dimension | null;
  filas: FilaRespuesta[];
}

export interface ResumenDimensionTotal {
  dimension: Dimension;
  favorable: number | null;
  noSe: number | null;
  alertaNoSe: boolean;
}

export interface ResultadosBuzon1 {
  personas: number;
  personasOcultas: number;
  grupos: GrupoAdkar[];
  porDimension: ResumenDimensionTotal[];
  participacion: ParticipacionArea[];
}

export function resultadosBuzon1(proyecto: Proyecto, datos: DatosProyecto, reglas: Reglas): ResultadosBuzon1 {
  const filas = datos.respuestas.filter((r) => r.instrumento === 'buzon1');
  const { umbralBloqueo, valorFavorableMinimo, alertaNoSe } = reglas.adkar;
  const { grupos, personasOcultas } = agruparConAnonimato(filas, (f) => f.area, reglas.anonimato.minimoColaboradores);

  const gruposAdkar = grupos.map<GrupoAdkar>((g) => {
    const perfil = resumirAdkar(g.filas, valorFavorableMinimo);
    return { ...g, perfil, bloqueo: puntoDeBloqueo(promediosDe(perfil), umbralBloqueo) };
  });

  // Los totales solo usan grupos visibles: quien quedó oculto no se cuenta aparte.
  const perfilVisible = resumirAdkar(
    grupos.flatMap((g) => g.filas),
    valorFavorableMinimo,
  );
  const porDimension = ORDEN_ADKAR.map<ResumenDimensionTotal>((dimension) => {
    const noSe = porcentajeNoSe(perfilVisible[dimension]);
    return {
      dimension,
      favorable: porcentajeFavorable(perfilVisible[dimension]),
      noSe,
      alertaNoSe: noSe !== null && noSe > alertaNoSe,
    };
  });

  return {
    personas: contarPersonas(filas),
    personasOcultas,
    grupos: gruposAdkar,
    porDimension,
    participacion: participacionPorArea(filas, proyecto.segmentacion.areas),
  };
}

/** Veces que se eligió cada opción, de más a menos elegida. */
export function conteoOpciones(
  filas: readonly FilaRespuesta[],
  pregunta: PreguntaSeleccion,
): { opcion: string; conteo: number }[] {
  return pregunta.opciones
    .map((opcion) => ({
      opcion,
      conteo: filas.filter((f) => f.pregunta_id === pregunta.id && f.valor === opcion).length,
    }))
    .sort((a, b) => b.conteo - a.conteo);
}
