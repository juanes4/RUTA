import { useMemo } from 'react';
import type { FilaUso } from '../../lib/modelo/tipos';
import { resumirUsoPorCiclo } from '../../lib/tablero/calculoUsoCiclos';
import estilos from './VisualizacionesTablero.module.css';

interface Props {
  uso?: readonly FilaUso[];
  metaAdopcion?: number; // default 0.9 (90%)
}

interface PuntoSvg {
  x: number;
  y: number;
  etiqueta: string;
  subetiqueta: string;
  ciclo: number;
}

/**
 * Gráfica de área ondulada con pines flotantes de valor (estilo "EARNING" de la referencia).
 * Muestra la evolución de adopción en transacciones a lo largo de los ciclos registrados.
 * Sin emojis.
 */
export function GraficoCurvaAdopcion({ uso = [], metaAdopcion = 0.9 }: Props) {
  const resumen = useMemo(() => resumirUsoPorCiclo(uso), [uso]);

  const ancho = 640;
  const alto = 140;
  const margenX = 50;
  const margenSup = 44;
  const margenInf = 24;
  const altoGrafica = alto - margenSup - margenInf;

  // Calculamos los puntos reales si hay ciclos
  const puntos: PuntoSvg[] = useMemo(() => {
    if (resumen.length === 0) return [];
    const primerCiclo = resumen[0];
    if (resumen.length === 1 && primerCiclo) {
      const tasa = primerCiclo.tasaAdopcion ?? 0;
      return [
        {
          x: ancho / 2,
          y: alto - margenInf - tasa * altoGrafica,
          etiqueta: `${Math.round(tasa * 100)}%`,
          subetiqueta: `Ciclo ${primerCiclo.ciclo}`,
          ciclo: primerCiclo.ciclo,
        },
      ];
    }
    const pasoX = (ancho - 2 * margenX) / (resumen.length - 1);
    return resumen.map((c, i) => {
      const tasa = c.tasaAdopcion ?? 0;
      return {
        x: margenX + i * pasoX,
        y: alto - margenInf - tasa * altoGrafica,
        etiqueta: `${Math.round(tasa * 100)}%`,
        subetiqueta: `Ciclo ${c.ciclo}`,
        ciclo: c.ciclo,
      };
    });
  }, [resumen, ancho, alto, altoGrafica, margenX, margenInf]);

  // Generamos el path suave bezier
  const { pathLinea, pathArea } = useMemo(() => {
    if (puntos.length < 2) return { pathLinea: '', pathArea: '' };

    const primerPunto = puntos[0];
    const ultimoPunto = puntos[puntos.length - 1];
    if (!primerPunto || !ultimoPunto) return { pathLinea: '', pathArea: '' };

    let d = `M ${primerPunto.x} ${primerPunto.y}`;
    for (let i = 0; i < puntos.length - 1; i++) {
      const pActual = puntos[i];
      const pSiguiente = puntos[i + 1];
      if (!pActual || !pSiguiente) continue;

      const cpX1 = pActual.x + (pSiguiente.x - pActual.x) / 2;
      const cpY1 = pActual.y;
      const cpX2 = pActual.x + (pSiguiente.x - pActual.x) / 2;
      const cpY2 = pSiguiente.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${pSiguiente.x} ${pSiguiente.y}`;
    }

    const fondoY = alto - margenInf;
    const area = `${d} L ${ultimoPunto.x} ${fondoY} L ${primerPunto.x} ${fondoY} Z`;

    return { pathLinea: d, pathArea: area };
  }, [puntos, alto, margenInf]);

  // Proyección de meta visual (90%)
  const yMeta = alto - margenInf - metaAdopcion * altoGrafica;

  return (
    <article className={estilos.panelOnda}>
      <header className={estilos.cabeceraPanel}>
        <div>
          <h3 className={estilos.tituloPanel}>Trayectoria de adopción por ciclos</h3>
          <p className={estilos.subtituloPanel}>
            Proporción de transacciones realizadas con el nuevo sistema frente al método antiguo
          </p>
        </div>
      </header>

      {resumen.length === 0 ? (
        <div className={estilos.estadoSinDatoHero}>
          <p>
            <strong>Aún no hay ciclos de uso registrados.</strong>
          </p>
          <p className={estilos.detalle}>
            Al registrar transacciones por ciclo en el paso U.5 (Etapa U), esta gráfica trazará la curva de adopción y los pines de medición automática.
          </p>
        </div>
      ) : (
        <>
          <div className={estilos.svgOndaContenedor}>
            <svg
              className={estilos.svgOnda}
              viewBox={`0 0 ${ancho} ${alto}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="gradienteOnda" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--pastel-blue)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--pastel-blue)" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Línea horizontal punteada de la meta */}
              <line
                x1={margenX}
                y1={yMeta}
                x2={ancho - margenX}
                y2={yMeta}
                stroke="var(--positive)"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />

              {/* Área y línea de la onda */}
              {pathArea && <path d={pathArea} fill="url(#gradienteOnda)" />}
              {pathLinea && <path d={pathLinea} className={estilos.trazoOnda} />}

              {/* Pines flotantes estilo marcador sobre cada ciclo */}
              {puntos.map((p) => {
                const pinW = 44;
                const pinH = 26;
                const pinX = p.x - pinW / 2;
                const pinY = p.y - pinH - 12;

                return (
                  <g key={p.ciclo} className={estilos.pinFlotanteValor}>
                    {/* Línea conectora hacia el punto */}
                    <line
                      x1={p.x}
                      y1={pinY + pinH}
                      x2={p.x}
                      y2={p.y}
                      stroke="var(--bg-dark)"
                      strokeWidth="1.5"
                    />
                    {/* Punto sobre la curva */}
                    <circle cx={p.x} cy={p.y} r="4" fill="var(--bg-card)" stroke="var(--bg-dark)" strokeWidth="2.5" />
                    {/* Burbuja / cápsula flotante con el valor */}
                    <rect
                      x={pinX}
                      y={pinY}
                      width={pinW}
                      height={pinH}
                      rx="13"
                      className={estilos.cuerpoPin}
                    />
                    <text x={p.x} y={pinY + pinH / 2} className={estilos.textoPin}>
                      {p.etiqueta}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <ul className={estilos.ejeCiclos}>
            {resumen.map((c) => (
              <li key={c.ciclo} className={estilos.puntoEjeCiclo}>
                <span className={estilos.marcaEjeCiclo} aria-hidden="true" />
                <span className={estilos.etiquetaEjeCiclo}>Ciclo {c.ciclo}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <footer className={estilos.resumenOndaPie}>
        <div className={estilos.leyendaOnda}>
          <span className={estilos.indicadorMuestraOnda}>
            <span className={estilos.lineaMuestraOnda} aria-hidden="true" />
            Curva de adopción alcanzada
          </span>
          <span className={estilos.indicadorMuestraOnda}>
            <span
              style={{
                width: 16,
                borderTop: '1.5px dashed var(--positive)',
                display: 'inline-block',
              }}
              aria-hidden="true"
            />
            Meta esperada (≥ {Math.round(metaAdopcion * 100)}%)
          </span>
        </div>
        <span>Fuente: Registro de uso por ciclo (Etapa U)</span>
      </footer>
    </article>
  );
}
