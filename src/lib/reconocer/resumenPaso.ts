import { LIENZO } from '../../config/formularios/reconocer';
import type { DatosProyecto, Proyecto } from '../modelo/proyecto';
import { BLOQUES_LIENZO, bloquesFaltantes } from './lienzo';
import { resumirTriaje } from './triaje';

const plural = (n: number, singular: string, varios: string) => `${n} ${n === 1 ? singular : varios}`;
const SIN_EMPEZAR = 'Sin empezar';

/** En qué va cada paso de Reconocer, para las tarjetas del índice. */
export function resumenPasoR(pasoId: string, proyecto: Proyecto | null, datos: DatosProyecto): string {
  if (!proyecto) return SIN_EMPEZAR;

  const conteos: Readonly<Record<string, [number, string, string]>> = {
    R3: [datos.foda.length, 'ítem registrado', 'ítems registrados'],
    R4: [datos.actores.length, 'actor registrado', 'actores registrados'],
    R5: [datos.escuchaInicial.length, 'respuesta recibida', 'respuestas recibidas'],
  };

  if (pasoId === 'R1') {
    const total = BLOQUES_LIENZO.length;
    const completos = total - bloquesFaltantes(datos.lienzo, LIENZO.motivosUrgencia).length;
    if (completos === 0) return SIN_EMPEZAR;
    return completos === total ? 'Completo' : `${completos} de ${total} bloques`;
  }
  if (pasoId === 'R2' && datos.triaje) {
    const resultado = resumirTriaje(datos.triaje);
    return `Ruta: ${resultado.nombre.toLowerCase()}`;
  }
  const conteo = conteos[pasoId];
  if (!conteo || conteo[0] === 0) return SIN_EMPEZAR;
  return plural(...conteo);
}
