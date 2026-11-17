import { useMemo, useState, type CSSProperties } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { pastelPorIndice } from '../../config/paleta';
import type { ParticipacionArea } from '../../lib/calculo/participacion';
import { formatearValor } from '../../lib/formato';
import type { FilaRespuesta } from '../../lib/modelo/tipos';
import {
  prepararBarrasAdkar,
  prepararBarrasIndicadores,
} from '../../lib/tablero/calculoBarras';
import type { FilaIndicador } from '../../lib/tablero/construirTablero';
import estilos from './VisualizacionesTablero.module.css';

type ModoBarra = 'kpis' | 'areas' | 'adkar';

interface Props {
  filas?: readonly FilaIndicador[];
  areas?: readonly ParticipacionArea[];
  respuestas?: readonly FilaRespuesta[];
  metaParticipacion?: number; // default 0.7 (70%)
}

/**
 * Gráfico de barras en píldora con leyenda lateral (estilo "SUBSCRIPTIONS" de la referencia).
 * Permite visualizar el cumplimiento de metas de KPIs, la participación por área o el diagnóstico ADKAR.
 * Sin emojis.
 */
export function GraficoBarrasPildora({
  filas = [],
  areas = [],
  respuestas = [],
  metaParticipacion = 0.7,
}: Props) {
  const [modo, setModo] = useState<ModoBarra>('kpis');

  const barrasKpis = useMemo(() => prepararBarrasIndicadores(filas), [filas]);
  const barrasAdkar = useMemo(() => prepararBarrasAdkar(respuestas), [respuestas]);

  const metaPorcentaje = Math.round(metaParticipacion * 100);

  return (
    <article className={estilos.panelGraficoBarras}>
      <header className={estilos.cabeceraConPestañas}>
        <div>
          <h3 className={estilos.tituloPanel}>
            {modo === 'kpis' && 'Cumplimiento de indicadores'}
            {modo === 'areas' && 'Participación por área'}
            {modo === 'adkar' && 'Diagnóstico ADKAR'}
          </h3>
          <p className={estilos.subtituloPanel}>
            {modo === 'kpis' && 'Barras de avance de los 8 KPIs frente a la meta esperada'}
            {modo === 'areas' && 'Respuestas recibidas frente al total de colaboradores afectados'}
            {modo === 'adkar' && 'Puntaje de las 5 dimensiones con umbral de bloqueo a 3.0'}
          </p>
        </div>

        {/* Selector de modo de barras */}
        <div className={estilos.grupoPestañasBarra} role="group" aria-label="Modo de gráfico de barras">
          <button
            type="button"
            className={`${estilos.botonPestañaBarra} ${modo === 'kpis' ? estilos.botonPestañaBarraActivo : ''}`}
            onClick={() => setModo('kpis')}
            aria-pressed={modo === 'kpis'}
          >
            Metas (KPIs)
          </button>
          <button
            type="button"
            className={`${estilos.botonPestañaBarra} ${modo === 'areas' ? estilos.botonPestañaBarraActivo : ''}`}
            onClick={() => setModo('areas')}
            aria-pressed={modo === 'areas'}
          >
            Áreas
          </button>
          <button
            type="button"
            className={`${estilos.botonPestañaBarra} ${modo === 'adkar' ? estilos.botonPestañaBarraActivo : ''}`}
            onClick={() => setModo('adkar')}
            aria-pressed={modo === 'adkar'}
          >
            ADKAR
          </button>
        </div>
      </header>

      {/* 1. MODO KPIS (Cumplimiento de las 8 metas) */}
      {modo === 'kpis' && (
        <div className={estilos.cuerpoGraficoBarras}>
          <div className={estilos.areaVisualBarras}>
            <div className={estilos.rejillaBarras}>
              {/* Línea horizontal promedio de referencia (75%) */}
              <div className={estilos.lineaGuiaMetaHorizontal} style={{ bottom: '75%' }}>
                <span className={estilos.etiquetaMetaHorizontal}>Ref. 75%</span>
              </div>

              {barrasKpis.map((b, indice) => {
                const tieneValor = b.porcentajeValor !== null;
                const alturaPorcentaje = tieneValor ? b.porcentajeValor! : b.porcentajeMeta;
                const alturaCss = `${Math.max(14, Math.min(100, alturaPorcentaje))}%`;
                const fondoBarra = pastelPorIndice(indice);

                return (
                  <div key={b.id} className={estilos.columnaBarra} title={`${b.nombre}: ${b.textoValor} (Meta: ${b.textoMeta})`}>
                    <div
                      className={estilos.barraPildora}
                      style={
                        {
                          height: alturaCss,
                          '--fondo-barra': fondoBarra,
                          opacity: tieneValor ? 1 : 0.65,
                          borderStyle: tieneValor ? 'solid' : 'dashed',
                        } as CSSProperties
                      }
                    >
                      <span className={estilos.valorDentroBarra}>
                        {tieneValor ? `${b.porcentajeValor}%` : 'Meta'}
                      </span>
                    </div>
                    <span className={estilos.etiquetaAreaEje} title={b.nombre}>
                      {b.etiquetaCorta}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leyenda lateral con viñetas coloreadas */}
          <ul className={estilos.leyendaBarras}>
            {barrasKpis.slice(0, 4).map((b, indice) => (
              <li
                key={b.id}
                className={estilos.itemLeyenda}
                style={{ '--fondo-barra': pastelPorIndice(indice) } as CSSProperties}
              >
                <span className={estilos.puntoColorLeyenda} aria-hidden="true" />
                <div className={estilos.contenidoLeyenda}>
                  <span className={estilos.nombreAreaLeyenda}>{b.nombre}</span>
                  <span className={`${estilos.datosAreaLeyenda} numero`}>
                    Valor: {b.textoValor} · Meta: {b.textoMeta}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. MODO ÁREAS */}
      {modo === 'areas' && (
        <>
          {areas.length === 0 ? (
            <EstadoVacio titulo="Sin áreas registradas">
              Registra las áreas y sus personas afectadas en el paso 0.2 de la Etapa 0 para ver sus barras de participación.
            </EstadoVacio>
          ) : (
            <div className={estilos.cuerpoGraficoBarras}>
              <div className={estilos.areaVisualBarras}>
                <div className={estilos.rejillaBarras}>
                  <div
                    className={estilos.lineaGuiaMetaHorizontal}
                    style={{ bottom: `${metaPorcentaje}%` }}
                  >
                    <span className={estilos.etiquetaMetaHorizontal}>Meta {metaPorcentaje}%</span>
                  </div>

                  {areas.map((a, indice) => {
                    const fraccion = a.participacion === null ? 0 : Math.min(Math.max(a.participacion, 0), 1);
                    const porcentaje = Math.round(fraccion * 100);
                    const alturaCss = a.participacion === null ? '8%' : `${Math.max(14, porcentaje)}%`;
                    const fondoBarra = pastelPorIndice(indice);

                    return (
                      <div key={a.area} className={estilos.columnaBarra} title={`${a.area}: ${porcentaje}%`}>
                        <div
                          className={estilos.barraPildora}
                          style={
                            {
                              height: alturaCss,
                              '--fondo-barra': fondoBarra,
                            } as CSSProperties
                          }
                        >
                          <span className={estilos.valorDentroBarra}>
                            {a.participacion === null ? '—' : `${porcentaje}%`}
                          </span>
                        </div>
                        <span className={estilos.etiquetaAreaEje} title={a.area}>
                          {a.area}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <ul className={estilos.leyendaBarras}>
                {areas.map((a, indice) => (
                  <li
                    key={a.area}
                    className={estilos.itemLeyenda}
                    style={{ '--fondo-barra': pastelPorIndice(indice) } as CSSProperties}
                  >
                    <span className={estilos.puntoColorLeyenda} aria-hidden="true" />
                    <div className={estilos.contenidoLeyenda}>
                      <span className={estilos.nombreAreaLeyenda}>{a.area}</span>
                      <span className={`${estilos.datosAreaLeyenda} numero`}>
                        {a.respondentes} de {a.afectados} ({a.participacion === null ? '—' : formatearValor(a.participacion, 'porcentaje')})
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* 3. MODO ADKAR */}
      {modo === 'adkar' && (
        <div className={estilos.cuerpoGraficoBarras}>
          <div className={estilos.areaVisualBarras}>
            <div className={estilos.rejillaBarras}>
              {/* Línea horizontal umbral de bloqueo a 3.0 (60%) */}
              <div className={estilos.lineaGuiaMetaHorizontal} style={{ bottom: '60%' }}>
                <span className={estilos.etiquetaMetaHorizontal}>Umbral 3.0</span>
              </div>

              {barrasAdkar.map((b, indice) => {
                const tieneValor = b.porcentajeValor !== null;
                const alturaPorcentaje = tieneValor ? b.porcentajeValor! : b.porcentajeMeta;
                const alturaCss = `${Math.max(14, Math.min(100, alturaPorcentaje))}%`;
                const fondoBarra = b.esPuntoBloqueo ? 'var(--negative)' : pastelPorIndice(indice);

                return (
                  <div key={b.id} className={estilos.columnaBarra} title={`${b.nombre}: ${b.textoValor} (Umbral: ${b.textoMeta})`}>
                    <div
                      className={estilos.barraPildora}
                      style={
                        {
                          height: alturaCss,
                          '--fondo-barra': fondoBarra,
                          borderStyle: tieneValor ? 'solid' : 'dashed',
                        } as CSSProperties
                      }
                    >
                      <span className={estilos.valorDentroBarra}>
                        {tieneValor ? b.textoValor : '3.0'}
                      </span>
                    </div>
                    <span className={estilos.etiquetaAreaEje} title={b.nombre}>
                      {b.etiquetaCorta}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <ul className={estilos.leyendaBarras}>
            {barrasAdkar.map((b, indice) => (
              <li
                key={b.id}
                className={estilos.itemLeyenda}
                style={{ '--fondo-barra': pastelPorIndice(indice) } as CSSProperties}
              >
                <span className={estilos.puntoColorLeyenda} aria-hidden="true" />
                <div className={estilos.contenidoLeyenda}>
                  <span className={estilos.nombreAreaLeyenda}>{b.nombre}</span>
                  <span className={`${estilos.datosAreaLeyenda} numero`}>
                    Puntaje: {b.textoValor} / 5.0 {b.esPuntoBloqueo ? '· Punto de bloqueo' : ''}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
