import type { CSSProperties } from 'react';
import { Semaforo } from '../../components/ui/Semaforo';
import { ETAPAS } from '../../config/etapas';
import { formatearValor } from '../../lib/formato';
import type { FilaIndicador } from '../../lib/tablero/construirTablero';
import estilos from './Tablero.module.css';

/** El cuadro de cada indicador lleva el pastel de su etapa. */
function colorDeEtapa(letra: string): string {
  return ETAPAS.find((e) => e.letra === letra)?.color ?? 'var(--bg-soft)';
}

/** Tabla de indicadores: valor, meta y semáforo; si no hay valor, el motivo. */
export function TablaIndicadores({ filas }: { filas: readonly FilaIndicador[] }) {
  return (
    <section aria-labelledby="titulo-indicadores" className={estilos.bloque}>
      <h2 id="titulo-indicadores" className={estilos.tituloBloque}>
        Indicadores
      </h2>
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Indicador</th>
            <th scope="col">Valor</th>
            <th scope="col">Meta</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ meta, valor, motivo, estado }) => (
            <tr key={meta.id}>
              <th scope="row">
                <div className={estilos.celdaIndicador}>
                  <span
                    className={estilos.cuadroEtapa}
                    style={{ '--fondo-etapa': colorDeEtapa(meta.etapa) } as CSSProperties}
                    title={`Etapa ${meta.etapa}`}
                  >
                    {meta.etapa}
                  </span>
                  <div>
                    <p className={estilos.nombreArea}>{meta.nombre}</p>
                    <p className={estilos.detalle}>{meta.fuenteDato}</p>
                  </div>
                </div>
              </th>
              <td className={`${estilos.valor} numero`}>{valor === null ? '—' : formatearValor(valor, meta.unidad)}</td>
              <td className={`${estilos.detalle} numero`}>
                {meta.sentido === 'menor_mejor' ? '≤ ' : '≥ '}
                {formatearValor(meta.meta, meta.unidad)}
              </td>
              <td>{estado ? <Semaforo estado={estado} /> : <span className={estilos.detalle}>{motivo}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
