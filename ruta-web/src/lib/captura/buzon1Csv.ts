import { COLUMNAS_PERSONALES, GRUPOS_BUZON1, PREGUNTAS_BUZON1, SIN_GRUPO, type CampoBuzon1 } from '../../config/formularios/buzon1';
import { leerCsv } from '../csv/leerCsv';
import type { RespuestaBuzon1 } from '../modelo/tipos';

/**
 * R5. Carga del buzón 1 desde un CSV de Google Forms. La columna de área
 * empieza con "Área", la de grupo (opcional) con "Grupo" y cada pregunta con
 * su código (P1, P2, P3). También acepta la tabla del copiloto
 * (id, fecha, area, grupo, p1, p2, p3). Si alguna línea tiene un error no se carga nada.
 */

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const empiezaCon = (columna: string, prefijo: string) => {
  const c = normalizar(columna);
  const p = normalizar(prefijo);
  return c === p || (c.startsWith(p) && !/[a-z0-9]/.test(c.charAt(p.length)));
};

/** Cabecera de la plantilla: la misma que reconoce el importador. El grupo es opcional. */
export const COLUMNAS_PLANTILLA: readonly string[] = ['Área', 'Grupo', ...PREGUNTAS_BUZON1.map((p) => `${p.codigo}. ${p.texto}`)];

/** Identificador estable de una fila: volver a cargar el mismo archivo no duplica respuestas. */
function idDeFila(valores: Record<string, string>): string {
  const texto = Object.values(valores).join('␟');
  let hash = 0;
  for (let i = 0; i < texto.length; i += 1) hash = (Math.imul(31, hash) + texto.charCodeAt(i)) | 0;
  return `csv-${(hash >>> 0).toString(36)}-${texto.length}`;
}

export interface ResultadoImportacion {
  filas: RespuestaBuzon1[];
  errores: string[];
  /** Columnas que el formulario no debería recolectar (correo, nombre, hora…). Se ignoran. */
  avisos: string[];
}

/** El grupo se escribe como en la lista; lo que no coincide queda "Sin grupo". */
function grupoDe(valor: string): string {
  const v = normalizar(valor);
  return GRUPOS_BUZON1.find((g) => normalizar(g) === v) ?? SIN_GRUPO;
}

function columnasPersonales(columnas: readonly string[]): string[] {
  return columnas.filter((c) => {
    if (/^p[123]\b/i.test(c.trim())) return false; // las preguntas nunca cuentan, aunque digan "ahora"
    const n = ` ${normalizar(c).replace(/[^a-z0-9-]+/g, ' ')} `;
    return COLUMNAS_PERSONALES.some((p) => n.includes(` ${p} `));
  });
}

export function importarBuzon1(texto: string, areas: readonly string[], fecha: string): ResultadoImportacion {
  const { columnas, filas } = leerCsv(texto);
  const columnaArea = columnas.find((c) => empiezaCon(c, 'Área'));
  const columnaGrupo = columnas.find((c) => empiezaCon(c, 'Grupo'));
  const personales = columnasPersonales(columnas);
  const avisos =
    personales.length > 0
      ? [`El formulario está recolectando ${personales.map((c) => `"${c}"`).join(', ')}. Esas columnas no se cargan; desactívalas en Google Forms para proteger el anonimato.`]
      : [];
  const columnaDe = Object.fromEntries(PREGUNTAS_BUZON1.map((p) => [p.campo, columnas.find((c) => empiezaCon(c, p.codigo))])) as Record<
    CampoBuzon1,
    string | undefined
  >;

  const errores: string[] = [];
  if (!columnaArea) errores.push('Falta la columna "Área".');
  for (const p of PREGUNTAS_BUZON1) {
    if (!columnaDe[p.campo]) errores.push(`Falta la columna de la pregunta ${p.codigo} (su título debe empezar con "${p.codigo}").`);
  }
  if (errores.length > 0 || !columnaArea) return { filas: [], errores, avisos };

  const areaRegistrada = new Map(areas.map((a) => [normalizar(a), a]));
  const resultado: RespuestaBuzon1[] = [];
  for (const { numero, valores } of filas) {
    const respuestas = Object.fromEntries(PREGUNTAS_BUZON1.map((p) => [p.campo, valores[columnaDe[p.campo] ?? ''] ?? ''])) as Record<CampoBuzon1, string>;
    if (Object.values(respuestas).every((r) => r === '')) continue;
    const area = areaRegistrada.get(normalizar(valores[columnaArea] ?? ''));
    if (!area) {
      errores.push(`Línea ${numero}: el área "${valores[columnaArea] ?? ''}" no está registrada en la Etapa 0.`);
      continue;
    }
    const grupo = columnaGrupo ? grupoDe(valores[columnaGrupo] ?? '') : SIN_GRUPO;
    resultado.push({ id: idDeFila(valores), fecha, area, grupo, ...respuestas });
  }
  return errores.length > 0 ? { filas: [], errores, avisos } : { filas: resultado, errores: [], avisos };
}

/** Agrega las filas nuevas sin repetir las que ya estaban (mismo id). */
export function fusionarBuzon1(actuales: readonly RespuestaBuzon1[], nuevas: readonly RespuestaBuzon1[]): RespuestaBuzon1[] {
  const ids = new Set(actuales.map((r) => r.id));
  return [...actuales, ...nuevas.filter((r) => !ids.has(r.id))];
}
