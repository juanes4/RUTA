import type { AreaAfectada, Segmentacion } from '../modelo/proyecto';

/** Reglas puras de la Etapa 0: validar y limpiar las áreas. */

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

/** Quita espacios en los nombres; las áreas se validan antes con `validarAreas`. */
export function normalizarSegmentacion(segmentacion: Segmentacion): Segmentacion {
  return { areas: segmentacion.areas.map((a) => ({ area: a.area.trim(), afectados: a.afectados })) };
}
