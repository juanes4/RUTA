import type { CSSProperties, ReactNode } from 'react';
import { Semaforo } from '../../components/ui/Semaforo';
import { formatearValor } from '../../lib/formato';
import type { FilaIndicador } from '../../lib/tablero/construirTablero';
import estilos from './VisualizacionesTablero.module.css';

interface Props {
  fila: FilaIndicador;
  icono: ReactNode;
}

function calcularPorcentajeProgreso(valor: number | null, unidad: FilaIndicador['meta']['unidad']): number {
  if (valor === null) return 0;
  if (unidad === 'escala_1_5') {
    return Math.round(Math.min(Math.max(valor / 5, 0), 1) * 100);
  }
  return Math.round(Math.min(Math.max(valor, 0), 1) * 100);
}

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

/** Tarjeta compacta para métricas secundarias en la fila intermedia. */
export function TarjetaMetricaSecundaria({ fila, icono }: Props) {
  const { meta, valor, motivo, estado } = fila;
  const porcentaje = calcularPorcentajeProgreso(valor, meta.unidad);
  const colorProgreso = obtenerColorProgreso(estado);

  return (
    <article
      className={estilos.tarjetaMetricaSecundaria}
      style={{ '--color-progreso': colorProgreso } as CSSProperties}
    >
      <header className={estilos.cabeceraMetricaSecundaria}>
        <div className={estilos.iconoYEtapa}>
          <span title={meta.nombre}>{icono}</span>
          <span className={estilos.etiquetaEtapa}>E.{meta.etapa}</span>
        </div>
        {estado ? <Semaforo estado={estado} /> : <span className={estilos.detalle}>Pendiente</span>}
      </header>

      <h4 className={estilos.nombreMetricaSecundaria} title={meta.nombre}>
        {meta.nombre}
      </h4>

      <p className={`${estilos.valorMetricaSecundaria} numero`}>
        {valor === null ? '—' : formatearValor(valor, meta.unidad)}
      </p>

      <div className={estilos.barraProgresoSutil} title={`Progreso: ${porcentaje}%`}>
        {valor !== null && (
          <div className={estilos.rellenoProgresoSutil} style={{ width: `${porcentaje}%` }} />
        )}
      </div>

      <footer className={estilos.detalleMetricaSecundaria}>
        <span>
          Meta: {meta.sentido === 'menor_mejor' ? '≤ ' : '≥ '}
          {formatearValor(meta.meta, meta.unidad)}
        </span>
        <span className={estilos.detalle}>{valor === null ? (motivo ? 'Faltan datos' : '—') : 'Registrado'}</span>
      </footer>
    </article>
  );
}
