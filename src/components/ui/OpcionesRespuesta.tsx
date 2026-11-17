import { useId } from 'react';
import estilos from './OpcionesRespuesta.module.css';

export interface Opcion {
  valor: string;
  texto: string;
}

interface Base {
  etiqueta: string;
  opciones: readonly Opcion[];
  /** fila: opciones cortas (1 a 5). lista: frases largas, una por renglón. */
  disposicion?: 'fila' | 'lista';
}

interface PropsUnica extends Base {
  valor: string;
  alCambiar(valor: string): void;
}

/** Una sola respuesta, con botones que se ven enteros (no un menú), para digitar rápido. */
export function OpcionesRespuesta({ etiqueta, opciones, disposicion = 'fila', valor, alCambiar }: PropsUnica) {
  const nombre = useId();
  return (
    <fieldset className={estilos.grupo}>
      <legend className={estilos.leyenda}>{etiqueta}</legend>
      <div className={estilos.opciones} data-disposicion={disposicion}>
        {opciones.map((o) => (
          <label key={o.valor} className={estilos.opcion}>
            <input type="radio" name={nombre} checked={valor === o.valor} onChange={() => alCambiar(o.valor)} />
            <span>{o.texto}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface PropsMultiple extends Base {
  valores: readonly string[];
  maximo: number;
  alCambiar(valores: string[]): void;
}

/** Varias respuestas hasta un máximo; al llegar a él, las demás se desactivan. */
export function OpcionesMultiples({ etiqueta, opciones, disposicion = 'fila', valores, maximo, alCambiar }: PropsMultiple) {
  const alternar = (valor: string) =>
    alCambiar(valores.includes(valor) ? valores.filter((v) => v !== valor) : [...valores, valor]);
  return (
    <fieldset className={estilos.grupo}>
      <legend className={estilos.leyenda}>
        {etiqueta} <span className={estilos.maximo}>(máximo {maximo})</span>
      </legend>
      <div className={estilos.opciones} data-disposicion={disposicion}>
        {opciones.map((o) => {
          const marcada = valores.includes(o.valor);
          return (
            <label key={o.valor} className={estilos.opcion}>
              <input
                type="checkbox"
                checked={marcada}
                disabled={!marcada && valores.length >= maximo}
                onChange={() => alternar(o.valor)}
              />
              <span>{o.texto}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
