import type { CSSProperties } from 'react';
import type { CategoriaTablero } from '../../config/tablero';
import estilos from './Tablero.module.css';

/** Las 3 categorías del tablero con sus indicadores de ejemplo del documento. */
export function TarjetasCategoria({ categorias }: { categorias: readonly CategoriaTablero[] }) {
  return (
    <section aria-labelledby="titulo-categorias" className={estilos.bloque}>
      <h2 id="titulo-categorias" className={estilos.tituloBloque}>
        Categorías
      </h2>
      <ul className={estilos.categorias}>
        {categorias.map((c) => (
          <li key={c.id} className={estilos.categoria} style={{ '--fondo-categoria': c.colorFondo } as CSSProperties}>
            <h3 className={estilos.nombreCategoria}>{c.nombre}</h3>
            <ul className={estilos.ejemplos}>
              {c.indicadores.map((i) => (
                <li key={i.nombre}>
                  <p className={estilos.nombreArea}>{i.nombre}</p>
                  <p className={estilos.detalle}>{i.queSeMide}</p>
                </li>
              ))}
            </ul>
            <p className={estilos.pieCategoria}>Indicadores de ejemplo · sin fórmula asignada</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
