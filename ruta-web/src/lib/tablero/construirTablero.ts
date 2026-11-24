import type { Reglas } from '../../config/reglas';
import { resumirActores, type ResumenActores } from '../calculo/actores';
import { evaluarFoda, type ResultadoFoda } from '../calculo/foda';
import { lideresPorEstilo, resumirLiderazgo, vocerosSugeridos, type Conteos } from '../calculo/liderazgo';
import { participacionPorArea, participacionTotal, type ParticipacionArea } from '../calculo/participacion';
import { evaluarTriaje, type ResultadoTriaje } from '../calculo/triaje';
import type { DatosProyecto, Proyecto } from '../modelo/proyecto';
import type { AlcanceDespliegue } from '../modelo/tipos';

/** Todo lo que muestra el tablero, ya calculado a partir de R y U. La vista solo lo dibuja. */
export interface Tablero {
  triaje: ResultadoTriaje & { alcance: AlcanceDespliegue | null };
  foda: ResultadoFoda & { items: number };
  actores: ResumenActores;
  buzon: { respuestas: number; total: number | null; areas: ParticipacionArea[] };
  liderazgo: { lideres: number; porEstilo: Conteos; voceros: string[] };
  vocero: string;
}

export function construirTablero(proyecto: Proyecto, datos: DatosProyecto, reglas: Reglas): Tablero {
  const lideres = resumirLiderazgo(datos.liderazgo);
  return {
    triaje: { ...evaluarTriaje(datos.triaje, reglas.triaje), alcance: datos.triaje.alcance },
    foda: { ...evaluarFoda(datos.foda), items: datos.foda.length },
    actores: resumirActores(datos.actores),
    buzon: {
      respuestas: datos.buzon1.length,
      total: participacionTotal(datos.buzon1, proyecto.segmentacion.areas),
      areas: participacionPorArea(datos.buzon1, proyecto.segmentacion.areas),
    },
    liderazgo: {
      lideres: lideres.length,
      porEstilo: lideresPorEstilo(lideres),
      voceros: vocerosSugeridos(lideres).map((l) => l.lider_id),
    },
    vocero: datos.narrativa.vocero,
  };
}
