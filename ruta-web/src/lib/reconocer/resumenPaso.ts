import { LIENZO } from '../../config/formularios/reconocer';
import { contarPersonas } from '../calculo/estadistica';
import type { DatosProyecto, Proyecto } from '../modelo/proyecto';
import { BLOQUES_LIENZO, bloquesFaltantes } from './lienzo';

const plural = (n: number, singular: string, varios: string) => `${n} ${n === 1 ? singular : varios}`;
const SIN_EMPEZAR = 'Sin empezar';

/** En qué va cada paso de Reconocer, para las tarjetas del índice. */
export function resumenPasoR(pasoId: string, proyecto: Proyecto | null, datos: DatosProyecto): string {
  if (pasoId === 'R5') return 'Solo para leer';
  if (!proyecto) return SIN_EMPEZAR;

  const conteos: Readonly<Record<string, [number, string, string]>> = {
    R2: [datos.foda.length, 'ítem registrado', 'ítems registrados'],
    R3: [datos.actores.length, 'actor registrado', 'actores registrados'],
    R4: [datos.liderazgo.length, 'encuesta registrada', 'encuestas registradas'],
    R6: [contarPersonas(datos.respuestas.filter((r) => r.instrumento === 'buzon1')), 'persona respondió', 'personas respondieron'],
    R7: [contarPersonas(datos.kotter.filter((k) => k.parte === 'A')), 'chequeo registrado', 'chequeos registrados'],
  };

  if (pasoId === 'R1') {
    const total = BLOQUES_LIENZO.length;
    const completos = total - bloquesFaltantes(datos.lienzo, LIENZO.motivosUrgencia).length;
    if (completos === 0) return SIN_EMPEZAR;
    return completos === total ? 'Completo' : `${completos} de ${total} bloques`;
  }
  if (pasoId === 'R7' && datos.decision) return 'Decisión registrada';
  const conteo = conteos[pasoId];
  if (!conteo || conteo[0] === 0) return SIN_EMPEZAR;
  return plural(...conteo);
}
