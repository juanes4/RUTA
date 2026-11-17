/** Lector de CSV sin dependencias: comillas, saltos de línea dentro de comillas, coma o punto y coma. */

export interface TablaCsv {
  columnas: string[];
  /** Cada fila con su número de línea en el archivo (la cabecera es la 1). */
  filas: { numero: number; valores: Record<string, string> }[];
}

function detectarSeparador(primeraLinea: string): ',' | ';' {
  return (primeraLinea.match(/;/g)?.length ?? 0) > (primeraLinea.match(/,/g)?.length ?? 0) ? ';' : ',';
}

function partirRegistros(texto: string, separador: string): { numero: number; campos: string[] }[] {
  const registros: { numero: number; campos: string[] }[] = [];
  let campos: string[] = [];
  let campo = '';
  let enComillas = false;
  let linea = 1;
  let inicioRegistro = 1;

  const cerrarRegistro = () => {
    campos.push(campo);
    if (campos.some((c) => c.trim() !== '')) registros.push({ numero: inicioRegistro, campos });
    campos = [];
    campo = '';
  };

  for (let i = 0; i < texto.length; i += 1) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        campo += '"';
        i += 1;
      } else if (c === '"') {
        enComillas = false;
      } else {
        if (c === '\n') linea += 1;
        campo += c;
      }
    } else if (c === '"') {
      enComillas = true;
    } else if (c === separador) {
      campos.push(campo);
      campo = '';
    } else if (c === '\n') {
      cerrarRegistro();
      linea += 1;
      inicioRegistro = linea;
    } else if (c !== '\r') {
      campo += c;
    }
  }
  cerrarRegistro();
  return registros;
}

export function leerCsv(texto: string): TablaCsv {
  const limpio = texto.replace(/^﻿/, '');
  const registros = partirRegistros(limpio, detectarSeparador(limpio.split('\n', 1)[0] ?? ''));
  const [cabecera, ...resto] = registros;
  if (!cabecera) return { columnas: [], filas: [] };
  const columnas = cabecera.campos.map((c) => c.trim());
  return {
    columnas,
    filas: resto.map(({ numero, campos }) => ({
      numero,
      valores: Object.fromEntries(columnas.map((c, i) => [c, (campos[i] ?? '').trim()])),
    })),
  };
}
