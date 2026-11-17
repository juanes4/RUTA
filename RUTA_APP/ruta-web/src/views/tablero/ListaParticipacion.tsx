import type { CSSProperties } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { pastelPorIndice } from '../../config/paleta';
import type { ParticipacionArea } from '../../lib/calculo/participacion';
import { formatearValor } from '../../lib/formato';
import estilos from './Tablero.module.css';

/** Participación por área: personas que respondieron el buzón 1 ÷ afectados (Etapa 0). */
export function ListaParticipacion({ areas }: { areas: readonly ParticipacionArea[] }) {
  return (
    <section aria-labelledby="titulo-participacion" className={estilos.bloque}>
      <h2 id="titulo-participacion" className={estilos.tituloBloque}>
        Participación por área
      </h2>
      {areas.length === 0 ? (
        <EstadoVacio titulo="Sin áreas registradas">Registra las áreas y sus afectados en la Etapa 0.</EstadoVacio>
      ) : (
        <ul className={estilos.listaAreas}>
          {areas.map((a, indice) => (
            <li key={a.area}>
              <div>
                <p className={estilos.nombreArea}>{a.area}</p>
                <p className={`${estilos.detalle} numero`}>
                  {a.respondentes} de {a.afectados} afectados
                </p>
              </div>
              <span
                className={`${estilos.porcentaje} numero`}
                style={{ '--fondo-porcentaje': pastelPorIndice(indice) } as CSSProperties}
              >
                {a.participacion === null ? '—' : formatearValor(a.participacion, 'porcentaje')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
