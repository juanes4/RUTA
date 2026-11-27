import { useId, useState, type CSSProperties } from 'react';
import {
  type MetricasServidor,
  type PilarTransformacion,
  type ResumenAvanceGlobal,
} from '../../lib/tablero/metricasEjecutivas';
import { useRuta } from '../../navegacion/RutaContexto';
import estilos from './Tablero.module.css';

/** Anillo SVG de avance global de los 15 pasos R–U–T–A, ubicado en el panel lateral. */
export function AnilloAvanceRuta({ avance }: { avance: ResumenAvanceGlobal }) {
  const radio = 40;
  const grosor = 9;
  const circunferencia = 2 * Math.PI * radio;
  const relleno = (avance.porcentaje / 100) * circunferencia;

  return (
    <section className={estilos.bloque} aria-labelledby="titulo-progreso-ruta">
      <h2 id="titulo-progreso-ruta" className={estilos.tituloBloque}>
        Madurez del proceso RUTA
      </h2>
      <div className={estilos.cajaAnillo}>
        <svg
          className={estilos.svgAnilloLateral}
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Avance global del proceso RUTA: ${avance.porcentaje} por ciento. ${avance.completos} pasos completos y ${avance.enCurso} en curso de ${avance.total}.`}
        >
          <circle cx={50} cy={50} r={radio} fill="none" stroke="var(--bg-card)" strokeWidth={grosor} />
          <circle
            cx={50}
            cy={50}
            r={radio}
            fill="none"
            stroke="var(--info-icono)"
            strokeWidth={grosor}
            strokeDasharray={`${relleno} ${circunferencia}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <text x={50} y={48} textAnchor="middle" fill="var(--text)" fontSize={20} fontWeight={700} className="numero">
            {avance.porcentaje}%
          </text>
          <text x={50} y={63} textAnchor="middle" fill="var(--text-muted)" fontSize={9.5} fontWeight={500}>
            {avance.completos + avance.enCurso}/{avance.total} pasos
          </text>
        </svg>

        <ul className={estilos.miniEtapas}>
          {avance.porEtapa.map((e) => (
            <li key={e.id} className={estilos.miniEtapaFila}>
              <span className={estilos.miniEtapaChip} style={{ '--fondo-etapa': e.color } as CSSProperties}>
                {e.letra}
              </span>
              <div className={estilos.miniEtapaBarraEnv}>
                <div className={estilos.miniEtapaCab}>
                  <span className={estilos.miniEtapaNombre}>{e.nombre}</span>
                  <span className={`${estilos.detalle} numero`}>
                    {e.activos}/{e.total}
                  </span>
                </div>
                <div className={estilos.pistaMini} aria-hidden="true">
                  <div className={estilos.rellenoMini} style={{ width: `${e.porcentaje}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Fila visual ejecutiva del tablero:
 * Izquierda: Los 5 pilares medibles de transformación (Kirkpatrick T1–T3 + A1–A2).
 * Derecha: Curva interactiva (alterna entre Mapa del Colaborador A2 y Evolución de Auditorías A1).
 */
export function PanelVisualEjecutivo({
  pilares,
  metricas,
}: {
  pilares: readonly PilarTransformacion[];
  metricas: MetricasServidor;
}) {
  const { enlace } = useRuta();
  const hayA2 = metricas.a2.totalRespuestas > 0;
  const hayA1Evol = metricas.a1.evolucion.length >= 2;
  const [vistaGrafico, setVistaGrafico] = useState<'a2' | 'a1'>(() => (hayA2 || !hayA1Evol ? 'a2' : 'a1'));

  return (
    <section className={estilos.bloque} aria-labelledby="titulo-pulso-visual">
      <div className={estilos.encabezadoSeccion}>
        <div>
          <h2 id="titulo-pulso-visual" className={estilos.tituloBloque}>
            Pulso visual del cambio
          </h2>
          <p className={estilos.detalle}>
            Equilibrio entre los niveles de Kirkpatrick (Transformar) y la sostenibilidad operativa y humana (Analizar).
          </p>
        </div>
      </div>

      <div className={estilos.rejillaVisual}>
        {/* 5 Pilares de Transformación */}
        <article className={estilos.tarjetaGrafico}>
          <header className={estilos.cabeceraCard}>
            <div>
              <h3 className={estilos.tituloCard}>Pilares de adopción (T + A)</h3>
              <p className={estilos.detalle}>Escala normalizada 0–100 % con cifras reales</p>
            </div>
          </header>

          <ul className={estilos.listaPilares}>
            {pilares.map((p) => {
              const tono =
                p.porcentaje === null ? 'neutro' : p.porcentaje >= 80 ? 'verde' : p.porcentaje >= 60 ? 'amarillo' : 'rojo';
              return (
                <li key={p.id}>
                  <a
                    className={estilos.pilarEnlace}
                    href={enlace({ pagina: 'etapa', etapaId: p.etapaId, pasoId: p.pasoId })}
                  >
                    <div className={estilos.pilarCabeza}>
                      <div className={estilos.pilarIdentidad}>
                        <span className={estilos.pilarCodigo} style={{ '--fondo-etapa': p.color } as CSSProperties}>
                          {p.pasoId}
                        </span>
                        <div>
                          <span className={estilos.pilarNombre}>{p.nombre}</span>
                          <span className={estilos.pilarSub}>{p.subtitulo}</span>
                        </div>
                      </div>
                      <div className={estilos.pilarCifra}>
                        <strong className="numero">{p.valorTexto}</strong>
                        <span className={estilos.detalle}>{p.metaTexto}</span>
                      </div>
                    </div>
                    <div className={estilos.pistaPilar} aria-hidden="true">
                      <div
                        className={estilos.rellenoPilar}
                        data-tono={tono}
                        style={{ width: `${p.porcentaje ?? 0}%` }}
                      />
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </article>

        {/* Curva ejecutiva con selector segmentado */}
        <article className={estilos.tarjetaGrafico}>
          <header className={estilos.cabeceraCard}>
            <div>
              <h3 className={estilos.tituloCard}>
                {vistaGrafico === 'a2' ? 'Curva del colaborador (A2)' : 'Evolución de auditorías (A1)'}
              </h3>
              <p className={estilos.detalle}>
                {vistaGrafico === 'a2'
                  ? 'Trayecto emocional en los 4 momentos del cambio'
                  : 'Tendencia del cumplimiento global entre mediciones'}
              </p>
            </div>
            <div className={estilos.segmentadoMini} role="tablist" aria-label="Tipo de gráfico de tendencia">
              <button
                type="button"
                role="tab"
                aria-selected={vistaGrafico === 'a2'}
                className={estilos.btnSegmentadoMini}
                onClick={() => setVistaGrafico('a2')}
              >
                Viaje A2
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={vistaGrafico === 'a1'}
                className={estilos.btnSegmentadoMini}
                onClick={() => setVistaGrafico('a1')}
              >
                Auditorías A1
              </button>
            </div>
          </header>

          {vistaGrafico === 'a2' ? (
            <GraficoCurvaA2Ejecutivo metricas={metricas} />
          ) : (
            <GraficoTendenciaA1Ejecutivo metricas={metricas} />
          )}

          <footer className={estilos.pieGrafico}>
            <a
              className={estilos.enlaceTexto}
              href={enlace({ pagina: 'etapa', etapaId: 'etapa-a', pasoId: vistaGrafico === 'a2' ? 'A2' : 'A1' })}
            >
              {vistaGrafico === 'a2' ? 'Abrir Mapa del Colaborador completo →' : 'Abrir Tablero de Auditorías completo →'}
            </a>
          </footer>
        </article>
      </div>
    </section>
  );
}

function rutaSuave(pts: readonly { x: number; y: number }[]): string {
  const primero = pts[0];
  if (!primero) return '';
  let d = `M ${primero.x} ${primero.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (!a || !b) continue;
    const cx = (a.x + b.x) / 2;
    d += ` C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`;
  }
  return d;
}

function GraficoCurvaA2Ejecutivo({ metricas }: { metricas: MetricasServidor }) {
  const idBase = useId();
  const idGrad = `${idBase}-a2`;

  if (metricas.a2.totalRespuestas === 0) {
    return (
      <div className={estilos.vacioGrafico}>
        <p className={estilos.nombreArea}>Sin respuestas en el Mapa del Colaborador</p>
        <p className={estilos.detalle}>Cuando el equipo responda las 12 preguntas de A2, verás aquí la curva emocional de las 4 fases.</p>
      </div>
    );
  }

  const xs = [64, 188, 312, 436];
  const Y_SUP = 36;
  const Y_INF = 152;
  const yDe = (pct: number) => Y_INF - (Math.max(0, Math.min(100, pct)) / 100) * (Y_INF - Y_SUP);

  const puntos = metricas.a2.fases.map((f, i) => ({
    ...f,
    x: xs[i] ?? 64,
    y: yDe(f.porcentaje),
    color: f.carita === 'feliz' ? 'var(--recorrido-acompanar)' : f.carita === 'preocupada' ? 'var(--peligro-linea)' : 'var(--recorrido-comprobar)',
  }));

  const curva = rutaSuave(puntos);
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  const area = primero && ultimo ? `${curva} L ${ultimo.x} ${Y_INF} L ${primero.x} ${Y_INF} Z` : '';

  return (
    <div className={estilos.envSvgCompacto}>
      <svg
        className={estilos.svgCompacto}
        viewBox="0 0 500 202"
        role="img"
        aria-label={`Curva del colaborador: ${puntos.map((p) => `${p.titulo} ${p.porcentaje}%`).join(', ')}`}
      >
        <defs>
          <linearGradient id={idGrad} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--recorrido-entender)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--recorrido-entender)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[100, 50, 0].map((g) => {
          const gy = yDe(g);
          return (
            <g key={g}>
              <line x1={38} y1={gy} x2={476} y2={gy} stroke="var(--border)" strokeDasharray={g === 0 ? undefined : '4 4'} />
              <text x={32} y={gy + 4} textAnchor="end" fill="var(--text-muted)" fontSize={10}>
                {g}%
              </text>
            </g>
          );
        })}

        {area && <path d={area} fill={`url(#${idGrad})`} />}
        {curva && <path d={curva} fill="none" stroke="var(--info-icono)" strokeWidth={2.5} strokeLinecap="round" />}

        {puntos.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={9} fill="var(--bg-card)" stroke={p.color} strokeWidth={3} />
            <text x={p.x} y={Math.max(15, p.y - 16)} textAnchor="middle" fill="var(--text)" fontSize={11.5} fontWeight={700}>
              {p.porcentaje}%
            </text>
            <text x={p.x} y={Y_INF + 20} textAnchor="middle" fill="var(--text)" fontSize={10.5} fontWeight={600}>
              {p.subtitulo}
            </text>
            <text x={p.x} y={Y_INF + 35} textAnchor="middle" fill="var(--text-muted)" fontSize={9.5}>
              {p.promedio !== null ? `${p.promedio.toFixed(2).replace('.', ',')} / 3` : '—'}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function GraficoTendenciaA1Ejecutivo({ metricas }: { metricas: MetricasServidor }) {
  const idBase = useId();
  const idGrad = `${idBase}-a1`;
  const serie = metricas.a1.evolucion;

  if (serie.length === 0) {
    return (
      <div className={estilos.vacioGrafico}>
        <p className={estilos.nombreArea}>Sin auditorías registradas en A1</p>
        <p className={estilos.detalle}>Registra tus mediciones periódicas (Día 30, Día 60, Día 90) para ver la curva de evolución.</p>
      </div>
    );
  }

  const PAD_IZQ = 44;
  const PAD_DER = 26;
  const ANCHO = 500;
  const Y_SUP = 36;
  const Y_INF = 152;
  const yDe = (pct: number) => Y_INF - (Math.max(0, Math.min(100, pct)) / 100) * (Y_INF - Y_SUP);
  const anchoUtil = ANCHO - PAD_IZQ - PAD_DER;

  const puntos = serie.map((s, idx) => ({
    ...s,
    x: PAD_IZQ + (serie.length > 1 ? (idx / (serie.length - 1)) * anchoUtil : anchoUtil / 2),
    y: yDe(s.cumplimiento),
  }));

  const curva = rutaSuave(puntos);
  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];
  const area = serie.length >= 2 && primero && ultimo ? `${curva} L ${ultimo.x} ${Y_INF} L ${primero.x} ${Y_INF} Z` : '';

  return (
    <div className={estilos.envSvgCompacto}>
      <svg
        className={estilos.svgCompacto}
        viewBox="0 0 500 202"
        role="img"
        aria-label={`Evolución de cumplimiento en auditorías A1: ${puntos.map((p) => `${p.periodo} ${p.cumplimiento}%`).join(', ')}`}
      >
        <defs>
          <linearGradient id={idGrad} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--recorrido-acompanar)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--recorrido-acompanar)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[100, 50, 0].map((g) => {
          const gy = yDe(g);
          return (
            <g key={g}>
              <line x1={PAD_IZQ} y1={gy} x2={ANCHO - PAD_DER} y2={gy} stroke="var(--border)" strokeDasharray={g === 0 ? undefined : '4 4'} />
              <text x={PAD_IZQ - 8} y={gy + 4} textAnchor="end" fill="var(--text-muted)" fontSize={10}>
                {g}%
              </text>
            </g>
          );
        })}

        {area && <path d={area} fill={`url(#${idGrad})`} />}
        {serie.length >= 2 && <path d={curva} fill="none" stroke="var(--recorrido-acompanar)" strokeWidth={2.8} strokeLinecap="round" />}

        {puntos.map((p) => (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={6.5} fill="var(--bg-card)" stroke="var(--info-icono)" strokeWidth={2.6} />
            <text x={p.x} y={Math.max(15, p.y - 12)} textAnchor="middle" fill="var(--text)" fontSize={11.5} fontWeight={700}>
              {p.cumplimiento}%
            </text>
            <text x={p.x} y={Y_INF + 20} textAnchor="middle" fill="var(--text)" fontSize={10.5} fontWeight={600}>
              {p.periodo}
            </text>
            <text x={p.x} y={Y_INF + 35} textAnchor="middle" fill="var(--text-muted)" fontSize={9.5}>
              {p.fecha}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
