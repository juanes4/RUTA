import { useState, type CSSProperties } from 'react';
import { Semaforo } from '../../components/ui/Semaforo';
import { ETAPAS } from '../../config/etapas';
import type { ParticipacionArea } from '../../lib/calculo/participacion';
import { formatearValor } from '../../lib/formato';
import type { FilaRespuesta, FilaUso } from '../../lib/modelo/tipos';
import type { FilaIndicador } from '../../lib/tablero/construirTablero';
import { DashboardIndicadores } from './DashboardIndicadores';
import { IconoVistaDashboard, IconoVistaTabla } from './IconosTablero';
import estilosTablero from './Tablero.module.css';
import estilosVis from './VisualizacionesTablero.module.css';

interface Props {
  filas: readonly FilaIndicador[];
  participacion?: readonly ParticipacionArea[];
  uso?: readonly FilaUso[];
  respuestas?: readonly FilaRespuesta[];
}

/** El cuadro de cada indicador lleva el pastel de su etapa. */
function colorDeEtapa(letra: string): string {
  return ETAPAS.find((e) => e.letra === letra)?.color ?? 'var(--bg-soft)';
}

/**
 * Sección de indicadores (KPIs):
 * Ofrece por defecto una vista visual creativa inspirada en dashboard de métricas,
 * y permite alternar a la tabla técnica detallada.
 * Sin emojis.
 */
export function TablaIndicadores({
  filas,
  participacion = [],
  uso = [],
  respuestas = [],
}: Props) {
  const [modo, setModo] = useState<'dashboard' | 'tabla'>('dashboard');

  return (
    <section aria-labelledby="titulo-indicadores" className={estilosTablero.bloque}>
      <div className={estilosVis.barraSuperior}>
        <div className={estilosVis.tituloGrupo}>
          <h2 id="titulo-indicadores" className={estilosVis.tituloSeccion}>
            Indicadores de gestión (KPIs)
          </h2>
          <span className={estilosVis.insigniaConteo}>
            {filas.length} indicadores
          </span>
        </div>

        {/* Conmutador de vista tipo píldora */}
        <div className={estilosVis.conmutadorVista} role="group" aria-label="Modo de visualización">
          <button
            type="button"
            className={`${estilosVis.botonVista} ${modo === 'dashboard' ? estilosVis.botonVistaActivo : ''}`}
            onClick={() => setModo('dashboard')}
            aria-pressed={modo === 'dashboard'}
          >
            <IconoVistaDashboard />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`${estilosVis.botonVista} ${modo === 'tabla' ? estilosVis.botonVistaActivo : ''}`}
            onClick={() => setModo('tabla')}
            aria-pressed={modo === 'tabla'}
          >
            <IconoVistaTabla />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {modo === 'dashboard' ? (
        <DashboardIndicadores
          filas={filas}
          participacion={participacion}
          uso={uso}
          respuestas={respuestas}
        />
      ) : (
        <table className={estilosTablero.tabla}>
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
                  <div className={estilosTablero.celdaIndicador}>
                    <span
                      className={estilosTablero.cuadroEtapa}
                      style={{ '--fondo-etapa': colorDeEtapa(meta.etapa) } as CSSProperties}
                      title={`Etapa ${meta.etapa}`}
                    >
                      {meta.etapa}
                    </span>
                    <div>
                      <p className={estilosTablero.nombreArea}>{meta.nombre}</p>
                      <p className={estilosTablero.detalle}>{meta.fuenteDato}</p>
                    </div>
                  </div>
                </th>
                <td className={`${estilosTablero.valor} numero`}>
                  {valor === null ? '—' : formatearValor(valor, meta.unidad)}
                </td>
                <td className={`${estilosTablero.detalle} numero`}>
                  {meta.sentido === 'menor_mejor' ? '≤ ' : '≥ '}
                  {formatearValor(meta.meta, meta.unidad)}
                </td>
                <td>{estado ? <Semaforo estado={estado} /> : <span className={estilosTablero.detalle}>{motivo}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
