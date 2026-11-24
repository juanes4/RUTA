import type { NivelSemaforoTriaje } from '../../config/formularios/reconocer';
import type { Reglas } from '../../config/reglas';
import type { Triaje } from '../modelo/proyecto';
import type { PuntajeTriaje } from '../modelo/tipos';

/** R2. Matriz rápida de puntuación del triaje (RUTA_ANDI_R_U.md). */

/** Complejidad organizacional según cuántos elementos impacta: 1 → 1, 2 o 3 → 2, 4 o más → 3. Sin elementos, null. */
export function puntajeComplejidad(elementos: number, reglas: Reglas['triaje']): PuntajeTriaje | null {
  if (elementos <= 0) return null;
  if (elementos >= reglas.elementosAlto) return 3;
  if (elementos >= reglas.elementosMedio) return 2;
  return 1;
}

export interface ResultadoTriaje {
  impacto_personas: PuntajeTriaje | null;
  complejidad: PuntajeTriaje | null;
  riesgo_operativo: PuntajeTriaje | null;
  /** Suma de los tres criterios (3 a 9); null mientras falte alguno. */
  total: number | null;
  nivel: NivelSemaforoTriaje | null;
}

export function nivelTriaje(total: number, reglas: Reglas['triaje']): NivelSemaforoTriaje {
  if (total <= reglas.verdeHasta) return 'verde';
  if (total <= reglas.amarilloHasta) return 'amarillo';
  return 'rojo';
}

export function evaluarTriaje(triaje: Triaje, reglas: Reglas['triaje']): ResultadoTriaje {
  const complejidad = puntajeComplejidad(new Set(triaje.elementos).size, reglas);
  const { impacto_personas, riesgo_operativo } = triaje;
  const completo = impacto_personas !== null && complejidad !== null && riesgo_operativo !== null;
  const total = completo ? impacto_personas + complejidad + riesgo_operativo : null;
  return { impacto_personas, complejidad, riesgo_operativo, total, nivel: total === null ? null : nivelTriaje(total, reglas) };
}

/** Cuántos de los 3 criterios y las 3 preguntas orientadoras tienen respuesta. */
export function avanceTriaje(triaje: Triaje): { hechos: number; total: number } {
  const partes = [
    triaje.por_que_ahora.trim() !== '',
    triaje.poblacion_afectada.trim() !== '',
    triaje.dimension_tecnica.trim() !== '',
    triaje.impacto_personas !== null,
    triaje.elementos.length > 0,
    triaje.riesgo_operativo !== null,
  ];
  return { hechos: partes.filter(Boolean).length, total: partes.length };
}
