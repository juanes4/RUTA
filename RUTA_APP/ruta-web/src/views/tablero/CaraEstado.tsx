import type { CategoriaExperiencia } from '../../lib/tablero/mapaColaborador';

interface Props {
  categoria: CategoriaExperiencia;
  tamaño?: number;
}

/**
 * Icono de cara vectorial SVG estilizado para representar el estado de experiencia del colaborador.
 * No es un emoji de texto; es un glifo gráfico de trazo limpio.
 * - Promotor (A): Cara sonriente verde
 * - En adaptación (B): Cara neutral amarilla
 * - Riesgo (C): Cara de alerta/preocupación roja
 * - Pendiente: Cara en gris punteado
 */
export function CaraEstado({ categoria, tamaño = 36 }: Props) {
  let fondo = 'var(--positive)';
  let colorTrazo = '#FFFFFF';
  let borde = 'none';

  if (categoria === 'adaptacion') {
    fondo = '#F59E0B'; // Ámbar accesible
    colorTrazo = '#111111';
  } else if (categoria === 'riesgo') {
    fondo = 'var(--negative)';
    colorTrazo = '#FFFFFF';
  } else if (categoria === 'pendiente') {
    fondo = 'var(--bg-card)';
    colorTrazo = 'var(--text-muted)';
    borde = '2px dashed var(--border)';
  }

  return (
    <svg
      width={tamaño}
      height={tamaño}
      viewBox="0 0 38 38"
      fill="none"
      aria-hidden="true"
      style={{
        borderRadius: '50%',
        background: fondo,
        boxShadow: categoria !== 'pendiente' ? '0 3px 10px rgba(0,0,0,0.18)' : 'none',
        border: borde,
        display: 'block',
      }}
    >
      {/* Ojos */}
      <circle cx="13" cy="14" r="2.2" fill={colorTrazo} />
      <circle cx="25" cy="14" r="2.2" fill={colorTrazo} />

      {/* Boca según estado */}
      {categoria === 'promotor' && (
        <path
          d="M 12 21 Q 19 28 26 21"
          stroke={colorTrazo}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {(categoria === 'adaptacion' || categoria === 'pendiente') && (
        <line
          x1="13"
          y1="23"
          x2="25"
          y2="23"
          stroke={colorTrazo}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      )}

      {categoria === 'riesgo' && (
        <path
          d="M 12 25 Q 19 18 26 25"
          stroke={colorTrazo}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}
