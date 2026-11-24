import type { CSSProperties } from 'react';
import { RECORRIDO } from '../../contenido/pasos';
import estilos from './RecorridoCinta.module.css';

/**
 * El recorrido en 11 pasos como una cinta que baja en zigzag: cada curva es un
 * paso (impares a la derecha, pares a la izquierda) y las etiquetas de fase van
 * sobre la cinta donde empieza cada fase. La cinta cambia de color por fase.
 * En pantallas angostas se ve como una lista vertical (solo CSS).
 */

/** Color de cada fase (tokens --recorrido-*). */
const COLOR_FASE: Readonly<Record<string, string>> = {
  Entender: 'var(--recorrido-entender)',
  Escuchar: 'var(--recorrido-escuchar)',
  Comunicar: 'var(--recorrido-comunicar)',
  Acompañar: 'var(--recorrido-acompanar)',
  Transformar: 'var(--recorrido-transformar)',
  Comprobar: 'var(--recorrido-comprobar)',
};
const colorDe = (verbo: string) => COLOR_FASE[verbo] ?? 'var(--recorrido-entender)';

/* ---------- Geometría (en px del dibujo) ---------- */
const ANCHO = 360;
const X_IZQ = 44;
const X_DER = ANCHO - 44;
const PASO_Y = 80;
const Y_INICIO = 30;
const X_INICIO = ANCHO * 0.42;
const Y_PRIMERO = 92;
const X_LLEGADA = ANCHO * 0.64;

interface Punto {
  x: number;
  y: number;
}
type Curva = [Punto, Punto, Punto, Punto];

const ultimo = RECORRIDO.length - 1;
/** Un nodo por paso: impares a la derecha, pares a la izquierda; el último es la llegada. */
const NODOS: Punto[] = RECORRIDO.map((_, i) => ({
  x: i === ultimo ? X_LLEGADA : i % 2 === 0 ? X_DER : X_IZQ,
  y: Y_PRIMERO + i * PASO_Y,
}));
const ALTO = (NODOS.at(-1)?.y ?? 0) + 56;

/**
 * Tramos de la cinta. Entre dos nodos, la curva sale y llega en vertical y
 * cruza en horizontal a media altura: así cada nodo queda en el borde de la curva.
 */
const CURVAS: Curva[] = NODOS.map((b, i) => {
  if (i === 0) {
    const a = { x: X_INICIO, y: Y_INICIO };
    return [a, { x: X_DER - 40, y: Y_INICIO }, { x: X_DER, y: Y_INICIO }, b];
  }
  const a = NODOS[i - 1] as Punto;
  if (i === ultimo) return [a, { x: a.x, y: a.y + (b.y - a.y) * 0.85 }, { x: a.x + 12, y: b.y }, b];
  return [a, { x: a.x, y: b.y }, { x: b.x, y: a.y }, b];
});

const RUTA_CINTA = CURVAS.map(([a, c1, c2, b], i) => `${i === 0 ? `M${a.x} ${a.y} ` : ''}C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`).join(' ');

/** Punto de una curva en t (para poner la etiqueta de fase a mitad del tramo). */
function enCurva([a, c1, c2, b]: Curva, t: number): Punto {
  const u = 1 - t;
  const f = (k: 'x' | 'y') => u * u * u * a[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * b[k];
  return { x: f('x'), y: f('y') };
}

/** Pasos con su número, lado y si empiezan una fase nueva. */
const PASOS = RECORRIDO.map((p, i) => ({
  ...p,
  numero: i + 1,
  nodo: NODOS[i] as Punto,
  lado: i === ultimo || i % 2 === 0 ? ('derecha' as const) : ('izquierda' as const),
  empiezaFase: i === 0 || RECORRIDO[i - 1]?.verbo !== p.verbo,
}));

/** Etiqueta de cada fase: sobre el inicio de la cinta, o a mitad del tramo que llega a su primer paso. */
const ETIQUETAS = PASOS.filter((p) => p.empiezaFase).map((p) => {
  const i = p.numero - 1;
  // En el último tramo la mitad cae en la curva de la esquina: la etiqueta va más adelante, en la parte recta.
  const lugar = i === 0 ? { x: X_INICIO, y: Y_INICIO } : enCurva(CURVAS[i] as Curva, i === ultimo ? 0.72 : 0.5);
  return { verbo: p.verbo, ...lugar };
});

/**
 * Degradado de la cinta: cada fase toma su color a la altura de su etiqueta y lo
 * mantiene hasta poco antes de la siguiente; así la mezcla entre dos fases es
 * corta y no aparecen tonos grises (morado + turquesa).
 */
const TRANSICION = 0.035;
const PARADAS = ETIQUETAS.flatMap((e, j) => {
  const desde = Math.max(0, e.y) / ALTO;
  const siguiente = ETIQUETAS[j + 1];
  const hasta = siguiente ? Math.max(desde, siguiente.y / ALTO - TRANSICION) : 1;
  return [
    { color: colorDe(e.verbo), desde },
    { color: colorDe(e.verbo), desde: hasta },
  ];
});

/** Burbujas decorativas junto a algunos nodos. */
const BURBUJAS = PASOS.filter((_, i) => i % 3 === 0 && i !== ultimo).map((p) => ({
  x: p.nodo.x + (p.lado === 'derecha' ? 22 : -22),
  y: p.nodo.y - 26,
  color: colorDe(p.verbo),
}));

export function RecorridoCinta() {
  return (
    <div className={estilos.recorrido} style={{ '--ancho-cinta': `${ANCHO}px`, '--alto-cinta': `${ALTO}px` } as CSSProperties}>
      <svg className={estilos.cinta} width={ANCHO} height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`} aria-hidden="true">
        <defs>
          <linearGradient id="degradado-recorrido" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={ALTO}>
            {PARADAS.map((p, i) => (
              <stop key={i} offset={p.desde} style={{ stopColor: p.color }} />
            ))}
          </linearGradient>
        </defs>

        {/* Líneas punteadas del nodo al texto. */}
        {PASOS.map((p) => (
          <line
            key={`guia-${p.numero}`}
            className={estilos.guia}
            x1={p.lado === 'derecha' ? p.nodo.x + 16 : p.nodo.x - 16}
            x2={p.lado === 'derecha' ? ANCHO : 0}
            y1={p.nodo.y}
            y2={p.nodo.y}
          />
        ))}

        {/* La cinta: resplandor, cuerpo y brillo. */}
        <path className={estilos.resplandor} d={RUTA_CINTA} stroke="url(#degradado-recorrido)" />
        <path className={estilos.cuerpo} d={RUTA_CINTA} stroke="url(#degradado-recorrido)" />
        <path className={estilos.brillo} d={RUTA_CINTA} />

        {BURBUJAS.map((b) => (
          <g key={`${b.x}-${b.y}`} style={{ fill: b.color }}>
            <circle cx={b.x} cy={b.y} r={3.5} className={estilos.burbuja} />
            <circle cx={b.x + 9} cy={b.y - 7} r={2} className={estilos.burbuja} />
          </g>
        ))}

        {PASOS.map((p, i) => (
          <g key={`nodo-${p.numero}`} className={estilos.nodo} data-llegada={i === ultimo}>
            <circle cx={p.nodo.x} cy={p.nodo.y} r={i === ultimo ? 14 : 12} className={estilos.aro} />
            <circle cx={p.nodo.x} cy={p.nodo.y} r={i === ultimo ? 9 : 6} style={{ fill: colorDe(p.verbo) }} />
          </g>
        ))}
      </svg>

      {/* Etiquetas de fase sobre la cinta. */}
      <div className={estilos.etiquetas} aria-hidden="true">
        {ETIQUETAS.map((e) => (
          <span key={e.verbo} className={estilos.etiqueta} style={{ '--x': `${e.x}px`, '--y': `${e.y}px` } as CSSProperties}>
            {e.verbo}
          </span>
        ))}
      </div>

      <ol className={estilos.pasos}>
        {PASOS.map((p) => (
          <li
            key={p.numero}
            className={estilos.paso}
            data-lado={p.lado}
            style={{ '--y': `${p.nodo.y}px`, '--color': colorDe(p.verbo) } as CSSProperties}
          >
            {p.empiezaFase && <span className={estilos.fase}>{p.verbo}</span>}
            <span className={`${estilos.numero} numero`}>{String(p.numero).padStart(2, '0')}.</span>
            <p className={estilos.pregunta}>{p.pregunta}</p>
            <p className={estilos.herramienta}>{p.herramienta}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
