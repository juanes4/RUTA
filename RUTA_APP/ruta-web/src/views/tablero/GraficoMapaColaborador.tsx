import { useMemo, useState } from 'react';
import type { FilaRespuesta } from '../../lib/modelo/tipos';
import {
  calcularMapaColaborador,
  type CategoriaExperiencia,
  type FaseExperiencia,
} from '../../lib/tablero/mapaColaborador';
import estilos from './VisualizacionesTablero.module.css';

interface Props {
  respuestas?: readonly FilaRespuesta[];
  metaSostenibilidad?: number;
}

const FASES_REFERENCIA: FaseExperiencia[] = [
  {
    numero: 1,
    id: 'base',
    titulo: 'Antes del cambio',
    subtitulo: 'Línea base',
    valor: 0.82,
    categoria: 'promotor',
    detalle: 'Comprensión y expectativa inicial de los colaboradores',
  },
  {
    numero: 2,
    id: 'transicion',
    titulo: 'Durante el cambio',
    subtitulo: 'Transición',
    valor: 0.47,
    categoria: 'adaptacion',
    detalle: 'Curva natural de ajuste, dudas y resistencia inicial',
  },
  {
    numero: 3,
    id: 'actual',
    titulo: 'Situación actual',
    subtitulo: 'Adopción real',
    valor: 0.76,
    categoria: 'promotor',
    detalle: 'Superación de fricciones y consolidación del nuevo método',
  },
  {
    numero: 4,
    id: 'sostenibilidad',
    titulo: 'Hacia dónde mejorar',
    subtitulo: 'Sostenibilidad',
    valor: 0.79,
    categoria: 'promotor',
    detalle: 'Meta de estabilización y cultura del cambio continua',
  },
];

function obtenerColorCategoria(cat: CategoriaExperiencia): string {
  switch (cat) {
    case 'promotor':
      return '#2F9E6B';
    case 'adaptacion':
      return '#F59E0B';
    case 'riesgo':
      return '#D64550';
    default:
      return '#94A3B8';
  }
}

/**
 * Mapa del Colaborador: Gráfico de caras y curva de evolución de la experiencia.
 * Muestra el recorrido por las 4 fases del cambio (Línea base → Transición → Adopción → Sostenibilidad).
 * Sin emojis; iconos gráficos vectoriales de caras.
 */
export function GraficoMapaColaborador({ respuestas = [], metaSostenibilidad = 0.8 }: Props) {
  const fasesCalculadas = useMemo(
    () => calcularMapaColaborador(respuestas, metaSostenibilidad),
    [respuestas, metaSostenibilidad],
  );

  const hayDatosReales = useMemo(
    () => fasesCalculadas.some((f) => f.valor !== null && f.id !== 'sostenibilidad'),
    [fasesCalculadas],
  );

  // Permite alternar entre los datos del proyecto o la curva metodológica esperada
  const [usarReferencia, setUsarReferencia] = useState<boolean>(!hayDatosReales);

  const fases = usarReferencia ? FASES_REFERENCIA : fasesCalculadas;

  const ancho = 680;
  const alto = 190;
  const margenIzq = 45;
  const margenDer = 35;
  const margenSup = 46;
  const margenInf = 24;
  const altoGrafica = alto - margenSup - margenInf;
  const anchoGrafica = ancho - margenIzq - margenDer;

  // Coordenadas X para las 4 fases
  const coordsX = [
    margenIzq + 0.12 * anchoGrafica,
    margenIzq + 0.38 * anchoGrafica,
    margenIzq + 0.65 * anchoGrafica,
    margenIzq + 0.90 * anchoGrafica,
  ];

  // Coordenadas completas de cada punto
  const puntos = fases.map((f, i) => {
    const val = f.valor ?? 0.5;
    const x = coordsX[i] ?? margenIzq;
    const y = alto - margenInf - val * altoGrafica;
    const porcentaje = Math.round(val * 100);
    const color = obtenerColorCategoria(f.categoria);
    return { ...f, x, y, porcentaje, color };
  });

  // Trazado de la curva spline cúbica continua
  const dCurva = useMemo(() => {
    if (puntos.length < 2) return '';
    const p0 = puntos[0]!;
    let d = `M ${p0.x} ${p0.y}`;
    for (let i = 0; i < puntos.length - 1; i++) {
      const pAct = puntos[i]!;
      const pSig = puntos[i + 1]!;
      const cpX1 = pAct.x + (pSig.x - pAct.x) / 2;
      const cpY1 = pAct.y;
      const cpX2 = pAct.x + (pSig.x - pAct.x) / 2;
      const cpY2 = pSig.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pSig.x} ${pSig.y}`;
    }
    return d;
  }, [puntos]);

  return (
    <article className={estilos.panelMapaColaborador}>
      <header className={estilos.cabeceraMapa}>
        <div className={estilos.bloqueTituloMapa}>
          <div className={estilos.iconoMapaContenedor} aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h4l3 8 4-16 3 8h4" />
            </svg>
          </div>
          <div>
            <h3 className={estilos.tituloMapa}>Mapa del Colaborador</h3>
            <p className={estilos.subtituloMapa}>
              Experiencia y evolución en el proceso de cambio · Recorrido por fases
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Leyenda de estados */}
          <ul className={estilos.leyendaMapa}>
            <li className={estilos.itemLeyendaMapa}>
              <span className={estilos.puntoLeyendaMapa} style={{ background: '#2F9E6B' }} aria-hidden="true" />
              <span>Promotor (A)</span>
            </li>
            <li className={estilos.itemLeyendaMapa}>
              <span className={estilos.puntoLeyendaMapa} style={{ background: '#F59E0B' }} aria-hidden="true" />
              <span>En adaptación (B)</span>
            </li>
            <li className={estilos.itemLeyendaMapa}>
              <span className={estilos.puntoLeyendaMapa} style={{ background: '#D64550' }} aria-hidden="true" />
              <span>Riesgo (C)</span>
            </li>
          </ul>

          {/* Botón de alternancia de curva */}
          <button
            type="button"
            onClick={() => setUsarReferencia(!usarReferencia)}
            className={estilos.botonAlternarCurva}
            title="Alternar entre datos capturados y curva de referencia metodológica"
          >
            {usarReferencia ? 'Ver datos reales' : 'Ver curva metodológica'}
          </button>
        </div>
      </header>

      <div className={estilos.svgMapaContenedor}>
        <svg
          className={estilos.svgMapa}
          viewBox={`0 0 ${ancho} ${alto}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* Gradiente dinámico a lo largo de la curva */}
            <linearGradient id="gradienteCurvaMapa" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="10%" stopColor={puntos[0]?.color ?? '#2F9E6B'} />
              <stop offset="38%" stopColor={puntos[1]?.color ?? '#F59E0B'} />
              <stop offset="65%" stopColor={puntos[2]?.color ?? '#2F9E6B'} />
              <stop offset="90%" stopColor={puntos[3]?.color ?? '#2F9E6B'} />
            </linearGradient>
          </defs>

          {/* Líneas horizontales de referencia del eje Y (100%, 50%, 0%) */}
          {[1, 0.5, 0].map((v) => {
            const y = alto - margenInf - v * altoGrafica;
            return (
              <g key={v}>
                <line
                  x1={margenIzq}
                  y1={y}
                  x2={ancho - margenDer}
                  y2={y}
                  className={estilos.lineaEjeYMapa}
                />
                <text x={margenIzq - 8} y={y} className={estilos.textoEjeYMapa}>
                  {Math.round(v * 100)}%
                </text>
              </g>
            );
          })}

          {/* Líneas guía verticales hacia las fases */}
          {puntos.map((p) => (
            <line
              key={p.id}
              x1={p.x}
              y1={p.y + 17}
              x2={p.x}
              y2={alto - margenInf}
              className={estilos.lineaGuiaFase}
            />
          ))}

          {/* Curva continua ondulada de la experiencia */}
          {dCurva && (
            <path
              d={dCurva}
              fill="none"
              stroke="url(#gradienteCurvaMapa)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          )}

          {/* Globitos de porcentaje y Caras SVG en cada punto */}
          {puntos.map((p) => {
            const tailH = 6;
            const globoW = 46;
            const globoH = 22;
            const globoX = p.x - globoW / 2;
            const globoY = p.y - 17 - globoH - tailH;

            const fondoCara = p.color;
            const trazoCara = p.categoria === 'adaptacion' ? '#111111' : '#FFFFFF';

            return (
              <g key={p.id}>
                {/* Globo de porcentaje con puntero */}
                {p.valor !== null && (
                  <g className={estilos.globoPorcentaje}>
                    <rect
                      x={globoX}
                      y={globoY}
                      width={globoW}
                      height={globoH}
                      rx="11"
                      fill="#FFFFFF"
                      stroke={p.color}
                      strokeWidth="1.6"
                    />
                    {/* Triángulo puntero */}
                    <polygon
                      points={`${p.x - 4},${globoY + globoH} ${p.x + 4},${globoY + globoH} ${p.x},${globoY + globoH + tailH}`}
                      fill={p.color}
                    />
                    <text
                      x={p.x}
                      y={globoY + globoH / 2}
                      fill={p.color}
                      fontFamily="var(--font-display)"
                      fontSize="11"
                      fontWeight="700"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {p.porcentaje}%
                    </text>
                  </g>
                )}

                {/* Sombra sutil de la cara */}
                <circle cx={p.x} cy={p.y} r="18" fill="rgba(17,17,17,0.06)" />

                {/* Círculo base de la cara con borde blanco protector */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="16"
                  fill={fondoCara}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                {/* Ojos */}
                <circle cx={p.x - 5} cy={p.y - 3} r="1.8" fill={trazoCara} />
                <circle cx={p.x + 5} cy={p.y - 3} r="1.8" fill={trazoCara} />

                {/* Boca según categoría */}
                {p.categoria === 'promotor' && (
                  <path
                    d={`M ${p.x - 5.5} ${p.y + 3} Q ${p.x} ${p.y + 8} ${p.x + 5.5} ${p.y + 3}`}
                    stroke={trazoCara}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}

                {(p.categoria === 'adaptacion' || p.categoria === 'pendiente') && (
                  <line
                    x1={p.x - 5}
                    y1={p.y + 4.5}
                    x2={p.x + 5}
                    y2={p.y + 4.5}
                    stroke={trazoCara}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                )}

                {p.categoria === 'riesgo' && (
                  <path
                    d={`M ${p.x - 5.5} ${p.y + 6} Q ${p.x} ${p.y + 1} ${p.x + 5.5} ${p.y + 6}`}
                    stroke={trazoCara}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bloques de fases numeradas en el pie */}
      <footer className={estilos.rejillaFasesPie}>
        {puntos.map((f) => (
          <div key={f.id} className={estilos.tarjetaFase}>
            <div className={estilos.cabeceraFasePie}>
              <span className={estilos.circuloNumeroFase} aria-hidden="true">
                {f.numero}
              </span>
              <h4 className={estilos.nombreFasePie}>{f.titulo}</h4>
            </div>
            <p className={estilos.subtituloFasePie}>{f.subtitulo}</p>
            <p className={estilos.detalleFasePie}>{f.detalle}</p>
          </div>
        ))}
      </footer>
    </article>
  );
}
