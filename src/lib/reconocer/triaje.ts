import type { PuntajeTriaje, TriajeCambio } from '../modelo/tipos';

export type RutaTriaje = 'agil_estandar' | 'moderado' | 'mayor';

export interface ResultadoTriaje {
  puntaje: number;
  ruta: RutaTriaje;
  nombre: string;
  descripcion: string;
}

export function puntajeTriaje(valor: string): PuntajeTriaje | null {
  if (valor === '1' || valor === '2' || valor === '3') return Number(valor) as PuntajeTriaje;
  return null;
}

export function resumirTriaje(triaje: Pick<TriajeCambio, 'impacto_personas' | 'complejidad_organizacional' | 'riesgo_operativo'>): ResultadoTriaje {
  const puntaje = triaje.impacto_personas + triaje.complejidad_organizacional + triaje.riesgo_operativo;
  if (puntaje <= 4) {
    return {
      puntaje,
      ruta: 'agil_estandar',
      nombre: 'Cambio ágil o estándar',
      descripcion: 'La organización está lista y cuenta con recursos de acompañamiento.',
    };
  }
  if (puntaje <= 7) {
    return {
      puntaje,
      ruta: 'moderado',
      nombre: 'Cambio moderado',
      descripcion: 'Identifica y atiende las barreras de recursos o resistencia antes del lanzamiento.',
    };
  }
  return {
    puntaje,
    ruta: 'mayor',
    nombre: 'Cambio mayor',
    descripcion: 'Alta complejidad y riesgo transformacional; anticipa impactos en la cultura, estructura u operación.',
  };
}
