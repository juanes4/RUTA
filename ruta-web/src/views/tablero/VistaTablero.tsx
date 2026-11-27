import { useMemo, useState, type CSSProperties } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Semaforo } from '../../components/ui/Semaforo';
import { REGLAS_CARITA } from '../../config/analizar';
import { ESTILOS_LIDERAZGO, LETRAS_LIDERAZGO } from '../../config/formularios/liderazgo';
import { ALCANCES, ESTRATEGIAS_FODA, RUTAS_TRIAJE } from '../../config/formularios/reconocer';
import { REGLAS } from '../../config/reglas';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useDatosTableroServidor } from '../../hooks/useDatosTableroServidor';
import { conSigno } from '../../lib/formato';
import { construirTablero, type Tablero } from '../../lib/tablero/construirTablero';
import {
  calcularAvanceGlobal,
  calcularPilaresTransformacion,
  generarAlertasEjecutivas,
  type AlertaEjecutiva,
  type MetricasServidor,
  type ResumenAvanceGlobal,
} from '../../lib/tablero/metricasEjecutivas';
import { useRuta } from '../../navegacion/RutaContexto';
import { AnilloAvanceRuta, PanelVisualEjecutivo } from './GraficosEjecutivos';
import { ListaParticipacion } from './ListaParticipacion';
import estilos from './Tablero.module.css';

const ETIQUETA_ESTADO_PASO = {
  completo: 'Activo',
  en_curso: 'En curso',
  sin_empezar: 'Pendiente',
} as const;

/**
 * Tablero ejecutivo RUTA:
 * Consolida en una sola vista la ruta del cambio (R2), la madurez de los 15 pasos (R–U–T–A),
 * las alertas prioritarias, los KPIs clave de adopción y experiencia, el pulso visual
 * (Kirkpatrick + Sostenibilidad) y los resultados estratégicos de las 4 etapas.
 */
export function VistaTablero() {
  const { cargando, activo, datos } = useProyecto();
  const { metricas } = useDatosTableroServidor();
  const { enlace } = useRuta();
  const [variante, setVariante] = useState<'enfocada' | 'completa'>('enfocada');
  const [seccionEnfocada, setSeccionEnfocada] = useState<'resumen' | 'resultados' | 'avance'>('resumen');

  const tablero = useMemo(() => (activo ? construirTablero(activo, datos, REGLAS) : null), [activo, datos]);
  const pilares = useMemo(() => calcularPilaresTransformacion(metricas), [metricas]);
  const alertas = useMemo(() => generarAlertasEjecutivas(tablero, metricas), [tablero, metricas]);
  const avance = useMemo(() => calcularAvanceGlobal(activo, datos, metricas), [activo, datos, metricas]);

  if (cargando) return null;

  const hayDatosServidor =
    metricas.t1.respuestas > 0 ||
    metricas.t2.simuladoresHechos > 0 ||
    metricas.t3.ultimoAcuerdo !== null ||
    metricas.t4.totalMeritos > 0 ||
    metricas.a1.totalAuditorias > 0 ||
    metricas.a2.totalRespuestas > 0;

  const totalAfectados = activo ? activo.segmentacion.areas.reduce((acc, a) => acc + a.afectados, 0) : 0;

  return (
    <>
      <header className={estilos.cabecera}>
        <div className={estilos.cabeceraFila}>
          <div>
            <p className={estilos.antetitulo}>Centro de control · Metodología RUTA ANDI</p>
            <h1>Tablero ejecutivo</h1>
            <p className={estilos.subtituloEmpresa}>
              {activo?.empresa.nombre ? activo.empresa.nombre : 'Seguimiento integral del cambio organizacional'}
              {activo?.empresa.sector ? ` · ${activo.empresa.sector}` : ''}
            </p>
          </div>
          <div className={estilos.chipsMeta}>
            {activo && totalAfectados > 0 && (
              <span className={`${estilos.chipInfo} numero`}>{totalAfectados} afectados en {activo.segmentacion.areas.length} áreas</span>
            )}
            {activo?.empresa.fecha_lanzamiento && (
              <span className={`${estilos.chipInfo} numero`}>Lanzamiento: {activo.empresa.fecha_lanzamiento}</span>
            )}
            {(activo || hayDatosServidor) && (
              <div className={estilos.segmentadoMini} role="group" aria-label="Variante de distribución del tablero">
                <button
                  type="button"
                  aria-pressed={variante === 'enfocada'}
                  className={estilos.btnSegmentadoMini}
                  data-activo={String(variante === 'enfocada')}
                  onClick={() => setVariante('enfocada')}
                >
                  Vista enfocada
                </button>
                <button
                  type="button"
                  aria-pressed={variante === 'completa'}
                  className={estilos.btnSegmentadoMini}
                  data-activo={String(variante === 'completa')}
                  onClick={() => setVariante('completa')}
                >
                  Vista completa
                </button>
              </div>
            )}
            <a className={estilos.chipAccion} href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>
              {activo ? 'Etapa 0 →' : 'Registrar empresa →'}
            </a>
          </div>
        </div>
        {activo?.empresa.que_cambia && <p className={estilos.resumenCambio}>{activo.empresa.que_cambia}</p>}
      </header>

      {!activo && !hayDatosServidor ? (
        <EstadoVacio
          titulo="Aún no hay una empresa registrada"
          accion={
            <a className={estilos.enlaceSecundario} href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>
              Ir a la Etapa 0 <span aria-hidden="true">→</span>
            </a>
          }
        >
          El tablero se alimenta automáticamente con lo que registres en Reconocer (R), Unir (U), Transformar (T) y Analizar (A).
        </EstadoVacio>
      ) : variante === 'enfocada' ? (
        <div className={estilos.enfocada}>
          {!activo && (
            <div className={estilos.avisoEtapa0} role="status">
              <div>
                <strong>Falta registrar la empresa en Etapa 0</strong>
                <p className={estilos.detalle}>
                  Ya estás viendo métricas reales de Transformar (T) y Analizar (A). Completa la Etapa 0 para activar también Reconocer (R) y Unir (U).
                </p>
              </div>
              <a className={estilos.enlaceSecundario} href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>
                Abrir Etapa 0 →
              </a>
            </div>
          )}

          {/* Cabecera ejecutiva aireada: Tarjeta oscura de Triaje + Franja unificada de 4 KPIs + Focos compactos */}
          <div className={estilos.heroEnfocado}>
            <TarjetaRuta tablero={tablero} />
            <div className={estilos.heroDerecha}>
              <FranjaKpisCompacta metricas={metricas} />
              <TiraAlertasCompactas alertas={alertas} />
            </div>
          </div>

          {/* Navegación segmentada limpia para consultar cada bloque sin saturar la pantalla */}
          <div className={estilos.barraSecciones} role="tablist" aria-label="Secciones del tablero ejecutivo">
            <button
              type="button"
              role="tab"
              aria-selected={seccionEnfocada === 'resumen'}
              className={estilos.btnSeccion}
              onClick={() => setSeccionEnfocada('resumen')}
            >
              Resumen y gráficas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={seccionEnfocada === 'resultados'}
              className={estilos.btnSeccion}
              onClick={() => setSeccionEnfocada('resultados')}
            >
              Resultados (R · U · T · A)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={seccionEnfocada === 'avance'}
              className={estilos.btnSeccion}
              onClick={() => setSeccionEnfocada('avance')}
            >
              Avance por pasos ({avance.completos + avance.enCurso}/{avance.total})
            </button>
          </div>

          {seccionEnfocada === 'resumen' && (
            <div className={estilos.cuerpoResumenEnfocado}>
              <PanelVisualEjecutivo pilares={pilares} metricas={metricas} />
              <div className={estilos.filaInferiorEnfocada}>
                <div className={estilos.cajaSuave}>
                  <AnilloAvanceRuta avance={avance} />
                </div>
                <div className={estilos.cajaSuave}>
                  <ListaParticipacion areas={tablero?.buzon.areas ?? []} total={tablero?.buzon.total ?? null} />
                </div>
              </div>
            </div>
          )}

          {seccionEnfocada === 'resultados' && <TarjetasResultados tablero={tablero} metricas={metricas} />}

          {seccionEnfocada === 'avance' && <AvancePasos avance={avance} />}
        </div>
      ) : (
        <div className={estilos.rejilla}>
          {/* Panel lateral: Ruta (R2), Madurez RUTA, Alertas y Buzón 1 */}
          <aside className={estilos.panel}>
            <TarjetaRuta tablero={tablero} />
            <AnilloAvanceRuta avance={avance} />
            <BloqueAlertas alertas={alertas} />
            <ListaParticipacion areas={tablero?.buzon.areas ?? []} total={tablero?.buzon.total ?? null} />
          </aside>

          {/* Lienzo principal ejecutivo */}
          <div className={estilos.principal}>
            {!activo && (
              <div className={estilos.avisoEtapa0} role="status">
                <div>
                  <strong>Falta registrar la empresa en Etapa 0</strong>
                  <p className={estilos.detalle}>
                    Ya estás viendo métricas reales de Transformar (T) y Analizar (A). Completa la Etapa 0 para activar también Reconocer (R) y Unir (U).
                  </p>
                </div>
                <a className={estilos.enlaceSecundario} href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>
                  Abrir Etapa 0 →
                </a>
              </div>
            )}

            <FranjaKpisEjecutivos metricas={metricas} />
            <PanelVisualEjecutivo pilares={pilares} metricas={metricas} />
            <TarjetasResultados tablero={tablero} metricas={metricas} />
            <AvancePasos avance={avance} />
          </div>
        </div>
      )}
    </>
  );
}

/** R2: puntaje del triaje y la ruta asignada (conserva la tarjeta oscura destacada). */
function TarjetaRuta({ tablero }: { tablero: Tablero | null }) {
  const { enlace } = useRuta();
  const triaje = tablero?.triaje;
  const alcance = ALCANCES.find((a) => a.valor === triaje?.alcance);
  return (
    <section className={estilos.tarjetaOscura} aria-labelledby="titulo-ruta">
      <p id="titulo-ruta" className={estilos.antetituloOscuro}>
        Ruta del cambio · triaje (R2)
      </p>
      {triaje?.nivel && triaje.total !== null ? (
        <>
          <p className={estilos.decision}>{RUTAS_TRIAJE[triaje.nivel].clasificacion}</p>
          <p>
            <Semaforo estado={triaje.nivel} texto={`${triaje.total} de 9 puntos`} />
          </p>
          <p className={estilos.textoOscuro}>{RUTAS_TRIAJE[triaje.nivel].descripcion}</p>
          {alcance && <p className={estilos.textoOscuro}>Alcance: {alcance.nombre.toLowerCase()}.</p>}
        </>
      ) : (
        <p className={estilos.textoOscuro}>Puntúa los tres criterios del triaje para asignar la ruta y calibrar el acompañamiento.</p>
      )}
      <a className={estilos.enlaceOscuro} href={enlace({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: 'R2' })}>
        Abrir el triaje <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}

/** Franja única horizontal de los 4 KPIs (para la variante enfocada, menos peso visual). */
function FranjaKpisCompacta({ metricas }: { metricas: MetricasServidor }) {
  const { enlace } = useRuta();
  const { a1, a2, t2, t3 } = metricas;

  const estadoA1: 'verde' | 'amarillo' | 'rojo' | null =
    a1.cumplimiento === null ? null : a1.intervenir > 0 ? 'rojo' : a1.atencion > 0 ? 'amarillo' : 'verde';
  const estadoA2: 'verde' | 'amarillo' | 'rojo' | null =
    a2.caritaGeneral === null ? null : a2.caritaGeneral === 'feliz' ? 'verde' : a2.caritaGeneral === 'neutra' ? 'amarillo' : 'rojo';

  return (
    <section aria-label="Indicadores clave" className={estilos.franjaUnica}>
      <a className={estilos.celdaKpiUnica} href={enlace({ pagina: 'etapa', etapaId: 'etapa-a', pasoId: 'A1' })}>
        <div className={estilos.kpiCabeza}>
          <span className={estilos.kpiEtiqueta}>Adopción · A1</span>
          {estadoA1 && <Semaforo estado={estadoA1} texto={a1.periodo ?? 'A1'} />}
        </div>
        <p className={`${estilos.kpiValorUnico} numero`}>{a1.cumplimiento === null ? '—' : `${a1.cumplimiento}%`}</p>
        <p className={estilos.kpiPie}>
          {a1.ultima ? `${a1.enMeta} de ${a1.evaluados} en meta` : 'Sin auditorías'}
          {a1.deltaCumplimiento !== null && (
            <span className={estilos.deltaInline} data-positivo={String(a1.deltaCumplimiento >= 0)}>
              {a1.deltaCumplimiento >= 0 ? ` · ↑ +${a1.deltaCumplimiento}%` : ` · ↓ ${a1.deltaCumplimiento}%`}
            </span>
          )}
        </p>
      </a>

      <a className={estilos.celdaKpiUnica} href={enlace({ pagina: 'etapa', etapaId: 'etapa-a', pasoId: 'A2' })}>
        <div className={estilos.kpiCabeza}>
          <span className={estilos.kpiEtiqueta}>Experiencia · A2</span>
          {estadoA2 && a2.caritaGeneral && (
            <Semaforo estado={estadoA2} texto={REGLAS_CARITA[a2.caritaGeneral].etiqueta.split(' ')[0] ?? ''} />
          )}
        </div>
        <p className={`${estilos.kpiValorUnico} numero`}>{a2.porcentajeGeneral === null ? '—' : `${a2.porcentajeGeneral}%`}</p>
        <p className={estilos.kpiPie}>
          {a2.promedioGeneral !== null ? `${a2.promedioGeneral.toFixed(2).replace('.', ',')} / 3,00 · ${a2.totalRespuestas} resp.` : 'Sin respuestas'}
        </p>
      </a>

      <a className={estilos.celdaKpiUnica} href={enlace({ pagina: 'etapa', etapaId: 'etapa-t', pasoId: 'T2' })}>
        <div className={estilos.kpiCabeza}>
          <span className={estilos.kpiEtiqueta}>Dominio · T2</span>
          {t2.seguridadPromedio !== null && (
            <span className={`${estilos.chipNeutro} numero`}>Seg. {t2.seguridadPromedio.toFixed(1).replace('.', ',')}/5</span>
          )}
        </div>
        <p className={`${estilos.kpiValorUnico} numero`}>{t2.tasaAprobacion === null ? '—' : `${t2.tasaAprobacion}%`}</p>
        <p className={estilos.kpiPie}>
          {t2.simuladoresHechos > 0 ? `Aprobación · videos ${t2.coberturaPorcentaje ?? 0}%` : 'Sin simuladores'}
        </p>
      </a>

      <a className={estilos.celdaKpiUnica} href={enlace({ pagina: 'etapa', etapaId: 'etapa-t', pasoId: 'T3' })}>
        <div className={estilos.kpiCabeza}>
          <span className={estilos.kpiEtiqueta}>Autonomía · T3</span>
          {t3.termometroPromedio !== null && (
            <span className={`${estilos.chipNeutro} numero`}>{t3.termometroPromedio.toFixed(1).replace('.', ',')}/5</span>
          )}
        </div>
        <p className={`${estilos.kpiValorUnico} numero`}>
          {t3.ultimoAcuerdo ? `N${t3.ultimoAcuerdo.nivel}` : t3.termometroPromedio !== null ? `${t3.termometroPromedio.toFixed(1).replace('.', ',')}` : '—'}
        </p>
        <p className={estilos.kpiPie}>
          {t3.ultimoAcuerdo ? `${t3.ultimoAcuerdo.nombre} (Ciclo ${t3.ultimoAcuerdo.ciclo})` : 'Sin votación'}
        </p>
      </a>
    </section>
  );
}

/** Tira compacta de alertas prioritarias (hasta 2 visibles en línea, sin apilar 4 bloques pesados). */
function TiraAlertasCompactas({ alertas }: { alertas: readonly AlertaEjecutiva[] }) {
  const { enlace } = useRuta();
  return (
    <section aria-label="Focos prioritarios" className={estilos.tiraAlertas}>
      {alertas.slice(0, 2).map((a) => (
        <a
          key={a.id}
          className={estilos.alertaCompacta}
          data-severidad={a.severidad}
          href={enlace({ pagina: 'etapa', etapaId: a.etapaId, pasoId: a.pasoId })}
        >
          <span className={estilos.etiquetaAlerta}>{a.etiqueta}</span>
          <span className={estilos.textoAlertaCompacta}>
            <strong>{a.titulo}</strong> — {a.detalle}
          </span>
          <span className={estilos.flechaAlerta} aria-hidden="true">→</span>
        </a>
      ))}
    </section>
  );
}

/** Radar de alertas prioritarias de todo el ciclo R–U–T–A. */
function BloqueAlertas({ alertas }: { alertas: readonly AlertaEjecutiva[] }) {
  const { enlace } = useRuta();
  return (
    <section className={estilos.bloque} aria-labelledby="titulo-alertas">
      <h2 id="titulo-alertas" className={estilos.tituloBloque}>
        Focos de atención
      </h2>
      <ul className={estilos.listaAlertas}>
        {alertas.map((a) => (
          <li key={a.id}>
            <a
              className={estilos.tarjetaAlerta}
              data-severidad={a.severidad}
              href={enlace({ pagina: 'etapa', etapaId: a.etapaId, pasoId: a.pasoId })}
            >
              <span className={estilos.etiquetaAlerta}>{a.etiqueta}</span>
              <strong className={estilos.tituloAlerta}>{a.titulo}</strong>
              <span className={estilos.detalleAlerta}>{a.detalle}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 4 KPIs ejecutivos de alto valor (carril técnico + carril humano). */
function FranjaKpisEjecutivos({ metricas }: { metricas: MetricasServidor }) {
  const { enlace } = useRuta();
  const { a1, a2, t2, t3 } = metricas;

  const estadoA1: 'verde' | 'amarillo' | 'rojo' | null =
    a1.cumplimiento === null ? null : a1.intervenir > 0 ? 'rojo' : a1.atencion > 0 ? 'amarillo' : 'verde';

  const estadoA2: 'verde' | 'amarillo' | 'rojo' | null =
    a2.caritaGeneral === null ? null : a2.caritaGeneral === 'feliz' ? 'verde' : a2.caritaGeneral === 'neutra' ? 'amarillo' : 'rojo';

  return (
    <section aria-labelledby="titulo-kpis" className={estilos.bloque}>
      <h2 id="titulo-kpis" className="solo-lectores">
        Indicadores ejecutivos clave
      </h2>
      <div className={estilos.rejillaKpis}>
        {/* KPI 1: Adopción operativa A1 */}
        <a className={estilos.tarjetaKpi} href={enlace({ pagina: 'etapa', etapaId: 'etapa-a', pasoId: 'A1' })}>
          <div className={estilos.kpiCabeza}>
            <span className={estilos.kpiEtiqueta}>Adopción operativa · A1</span>
            {estadoA1 && <Semaforo estado={estadoA1} texto={a1.periodo ?? 'A1'} />}
          </div>
          <p className={`${estilos.kpiValor} numero`}>{a1.cumplimiento === null ? '—' : `${a1.cumplimiento}%`}</p>
          <p className={estilos.kpiPie}>
            {a1.ultima ? (
              <>
                <span className="numero">{a1.enMeta}/{a1.evaluados}</span> en meta
                {a1.deltaCumplimiento !== null && (
                  <span className={estilos.deltaInline} data-positivo={String(a1.deltaCumplimiento >= 0)}>
                    {a1.deltaCumplimiento >= 0 ? ` ↑ +${a1.deltaCumplimiento}%` : ` ↓ ${a1.deltaCumplimiento}%`}
                  </span>
                )}
              </>
            ) : (
              'Sin auditorías registradas'
            )}
          </p>
        </a>

        {/* KPI 2: Experiencia del colaborador A2 */}
        <a className={estilos.tarjetaKpi} href={enlace({ pagina: 'etapa', etapaId: 'etapa-a', pasoId: 'A2' })}>
          <div className={estilos.kpiCabeza}>
            <span className={estilos.kpiEtiqueta}>Experiencia · A2</span>
            {estadoA2 && a2.caritaGeneral && (
              <Semaforo estado={estadoA2} texto={REGLAS_CARITA[a2.caritaGeneral].etiqueta.split(' ')[0] ?? ''} />
            )}
          </div>
          <p className={`${estilos.kpiValor} numero`}>{a2.porcentajeGeneral === null ? '—' : `${a2.porcentajeGeneral}%`}</p>
          <p className={estilos.kpiPie}>
            {a2.totalRespuestas > 0 && a2.promedioGeneral !== null
              ? `Promedio ${a2.promedioGeneral.toFixed(2).replace('.', ',')} / 3,00 · ${a2.totalRespuestas} resp.`
              : 'Sin respuestas en el viaje'}
          </p>
        </a>

        {/* KPI 3: Dominio técnico T2 */}
        <a className={estilos.tarjetaKpi} href={enlace({ pagina: 'etapa', etapaId: 'etapa-t', pasoId: 'T2' })}>
          <div className={estilos.kpiCabeza}>
            <span className={estilos.kpiEtiqueta}>Dominio práctico · T2</span>
            {t2.seguridadPromedio !== null && (
              <span className={`${estilos.chipNeutro} numero`}>Seg. {t2.seguridadPromedio.toFixed(1).replace('.', ',')}/5</span>
            )}
          </div>
          <p className={`${estilos.kpiValor} numero`}>{t2.tasaAprobacion === null ? '—' : `${t2.tasaAprobacion}%`}</p>
          <p className={estilos.kpiPie}>
            {t2.simuladoresHechos > 0
              ? `Aprobación · cobertura videos ${t2.coberturaPorcentaje ?? 0}%`
              : t2.coberturaPorcentaje
                ? `Cobertura videos ${t2.coberturaPorcentaje}% · sin simuladores`
                : 'Sin actividad en micro-cursos'}
          </p>
        </a>

        {/* KPI 4: Autonomía y apropiación T3 */}
        <a className={estilos.tarjetaKpi} href={enlace({ pagina: 'etapa', etapaId: 'etapa-t', pasoId: 'T3' })}>
          <div className={estilos.kpiCabeza}>
            <span className={estilos.kpiEtiqueta}>Autonomía · T3</span>
            {t3.termometroPromedio !== null && (
              <span className={`${estilos.chipNeutro} numero`}>{t3.termometroPromedio.toFixed(1).replace('.', ',')} / 5</span>
            )}
          </div>
          <p className={`${estilos.kpiValor} numero`}>
            {t3.ultimoAcuerdo ? `N${t3.ultimoAcuerdo.nivel}` : t3.termometroPromedio !== null ? `${t3.termometroPromedio.toFixed(1).replace('.', ',')}` : '—'}
          </p>
          <p className={estilos.kpiPie}>
            {t3.ultimoAcuerdo
              ? `${t3.ultimoAcuerdo.nombre} (Ciclo ${t3.ultimoAcuerdo.ciclo})`
              : t3.termometroRespuestas > 0
                ? `${t3.termometroRespuestas} resp. en termómetro`
                : 'Sin votación de escalera'}
          </p>
        </a>
      </div>
    </section>
  );
}

/** 6 tarjetas pastel de resultados: conserva R3, R4, U1–U2 y suma T1/T4, A1 y A2. */
function TarjetasResultados({ tablero, metricas }: { tablero: Tablero | null; metricas: MetricasServidor }) {
  const { enlace } = useRuta();
  const fondo = (color: string) => ({ '--fondo-categoria': color }) as CSSProperties;
  const foda = tablero?.foda;
  const actores = tablero?.actores;
  const liderazgo = tablero?.liderazgo;
  const vocero = tablero?.vocero ?? '';
  const { t1, t4, a1, a2 } = metricas;

  return (
    <section aria-labelledby="titulo-resultados" className={estilos.bloque}>
      <div className={estilos.encabezadoSeccion}>
        <div>
          <h2 id="titulo-resultados" className={estilos.tituloBloque}>
            Resultados estratégicos
          </h2>
          <p className={estilos.detalle}>Síntesis accionable de las cuatro etapas del cambio; haz clic en cualquier tarjeta para abrir su detalle.</p>
        </div>
      </div>

      <ul className={estilos.categorias}>
        {/* 1. FODA (R3) — conservada */}
        <li className={estilos.categoria} style={fondo('var(--pastel-blue)')}>
          <a className={estilos.enlaceTarjeta} href={enlace({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: 'R3' })}>
            <div className={estilos.cabezaTarjeta}>
              <h3 className={estilos.nombreCategoria}>FODA del cambio (R3)</h3>
              <span className={estilos.flechaTarjeta} aria-hidden="true">→</span>
            </div>
            {foda?.estrategia ? (
              <ul className={estilos.ejemplos}>
                <li>
                  <p className={estilos.nombreArea}>{ESTRATEGIAS_FODA[foda.estrategia].nombre}</p>
                  <p className={estilos.detalle}>{ESTRATEGIAS_FODA[foda.estrategia].descripcion}</p>
                </li>
                <li>
                  <p className={estilos.detalle}>
                    Interno (F − D): <strong className="numero">{conSigno(foda.interno)}</strong> · Externo (O − A):{' '}
                    <strong className="numero">{conSigno(foda.externo)}</strong>
                  </p>
                </li>
              </ul>
            ) : (
              <p className={estilos.detalle}>Sin ítems registrados.</p>
            )}
            <p className={`${estilos.pieCategoria} numero`}>{foda?.items ?? 0} {(foda?.items ?? 0) === 1 ? 'ítem' : 'ítems'}</p>
          </a>
        </li>

        {/* 2. Mapa de actores (R4) — conservada */}
        <li className={estilos.categoria} style={fondo('var(--pastel-mint)')}>
          <a className={estilos.enlaceTarjeta} href={enlace({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: 'R4' })}>
            <div className={estilos.cabezaTarjeta}>
              <h3 className={estilos.nombreCategoria}>Mapa de actores (R4)</h3>
              <span className={estilos.flechaTarjeta} aria-hidden="true">→</span>
            </div>
            {actores && actores.total > 0 ? (
              <ul className={estilos.ejemplos}>
                <li>
                  <p className={estilos.nombreArea}>
                    <span className="numero">{actores.conBrecha}</span> con brecha de compromiso
                  </p>
                  <p className={estilos.detalle}>
                    {actores.prioridades.length > 0
                      ? `Mayor esfuerzo: ${actores.prioridades
                          .slice(0, 3)
                          .map((p) => p.actor)
                          .join(', ')}.`
                      : 'Ningún actor está por debajo de donde debe estar.'}
                  </p>
                </li>
                <li>
                  <p className={estilos.detalle}>
                    <span className="numero">{actores.evaluados}</span> de <span className="numero">{actores.total}</span> con poder e interés asignados.
                  </p>
                </li>
              </ul>
            ) : (
              <p className={estilos.detalle}>Sin actores registrados.</p>
            )}
            <p className={`${estilos.pieCategoria} numero`}>{actores?.total ?? 0} {(actores?.total ?? 0) === 1 ? 'actor' : 'actores'}</p>
          </a>
        </li>

        {/* 3. Liderazgo (U1 y U2) — conservada */}
        <li className={estilos.categoria} style={fondo('var(--pastel-lavender)')}>
          <a className={estilos.enlaceTarjeta} href={enlace({ pagina: 'etapa', etapaId: 'etapa-u', pasoId: 'U1' })}>
            <div className={estilos.cabezaTarjeta}>
              <h3 className={estilos.nombreCategoria}>Liderazgo (U1 y U2)</h3>
              <span className={estilos.flechaTarjeta} aria-hidden="true">→</span>
            </div>
            {liderazgo && liderazgo.lideres > 0 ? (
              <ul className={estilos.ejemplos}>
                <li>
                  <p className={estilos.nombreArea}>
                    Vocero: {vocero || (liderazgo.voceros.length > 0 ? `sugeridos: ${liderazgo.voceros.join(', ')}` : 'sin elegir')}
                  </p>
                </li>
                <li>
                  <ul className={estilos.motivosClaros}>
                    {LETRAS_LIDERAZGO.filter((l) => liderazgo.porEstilo[l] > 0).map((l) => (
                      <li key={l}>
                        {ESTILOS_LIDERAZGO[l].nombre}: <strong className="numero">{liderazgo.porEstilo[l]}</strong>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            ) : (
              <p className={estilos.detalle}>Sin encuestas de liderazgo.</p>
            )}
            <p className={`${estilos.pieCategoria} numero`}>
              {liderazgo?.lideres ?? 0} {(liderazgo?.lideres ?? 0) === 1 ? 'líder' : 'líderes'}
            </p>
          </a>
        </li>

        {/* 4. Comunicación y Méritos (T1 y T4) — nueva */}
        <li className={estilos.categoria} style={fondo('var(--pastel-cream)')}>
          <a className={estilos.enlaceTarjeta} href={enlace({ pagina: 'etapa', etapaId: 'etapa-t', pasoId: 'T4' })}>
            <div className={estilos.cabezaTarjeta}>
              <h3 className={estilos.nombreCategoria}>Pulso y Victorias (T1 y T4)</h3>
              <span className={estilos.flechaTarjeta} aria-hidden="true">→</span>
            </div>
            {t1.respuestas > 0 || t4.totalMeritos > 0 ? (
              <ul className={estilos.ejemplos}>
                <li>
                  <p className={estilos.nombreArea}>
                    {t1.promedioGeneral !== null
                      ? `Claridad y pulso: ${t1.promedioGeneral.toFixed(1).replace('.', ',')} / 5`
                      : 'Sin pulsos de comunicación'}
                  </p>
                  <p className={estilos.detalle}>
                    {t1.sesiones > 0
                      ? `${t1.respuestas} respuestas en ${t1.sesiones} ${t1.sesiones === 1 ? 'sesión' : 'sesiones'}.`
                      : 'Aplica la encuesta breve al cierre de cada sesión.'}
                  </p>
                </li>
                <li>
                  <p className={estilos.detalle}>
                    {t4.ultimoPublicado
                      ? `Último mérito: «${t4.ultimoPublicado}».`
                      : t4.totalMeritos > 0
                        ? `${t4.totalMeritos} méritos en valoración.`
                        : 'Aún sin victorias tempranas publicadas.'}
                  </p>
                </li>
              </ul>
            ) : (
              <p className={estilos.detalle}>Sin registros en T1 ni T4.</p>
            )}
            <p className={`${estilos.pieCategoria} numero`}>
              {t4.publicados} {t4.publicados === 1 ? 'mérito publicado' : 'méritos publicados'}
            </p>
          </a>
        </li>

        {/* 5. Auditorías de adopción (A1) — nueva */}
        <li className={estilos.categoria} style={fondo('var(--pastel-mint)')}>
          <a className={estilos.enlaceTarjeta} href={enlace({ pagina: 'etapa', etapaId: 'etapa-a', pasoId: 'A1' })}>
            <div className={estilos.cabezaTarjeta}>
              <h3 className={estilos.nombreCategoria}>Auditorías de adopción (A1)</h3>
              <span className={estilos.flechaTarjeta} aria-hidden="true">→</span>
            </div>
            {a1.ultima ? (
              <ul className={estilos.ejemplos}>
                <li>
                  <p className={estilos.nombreArea}>
                    {a1.periodo}: <span className="numero">{a1.cumplimiento ?? 0} %</span> en meta
                  </p>
                  <p className={estilos.detalle}>
                    <span className="numero">{a1.enMeta}</span> verde · <span className="numero">{a1.atencion}</span> amarillo ·{' '}
                    <span className="numero">{a1.intervenir}</span> rojo.
                  </p>
                </li>
                <li>
                  <p className={estilos.detalle}>
                    {a1.criticos.length > 0
                      ? `Foco inmediato: ${a1.criticos.join(', ')}.`
                      : 'Sin desvíos críticos mayores al 15 %.'}
                  </p>
                </li>
              </ul>
            ) : (
              <p className={estilos.detalle}>Sin auditorías registradas.</p>
            )}
            <p className={`${estilos.pieCategoria} numero`}>
              {a1.totalAuditorias} {a1.totalAuditorias === 1 ? 'auditoría' : 'auditorías'}
            </p>
          </a>
        </li>

        {/* 6. Viaje del colaborador (A2) — nueva */}
        <li className={estilos.categoria} style={fondo('var(--pastel-blue)')}>
          <a className={estilos.enlaceTarjeta} href={enlace({ pagina: 'etapa', etapaId: 'etapa-a', pasoId: 'A2' })}>
            <div className={estilos.cabezaTarjeta}>
              <h3 className={estilos.nombreCategoria}>Viaje del colaborador (A2)</h3>
              <span className={estilos.flechaTarjeta} aria-hidden="true">→</span>
            </div>
            {a2.totalRespuestas > 0 ? (
              <ul className={estilos.ejemplos}>
                <li>
                  <p className={estilos.nombreArea}>
                    {a2.faseCritica
                      ? `Mayor fricción: ${a2.faseCritica.titulo} (${a2.faseCritica.porcentaje} %)`
                      : `Promedio global: ${a2.porcentajeGeneral ?? 0} %`}
                  </p>
                  <p className={estilos.detalle}>
                    {a2.prioridadMejora
                      ? `Prioridad #1 (P10): ${a2.prioridadMejora.texto} (${a2.prioridadMejora.porcentaje} %).`
                      : 'Revisa los cuatro momentos en el mapa interactivo.'}
                  </p>
                </li>
              </ul>
            ) : (
              <p className={estilos.detalle}>Sin respuestas del mapa de viaje.</p>
            )}
            <p className={`${estilos.pieCategoria} numero`}>
              {a2.totalRespuestas} {a2.totalRespuestas === 1 ? 'respuesta' : 'respuestas'}
            </p>
          </a>
        </li>
      </ul>
    </section>
  );
}

/** Avance completo de los 15 pasos (R, U, T, A) con filtro segmentado por etapa. */
function AvancePasos({ avance }: { avance: ResumenAvanceGlobal }) {
  const { enlace } = useRuta();
  const [filtroEtapa, setFiltroEtapa] = useState<string>('todas');

  const visibles = filtroEtapa === 'todas' ? avance.pasos : avance.pasos.filter((p) => p.etapaId === filtroEtapa);

  return (
    <section aria-labelledby="titulo-avance" className={estilos.bloque}>
      <div className={estilos.encabezadoSeccion}>
        <div>
          <h2 id="titulo-avance" className={estilos.tituloBloque}>
            Avance completo de las etapas
          </h2>
          <p className={estilos.detalle}>
            Recorrido de punta a punta ({avance.completos} activos, {avance.enCurso} en curso de {avance.total} pasos).
          </p>
        </div>

        <div className={estilos.segmentadoEtapas} role="tablist" aria-label="Filtrar pasos por etapa">
          <button
            type="button"
            role="tab"
            aria-selected={filtroEtapa === 'todas'}
            className={estilos.btnSegmentadoMini}
            onClick={() => setFiltroEtapa('todas')}
          >
            Todas ({avance.total})
          </button>
          {avance.porEtapa.map((e) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={filtroEtapa === e.id}
              className={estilos.btnSegmentadoMini}
              onClick={() => setFiltroEtapa(e.id)}
            >
              {e.letra} · {e.activos}/{e.total}
            </button>
          ))}
        </div>
      </div>

      <div className={estilos.tarjetaTabla}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Paso</th>
              <th scope="col">Detalle</th>
              <th scope="col">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((paso) => (
              <tr key={paso.pasoId}>
                <th scope="row">
                  <a className={estilos.celdaIndicador} href={enlace({ pagina: 'etapa', etapaId: paso.etapaId, pasoId: paso.pasoId })}>
                    <span className={estilos.cuadroEtapa} style={{ '--fondo-etapa': paso.color } as CSSProperties}>
                      {paso.pasoId}
                    </span>
                    <span>{paso.titulo}</span>
                  </a>
                </th>
                <td className={estilos.valor}>{paso.texto}</td>
                <td>
                  <span className={estilos.estadoPaso} data-estado={paso.estado}>
                    <span className={estilos.puntoEstado} aria-hidden="true" />
                    {ETIQUETA_ESTADO_PASO[paso.estado]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
