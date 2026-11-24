import { useId, useState } from 'react';
import { INDICADORES_TABLERO_A, type IdIndicadorA } from '../../config/analizar';
import type { RegistroAuditoriaA } from '../../lib/api';
import {
  formatearMetaA,
  formatearValorA,
  posicionEnEscalaA,
  resumirSemaforosA,
  semaforoIndicadorA,
  textoBrechaMetaA,
  type ResumenSemaforosA,
} from '../../lib/analizar/calculos';
import type { EstadoSemaforo } from '../../lib/calculo/semaforo';
import estilos from './etapaA.module.css';

export type FiltroEstadoA = 'todos' | EstadoSemaforo;

interface PropsVisuales {
  auditoria: RegistroAuditoriaA;
  resumen: ResumenSemaforosA;
  filtro: FiltroEstadoA;
  alFiltrar(estado: FiltroEstadoA): void;
}

/**
 * Panel ejecutivo de visualizaciones para el Tablero del equipo (A1):
 * 1) Anillo interactivo de salud de adopción (con filtro por semáforo).
 * 2) Comparativa «Valor actual vs. Meta» con marcador vertical de objetivo en los 8 indicadores.
 */
export function GraficosTableroA({ auditoria, resumen, filtro, alFiltrar }: PropsVisuales) {
  return (
    <div className={estilos.gridGraficosA1}>
      <GraficoAnilloSalud resumen={resumen} filtro={filtro} alFiltrar={alFiltrar} />
      <GraficoBarrasMeta auditoria={auditoria} filtro={filtro} />
    </div>
  );
}

function GraficoAnilloSalud({
  resumen,
  filtro,
  alFiltrar,
}: {
  resumen: ResumenSemaforosA;
  filtro: FiltroEstadoA;
  alFiltrar(estado: FiltroEstadoA): void;
}) {
  const radio = 66;
  const grosor = 16;
  const cx = 90;
  const cy = 90;
  const circunferencia = 2 * Math.PI * radio;
  const total = INDICADORES_TABLERO_A.length;

  const segmentos: {
    id: EstadoSemaforo | 'sin_dato';
    etiqueta: string;
    cantidad: number;
    color: string;
    filtrable: boolean;
  }[] = [
    { id: 'en_meta', etiqueta: 'En meta', cantidad: resumen.enMeta, color: 'var(--positive)', filtrable: true },
    { id: 'atencion', etiqueta: 'Atención', cantidad: resumen.atencion, color: 'var(--text)', filtrable: true },
    { id: 'intervenir', etiqueta: 'Intervenir', cantidad: resumen.intervenir, color: 'var(--negative)', filtrable: true },
    { id: 'sin_dato', etiqueta: 'Sin dato', cantidad: resumen.sinDato, color: 'var(--border)', filtrable: false },
  ];

  let acumulado = 0;
  const arcos = segmentos
    .filter((s) => s.cantidad > 0)
    .map((s) => {
      const fraccion = s.cantidad / total;
      const longitud = Math.max(0, fraccion * circunferencia - 3);
      const desplazamiento = -acumulado * circunferencia;
      acumulado += fraccion;
      return { ...s, longitud, desplazamiento };
    });

  const alternar = (id: EstadoSemaforo) => {
    alFiltrar(filtro === id ? 'todos' : id);
  };

  return (
    <section className={estilos.cardGrafico} aria-labelledby="titulo-anillo-a1">
      <div className={estilos.cabeceraCardGrafico}>
        <div>
          <h3 id="titulo-anillo-a1" className={estilos.tituloCardGrafico}>
            Salud de adopción
          </h3>
          <span className={estilos.apoyo}>Distribución de los 8 indicadores por semáforo</span>
        </div>
        {filtro !== 'todos' && (
          <button type="button" className={estilos.botonMini} onClick={() => alFiltrar('todos')}>
            Ver todos
          </button>
        )}
      </div>

      <div className={estilos.cuerpoAnillo}>
        <svg
          className={estilos.svgAnillo}
          viewBox="0 0 180 180"
          role="img"
          aria-label={`Cumplimiento global: ${resumen.porcentajeCumplimiento ?? 0} %. ${resumen.enMeta} en meta, ${resumen.atencion} en atención y ${resumen.intervenir} para intervenir.`}
        >
          {/* Pista base */}
          <circle cx={cx} cy={cy} r={radio} fill="none" stroke="var(--bg-soft)" strokeWidth={grosor} />

          {/* Segmentos */}
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {arcos.map((arco) => {
              const activo = filtro === 'todos' || filtro === arco.id;
              return (
                <circle
                  key={arco.id}
                  cx={cx}
                  cy={cy}
                  r={radio}
                  fill="none"
                  stroke={arco.color}
                  strokeWidth={activo ? grosor : grosor - 3}
                  strokeDasharray={`${arco.longitud} ${circunferencia}`}
                  strokeDashoffset={arco.desplazamiento}
                  strokeLinecap="round"
                  opacity={activo ? 1 : 0.28}
                  className={arco.filtrable ? estilos.arcoInteractivo : undefined}
                  onClick={() => arco.filtrable && alternar(arco.id as EstadoSemaforo)}
                />
              );
            })}
          </g>

          {/* Dato central */}
          <text x={cx} y={cy - 2} textAnchor="middle" fill="var(--text)" fontSize={30} fontWeight={700} className="numero">
            {resumen.porcentajeCumplimiento === null ? '—' : `${resumen.porcentajeCumplimiento}%`}
          </text>
          <text x={cx} y={cy + 18} textAnchor="middle" fill="var(--text-muted)" fontSize={11} fontWeight={500}>
            {resumen.enMeta} de {resumen.evaluados} en meta
          </text>
        </svg>

        <ul className={estilos.leyendaAnillo}>
          {segmentos
            .filter((s) => s.filtrable || s.cantidad > 0)
            .map((s) => {
              const seleccionado = filtro === s.id;
              return (
                <li key={s.id}>
                  {s.filtrable ? (
                    <button
                      type="button"
                      className={estilos.filaLeyendaBtn}
                      aria-pressed={seleccionado}
                      onClick={() => alternar(s.id as EstadoSemaforo)}
                    >
                      <span className={estilos.muestraColor} style={{ background: s.color }} aria-hidden="true" />
                      <span className={estilos.nombreLeyenda}>{s.etiqueta}</span>
                      <strong className="numero">{s.cantidad}</strong>
                    </button>
                  ) : (
                    <div className={estilos.filaLeyendaFija}>
                      <span className={estilos.muestraColor} style={{ background: s.color }} aria-hidden="true" />
                      <span className={estilos.nombreLeyenda}>{s.etiqueta}</span>
                      <strong className="numero">{s.cantidad}</strong>
                    </div>
                  )}
                </li>
              );
            })}
        </ul>
      </div>
      <p className={estilos.apoyo}>Haz clic en un estado para filtrar la comparativa y la tabla.</p>
    </section>
  );
}

function GraficoBarrasMeta({ auditoria, filtro }: { auditoria: RegistroAuditoriaA; filtro: FiltroEstadoA }) {
  const filas = INDICADORES_TABLERO_A.map((ind) => {
    const meta = auditoria.metas[ind.id] ?? ind.metaInicial;
    const valor = auditoria.valores[ind.id];
    const estado = semaforoIndicadorA(valor, meta, ind);
    const posValor = valor === null ? 0 : posicionEnEscalaA(valor, ind.unidad);
    const posMeta = posicionEnEscalaA(meta, ind.unidad);
    const brecha = textoBrechaMetaA(valor, meta, ind);
    return { ind, meta, valor, estado, posValor, posMeta, brecha };
  }).filter((f) => filtro === 'todos' || f.estado === filtro);

  return (
    <section className={estilos.cardGrafico} aria-labelledby="titulo-comparativa-a1">
      <div className={estilos.cabeceraCardGrafico}>
        <div>
          <h3 id="titulo-comparativa-a1" className={estilos.tituloCardGrafico}>
            Valor actual frente a la meta
          </h3>
          <span className={estilos.apoyo}>La marca vertical indica la meta definida para cada indicador</span>
        </div>
        <span className={estilos.leyendaMarcaMeta}>
          <span className={estilos.lineaMetaMini} aria-hidden="true" /> Meta
        </span>
      </div>

      {filas.length === 0 ? (
        <p className={estilos.apoyo}>Ningún indicador se encuentra en este estado de semáforo.</p>
      ) : (
        <ul className={estilos.listaBullet}>
          {filas.map(({ ind, meta, valor, estado, posValor, posMeta, brecha }) => (
            <li key={ind.id} className={estilos.filaBullet}>
              <div className={estilos.cabezaBullet}>
                <span className={estilos.nombreBullet}>{ind.nombre}</span>
                <span className={`${estilos.cifrasBullet} numero`}>
                  <strong>{formatearValorA(valor, ind.unidad)}</strong>
                  <span className={estilos.metaBullet}>({formatearMetaA(meta, ind)})</span>
                </span>
              </div>

              <div className={estilos.pistaBullet} aria-hidden="true">
                {ind.sentido === 'menor_mejor' && (
                  <div className={estilos.zonaSeguraBullet} style={{ width: `${Math.max(posMeta, 3)}%` }} />
                )}
                {valor !== null && (
                  <div
                    className={estilos.barraBullet}
                    data-estado={estado ?? undefined}
                    style={{ width: `${Math.max(posValor, valor > 0 ? 2 : 0)}%` }}
                  />
                )}
                <div
                  className={estilos.marcadorMetaBullet}
                  style={{ left: `${posMeta}%` }}
                  title={`Meta: ${formatearMetaA(meta, ind)}`}
                />
              </div>

              <div className={estilos.pieBullet}>
                <span className={estilos.apoyo}>{brecha ?? 'Sin medición en esta auditoría'}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type MetricaTendencia = 'cumplimiento' | IdIndicadorA;

/**
 * Curva de evolución entre auditorías (cuando existen 2 o más mediciones).
 * Permite alternar entre % de cumplimiento global o cualquiera de los 8 indicadores.
 */
export function GraficoEvolucionAuditorias({ auditorias }: { auditorias: readonly RegistroAuditoriaA[] }) {
  const [metrica, setMetrica] = useState<MetricaTendencia>('cumplimiento');
  const idBase = useId();
  const idGrad = `${idBase}-evol`;

  if (auditorias.length < 2) return null;

  // Orden cronológico: más antigua a la izquierda, más reciente a la derecha.
  const serie = [...auditorias].reverse();
  const ind = metrica === 'cumplimiento' ? null : INDICADORES_TABLERO_A.find((i) => i.id === metrica) ?? null;

  const ANCHO = 760;
  const ALTO = 228;
  const PAD_IZQ = 52;
  const PAD_DER = 28;
  const Y_SUP = 34;
  const Y_INF = 176;
  const anchoUtil = ANCHO - PAD_IZQ - PAD_DER;

  const escalaMax = ind?.unidad === 'escala_5' ? 5 : 100;
  const yDe = (val: number) => {
    const pct = Math.max(0, Math.min(1, val / escalaMax));
    return Y_INF - pct * (Y_INF - Y_SUP);
  };

  const puntos = serie.map((a, idx) => {
    const x = PAD_IZQ + (serie.length > 1 ? (idx / (serie.length - 1)) * anchoUtil : anchoUtil / 2);
    let valor: number | null;
    let etiquetaValor: string;

    if (!ind) {
      const r = resumirSemaforosA(a.valores, a.metas);
      valor = r.porcentajeCumplimiento;
      etiquetaValor = valor === null ? '—' : `${valor}%`;
    } else {
      valor = a.valores[ind.id];
      etiquetaValor = formatearValorA(valor, ind.unidad);
    }

    return {
      id: a.id,
      periodo: a.periodo,
      fecha: a.fecha,
      x,
      y: valor === null ? null : yDe(valor),
      valor,
      etiquetaValor,
    };
  });

  const validos = puntos.filter((p): p is typeof p & { y: number; valor: number } => p.y !== null && p.valor !== null);

  let ruta = '';
  if (validos.length > 0) {
    const primero = validos[0]!;
    ruta = `M ${primero.x} ${primero.y}`;
    for (let i = 0; i < validos.length - 1; i++) {
      const a = validos[i]!;
      const b = validos[i + 1]!;
      const cx = (a.x + b.x) / 2;
      ruta += ` C ${cx} ${a.y}, ${cx} ${b.y}, ${b.x} ${b.y}`;
    }
  }
  const rutaArea =
    validos.length >= 2
      ? `${ruta} L ${validos[validos.length - 1]!.x} ${Y_INF} L ${validos[0]!.x} ${Y_INF} Z`
      : '';

  const ultima = serie[serie.length - 1];
  const metaLinea = ind ? (ultima?.metas[ind.id] ?? ind.metaInicial) : null;
  const yMeta = metaLinea !== null ? yDe(metaLinea) : null;

  const guias =
    ind?.unidad === 'escala_5'
      ? [
          { etiqueta: '5,0', y: yDe(5) },
          { etiqueta: '2,5', y: yDe(2.5) },
          { etiqueta: '0', y: yDe(0) },
        ]
      : [
          { etiqueta: '100%', y: yDe(100) },
          { etiqueta: '50%', y: yDe(50) },
          { etiqueta: '0%', y: yDe(0) },
        ];

  return (
    <section className={estilos.cardGrafico} aria-labelledby="titulo-evolucion-a1">
      <div className={estilos.cabeceraCardGrafico}>
        <div>
          <h3 id="titulo-evolucion-a1" className={estilos.tituloCardGrafico}>
            Evolución entre auditorías
          </h3>
          <span className={estilos.apoyo}>Seguimiento histórico de la adopción a lo largo de los hitos registrados</span>
        </div>

        <label className={estilos.selectorInline}>
          <span>Indicador</span>
          <select value={metrica} onChange={(e) => setMetrica(e.target.value as MetricaTendencia)}>
            <option value="cumplimiento">Cumplimiento global (%)</option>
            {INDICADORES_TABLERO_A.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={estilos.svgEnv}>
        <svg
          className={estilos.svgEvolucion}
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          role="img"
          aria-label={`Gráfico de evolución de ${ind ? ind.nombre : 'cumplimiento global'} en ${serie.length} auditorías`}
        >
          <defs>
            <linearGradient id={idGrad} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--positive)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--positive)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {guias.map((g) => (
            <g key={g.etiqueta}>
              <line x1={PAD_IZQ} y1={g.y} x2={ANCHO - PAD_DER} y2={g.y} stroke="var(--border)" strokeDasharray="4 4" strokeWidth={1} />
              <text x={PAD_IZQ - 8} y={g.y + 4} textAnchor="end" fill="var(--text-muted)" fontSize={11} fontWeight={500}>
                {g.etiqueta}
              </text>
            </g>
          ))}

          {yMeta !== null && ind && (
            <g>
              <line x1={PAD_IZQ} y1={yMeta} x2={ANCHO - PAD_DER} y2={yMeta} stroke="var(--text)" strokeDasharray="6 4" strokeWidth={1.5} />
              <text x={ANCHO - PAD_DER} y={Math.max(14, yMeta - 6)} textAnchor="end" fill="var(--text)" fontSize={11} fontWeight={600}>
                Meta: {formatearMetaA(metaLinea!, ind)}
              </text>
            </g>
          )}

          {rutaArea && <path d={rutaArea} fill={`url(#${idGrad})`} />}
          {ruta && <path d={ruta} fill="none" stroke="var(--positive)" strokeWidth={3} strokeLinecap="round" />}

          {puntos.map((p) => {
            const estado =
              ind && p.valor !== null && metaLinea !== null ? semaforoIndicadorA(p.valor, metaLinea, ind) : null;
            const colorPunto =
              estado === 'intervenir' ? 'var(--negative)' : estado === 'atencion' ? 'var(--text)' : 'var(--positive)';
            return (
              <g key={p.id}>
                {p.y !== null && (
                  <>
                    <circle cx={p.x} cy={p.y} r={6} fill="var(--bg-card)" stroke={colorPunto} strokeWidth={3} />
                    <text x={p.x} y={Math.max(16, p.y - 12)} textAnchor="middle" fill="var(--text)" fontSize={12} fontWeight={700}>
                      {p.etiquetaValor}
                    </text>
                  </>
                )}
                <text x={p.x} y={Y_INF + 22} textAnchor="middle" fill="var(--text)" fontSize={11} fontWeight={600}>
                  {p.periodo}
                </text>
                <text x={p.x} y={Y_INF + 37} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>
                  {p.fecha}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
