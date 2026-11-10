import { METAS, type DefinicionMeta } from '../../config/metas';
import type { AreaAfectada, MetasAjustadas, Segmentacion } from '../modelo/proyecto';

/** Reglas puras de la Etapa 0: limpiar lo que se escribe y resolver metas. */

function limpiarLista(valores: readonly string[]): string[] {
  const vistos = new Set<string>();
  const resultado: string[] = [];
  for (const valor of valores) {
    const limpio = valor.trim();
    const clave = limpio.toLocaleLowerCase('es');
    if (limpio && !vistos.has(clave)) {
      vistos.add(clave);
      resultado.push(limpio);
    }
  }
  return resultado;
}

export interface ErrorValidacion {
  campo: string;
  mensaje: string;
}

export function validarAreas(areas: readonly AreaAfectada[]): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  const nombres = new Set<string>();
  areas.forEach(({ area, afectados }, i) => {
    const nombre = area.trim();
    const clave = nombre.toLocaleLowerCase('es');
    if (!nombre) errores.push({ campo: `area-${i}`, mensaje: `Fila ${i + 1}: falta el nombre del área.` });
    else if (nombres.has(clave)) errores.push({ campo: `area-${i}`, mensaje: `El área "${nombre}" está repetida.` });
    nombres.add(clave);
    if (!Number.isInteger(afectados) || afectados < 0) {
      errores.push({ campo: `afectados-${i}`, mensaje: `Fila ${i + 1}: el número de afectados debe ser un entero de 0 o más.` });
    }
  });
  return errores;
}

/** Quita espacios y repetidos en turnos y rangos; las áreas se validan antes con `validarAreas`. */
export function normalizarSegmentacion(segmentacion: Segmentacion): Segmentacion {
  return {
    areas: segmentacion.areas.map((a) => ({ area: a.area.trim(), afectados: a.afectados })),
    turnos: limpiarLista(segmentacion.turnos),
    rangos_antiguedad: limpiarLista(segmentacion.rangos_antiguedad),
  };
}

export interface MetaResuelta extends DefinicionMeta {
  valorPorDefecto: number;
  ajustada: boolean;
}

/** Meta vigente de cada indicador: la de la empresa si la cambió, si no la del documento. */
export function resolverMetas(ajustes: MetasAjustadas, metas: readonly DefinicionMeta[] = METAS): MetaResuelta[] {
  return metas.map((m) => {
    const ajuste = ajustes[m.id];
    const ajustada = ajuste !== undefined && ajuste !== m.meta;
    return { ...m, valorPorDefecto: m.meta, meta: ajustada ? ajuste : m.meta, ajustada };
  });
}

/** Guarda solo las metas que difieren del documento. */
export function ajustesDeMetas(valores: Record<string, number>, metas: readonly DefinicionMeta[] = METAS): MetasAjustadas {
  const ajustes: MetasAjustadas = {};
  for (const m of metas) {
    const valor = valores[m.id];
    if (valor !== undefined && Number.isFinite(valor) && valor !== m.meta) ajustes[m.id] = valor;
  }
  return ajustes;
}
