import { useId } from 'react';
import { FASES_VIAJE_CONFIG, REGLAS_CARITA, type EstadoCarita, type IdFaseViaje } from '../../config/analizar';
import { formatearPromedioViaje } from '../../lib/analizar/calculos';
import type { FaseResumenViaje } from '../../lib/api';
import estilos from './etapaA.module.css';

interface Props {
  fases: readonly FaseResumenViaje[];
  faseActiva: IdFaseViaje;
  alSeleccionar(fase: IdFaseViaje): void;
}

const COLOR_TRAZO: Readonly<Record<EstadoCarita, string>> = {
  feliz: 'var(--positive)',
  neutra: 'var(--text)',
  preocupada: 'var(--negative)',
};

const FONDO_CARITA: Readonly<Record<EstadoCarita, string>> = {
  feliz: 'var(--pastel-mint)',
  neutra: 'var(--pastel-cream)',
  preocupada: 'var(--bg-card)',
};

const ANCHO = 840;
const ALTO = 318;
const Y_SUPERIOR = 84; // 100 % (deja margen limpio para insignia y halo de selección)
const Y_INFERIOR = 250; // 0 %
const X_FASES = [132, 336, 540, 744];

function yDePorcentaje(pct: number): number {
  const acotado = Math.max(0, Math.min(100, pct));
  return Y_INFERIOR - (acotado / 100) * (Y_INFERIOR - Y_SUPERIOR);
}

/** Construye una curva suave (cúbica horizontal) entre los cuatro hitos. */
function rutaCurvaSuave(puntos: readonly { x: number; y: number }[]): string {
  const primero = puntos[0];
  if (!primero) return '';
  let d = `M ${primero.x} ${primero.y}`;
  for (let i = 0; i < puntos.length - 1; i++) {
    const actual = puntos[i];
    const siguiente = puntos[i + 1];
    if (!actual || !siguiente) continue;
    const cx = (actual.x + siguiente.x) / 2;
    d += ` C ${cx} ${actual.y}, ${cx} ${siguiente.y}, ${siguiente.x} ${siguiente.y}`;
  }
  return d;
}

/** Rostro vectorial limpio y accesible según el estado emocional de la fase. */
function CaritaVector({ estado, cx, cy, radio = 22 }: { estado: EstadoCarita; cx: number; cy: number; radio?: number }) {
  const trazo = COLOR_TRAZO[estado];
  const relleno = FONDO_CARITA[estado];
  const ojoDx = radio * 0.34;
  const ojoY = cy - radio * 0.16;

  return (
    <g aria-hidden="true">
      <circle cx={cx} cy={cy} r={radio} fill={relleno} stroke={trazo} strokeWidth={2.5} />
      <circle cx={cx - ojoDx} cy={ojoY} r={2.6} fill="var(--text)" />
      <circle cx={cx + ojoDx} cy={ojoY} r={2.6} fill="var(--text)" />
      {estado === 'feliz' && (
        <path
          d={`M ${cx - radio * 0.42} ${cy + radio * 0.14} Q ${cx} ${cy + radio * 0.56} ${cx + radio * 0.42} ${cy + radio * 0.14}`}
          fill="none"
          stroke="var(--text)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
      {estado === 'neutra' && (
        <line
          x1={cx - radio * 0.36}
          y1={cy + radio * 0.28}
          x2={cx + radio * 0.36}
          y2={cy + radio * 0.28}
          stroke="var(--text)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
      {estado === 'preocupada' && (
        <path
          d={`M ${cx - radio * 0.4} ${cy + radio * 0.42} Q ${cx} ${cy + radio * 0.08} ${cx + radio * 0.4} ${cy + radio * 0.42}`}
          fill="none"
          stroke="var(--text)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

/**
 * Gráfica interactiva del Mapa del Colaborador (A2):
 * conecta los 4 hitos del cambio con una curva suave, porcentajes y caritas.
 */
export function GraficoViaje({ fases, faseActiva, alSeleccionar }: Props) {
  const idBase = useId();
  const idLinea = `${idBase}-linea`;
  const idArea = `${idBase}-area`;
  const puntos = FASES_VIAJE_CONFIG.map((cfg, i) => {
    const datos = fases.find((f) => f.id === cfg.id);
    const porcentaje = datos?.porcentaje ?? 0;
    const carita: EstadoCarita = datos?.carita ?? 'neutra';
    return {
      cfg,
      datos,
      x: X_FASES[i] ?? X_FASES[0] ?? 132,
      y: yDePorcentaje(porcentaje),
      porcentaje,
      carita,
    };
  });

  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  const curva = rutaCurvaSuave(puntos);
  const curvaArea = primero && ultimo ? `${curva} L ${ultimo.x} ${Y_INFERIOR} L ${primero.x} ${Y_INFERIOR} Z` : '';

  return (
    <figure className={estilos.figuraGrafico}>
      <div className={estilos.svgEnv}>
        <svg
          className={estilos.svgGrafico}
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          role="img"
          aria-label="Recorrido de la experiencia del colaborador por las cuatro fases del cambio"
        >
          <defs>
            <linearGradient id={idLinea} x1="0%" y1="0%" x2="100%" y2="0%">
              {puntos.map((p, idx) => (
                <stop key={p.cfg.id} offset={`${(idx / (puntos.length - 1)) * 100}%`} stopColor={COLOR_TRAZO[p.carita]} />
              ))}
            </linearGradient>
            <linearGradient id={idArea} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--positive)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--positive)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Guías horizontales 100%, 50%, 0% */}
          {[
            { pct: 100, y: Y_SUPERIOR },
            { pct: 50, y: (Y_SUPERIOR + Y_INFERIOR) / 2 },
            { pct: 0, y: Y_INFERIOR },
          ].map((g) => (
            <g key={g.pct}>
              <line
                x1={56}
                y1={g.y}
                x2={ANCHO - 20}
                y2={g.y}
                stroke="var(--border)"
                strokeDasharray={g.pct === 0 ? undefined : '4 4'}
                strokeWidth={1}
              />
              <text x={46} y={g.y + 4} textAnchor="end" fill="var(--text-muted)" fontSize={11} fontWeight={500}>
                {g.pct}%
              </text>
            </g>
          ))}

          {/* Separadores verticales entre fases */}
          {[234, 438, 642].map((vx) => (
            <line key={vx} x1={vx} y1={24} x2={vx} y2={Y_INFERIOR} stroke="var(--border)" strokeDasharray="4 4" strokeWidth={1} />
          ))}

          {/* Área suave bajo la curva + línea principal */}
          <path d={curvaArea} fill={`url(#${idArea})`} />
          <path d={curva} fill="none" stroke={`url(#${idLinea})`} strokeWidth={3.5} strokeLinecap="round" />

          {/* Hitos interactivos */}
          {puntos.map((p) => {
            const activa = p.cfg.id === faseActiva;
            const regla = REGLAS_CARITA[p.carita];
            const pillY = Math.max(12, p.y - 62);
            return (
              <g
                key={p.cfg.id}
                className={estilos.nodoSvg}
                role="button"
                tabIndex={0}
                aria-pressed={activa}
                aria-label={`${p.cfg.numero}. ${p.cfg.titulo}: ${p.porcentaje} %, promedio ${formatearPromedioViaje(p.datos?.promedio)} de 3, ${regla.etiqueta}`}
                onClick={() => alSeleccionar(p.cfg.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    alSeleccionar(p.cfg.id);
                  }
                }}
              >
                {/* Guía vertical del punto hasta el eje inferior */}
                <line
                  x1={p.x}
                  y1={p.y + 24}
                  x2={p.x}
                  y2={Y_INFERIOR}
                  stroke={activa ? 'var(--text)' : 'var(--border)'}
                  strokeDasharray="3 3"
                  strokeWidth={activa ? 1.5 : 1}
                />

                {/* Halo de selección */}
                {activa && <circle cx={p.x} cy={p.y} r={30} fill="none" stroke="var(--text)" strokeWidth={2} strokeDasharray="4 3" />}

                {/* Insignia superior con porcentaje */}
                <rect
                  x={p.x - 32}
                  y={pillY}
                  width={64}
                  height={24}
                  rx={12}
                  fill="var(--bg-card)"
                  stroke={COLOR_TRAZO[p.carita]}
                  strokeWidth={1.5}
                />
                <text x={p.x} y={pillY + 16} textAnchor="middle" fill="var(--text)" fontSize={12} fontWeight={700}>
                  {p.porcentaje}%
                </text>

                {/* Carita vectorial */}
                <CaritaVector estado={p.carita} cx={p.x} cy={p.y} />

                {/* Etiqueta inferior del hito */}
                <text x={p.x} y={Y_INFERIOR + 30} textAnchor="middle" fill="var(--text)" fontSize={12} fontWeight={activa ? 700 : 600}>
                  {p.cfg.numero}. {p.cfg.titulo}
                </text>
                <text x={p.x} y={Y_INFERIOR + 48} textAnchor="middle" fill="var(--text-muted)" fontSize={11}>
                  {p.cfg.subtitulo} · {formatearPromedioViaje(p.datos?.promedio)} / 3,00
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className={estilos.apoyo}>
        Selecciona cualquier hito de la curva o de las tarjetas inferiores para ver el desglose por pregunta.
      </figcaption>
    </figure>
  );
}
