import type { TablaCsv } from '../csv/leerCsv';
import type { CatalogoPreguntas, ContextoImportacion, FilaCruda } from './respuestasCsv';

/**
 * Convierte el archivo de Google Forms (una fila por persona, una columna
 * por pregunta) en filas de formato largo, que valida `respuestasCsv`.
 * Cada columna se empareja por el código con el que empieza su título ("C1.").
 * Las columnas sin código no se leen: un correo recogido por el formulario
 * nunca entra a la herramienta.
 */

/** Permite que los errores nombren la pregunta por su código y no por su id interno. */
export const CLAVE_CODIGO = 'codigo_forms';

const normalizar = (texto: string) => texto.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();
const codigoDe = (columna: string) => columna.match(/^([A-Za-z]\d+)\s*\./)?.[1]?.toUpperCase() ?? null;
const canonico = (texto: string, permitidos: readonly string[]) => permitidos.find((p) => normalizar(p) === normalizar(texto)) ?? texto;

const buscarColumna = (columnas: readonly string[], inicios: readonly string[]) => columnas.find((c) => inicios.some((i) => normalizar(c).startsWith(i)));

export function esArchivoForms(columnas: readonly string[], catalogo: CatalogoPreguntas): boolean {
  return columnas.some((c) => {
    const codigo = codigoDe(c);
    return codigo !== null && catalogo.codigos.has(codigo);
  });
}

/** "9/11/2026 10:30:15" → "2026-11-09". En inglés, Sheets escribe primero el mes. Solo se guarda el día. */
function fechaDeMarca(marca: string, mesPrimero: boolean): string | null {
  const iso = marca.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  const local = marca.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const partes = iso ? { anio: iso[1], mes: iso[2], dia: iso[3] } : local && { anio: local[3], mes: local[mesPrimero ? 1 : 2], dia: local[mesPrimero ? 2 : 1] };
  if (!partes) return null;
  const [mes, dia] = [Number(partes.mes), Number(partes.dia)];
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return `${partes.anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** FNV-1a: un id estable por persona para que volver a cargar el archivo no duplique. */
function resumen(texto: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

interface ColumnaPregunta {
  codigo: string;
  id: string;
  columna: string;
}

function columnasDePreguntas(columnas: readonly string[], catalogo: CatalogoPreguntas): { preguntas: ColumnaPregunta[]; errores: string[] } {
  const preguntas: ColumnaPregunta[] = [];
  const errores: string[] = [];
  for (const columna of columnas) {
    const codigo = codigoDe(columna);
    const id = codigo && catalogo.codigos.get(codigo);
    if (!codigo || !id) continue;
    if (preguntas.some((p) => p.codigo === codigo)) errores.push(`El código ${codigo} está en más de una columna.`);
    else preguntas.push({ codigo, id, columna });
  }
  const faltan = [...catalogo.codigos.keys()].filter((c) => !preguntas.some((p) => p.codigo === c));
  if (faltan.length > 0) errores.push(`Faltan las preguntas ${faltan.join(', ')}. Cada título debe empezar con su código, por ejemplo "${faltan[0]}. …".`);
  return { preguntas, errores };
}

export function filasDeForms({ columnas, filas }: TablaCsv, contexto: ContextoImportacion): { filas: FilaCruda[]; errores: string[] } {
  const { catalogo, areas } = contexto;
  const { preguntas, errores } = columnasDePreguntas(columnas, catalogo);
  const columnaMarca = buscarColumna(columnas, ['marca temporal', 'marca de tiempo', 'timestamp']);
  const columnaArea = buscarColumna(columnas, ['area']);
  const columnaTurno = buscarColumna(columnas, ['turno']);
  const columnaAntiguedad = buscarColumna(columnas, ['antiguedad']);
  if (!columnaMarca) errores.push('Falta la columna "Marca temporal" de Google Forms.');
  if (!columnaArea) errores.push('Falta la columna cuyo título empieza por "Área".');
  if (!columnaMarca || !columnaArea || errores.length > 0) return { filas: [], errores };

  const mesPrimero = normalizar(columnaMarca).startsWith('timestamp');
  const vistos = new Map<string, number>();
  const largas: FilaCruda[] = [];

  for (const { numero, valores } of filas) {
    const marca = valores[columnaMarca] ?? '';
    const fecha = fechaDeMarca(marca, mesPrimero);
    if (!fecha) {
      errores.push(`Línea ${numero}: la marca temporal "${marca}" no se entiende.`);
      continue;
    }
    const firma = resumen([marca, ...preguntas.map((p) => valores[p.columna] ?? '')].join('\u0000'));
    const repeticion = vistos.get(firma) ?? 0;
    vistos.set(firma, repeticion + 1);

    const base = {
      id_respuesta: `gf_${firma}_${repeticion}`,
      instrumento: catalogo.instrumento,
      momento: 'base',
      fecha,
      area: canonico(valores[columnaArea] ?? '', areas),
      turno: columnaTurno ? (valores[columnaTurno] ?? '') : '',
      antiguedad_rango: columnaAntiguedad ? (valores[columnaAntiguedad] ?? '') : '',
      no_se: '',
    };

    for (const { codigo, id, columna } of preguntas) {
      const celda = valores[columna] ?? '';
      if (celda === '') continue; // Lo que quedó en blanco no genera fila, igual que en papel.
      const pregunta = { ...base, pregunta_id: id, [CLAVE_CODIGO]: codigo };
      const opciones = catalogo.seleccion.get(id);
      if (!opciones) {
        largas.push({ numero, valores: { ...pregunta, dimension: catalogo.escala.get(id) ?? 'otra', valor: celda } });
        continue;
      }
      // Google Sheets separa las opciones marcadas con coma; la descarga directa de Forms, con punto y coma.
      const elegidas = celda.split(/[,;]/).map((o) => o.trim()).filter(Boolean);
      const maximo = catalogo.maximos.get(id);
      if (maximo !== undefined && elegidas.length > maximo) errores.push(`Línea ${numero}: ${codigo} admite máximo ${maximo} opciones.`);
      for (const elegida of elegidas) largas.push({ numero, valores: { ...pregunta, dimension: 'otra', valor: canonico(elegida, opciones) } });
    }
  }
  return { filas: largas, errores };
}
