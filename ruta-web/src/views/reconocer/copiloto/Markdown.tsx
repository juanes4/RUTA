import { Fragment, type ReactNode } from 'react';
import estilos from './copiloto.module.css';

/**
 * Markdown mínimo para los mensajes del copiloto y el dossier: títulos,
 * párrafos, listas, tablas, citas, **negrita** y _cursiva_. Arma elementos de
 * React (nunca HTML crudo), así un texto del modelo no puede inyectar nada.
 */

function enLinea(texto: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const patron = /\*\*([^*]+)\*\*|(?<![\p{L}\d])_([^_]+)_(?![\p{L}\d])|`([^`]+)`/gu;
  let ultimo = 0;
  let i = 0;
  for (const m of texto.matchAll(patron)) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    if (m[1] !== undefined) partes.push(<strong key={i++}>{m[1]}</strong>);
    else if (m[2] !== undefined) partes.push(<em key={i++}>{m[2]}</em>);
    else partes.push(<code key={i++}>{m[3]}</code>);
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

const celdas = (linea: string) =>
  linea
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

export function Markdown({ texto }: { texto: string }) {
  const lineas = texto.replace(/\r/g, '').split('\n');
  const bloques: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lineas.length) {
    const linea = lineas[i] ?? '';
    if (!linea.trim()) {
      i += 1;
      continue;
    }
    const titulo = linea.match(/^(#{1,4})\s+(.*)$/);
    if (titulo) {
      const nivel = Math.min(titulo[1]!.length + 2, 6);
      const Etiqueta = `h${nivel}` as 'h3';
      bloques.push(<Etiqueta key={k++} className={estilos.mdTitulo}>{enLinea(titulo[2]!)}</Etiqueta>);
      i += 1;
      continue;
    }
    if (linea.trim().startsWith('|')) {
      const filas: string[] = [];
      while (i < lineas.length && (lineas[i] ?? '').trim().startsWith('|')) filas.push(lineas[i++]!);
      const [cabecera, ...resto] = filas;
      const cuerpo = resto.filter((f) => !/^\s*\|?\s*:?-{2,}/.test(f));
      bloques.push(
        <div key={k++} className={estilos.mdTablaCaja}>
          <table className={estilos.mdTabla}>
            <thead>
              <tr>
                {celdas(cabecera ?? '').map((c, j) => (
                  <th key={j} scope="col">
                    {enLinea(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cuerpo.map((f, j) => (
                <tr key={j}>
                  {celdas(f).map((c, m) => (
                    <td key={m}>{enLinea(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(linea)) {
      const ordenada = /^\s*\d+\./.test(linea);
      const items: string[] = [];
      while (i < lineas.length && /^\s*([-*]|\d+\.)\s+/.test(lineas[i] ?? '')) items.push((lineas[i++] ?? '').replace(/^\s*([-*]|\d+\.)\s+/, ''));
      const Lista = ordenada ? 'ol' : 'ul';
      bloques.push(
        <Lista key={k++} className={estilos.mdLista}>
          {items.map((t, j) => (
            <li key={j}>{enLinea(t)}</li>
          ))}
        </Lista>,
      );
      continue;
    }
    if (linea.startsWith('>')) {
      const citas: string[] = [];
      while (i < lineas.length && (lineas[i] ?? '').startsWith('>')) citas.push((lineas[i++] ?? '').replace(/^>\s?/, ''));
      bloques.push(
        <blockquote key={k++} className={estilos.mdCita}>
          {citas.map((c, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {enLinea(c)}
            </Fragment>
          ))}
        </blockquote>,
      );
      continue;
    }
    const parrafo: string[] = [];
    while (i < lineas.length && (lineas[i] ?? '').trim() && !/^(#{1,4}\s|\||>|\s*([-*]|\d+\.)\s)/.test(lineas[i] ?? '')) parrafo.push(lineas[i++]!);
    bloques.push(
      <p key={k++}>
        {parrafo.map((t, j) => (
          <Fragment key={j}>
            {j > 0 && <br />}
            {enLinea(t)}
          </Fragment>
        ))}
      </p>,
    );
  }
  return <div className={estilos.markdown}>{bloques}</div>;
}
