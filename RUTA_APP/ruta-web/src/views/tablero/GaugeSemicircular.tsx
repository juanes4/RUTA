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

const LONGITUD_ARCO = Math.PI * 35; // ~109.96

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
 * Medidor semicircular (Arc meter) con pista inferior y pin indicador.
 * Inspirado en la tercera tarjeta de la fila superior de la referencia visual.
 * Sin emojis.
 */
export function GaugeSemicircular({ fila, colorEtapa, icono }: Props) {
  const { meta, valor, motivo, estado } = fila;
  const colorProgreso = obtenerColorProgreso(estado);

  const fraccion = valor === null ? 0 : Math.min(Math.max(valor, 0), 1);
  const offset = LONGITUD_ARCO * (1 - fraccion);

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
        <div className={estilos.contenedorSvgSemi}>
          <svg className={estilos.svgSemi} viewBox="0 0 100 75" aria-hidden="true">
            {/* Arco de fondo */}
            <path className={estilos.arcoFondo} d="M 15 70 A 35 35 0 0 1 85 70" />
            {/* Arco de progreso */}
            {valor !== null && (
              <path
                className={estilos.arcoProgreso}
                d="M 15 70 A 35 35 0 0 1 85 70"
                strokeDasharray={LONGITUD_ARCO}
                strokeDashoffset={offset}
              />
            )}
          </svg>
          <div className={estilos.centroSvgSemi}>
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
