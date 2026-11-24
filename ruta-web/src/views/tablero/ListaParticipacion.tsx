import type { CSSProperties } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { pastelPorIndice } from '../../config/paleta';
import type { ParticipacionArea } from '../../lib/calculo/participacion';
import { formatearPorcentaje } from '../../lib/formato';
import estilos from './Tablero.module.css';

/** Participación por área: personas que respondieron el buzón 1 ÷ afectados (Etapa 0). */
export function ListaParticipacion({ areas, total }: { areas: readonly ParticipacionArea[]; total: number | null }) {
  return (
    <section aria-labelledby="titulo-participacion" className={estilos.bloque}>
      <h2 id="titulo-participacion" className={estilos.tituloBloque}>
        Escucha · buzón 1 (R5)
      </h2>
      {areas.length === 0 ? (
        <EstadoVacio titulo="Sin áreas registradas">Registra las áreas y sus afectados en la Etapa 0.</EstadoVacio>
      ) : (
        <>
          <p className={estilos.detalle}>
            Participación total: <span className="numero">{total === null ? '—' : formatearPorcentaje(total)}</span>
          </p>
          <ul className={estilos.listaAreas}>
            {areas.map((a, indice) => (
              <li key={a.area}>
                <div>
                  <p className={estilos.nombreArea}>{a.area}</p>
                  <p className={`${estilos.detalle} numero`}>
                    {a.respondentes} de {a.afectados} afectados
                  </p>
                </div>
                <span className={`${estilos.porcentaje} numero`} style={{ '--fondo-porcentaje': pastelPorIndice(indice) } as CSSProperties}>
                  {a.participacion === null ? '—' : formatearPorcentaje(a.participacion)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
