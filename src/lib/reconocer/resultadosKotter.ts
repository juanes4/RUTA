import { KOTTER_PARTE_A } from '../../config/formularios/kotter';
import type { Reglas } from '../../config/reglas';
import { decidirR7, type ResultadoR7 } from '../calculo/decisionR7';
import { contarPersonas } from '../calculo/estadistica';
import {
  agruparPorRol,
  calcularBrechas,
  nivelPaso,
  PASOS_KOTTER,
  puntajesPorPaso,
  type AgrupacionKotter,
  type Brecha,
  type NivelKotter,
} from '../calculo/kotter';
import type { DatosProyecto } from '../modelo/proyecto';
import type { PasoKotter } from '../modelo/tipos';
import { entradaR7 } from '../tablero/construirTablero';

/** Todo lo que muestra R7, ya calculado. */

export interface PasoResultado {
  paso: PasoKotter;
  puntaje: number | null;
  nivel: NivelKotter | null;
}

export interface ResultadosKotter {
  personas: number;
  /** false: hay menos personas que el mínimo y no se muestra ningún puntaje. */
  visible: boolean;
  decision: ResultadoR7;
  pasos: PasoResultado[];
  agrupacion: AgrupacionKotter;
  brechas: Brecha[];
}

export function resultadosKotter(datos: DatosProyecto, reglas: Reglas): ResultadosKotter {
  const filas = datos.kotter.filter((k) => k.parte === 'A');
  const personas = contarPersonas(filas);
  const visible = personas >= reglas.anonimato.minimoKotter;
  const puntajes = puntajesPorPaso(filas, KOTTER_PARTE_A);
  const agrupacion = agruparPorRol(filas, reglas.anonimato.minimoKotter);

  return {
    personas,
    visible,
    decision: decidirR7(entradaR7(datos, reglas), { ...reglas.kotter, ...reglas.decisionR7 }),
    pasos: PASOS_KOTTER.map((paso) => {
      const puntaje = visible ? puntajes[paso] : null;
      return { paso, puntaje, nivel: puntaje === null ? null : nivelPaso(puntaje, reglas.kotter) };
    }),
    agrupacion,
    brechas: visible ? calcularBrechas(agrupacion, KOTTER_PARTE_A, reglas.kotter.brechaAlerta) : [],
  };
}
