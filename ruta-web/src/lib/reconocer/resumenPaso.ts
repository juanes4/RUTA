import { LIENZO } from '../../config/formularios/reconocer';
import { CUADRANTES_EMPATIA } from '../../config/formularios/unir';
import type { DatosProyecto, Proyecto } from '../modelo/proyecto';
import { avanceTriaje } from '../calculo/triaje';
import { BLOQUES_LIENZO, bloquesFaltantes } from './lienzo';

const plural = (n: number, singular: string, varios: string) => `${n} ${n === 1 ? singular : varios}`;
const SIN_EMPEZAR = 'Sin empezar';
const lleno = (t: string) => t.trim() !== '';

function avance(hechos: number, total: number, unidad: string): string {
  if (hechos === 0) return SIN_EMPEZAR;
  return hechos === total ? 'Completo' : `${hechos} de ${total} ${unidad}`;
}

/** En qué va cada paso de Reconocer y Unir, para las tarjetas del índice. */
export function resumenPaso(pasoId: string, proyecto: Proyecto | null, datos: DatosProyecto): string {
  if (!proyecto) return SIN_EMPEZAR;
  switch (pasoId) {
    case 'R1': {
      const total = BLOQUES_LIENZO.length;
      return avance(total - bloquesFaltantes(datos.lienzo, LIENZO.motivosUrgencia).length, total, 'bloques');
    }
    case 'R2': {
      const { hechos, total } = avanceTriaje(datos.triaje);
      return avance(hechos, total, 'respuestas');
    }
    case 'R3':
      return datos.foda.length === 0 ? SIN_EMPEZAR : plural(datos.foda.length, 'ítem registrado', 'ítems registrados');
    case 'R4':
      return datos.actores.length === 0 ? SIN_EMPEZAR : plural(datos.actores.length, 'actor registrado', 'actores registrados');
    case 'R5':
      return datos.buzon1.length === 0 ? SIN_EMPEZAR : plural(datos.buzon1.length, 'persona respondió', 'personas respondieron');
    case 'U1':
      return datos.liderazgo.length === 0 ? SIN_EMPEZAR : plural(datos.liderazgo.length, 'encuesta registrada', 'encuestas registradas');
    case 'U2': {
      const { vocero, ...partes } = datos.narrativa;
      const campos = Object.values(partes);
      return avance(campos.filter(lleno).length + (lleno(vocero) ? 1 : 0), campos.length + 1, 'campos');
    }
    case 'U3': {
      const s = datos.soporte;
      return avance([s.mensajes.length > 0, s.preguntas.length > 0, s.pautas.length > 0].filter(Boolean).length, 3, 'secciones');
    }
    case 'U4':
      return avance(CUADRANTES_EMPATIA.filter((c) => datos.empatia[c.clave].length > 0).length, CUADRANTES_EMPATIA.length, 'cuadrantes');
    default:
      return SIN_EMPEZAR;
  }
}
