import type { FichaPaso as DatosFicha } from '../../contenido/pasos';
import estilos from './FichaPaso.module.css';

interface Props {
  ficha: DatosFicha;
}

/** Ficha de un paso de taller o papel: la herramienta lo explica, no lo calcula (PLAN §4). */
export function FichaPaso({ ficha }: Props) {
  const datos = [
    ['Con quién', ficha.conQuien],
    ['Tiempo', ficha.tiempo],
    ['Formato', ficha.formato],
  ].filter((par): par is [string, string] => Boolean(par[1]));

  return (
    <>
      <p className={estilos.queSeHace}>{ficha.queSeHace}</p>
      {datos.length > 0 && (
        <dl className={estilos.datos}>
          {datos.map(([termino, valor]) => (
            <div key={termino}>
              <dt>{termino}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className={estilos.detalle}>{ficha.detalle}</p>
    </>
  );
}
