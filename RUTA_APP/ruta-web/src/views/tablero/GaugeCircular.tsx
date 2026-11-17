import type { CSSProperties, ReactNode } from 'react';
import { Semaforo } from '../../components/ui/Semaforo';
import { formatearValor } from '../../lib/formato';
import type { FilaIndicador } from '../../lib/tablero/construirTablero';
import estilos from './VisualizacionesTablero.module.css';

interface Props {
  fila: FilaIndicador;
  colorEtapa: string;
  icono: ReactNode;
}

const RADIO = 44;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

function obtenerColorProgreso(estado: FilaIndicador['estado']): string {
  switch (estado) {
    case 'en_meta':
      return 'var(--positive)';
    case 'atencion':
      return 'var(--text)';
    case 'intervenir':
      return 'var(--negative)';
    default:
      return 'var(--border)';
  }
}

/**
 * Medidor circular (Donut gauge) con pista de control inferior y pin indicador.
 * Inspirado en las tarjetas superiores de la referencia visual.
 * Sin emojis.
 */
export function GaugeCircular({ fila, colorEtapa, icono }: Props) {
  const { meta, valor, motivo, estado } = fila;
  const colorProgreso = obtenerColorProgreso(estado);

  const fraccion = valor === null ? 0 : Math.min(Math.max(valor, 0), 1);
  const offset = CIRCUNFERENCIA * (1 - fraccion);

  const porcentajeValor = Math.round(fraccion * 100);
  const porcentajeMeta = Math.round(Math.min(Math.max(meta.meta, 0), 1) * 100);

  return (
    <article
      className={estilos.tarjetaHero}
      style={
        {
          '--color-etapa': colorEtapa,
          '--color-progreso': colorProgreso,
        } as CSSProperties
      }
    >
      <header className={estilos.cabeceraHero}>
        <div className={estilos.infoHero}>
          <div className={estilos.etiquetaEtapa}>
            <span className={estilos.puntoEtapa} aria-hidden="true" />
            <span>Etapa {meta.etapa}</span>
          </div>
          <h3 className={estilos.tituloHero} title={meta.nombre}>
            {meta.nombre}
          </h3>
        </div>
        <div title={meta.nombre} style={{ color: 'var(--text-muted)' }}>
          {icono}
        </div>
      </header>

      <div className={estilos.cuerpoHeroGauge}>
        <div className={estilos.contenedorSvgGauge}>
          <svg className={estilos.svgGauge} viewBox="0 0 100 100" aria-hidden="true">
            {/* Pista de fondo */}
            <circle className={estilos.circuloFondo} cx="50" cy="50" r={RADIO} />
            {/* Arco de progreso */}
            {valor !== null && (
              <circle
                className={estilos.circuloProgreso}
                cx="50"
                cy="50"
                r={RADIO}
                strokeDasharray={CIRCUNFERENCIA}
                strokeDashoffset={offset}
              />
            )}
          </svg>
          <div className={estilos.centroSvgGauge}>
            <span className={`${estilos.valorHeroCentrado} numero`}>
              {valor === null ? '—' : formatearValor(valor, meta.unidad)}
            </span>
            <span className={estilos.subtextoHeroCentrado}>
              {estado ? <Semaforo estado={estado} /> : 'Sin dato'}
            </span>
          </div>
        </div>
      </div>

      <div className={estilos.pistaHeroContenedor}>
        <div className={estilos.pistaSlider} title={`Avance: ${porcentajeValor}%, Meta: ${porcentajeMeta}%`}>
          {valor !== null && (
            <div className={estilos.barraRelleno} style={{ width: `${porcentajeValor}%` }} />
          )}
          {valor !== null && (
            <div className={estilos.pinIndicador} style={{ left: `${porcentajeValor}%` }} />
          )}
          {/* Marca de meta en la pista */}
          <div
            className={estilos.marcaMetaPista}
            style={{ left: `${porcentajeMeta}%` }}
            title={`Meta: ${porcentajeMeta}%`}
          />
        </div>

        <div className={estilos.piePistaHero}>
          <span className={estilos.metaTexto}>
            Meta: {meta.sentido === 'menor_mejor' ? '≤ ' : '≥ '}
            {formatearValor(meta.meta, meta.unidad)}
          </span>
          <span className={estilos.detalle}>
            {valor !== null ? (meta.sentido === 'menor_mejor' ? `${porcentajeValor}% actual` : `${porcentajeValor}% alcanzado`) : motivo}
          </span>
        </div>
      </div>
    </article>
  );
}
