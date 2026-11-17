import type { DatosProyecto, Proyecto } from '../modelo/proyecto';
import type { FilaUso } from '../modelo/tipos';
import { coberturaActores } from '../calculo/actores';
import { contarPersonas, proporcion } from '../calculo/estadistica';
import { participacionTotal } from '../calculo/participacion';

/**
 * Una calculadora por indicador (abierto a extensión: agregar un indicador
 * es agregar una entrada, sin tocar el tablero). Devuelve el valor o el
 * motivo por el que no hay valor; nunca inventa uno.
 */

export interface ContextoIndicadores {
  proyecto: Proyecto;
  datos: DatosProyecto;
}

export type ResultadoIndicador = { valor: number; motivo?: undefined } | { valor: null; motivo: string };

export type Calculadora = (contexto: ContextoIndicadores) => ResultadoIndicador;

const sinDato = (motivo: string): ResultadoIndicador => ({ valor: null, motivo });

function ultimoCiclo(uso: readonly FilaUso[]): FilaUso[] {
  if (uso.length === 0) return [];
  const ciclo = Math.max(...uso.map((u) => u.ciclo));
  return uso.filter((u) => u.ciclo === ciclo);
}

/** Proporción sobre el total de transacciones del último ciclo, sumando todos los grupos. */
function proporcionUltimoCiclo(uso: readonly FilaUso[], parte: (u: FilaUso) => number): ResultadoIndicador {
  const filas = ultimoCiclo(uso);
  const total = filas.reduce((s, u) => s + u.transacciones_nuevo + u.transacciones_antiguo, 0);
  const valor = proporcion(filas.reduce((s, u) => s + parte(u), 0), total);
  return valor === null ? sinDato('Sin registro de uso por ciclo todavía.') : { valor };
}

export const CALCULADORAS: Readonly<Record<string, Calculadora>> = {
  participacion: ({ proyecto, datos }) => {
    const areas = proyecto.segmentacion.areas;
    if (areas.length === 0) return sinDato('Registra las áreas y sus afectados en la Etapa 0.');
    const buzon1 = datos.respuestas.filter((r) => r.instrumento === 'buzon1');
    if (contarPersonas(buzon1) === 0) return sinDato('Sin respuestas del buzón 1 todavía.');
    const valor = participacionTotal(buzon1, areas);
    return valor === null ? sinDato('Las áreas registradas no tienen afectados.') : { valor };
  },
  utilizacion: ({ datos }) => proporcionUltimoCiclo(datos.uso, (u) => u.transacciones_nuevo),
  uso_residual: ({ datos }) => proporcionUltimoCiclo(datos.uso, (u) => u.transacciones_antiguo),
  competencia: () => sinDato('Pendiente de definir: el total de la fórmula (registros nuevos o todos los registros).'),
  cobertura_actores: ({ datos }) => {
    const valor = coberturaActores(datos.actores);
    return valor === null ? sinDato('Sin actores registrados en el mapa (R3) todavía.') : { valor };
  },
  dudas_atendidas: () => sinDato('El muro de dudas todavía no se captura en la herramienta.'),
  conducta_lideres: () => sinDato('El pulso completo y Kotter parte B todavía no se capturan.'),
  preparacion: () => sinDato('El pulso completo todavía no se captura.'),
};

export function calcularIndicador(id: string, contexto: ContextoIndicadores): ResultadoIndicador {
  const calculadora = CALCULADORAS[id];
  return calculadora ? calculadora(contexto) : sinDato('Indicador sin calculadora.');
}
