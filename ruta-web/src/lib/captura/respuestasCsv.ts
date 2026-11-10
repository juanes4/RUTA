import { leerCsv, type TablaCsv } from '../csv/leerCsv';
import type { FilaRespuesta, Instrumento, Momento } from '../modelo/tipos';
import { CLAVE_CODIGO, esArchivoForms, filasDeForms } from './respuestasForms';

/**
 * Carga de la tabla `respuestas` desde CSV (CONTEXTO §12.5). El archivo se
 * acepta completo o no se acepta: una carga parcial daría indicadores falsos.
 */

/** Columnas de la tabla `respuestas` (CONTEXTO §7) más `no_se` (§5). */
export const COLUMNAS_RESPUESTAS = [
  'id_respuesta',
  'instrumento',
  'momento',
  'fecha',
  'area',
  'turno',
  'antiguedad_rango',
  'pregunta_id',
  'dimension',
  'valor',
  'no_se',
] as const;

/** Qué preguntas admite un instrumento y cómo se valida cada una. */
export interface CatalogoPreguntas {
  instrumento: Instrumento;
  escala: ReadonlyMap<string, FilaRespuesta['dimension']>;
  seleccion: ReadonlyMap<string, readonly string[]>;
  abiertas: ReadonlySet<string>;
  /** Código de la pregunta en Google Forms ("C1") → `pregunta_id`. */
  codigos: ReadonlyMap<string, string>;
  /** Cuántas opciones admite cada pregunta de selección. */
  maximos: ReadonlyMap<string, number>;
}

export interface ContextoImportacion {
  catalogo: CatalogoPreguntas;
  areas: readonly string[];
  escala: { minimo: number; maximo: number };
}

export interface ResultadoImportacion {
  filas: FilaRespuesta[];
  errores: string[];
}

export type FilaCruda = TablaCsv['filas'][number];

type ValorLeido = Pick<FilaRespuesta, 'valor' | 'no_se' | 'dimension'>;

const DIMENSION_NO_ESCALA: FilaRespuesta['dimension'] = 'otra';
const esVerdadero = (v: string) => ['true', '1', 'si', 'sí'].includes(v.toLowerCase());
const esNoSe = (v: string) => ['ns', 'no sé', 'no se'].includes(v.toLowerCase());
const esMomento = (v: string): v is Momento => /^(base|ciclo_\d+|dia30|dia60|dia90)$/.test(v);

/** Devuelve el valor ya interpretado o el texto del error. */
function leerValor(crudo: Record<string, string>, { catalogo, escala }: ContextoImportacion): ValorLeido | string {
  const pregunta = crudo.pregunta_id ?? '';
  const texto = crudo.valor ?? '';
  const nombre = crudo[CLAVE_CODIGO] ?? pregunta;

  const dimension = catalogo.escala.get(pregunta);
  if (dimension !== undefined) {
    if (crudo.dimension !== dimension) {
      return `la pregunta ${pregunta} es de la dimensión ${dimension}, no ${crudo.dimension || '(vacía)'}`;
    }
    if (esVerdadero(crudo.no_se ?? '') || esNoSe(texto)) return { valor: null, no_se: true, dimension };
    const numero = Number(texto);
    if (texto === '' || !Number.isInteger(numero) || numero < escala.minimo || numero > escala.maximo) {
      return `${nombre}: el valor "${texto}" no es válido, usa ${escala.minimo} a ${escala.maximo} o NS`;
    }
    return { valor: numero, no_se: false, dimension };
  }

  const opciones = catalogo.seleccion.get(pregunta);
  if (opciones) {
    if (!opciones.includes(texto)) return `"${texto}" no es una opción de ${nombre}`;
    return { valor: texto, no_se: false, dimension: DIMENSION_NO_ESCALA };
  }

  if (catalogo.abiertas.has(pregunta)) return { valor: texto, no_se: false, dimension: DIMENSION_NO_ESCALA };
  return `la pregunta "${pregunta}" no existe en este formulario`;
}

/** Valida una fila completa. Devuelve la fila o el texto del error. */
function leerFila(valores: Record<string, string>, contexto: ContextoImportacion): FilaRespuesta | string {
  const { id_respuesta = '', instrumento = '', momento = '', fecha = '', area = '' } = valores;
  const { turno = '', antiguedad_rango = '', pregunta_id = '' } = valores;

  if (!id_respuesta) return 'falta id_respuesta';
  if (instrumento !== contexto.catalogo.instrumento) return `el instrumento debe ser ${contexto.catalogo.instrumento}`;
  if (!esMomento(momento)) return `el momento "${momento}" no es válido`;
  if (!fecha) return 'falta la fecha';
  if (!contexto.areas.includes(area)) return `el área "${area}" no está registrada en la Etapa 0`;

  const valor = leerValor(valores, contexto);
  if (typeof valor === 'string') return valor;
  return { id_respuesta, instrumento: contexto.catalogo.instrumento, momento, fecha, area, turno, antiguedad_rango, pregunta_id, ...valor };
}

/** Valida filas en formato largo; un solo error descarta todo. */
function validarFilas(filas: readonly FilaCruda[], contexto: ContextoImportacion, erroresPrevios: readonly string[] = []): ResultadoImportacion {
  const errores = new Set(erroresPrevios);
  const resultado: FilaRespuesta[] = [];
  for (const { numero, valores } of filas) {
    const fila = leerFila(valores, contexto);
    if (typeof fila === 'string') errores.add(`Línea ${numero}: ${fila}.`);
    else resultado.push(fila);
  }
  return errores.size > 0 ? { filas: [], errores: [...errores] } : { filas: resultado, errores: [] };
}

/** Acepta la plantilla de la tabla `respuestas` o el archivo de Google Forms, una columna por pregunta. */
export function importarRespuestas(texto: string, contexto: ContextoImportacion): ResultadoImportacion {
  const tabla = leerCsv(texto);
  const faltantes = COLUMNAS_RESPUESTAS.filter((c) => !tabla.columnas.includes(c));

  if (faltantes.length > 0 && !esArchivoForms(tabla.columnas, contexto.catalogo)) {
    return { filas: [], errores: [`Faltan columnas: ${faltantes.join(', ')}.`] };
  }
  if (tabla.filas.length === 0) return { filas: [], errores: ['El archivo no tiene filas de datos.'] };
  if (faltantes.length === 0) return validarFilas(tabla.filas, contexto);

  const { filas, errores } = filasDeForms(tabla, contexto);
  return validarFilas(filas, contexto, errores);
}

/** Une sin duplicar: si un id_respuesta ya existía, sus filas se reemplazan por las del archivo. */
export function fusionarRespuestas(existentes: readonly FilaRespuesta[], nuevas: readonly FilaRespuesta[]): FilaRespuesta[] {
  const ids = new Set(nuevas.map((f) => f.id_respuesta));
  return [...existentes.filter((f) => !ids.has(f.id_respuesta)), ...nuevas];
}
