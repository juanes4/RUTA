import type { CSSProperties } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { pastelPorIndice } from '../../config/paleta';
import type { ParticipacionArea } from '../../lib/calculo/participacion';
import { formatearPorcentaje } from '../../lib/formato';
import { useRuta } from '../../navegacion/RutaContexto';
import estilos from './Tablero.module.css';

/** Participación por área: personas que respondieron el buzón 1 ÷ afectados (Etapa 0). */
export function ListaParticipacion({ areas, total }: { areas: readonly ParticipacionArea[]; total: number | null }) {
  const { enlace } = useRuta();
  return (
    <section aria-labelledby="titulo-participacion" className={estilos.bloque}>
      <div className={estilos.encabezadoMini}>
        <h2 id="titulo-participacion" className={estilos.tituloBloque}>
          Escucha · buzón 1 (R5)
        </h2>
        <a className={estilos.enlaceMini} href={enlace({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: 'R5' })}>
          Abrir →
        </a>
      </div>
      {areas.length === 0 ? (
        <EstadoVacio titulo="Sin áreas registradas">Registra las áreas y sus afectados en la Etapa 0.</EstadoVacio>
      ) : (
        <>
          <p className={estilos.detalle}>
            Participación total: <strong className="numero">{total === null ? '—' : formatearPorcentaje(total)}</strong>
          </p>
          <ul className={estilos.listaAreas}>
            {areas.map((a, indice) => {
              const pctBarra = a.participacion === null ? 0 : Math.min(100, Math.round(a.participacion * 100));
              return (
                <li key={a.area} className={estilos.itemArea}>
                  <div className={estilos.filaArea}>
                    <div>
                      <p className={estilos.nombreArea}>{a.area}</p>
                      <p className={`${estilos.detalle} numero`}>
                        {a.respondentes} de {a.afectados} afectados
                      </p>
                    </div>
                    <span className={`${estilos.porcentaje} numero`} style={{ '--fondo-porcentaje': pastelPorIndice(indice) } as CSSProperties}>
                      {a.participacion === null ? '—' : formatearPorcentaje(a.participacion)}
                    </span>
                  </div>
                  <div className={estilos.pistaMini} aria-hidden="true">
                    <div className={estilos.rellenoMini} style={{ width: `${pctBarra}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
