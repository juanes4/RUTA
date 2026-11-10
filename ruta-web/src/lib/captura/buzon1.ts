import { BUZON1_ABIERTAS, BUZON1_ESCALA, BUZON1_SELECCION } from '../../config/formularios/buzon1';
import type { FilaRespuesta } from '../modelo/tipos';
import type { CatalogoPreguntas } from './respuestasCsv';

/** Catálogo del buzón 1 para validar el CSV. */
export const CATALOGO_BUZON1: CatalogoPreguntas = {
  instrumento: 'buzon1',
  escala: new Map(BUZON1_ESCALA.map((p) => [p.id, p.dimension])),
  seleccion: new Map(BUZON1_SELECCION.map((p) => [p.id, p.opciones])),
  abiertas: new Set(BUZON1_ABIERTAS.map((p) => p.id)),
  codigos: new Map([...BUZON1_ESCALA, ...BUZON1_SELECCION, ...BUZON1_ABIERTAS].map((p) => [p.codigo, p.id])),
  maximos: new Map(BUZON1_SELECCION.map((p) => [p.id, p.maximo])),
};

export interface EncuestaBuzon1 {
  area: string;
  turno: string;
  antiguedad_rango: string;
  escala: Readonly<Record<string, string>>;
  seleccion: Readonly<Record<string, readonly string[]>>;
  abiertas: Readonly<Record<string, string>>;
}

export const VALOR_NO_SE = 'NS';

/** Convierte una encuesta digitada en filas de formato largo. Lo que quedó en blanco no genera fila. */
export function filasDeEncuesta(encuesta: EncuestaBuzon1, id_respuesta: string, fecha: string): FilaRespuesta[] {
  const base = {
    id_respuesta,
    instrumento: 'buzon1' as const,
    momento: 'base' as const,
    fecha,
    area: encuesta.area,
    turno: encuesta.turno,
    antiguedad_rango: encuesta.antiguedad_rango,
  };
  const filas: FilaRespuesta[] = [];

  for (const { id, dimension } of BUZON1_ESCALA) {
    const valor = encuesta.escala[id];
    if (!valor) continue;
    const noSe = valor === VALOR_NO_SE;
    filas.push({ ...base, pregunta_id: id, dimension, valor: noSe ? null : Number(valor), no_se: noSe });
  }
  for (const { id } of BUZON1_SELECCION) {
    for (const valor of encuesta.seleccion[id] ?? []) {
      filas.push({ ...base, pregunta_id: id, dimension: 'otra', valor, no_se: false });
    }
  }
  for (const { id } of BUZON1_ABIERTAS) {
    const valor = (encuesta.abiertas[id] ?? '').trim();
    if (valor) filas.push({ ...base, pregunta_id: id, dimension: 'otra', valor, no_se: false });
  }
  return filas;
}
