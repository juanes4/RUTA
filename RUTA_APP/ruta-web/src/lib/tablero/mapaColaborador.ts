import type { FilaRespuesta } from '../modelo/tipos';
import { esNumeroValido, promedio } from '../calculo/estadistica';

export type CategoriaExperiencia = 'promotor' | 'adaptacion' | 'riesgo' | 'pendiente';

export interface FaseExperiencia {
  numero: number;
  id: string;
  titulo: string;
  subtitulo: string;
  valor: number | null; // Fracción 0 a 1 (ej: 0.82 = 82%)
  categoria: CategoriaExperiencia;
  detalle: string;
}

export function clasificarExperiencia(valor: number | null): CategoriaExperiencia {
  if (valor === null) return 'pendiente';
  if (valor >= 0.7) return 'promotor';
  if (valor >= 0.45) return 'adaptacion';
  return 'riesgo';
}

/**
 * Calcula el promedio de favorabilidad (0 a 1) para un subconjunto de respuestas.
 * Si las preguntas son en escala 1 a 5, se normalizan: (promedio - 1) / 4.
 */
function calcularFavorabilidad(filas: readonly FilaRespuesta[]): number | null {
  const valoresNumericos = filas
    .map((f) => f.valor)
    .filter(esNumeroValido);

  if (valoresNumericos.length === 0) return null;

  const prom = promedio(valoresNumericos);
  if (prom === null) return null;

  // Si los valores están en escala 1 a 5, convertimos a fracción 0 a 1
  if (prom > 1.0) {
    return Math.min(Math.max((prom - 1) / 4, 0), 1);
  }
  return Math.min(Math.max(prom, 0), 1);
}

/**
 * Calcula las 4 fases del Mapa del Colaborador (curva de experiencia del cambio).
 * 1. Antes del cambio (Línea base - Buzón 1)
 * 2. Durante el cambio (Transición - Buzón 2)
 * 3. Situación actual (Adopción real - Pulso completo o uso)
 * 4. Hacia dónde mejorar (Sostenibilidad - Meta esperada)
 */
export function calcularMapaColaborador(
  respuestas: readonly FilaRespuesta[],
  metaSostenibilidad = 0.8,
): FaseExperiencia[] {
  // Fase 1: Buzón 1 / Línea base
  const respuestasBuzon1 = respuestas.filter(
    (r) => r.instrumento === 'buzon1' || r.momento === 'base',
  );
  const valorFase1 = calcularFavorabilidad(respuestasBuzon1);

  // Fase 2: Buzón 2 / Transición
  const respuestasBuzon2 = respuestas.filter(
    (r) => r.instrumento === 'buzon2' || String(r.momento).startsWith('ciclo'),
  );
  const valorFase2 = calcularFavorabilidad(respuestasBuzon2);

  // Fase 3: Pulso completo / Situación actual
  const respuestasActual = respuestas.filter(
    (r) => r.instrumento === 'pulso_completo' || r.instrumento === 'verificacion',
  );
  const valorFase3 = calcularFavorabilidad(respuestasActual);

  // Fase 4: Sostenibilidad (Meta fijada)
  const valorFase4 = metaSostenibilidad;

  return [
    {
      numero: 1,
      id: 'base',
      titulo: 'Antes del cambio',
      subtitulo: 'Línea base',
      valor: valorFase1,
      categoria: clasificarExperiencia(valorFase1),
      detalle: valorFase1 !== null ? 'Evaluación de apertura y comprensión inicial' : 'Pendiente de respuestas en Buzón 1',
    },
    {
      numero: 2,
      id: 'transicion',
      titulo: 'Durante el cambio',
      subtitulo: 'Transición',
      valor: valorFase2,
      categoria: clasificarExperiencia(valorFase2),
      detalle: valorFase2 !== null ? 'Punto de ajuste en la curva de adopción' : 'Pendiente de mediciones en Buzón 2',
    },
    {
      numero: 3,
      id: 'actual',
      titulo: 'Situación actual',
      subtitulo: 'Adopción real',
      valor: valorFase3,
      categoria: clasificarExperiencia(valorFase3),
      detalle: valorFase3 !== null ? 'Nivel de consolidación del hábito' : 'Pendiente de pulso de adopción',
    },
    {
      numero: 4,
      id: 'sostenibilidad',
      titulo: 'Hacia dónde mejorar',
      subtitulo: 'Sostenibilidad',
      valor: valorFase4,
      categoria: clasificarExperiencia(valorFase4),
      detalle: `Meta de sostenibilidad: ${Math.round(valorFase4 * 100)}%`,
    },
  ];
}
