import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import estilos from './Graficos.module.css';

/**
 * Gráficos del Tablero en SVG, sin librerías. Reglas comunes:
 * - marcas delgadas, rejilla tenue, una sola escala por gráfico;
 * - el texto usa las tintas del texto, nunca el color de la serie;
 * - cada marca tiene globo al pasar el mouse (o al enfocarla con el teclado);
 * - cada tarjeta trae su tabla en «Ver datos», para no depender del color.
 */

/* ------------------------------------------------------------------ */
/* Base: ancho, globo, tarjeta y leyenda                               */
/* ------------------------------------------------------------------ */

export function useAncho<T extends HTMLElement>(inicial = 520) {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(inicial);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = (w: number) => setAncho(Math.max(220, Math.round(w)));
    medir(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => e && medir(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho] as const;
}

interface InfoGlobo {
  x: number;
  y: number;
  contenido: ReactNode;
}

function useGlobo() {
  const [info, setInfo] = useState<InfoGlobo | null>(null);
  const mostrar = (e: PointerEvent<Element> | FocusEvent<Element>, contenido: ReactNode) => {
    const marco = (e.currentTarget as Element).closest('[data-lienzo]');
    if (!marco) return;
    const r = marco.getBoundingClientRect();
    if ('clientX' in e) setInfo({ x: e.clientX - r.left, y: e.clientY - r.top, contenido });
    else {
      const b = (e.currentTarget as Element).getBoundingClientRect();
      setInfo({ x: b.left + b.width / 2 - r.left, y: b.top - r.top, contenido });
    }
  };
  const ocultar = () => setInfo(null);
  /** Props para una marca con globo: mouse y teclado. */
  const marca = (contenido: ReactNode) => ({
    tabIndex: 0,
    onPointerEnter: (e: PointerEvent<Element>) => mostrar(e, contenido),
    onPointerMove: (e: PointerEvent<Element>) => mostrar(e, contenido),
    onPointerLeave: ocultar,
    onFocus: (e: FocusEvent<Element>) => mostrar(e, contenido),
    onBlur: ocultar,
  });
  return { info, mostrar, ocultar, marca };
}

function Globo({ info, ancho }: { info: InfoGlobo | null; ancho: number }) {
  if (!info) return null;
  const x = Math.min(Math.max(info.x, 90), ancho - 90);
  return (
    <div className={estilos.globo} style={{ left: x, top: info.y } as CSSProperties} role="status">
      {info.contenido}
    </div>
  );
}

export type LetraEtapa = 'R' | 'U' | 'T' | 'A';
const FONDO_ETAPA: Record<LetraEtapa, string> = {
  R: 'var(--pastel-blue)',
  U: 'var(--pastel-lavender)',
  T: 'var(--pastel-mint)',
  A: 'var(--pastel-cream)',
};

export function ChipEtapa({ etapa, texto }: { etapa: LetraEtapa; texto?: string }) {
  return (
    <span className={estilos.chipEtapa} style={{ '--fondo-chip': FONDO_ETAPA[etapa] } as CSSProperties}>
      {texto ?? etapa}
    </span>
  );
}

export interface ItemLeyenda {
  nombre: string;
  color: string;
  forma?: 'punto' | 'anillo' | 'linea' | 'guion' | 'cuadro';
}

export function Leyenda({ items }: { items: readonly ItemLeyenda[] }) {
  return (
    <ul className={estilos.leyenda}>
      {items.map((i) => (
        <li key={i.nombre}>
          <span className={estilos.muestra} data-forma={i.forma ?? 'cuadro'} style={{ '--color-muestra': i.color } as CSSProperties} aria-hidden="true" />
          {i.nombre}
        </li>
      ))}
    </ul>
  );
}

export interface TablaDatos {
  columnas: readonly string[];
  filas: readonly (readonly (string | number)[])[];
}

interface PropsTarjeta {
  titulo: string;
  etapa: LetraEtapa;
  paso?: string;
  /** La lectura principal del gráfico, en una frase. Es lo primero que se lee. */
  lectura?: ReactNode;
  leyenda?: readonly ItemLeyenda[];
  datos?: TablaDatos;
  nota?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Tarjeta({ titulo, etapa, paso, lectura, leyenda, datos, nota, className, children }: PropsTarjeta) {
  return (
    <section className={`${estilos.tarjeta} ${className ?? ''}`}>
      <header className={estilos.cabeceraTarjeta}>
        <ChipEtapa etapa={etapa} texto={paso ?? etapa} />
        <h3 className={estilos.tituloTarjeta}>{titulo}</h3>
      </header>
      {lectura && <p className={estilos.lectura}>{lectura}</p>}
      {leyenda && leyenda.length > 0 && <Leyenda items={leyenda} />}
      <div className={estilos.cuerpo}>{children}</div>
      {nota && <p className={estilos.nota}>{nota}</p>}
      {datos && datos.filas.length > 0 && (
        <details className={estilos.datos}>
          <summary>Ver datos</summary>
          <div className={estilos.tablaDesplazable}>
            <table>
              <thead>
                <tr>
                  {datos.columnas.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.filas.map((f, i) => (
                  <tr key={i}>
                    {f.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

/** Texto del globo: título y líneas. */
export function ContenidoGlobo({ titulo, lineas }: { titulo: string; lineas: readonly ReactNode[] }) {
  return (
    <>
      <strong>{titulo}</strong>
      {lineas.map((l, i) => (
        <span key={i}>{l}</span>
      ))}
    </>
  );
}

const recortar = (t: string, max: number) => (t.length > max ? `${t.slice(0, Math.max(1, max - 1))}…` : t);
/** Parte una etiqueta en máximo dos líneas por palabras; recorta la segunda si no cabe. */
function lineasEtiqueta(texto: string, maxCar: number): string[] {
  if (texto.length <= maxCar) return [texto];
  const palabras = texto.split(' ');
  let primera = '';
  while (palabras.length && `${primera} ${palabras[0]}`.trim().length <= maxCar) primera = `${primera} ${palabras.shift()}`.trim();
  if (!primera) return [recortar(texto, maxCar)];
  return [primera, recortar(palabras.join(' '), maxCar)];
}

function EtiquetaFila({ texto, y, maxCar, x = 0 }: { texto: string; y: number; maxCar: number; x?: number }) {
  const lineas = lineasEtiqueta(texto, maxCar);
  return (
    <text x={x} y={lineas.length === 1 ? y + 4 : y - 3} className={estilos.etiquetaFila}>
      {lineas.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : 14}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

const ticks = (d0: number, d1: number, n: number) => Array.from({ length: n }, (_, i) => d0 + ((d1 - d0) * i) / (n - 1));

/* ------------------------------------------------------------------ */
/* Mancuernas: de dónde partió (anillo) a dónde llegó (punto lleno)     */
/* ------------------------------------------------------------------ */

export interface FilaMancuerna {
  clave: string;
  etiqueta: string;
  desde: number | null;
  hasta: number | null;
  /** Color del punto de llegada (por ejemplo, el estado del semáforo). */
  color?: string;
  /** Texto junto al punto de llegada; por omisión, formato(hasta). */
  valor?: string;
  globo: ReactNode;
}

export function Mancuernas({
  filas,
  dominio,
  referencia,
  formato,
  etiquetaEje,
  proporcionEtiqueta = 0.34,
}: {
  filas: readonly FilaMancuerna[];
  dominio: readonly [number, number];
  referencia?: { valor: number; etiqueta: string };
  formato: (v: number) => string;
  etiquetaEje?: string;
  /** Parte del ancho para los nombres de las filas. */
  proporcionEtiqueta?: number;
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const g = useGlobo();
  const izq = Math.min(230, Math.round(ancho * proporcionEtiqueta));
  const maxCar = Math.floor(izq / 6.6);
  const dosLineas = filas.some((f) => lineasEtiqueta(f.etiqueta, maxCar).length > 1);
  const alto_fila = dosLineas ? 40 : 34;
  const arriba = referencia ? 26 : 10;
  const abajo = 30;
  // Columna fija a la derecha para los valores: así nunca cruzan la línea de la meta.
  const der = 74;
  const alto = arriba + filas.length * alto_fila + abajo;
  const [d0, d1] = dominio;
  const x = (v: number) => izq + 8 + ((Math.min(Math.max(v, d0), d1) - d0) / (d1 - d0)) * (ancho - izq - der - 16);
  return (
    <div className={estilos.lienzo} data-lienzo ref={ref}>
      <svg width={ancho} height={alto} role="img" aria-label={`Gráfico de mancuernas con ${filas.length} filas`}>
        {ticks(d0, d1, 5).map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={arriba - 4} y2={alto - abajo + 4} className={estilos.rejilla} />
            <text x={x(t)} y={alto - abajo + 18} textAnchor="middle" className={estilos.eje}>
              {formato(t)}
            </text>
          </g>
        ))}
        {etiquetaEje && (
          <text x={ancho - der} y={alto - 2} textAnchor="end" className={estilos.eje}>
            {etiquetaEje}
          </text>
        )}
        {referencia && (
          <g>
            <line x1={x(referencia.valor)} x2={x(referencia.valor)} y1={arriba - 8} y2={alto - abajo + 4} className={estilos.referencia} />
            <text x={x(referencia.valor)} y={arriba - 12} textAnchor="middle" className={estilos.etiquetaReferencia}>
              {referencia.etiqueta}
            </text>
          </g>
        )}
        {filas.map((f, i) => {
          const y = arriba + i * alto_fila + alto_fila / 2;
          const xd = f.desde !== null ? x(f.desde) : null;
          const xh = f.hasta !== null ? x(f.hasta) : null;
          return (
            <g key={f.clave} className={estilos.filaMarca} {...g.marca(f.globo)}>
              <rect x={0} y={y - alto_fila / 2} width={ancho} height={alto_fila} className={estilos.zonaToque} />
              <EtiquetaFila texto={f.etiqueta} y={y} maxCar={maxCar} />
              {xd !== null && xh !== null && <line x1={xd} x2={xh} y1={y} y2={y} className={estilos.lineaMancuerna} />}
              {xd !== null && <circle cx={xd} cy={y} r={5} className={estilos.anillo} />}
              {xh !== null && <circle cx={xh} cy={y} r={6.5} fill={f.color ?? 'var(--grafico-1)'} className={estilos.puntoLleno} />}
              {xh !== null && (
                <text x={ancho} y={y + 4} textAnchor="end" className={estilos.valorFila}>
                  {f.valor ?? formato(f.hasta!)}
                </text>
              )}
              {xh === null && (
                <text x={izq} y={y + 4} className={estilos.eje}>
                  Sin dato
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <Globo info={g.info} ancho={ancho} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Curva: líneas sobre categorías ordenadas, con bandas de lectura      */
/* ------------------------------------------------------------------ */

export interface SerieCurva {
  nombre: string;
  color: string;
  valores: readonly (number | null)[];
  /** Serie de contexto: más tenue y punteada. */
  contexto?: boolean;
}

export function Curva({
  categorias,
  series,
  dominio,
  bandas = [],
  formato,
  alto = 260,
  categoriasLargas,
}: {
  /** Nombres cortos para el eje; los largos (opcionales) salen en el globo. */
  categoriasLargas?: readonly string[];
  categorias: readonly string[];
  series: readonly SerieCurva[];
  dominio: readonly [number, number];
  bandas?: readonly { desde: number; hasta: number; etiqueta: string; color: string }[];
  formato: (v: number) => string;
  alto?: number;
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const [activo, setActivo] = useState<number | null>(null);
  const izq = 34;
  const der = 22;
  const arriba = 14;
  const abajo = 40;
  const [d0, d1] = dominio;
  const n = categorias.length;
  const paso = (ancho - izq - der) / Math.max(1, n);
  const x = (i: number) => izq + paso * (i + 0.5);
  const y = (v: number) => arriba + (1 - (v - d0) / (d1 - d0)) * (alto - arriba - abajo);
  const camino = (vals: readonly (number | null)[]) =>
    vals.reduce<string>((acc, v, i) => (v === null ? acc : `${acc}${acc === '' || vals[i - 1] === null ? 'M' : 'L'}${x(i)},${y(v)}`), '');
  const ultimaFila = series.map((s) => {
    const i = [...s.valores].map((v, k) => (v === null ? -1 : k)).filter((k) => k >= 0).at(-1);
    return i === undefined ? null : { i, v: s.valores[i] as number };
  });
  return (
    <div className={estilos.lienzo} data-lienzo ref={ref}>
      <svg width={ancho} height={alto} role="img" aria-label={`Curva con ${series.length} series en ${n} momentos`}>
        {bandas.map((b) => (
          <g key={b.etiqueta}>
            <rect x={izq} width={ancho - izq - der} y={y(b.hasta)} height={y(b.desde) - y(b.hasta)} fill={b.color} className={estilos.banda} />
            <text x={izq + 8} y={y(b.hasta) + 14} className={estilos.etiquetaBanda}>
              {b.etiqueta}
            </text>
          </g>
        ))}
        {ticks(d0, d1, d1 - d0 + 1).map((t) => (
          <g key={t}>
            <line x1={izq} x2={ancho - der} y1={y(t)} y2={y(t)} className={estilos.rejilla} />
            <text x={izq - 8} y={y(t) + 4} textAnchor="end" className={estilos.eje}>
              {formato(t)}
            </text>
          </g>
        ))}
        {categorias.map((c, i) => (
          <text key={c} x={x(i)} y={alto - abajo + 20} textAnchor="middle" className={estilos.ejeCategoria}>
            {recortar(c, Math.floor(paso / 6.2))}
          </text>
        ))}
        {activo !== null && <line x1={x(activo)} x2={x(activo)} y1={arriba} y2={alto - abajo} className={estilos.cruz} />}
        {series.map((s) => (
          <path key={s.nombre} d={camino(s.valores)} fill="none" stroke={s.color} className={s.contexto ? estilos.lineaContexto : estilos.linea} />
        ))}
        {series.map((s) =>
          s.valores.map((v, i) =>
            v === null ? null : (
              <circle key={`${s.nombre}-${i}`} cx={x(i)} cy={y(v)} r={activo === i ? 6 : 4.5} fill={s.contexto ? 'var(--bg-card)' : s.color} stroke={s.contexto ? s.color : 'var(--bg-card)'} strokeWidth={2} />
            ),
          ),
        )}
        {series.map((s, k) => {
          const u = ultimaFila[k];
          if (!u) return null;
          const otro = ultimaFila.find((o, j) => j !== k && o && o.i === u.i);
          const arribaDelOtro = !otro || u.v >= otro.v;
          return (
            <text key={`et-${s.nombre}`} x={x(u.i)} y={y(u.v) + (arribaDelOtro ? -12 : 20)} textAnchor="middle" className={estilos.etiquetaSerie}>
              {s.nombre} · {formato(u.v)}
            </text>
          );
        })}
        {categorias.map((c, i) => (
          <rect
            key={`zona-${c}`}
            x={x(i) - paso / 2}
            width={paso}
            y={arriba}
            height={alto - arriba - abajo}
            className={estilos.zonaToque}
            tabIndex={0}
            onPointerEnter={() => setActivo(i)}
            onPointerLeave={() => setActivo(null)}
            onFocus={() => setActivo(i)}
            onBlur={() => setActivo(null)}
          />
        ))}
      </svg>
      {activo !== null && (
        <div className={estilos.globo} style={{ left: Math.min(Math.max(x(activo), 90), ancho - 90), top: arriba + 8 } as CSSProperties} role="status">
          <strong>{categoriasLargas?.[activo] ?? categorias[activo]}</strong>
          {series.map((s) => (
            <span key={s.nombre} className={estilos.lineaGlobo}>
              <i style={{ background: s.color }} aria-hidden="true" />
              {s.nombre}: {s.valores[activo] === null ? '—' : formato(s.valores[activo] as number)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barras apiladas al 100 %                                             */
/* ------------------------------------------------------------------ */

export interface CategoriaApilada {
  nombre: string;
  color: string;
  /** Tinta del número dentro del segmento (blanca sobre colores oscuros). */
  tinta?: 'clara' | 'oscura';
}

export function Apiladas({
  filas,
  categorias,
  alto_fila = 30,
  etiquetaAncho,
  unidad = 'personas',
}: {
  filas: readonly { etiqueta: string; valores: readonly number[] }[];
  categorias: readonly CategoriaApilada[];
  alto_fila?: number;
  etiquetaAncho?: number;
  unidad?: string;
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const g = useGlobo();
  const izq = etiquetaAncho ?? (filas.length === 1 && !filas[0]?.etiqueta ? 0 : Math.min(120, Math.round(ancho * 0.26)));
  const gap = 10;
  const alto = filas.length * (alto_fila + gap);
  const util = ancho - izq;
  return (
    <div className={estilos.lienzo} data-lienzo ref={ref}>
      <svg width={ancho} height={alto} role="img" aria-label="Barras apiladas al 100 %">
        {filas.map((f, i) => {
          const total = f.valores.reduce((s, v) => s + v, 0);
          const y = i * (alto_fila + gap);
          let acum = 0;
          return (
            <g key={f.etiqueta || i}>
              {izq > 0 && (
                <text x={0} y={y + alto_fila / 2 + 4} className={estilos.etiquetaFila}>
                  {f.etiqueta}
                </text>
              )}
              {total === 0 && (
                <text x={izq} y={y + alto_fila / 2 + 4} className={estilos.eje}>
                  Sin datos
                </text>
              )}
              {total > 0 &&
                f.valores.map((v, k) => {
                  if (v === 0) return null;
                  const w = (v / total) * util;
                  const x0 = izq + (acum / total) * util;
                  acum += v;
                  const cat = categorias[k];
                  const pct = Math.round((v / total) * 100);
                  return (
                    <g key={k} {...g.marca(<ContenidoGlobo titulo={`${f.etiqueta ? `${f.etiqueta} · ` : ''}${cat?.nombre ?? ''}`} lineas={[`${v} ${unidad} (${pct} %)`]} />)}>
                      <rect x={x0 + 1} y={y} width={Math.max(1, w - 2)} height={alto_fila} rx={4} fill={cat?.color} />
                      {w > 34 && (
                        <text x={x0 + w / 2} y={y + alto_fila / 2 + 4} textAnchor="middle" className={cat?.tinta === 'clara' ? estilos.numeroClaro : estilos.numeroOscuro}>
                          {pct} %
                        </text>
                      )}
                    </g>
                  );
                })}
            </g>
          );
        })}
      </svg>
      <Globo info={g.info} ancho={ancho} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dona                                                                 */
/* ------------------------------------------------------------------ */

export function Dona({
  segmentos,
  centro,
  tamano = 156,
  grosor = 18,
  superficie = 'var(--bg-card)',
  oscura = false,
}: {
  segmentos: readonly { nombre: string; valor: number; color: string }[];
  centro: { valor: string; etiqueta: string };
  tamano?: number;
  grosor?: number;
  superficie?: string;
  oscura?: boolean;
}) {
  const g = useGlobo();
  const total = segmentos.reduce((s, x) => s + x.valor, 0);
  const r = tamano / 2 - grosor / 2 - 2;
  const c = tamano / 2;
  let acum = 0;
  const punto = (frac: number) => [c + r * Math.sin(frac * 2 * Math.PI), c - r * Math.cos(frac * 2 * Math.PI)] as const;
  return (
    <div className={estilos.lienzo} data-lienzo style={{ width: tamano }}>
      <svg width={tamano} height={tamano} role="img" aria-label={`Dona: ${segmentos.map((s) => `${s.nombre} ${s.valor}`).join(', ')}`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={oscura ? 'rgba(255,255,255,0.12)' : 'var(--grafico-rejilla)'} strokeWidth={grosor} />
        {total > 0 &&
          segmentos.map((s) => {
            if (s.valor === 0) return null;
            const ini = acum / total;
            acum += s.valor;
            const fin = acum / total;
            const [x0, y0] = punto(ini);
            const [x1, y1] = punto(fin - 1e-6);
            const grande = fin - ini > 0.5 ? 1 : 0;
            const d = segmentos.filter((x) => x.valor > 0).length === 1 ? `M${c},${c - r} a${r},${r} 0 1,1 0,${2 * r} a${r},${r} 0 1,1 0,${-2 * r}` : `M${x0},${y0} A${r},${r} 0 ${grande} 1 ${x1},${y1}`;
            return (
              <path
                key={s.nombre}
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth={grosor}
                className={estilos.arco}
                style={{ '--superficie': superficie } as CSSProperties}
                {...g.marca(<ContenidoGlobo titulo={s.nombre} lineas={[`${s.valor} de ${total} (${Math.round((s.valor / total) * 100)} %)`]} />)}
              />
            );
          })}
        {total > 0 &&
          segmentos.length > 1 &&
          (() => {
            let a = 0;
            return segmentos.map((s) => {
              a += s.valor;
              const [x, y] = punto(a / total);
              const [xi, yi] = [c + (r - grosor / 2 - 1) * Math.sin((a / total) * 2 * Math.PI), c - (r - grosor / 2 - 1) * Math.cos((a / total) * 2 * Math.PI)];
              const [xe, ye] = [x + (x - c) * (grosor / 2 + 1) / r, y + (y - c) * (grosor / 2 + 1) / r];
              return s.valor > 0 ? <line key={`sep-${s.nombre}`} x1={xi} y1={yi} x2={xe} y2={ye} stroke={superficie} strokeWidth={2.5} /> : null;
            });
          })()}
        <text x={c} y={c + 4} textAnchor="middle" className={oscura ? estilos.centroDonaClaro : estilos.centroDona}>
          {centro.valor}
        </text>
        <text x={c} y={c + 22} textAnchor="middle" className={oscura ? estilos.subcentroDonaClaro : estilos.subcentroDona}>
          {centro.etiqueta}
        </text>
      </svg>
      <Globo info={g.info} ancho={tamano + 120} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barras horizontales de dos series apiladas                           */
/* ------------------------------------------------------------------ */

export function BarrasDobles({
  filas,
  series,
}: {
  filas: readonly { etiqueta: string; valores: readonly [number, number] }[];
  series: readonly [ItemLeyenda, ItemLeyenda];
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const g = useGlobo();
  const alto_fila = 22;
  const gap = 14;
  const izq = Math.min(200, Math.round(ancho * 0.36));
  const der = 40;
  const max = Math.max(1, ...filas.map((f) => f.valores[0] + f.valores[1]));
  const escala = (v: number) => (v / max) * (ancho - izq - der);
  const alto = filas.length * (alto_fila + gap);
  const maxCar = Math.floor(izq / 6.4);
  return (
    <div className={estilos.lienzo} data-lienzo ref={ref}>
      <svg width={ancho} height={alto} role="img" aria-label="Barras horizontales apiladas">
        {filas.map((f, i) => {
          const y = i * (alto_fila + gap) + 4;
          const [a, b] = f.valores;
          const total = a + b;
          return (
            <g key={f.etiqueta}>
              <text x={0} y={y + alto_fila / 2 + 4} className={estilos.etiquetaFila}>
                {recortar(f.etiqueta, maxCar)}
              </text>
              {[a, b].map((v, k) => {
                if (v === 0) return null;
                const x0 = izq + (k === 0 ? 0 : escala(a));
                const w = escala(v);
                return (
                  <g key={k} {...g.marca(<ContenidoGlobo titulo={f.etiqueta} lineas={[`${series[k as 0 | 1].nombre}: ${v}`, `Total: ${total} menciones`]} />)}>
                    <rect x={x0 + (k === 1 ? 1 : 0)} y={y} width={Math.max(1, w - 1)} height={alto_fila} rx={4} fill={series[k as 0 | 1].color} />
                    {w > 24 && (
                      <text x={x0 + w / 2} y={y + alto_fila / 2 + 4} textAnchor="middle" className={k === 0 ? estilos.numeroClaro : estilos.numeroOscuro}>
                        {v}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={izq + escala(total) + 8} y={y + alto_fila / 2 + 4} className={estilos.valorFila}>
                {total}
              </text>
            </g>
          );
        })}
      </svg>
      <Globo info={g.info} ancho={ancho} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mapa de calor (HTML): filas × columnas con rampa secuencial          */
/* ------------------------------------------------------------------ */

const RAMPA = ['var(--grafico-sec-1)', 'var(--grafico-sec-2)', 'var(--grafico-sec-3)', 'var(--grafico-sec-4)', 'var(--grafico-sec-5)'];

export function MapaCalor({
  filas,
  columnas,
  valores,
  dominio,
  formato,
}: {
  filas: readonly string[];
  columnas: readonly string[];
  valores: readonly (readonly (number | null)[])[];
  dominio: readonly [number, number];
  formato: (v: number) => string;
}) {
  const g = useGlobo();
  const [d0, d1] = dominio;
  const paso = (v: number) => Math.min(RAMPA.length - 1, Math.max(0, Math.floor(((v - d0) / (d1 - d0)) * RAMPA.length - 1e-9)));
  return (
    <div className={estilos.lienzo} data-lienzo>
      <div className={estilos.mapaCalor} style={{ gridTemplateColumns: `minmax(120px, 1.6fr) repeat(${columnas.length}, minmax(64px, 1fr))` }}>
        <span />
        {columnas.map((c) => (
          <span key={c} className={estilos.cabeceraCalor}>
            {c}
          </span>
        ))}
        {filas.map((f, i) => (
          <div key={f} className={estilos.filaCalor}>
            <span className={estilos.etiquetaCalor}>{f}</span>
            {columnas.map((c, j) => {
              const v = valores[i]?.[j] ?? null;
              const k = v === null ? -1 : paso(v);
              return (
                <span
                  key={c}
                  className={estilos.celdaCalor}
                  style={{ background: v === null ? 'var(--bg-soft)' : RAMPA[k], color: k >= 3 ? 'var(--text-on-dark)' : 'var(--text)' }}
                  {...g.marca(<ContenidoGlobo titulo={f} lineas={[`${c}: ${v === null ? 'sin dato' : `${formato(v)} de ${d1}`}`]} />)}
                >
                  {v === null ? '—' : formato(v)}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <div className={estilos.rampa} aria-hidden="true">
        <span>{formato(d0)}</span>
        {RAMPA.map((c) => (
          <i key={c} style={{ background: c }} />
        ))}
        <span>{formato(d1)}</span>
      </div>
      <Globo info={g.info} ancho={520} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Burbujas en una cuadrícula (simulador: aciertos × seguridad)         */
/* ------------------------------------------------------------------ */

export interface ZonaBurbujas {
  clave: string;
  nombre: string;
  color: string;
  /** Rango de la zona en las dos escalas (incluye los extremos). */
  x: readonly [number, number];
  y: readonly [number, number];
}

export function Burbujas({
  puntos,
  zonas,
  ejeX,
  ejeY,
  dominioX,
  dominioY,
  zonaDe,
}: {
  puntos: readonly { x: number; y: number; n: number }[];
  zonas: readonly ZonaBurbujas[];
  ejeX: string;
  ejeY: string;
  dominioX: readonly [number, number];
  dominioY: readonly [number, number];
  zonaDe: (x: number, y: number) => ZonaBurbujas;
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const g = useGlobo();
  const alto = 320;
  const izq = 44;
  const der = 14;
  const arriba = 24;
  const abajo = 42;
  const [x0, x1] = dominioX;
  const [y0, y1] = dominioY;
  const sx = (v: number) => izq + ((v - (x0 - 0.5)) / (x1 - x0 + 1)) * (ancho - izq - der);
  const sy = (v: number) => arriba + (1 - (v - (y0 - 0.5)) / (y1 - y0 + 1)) * (alto - arriba - abajo);
  const maxN = Math.max(1, ...puntos.map((p) => p.n));
  return (
    <div className={estilos.lienzo} data-lienzo ref={ref}>
      <svg width={ancho} height={alto} role="img" aria-label={`Burbujas: ${ejeX} contra ${ejeY}`}>
        {zonas.map((z) => (
          <g key={z.clave}>
            <rect
              x={sx(z.x[0] - 0.5)}
              y={sy(z.y[1] + 0.5)}
              width={sx(z.x[1] + 0.5) - sx(z.x[0] - 0.5)}
              height={sy(z.y[0] - 0.5) - sy(z.y[1] + 0.5)}
              fill={z.color}
              className={estilos.zonaBurbujas}
              rx={8}
            />
            <text x={sx(z.x[0] - 0.5) + 4} y={sy(z.y[1] + 0.5) - 6} className={estilos.etiquetaZona}>
              {z.nombre}
            </text>
          </g>
        ))}
        {Array.from({ length: x1 - x0 + 1 }, (_, i) => x0 + i).map((v) => (
          <text key={`x${v}`} x={sx(v)} y={alto - abajo + 18} textAnchor="middle" className={estilos.eje}>
            {v}
          </text>
        ))}
        {Array.from({ length: y1 - y0 + 1 }, (_, i) => y0 + i).map((v) => (
          <text key={`y${v}`} x={izq - 10} y={sy(v) + 4} textAnchor="end" className={estilos.eje}>
            {v}
          </text>
        ))}
        <text x={(izq + ancho - der) / 2} y={alto - 4} textAnchor="middle" className={estilos.ejeCategoria}>
          {ejeX}
        </text>
        <text x={12} y={(arriba + alto - abajo) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(arriba + alto - abajo) / 2})`} className={estilos.ejeCategoria}>
          {ejeY}
        </text>
        {puntos.map((p) => {
          const z = zonaDe(p.x, p.y);
          const r = 6 + Math.sqrt(p.n / maxN) * 12;
          return (
            <g key={`${p.x}-${p.y}`} {...g.marca(<ContenidoGlobo titulo={z.nombre} lineas={[`${p.n} ${p.n === 1 ? 'resultado' : 'resultados'}`, `${p.x} de 3 aciertos · seguridad ${p.y} de 5`]} />)}>
              <circle cx={sx(p.x)} cy={sy(p.y)} r={r} fill={z.color} className={estilos.burbuja} />
              {r >= 11 && (
                <text x={sx(p.x)} y={sy(p.y) + 4} textAnchor="middle" className={estilos.numeroClaro}>
                  {p.n}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <Globo info={g.info} ancho={ancho} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Medidor semicircular con zonas del semáforo                          */
/* ------------------------------------------------------------------ */

export function Medidor({
  valor,
  minimo,
  maximo,
  zonas,
  etiqueta,
}: {
  valor: number | null;
  minimo: number;
  maximo: number;
  zonas: readonly { hasta: number; color: string; nombre: string }[];
  etiqueta: string;
}) {
  const g = useGlobo();
  const ancho = 240;
  const alto = 150;
  const c = { x: ancho / 2, y: 124 };
  const r = 92;
  const grosor = 20;
  const angulo = (v: number) => Math.PI * (1 - (v - minimo) / (maximo - minimo));
  const punto = (v: number, radio = r) => [c.x + radio * Math.cos(angulo(v)), c.y - radio * Math.sin(angulo(v))] as const;
  let desde = minimo;
  return (
    <div className={estilos.lienzo} data-lienzo style={{ width: ancho }}>
      <svg width={ancho} height={alto} role="img" aria-label={`Medidor: ${valor ?? 'sin dato'} de ${maximo}`}>
        {zonas.map((z) => {
          const [ax, ay] = punto(desde);
          const [bx, by] = punto(z.hasta);
          const tramo = (
            <path
              key={z.nombre}
              d={`M${ax},${ay} A${r},${r} 0 0 1 ${bx},${by}`}
              fill="none"
              stroke={z.color}
              strokeWidth={grosor}
              className={estilos.zonaMedidor}
              {...g.marca(<ContenidoGlobo titulo={z.nombre} lineas={[`De ${Math.ceil(desde)} a ${Math.floor(z.hasta)} puntos`]} />)}
            />
          );
          desde = z.hasta;
          return tramo;
        })}
        {zonas.slice(0, -1).map((z) => {
          const [ix, iy] = punto(z.hasta, r - grosor / 2 - 1);
          const [ex, ey] = punto(z.hasta, r + grosor / 2 + 1);
          return <line key={`s-${z.nombre}`} x1={ix} y1={iy} x2={ex} y2={ey} stroke="var(--bg-card)" strokeWidth={3} />;
        })}
        {valor !== null && (
          <>
            <line x1={c.x} y1={c.y} x2={punto(valor, r - 6)[0]} y2={punto(valor, r - 6)[1]} className={estilos.aguja} />
            <circle cx={c.x} cy={c.y} r={7} className={estilos.ejeAguja} />
          </>
        )}
        <text x={punto(minimo, r)[0]} y={c.y + 20} textAnchor="middle" className={estilos.eje}>
          {minimo}
        </text>
        <text x={punto(maximo, r)[0]} y={c.y + 20} textAnchor="middle" className={estilos.eje}>
          {maximo}
        </text>
      </svg>
      <p className={estilos.etiquetaMedidor}>{etiqueta}</p>
      <Globo info={g.info} ancho={ancho + 60} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Barra divergente (negativo ← neutral → positivo)                    */
/* ------------------------------------------------------------------ */

export function Divergente({
  negativo,
  neutral,
  positivo,
}: {
  negativo: { nombre: string; partes: readonly { nombre: string; valor: number }[] };
  neutral: { nombre: string; valor: number };
  positivo: { nombre: string; partes: readonly { nombre: string; valor: number }[] };
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const g = useGlobo();
  const neg = negativo.partes.reduce((s, p) => s + p.valor, 0);
  const pos = positivo.partes.reduce((s, p) => s + p.valor, 0);
  const total = neg + pos + neutral.valor;
  const alto = 92;
  const yb = 40;
  const hb = 26;
  const medio = ancho / 2;
  const lado = Math.max(neg + neutral.valor / 2, pos + neutral.valor / 2, 1);
  const escala = (v: number) => (v / lado) * (medio - 12);
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0);
  const detalle = (partes: readonly { nombre: string; valor: number }[]) => partes.map((p) => `${p.nombre}: ${p.valor} (${pct(p.valor)} %)`);
  const wNeu = escala(neutral.valor);
  return (
    <div className={estilos.lienzo} data-lienzo ref={ref}>
      <svg width={ancho} height={alto} role="img" aria-label={`${pct(neg)} % negativo, ${pct(neutral.valor)} % neutral, ${pct(pos)} % positivo`}>
        <text x={12} y={yb - 12} className={estilos.cifraDivergente}>
          {pct(neg)} % {negativo.nombre.toLowerCase()}
        </text>
        <text x={ancho - 12} y={yb - 12} textAnchor="end" className={estilos.cifraDivergente}>
          {pct(pos)} % {positivo.nombre.toLowerCase()}
        </text>
        <g {...g.marca(<ContenidoGlobo titulo={negativo.nombre} lineas={detalle(negativo.partes)} />)}>
          <rect x={medio - wNeu / 2 - escala(neg)} y={yb} width={Math.max(0, escala(neg) - 1)} height={hb} rx={4} fill="var(--grafico-2)" />
        </g>
        <g {...g.marca(<ContenidoGlobo titulo={neutral.nombre} lineas={[`${neutral.valor} (${pct(neutral.valor)} %)`]} />)}>
          <rect x={medio - wNeu / 2} y={yb} width={Math.max(0, wNeu)} height={hb} rx={4} fill="var(--grafico-neutro)" />
        </g>
        <g {...g.marca(<ContenidoGlobo titulo={positivo.nombre} lineas={pos ? detalle(positivo.partes) : ['Ninguna respuesta con este tono']} />)}>
          <rect x={medio + wNeu / 2 + 1} y={yb} width={Math.max(pos ? 2 : 0, escala(pos) - 1)} height={hb} rx={4} fill="var(--grafico-1)" />
        </g>
        <line x1={medio} x2={medio} y1={yb - 4} y2={yb + hb + 4} className={estilos.ejeCentro} />
        <text x={medio} y={yb + hb + 20} textAnchor="middle" className={estilos.eje}>
          {neutral.nombre}
        </text>
      </svg>
      <Globo info={g.info} ancho={ancho} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Piruletas: un punto por categoría sobre una escala común             */
/* ------------------------------------------------------------------ */

export function Piruletas({
  filas,
  formato,
  promedio,
}: {
  filas: readonly { etiqueta: string; valor: number | null; globo: ReactNode }[];
  formato: (v: number) => string;
  promedio?: { valor: number; etiqueta: string };
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const g = useGlobo();
  const izq = Math.min(210, Math.round(ancho * 0.4));
  const maxCar = Math.floor(izq / 6.6);
  const alto_fila = filas.some((f) => lineasEtiqueta(f.etiqueta, maxCar).length > 1) ? 38 : 30;
  const der = 64;
  const arriba = promedio ? 22 : 6;
  const max = Math.max(0.0001, ...filas.map((f) => f.valor ?? 0), promedio?.valor ?? 0) * 1.05;
  const x = (v: number) => izq + 8 + (v / max) * (ancho - izq - der - 16);
  const alto = arriba + filas.length * alto_fila + 6;
  return (
    <div className={estilos.lienzo} data-lienzo ref={ref}>
      <svg width={ancho} height={alto} role="img" aria-label="Gráfico de piruletas">
        {promedio && (
          <g>
            <line x1={x(promedio.valor)} x2={x(promedio.valor)} y1={arriba - 6} y2={alto - 4} className={estilos.referencia} />
            <text x={x(promedio.valor)} y={arriba - 10} textAnchor="middle" className={estilos.etiquetaReferencia}>
              {promedio.etiqueta}
            </text>
          </g>
        )}
        {filas.map((f, i) => {
          const y = arriba + i * alto_fila + alto_fila / 2;
          return (
            <g key={f.etiqueta} className={estilos.filaMarca} {...g.marca(f.globo)}>
              <rect x={0} y={y - alto_fila / 2} width={ancho} height={alto_fila} className={estilos.zonaToque} />
              <EtiquetaFila texto={f.etiqueta} y={y} maxCar={maxCar} />
              <line x1={izq + 8} x2={ancho - der} y1={y} y2={y} className={estilos.rejilla} />
              {f.valor !== null && (
                <>
                  <line x1={izq + 8} x2={x(f.valor)} y1={y} y2={y} className={estilos.tallo} />
                  <circle cx={x(f.valor)} cy={y} r={6} className={estilos.puntoLleno} fill="var(--grafico-3)" />
                  <text x={ancho} y={y + 4} textAnchor="end" className={estilos.valorFila}>
                    {formato(f.valor)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <Globo info={g.info} ancho={ancho} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mariposa: dos lados que se restan (FODA)                             */
/* ------------------------------------------------------------------ */

export function Mariposa({
  filas,
}: {
  filas: readonly {
    etiqueta: string;
    izquierda: { nombre: string; valor: number };
    derecha: { nombre: string; valor: number };
  }[];
}) {
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const g = useGlobo();
  const alto_fila = 58;
  const balance = 46;
  const medio = (ancho - balance) / 2;
  const max = Math.max(1, ...filas.flatMap((f) => [f.izquierda.valor, f.derecha.valor]));
  const escala = (v: number) => (v / max) * (medio - 8);
  const alto = filas.length * alto_fila + 8;
  return (
    <div className={estilos.lienzo} data-lienzo ref={ref}>
      <svg width={ancho} height={alto} role="img" aria-label="Gráfico mariposa">
        {filas.map((f, i) => {
          const y = i * alto_fila + 20;
          const b = f.derecha.valor - f.izquierda.valor;
          return (
            <g key={f.etiqueta}>
              <text x={0} y={y - 6} className={estilos.ejeCategoria}>
                {f.etiqueta}
              </text>
              <g {...g.marca(<ContenidoGlobo titulo={f.izquierda.nombre} lineas={[`${f.izquierda.valor} puntos`]} />)}>
                <rect x={medio - escala(f.izquierda.valor)} y={y} width={Math.max(0, escala(f.izquierda.valor) - 1)} height={22} rx={4} fill="var(--grafico-2)" />
                <text x={medio - escala(f.izquierda.valor) + 6} y={y + 15} className={estilos.numeroOscuro}>
                  {f.izquierda.nombre} {f.izquierda.valor}
                </text>
              </g>
              <g {...g.marca(<ContenidoGlobo titulo={f.derecha.nombre} lineas={[`${f.derecha.valor} puntos`]} />)}>
                <rect x={medio + 1} y={y} width={Math.max(0, escala(f.derecha.valor) - 1)} height={22} rx={4} fill="var(--grafico-1)" />
                <text x={medio + escala(f.derecha.valor) - 6} y={y + 15} textAnchor="end" className={estilos.numeroClaro}>
                  {f.derecha.nombre} {f.derecha.valor}
                </text>
              </g>
              <text x={ancho - 4} y={y + 15} textAnchor="end" className={estilos.balance}>
                {b > 0 ? `+${b}` : b}
              </text>
            </g>
          );
        })}
        <line x1={medio} x2={medio} y1={8} y2={alto} className={estilos.ejeCentro} />
      </svg>
      <Globo info={g.info} ancho={ancho} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Minitendencia para los indicadores clave                             */
/* ------------------------------------------------------------------ */

export function Minitendencia({ valores, color = 'var(--grafico-1)', ancho = 104, alto = 36 }: { valores: readonly (number | null)[]; color?: string; ancho?: number; alto?: number }) {
  const v = valores.filter((x): x is number => x !== null);
  if (v.length < 2) return null;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const x = (i: number) => 4 + (i / (valores.length - 1)) * (ancho - 8);
  const y = (n: number) => (max === min ? alto / 2 : 4 + (1 - (n - min) / (max - min)) * (alto - 8));
  const d = valores.reduce<string>((acc, n, i) => (n === null ? acc : `${acc}${acc ? 'L' : 'M'}${x(i)},${y(n)}`), '');
  const ultimo = valores.length - 1;
  return (
    <svg width={ancho} height={alto} aria-hidden="true" className={estilos.minitendencia}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {valores[ultimo] !== null && <circle cx={x(ultimo)} cy={y(valores[ultimo] as number)} r={3.5} fill={color} stroke="var(--bg-card)" strokeWidth={1.5} />}
    </svg>
  );
}
