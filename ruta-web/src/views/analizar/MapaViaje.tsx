import { useEffect, useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { Pestanas } from '../../components/ui/Pestanas';
import {
  FASES_VIAJE_CONFIG,
  PERIODOS_VIAJE,
  PREGUNTAS_VIAJE,
  REGLAS_CARITA,
  type EstadoCarita,
  type IdFaseViaje,
} from '../../config/analizar';
import { useEnvio } from '../../hooks/useRegistros';
import { useSesion } from '../../estado/SesionContexto';
import {
  api,
  ErrorApi,
  formatearFechaVista,
  type RespuestaViajeA,
  type RespuestaViajePropia,
  type ResumenViaje,
} from '../../lib/api';
import { formatearPromedioViaje, opcionPredominante } from '../../lib/analizar/calculos';
import formulario from '../etapa0/formulario.module.css';
import { MensajeEnvio } from '../transformar/MensajeEnvio';
import { GraficoViaje } from './GraficoViaje';
import estilos from './etapaA.module.css';

type CargaViaje = { fase: 'cargando' } | { fase: 'error'; mensaje: string } | { fase: 'listo'; datos: RespuestaViajeA };

const VACIAS_12 = (): string[] => Array.from({ length: 12 }, () => '');

/**
 * A2 · Mapa de viaje del colaborador (antes, durante, situación actual y hacia dónde mejorar).
 * Todos responden las 12 preguntas; el tablero muestra la curva interactiva con caritas y desglose por fase.
 */
export function MapaViaje({ esLider }: { esLider: boolean }) {
  const { expirar } = useSesion();
  const [periodoFiltro, setPeriodoFiltro] = useState('todos');
  const [carga, setCarga] = useState<CargaViaje>({ fase: 'cargando' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    api
      .viajeA(periodoFiltro)
      .then((datos) => vigente && setCarga({ fase: 'listo', datos }))
      .catch((e: unknown) => {
        if (e instanceof ErrorApi && e.estado === 401) expirar();
        if (vigente) setCarga({ fase: 'error', mensaje: e instanceof Error ? e.message : 'No se pudo cargar el mapa de viaje.' });
      });
    return () => {
      vigente = false;
    };
  }, [periodoFiltro, version, expirar]);

  const recargar = () => setVersion((v) => v + 1);

  if (carga.fase === 'cargando') return <p role="status">Cargando mapa de viaje del colaborador…</p>;
  if (carga.fase === 'error') return <EstadoVacio titulo="No se pudo cargar el mapa de viaje">{carga.mensaje}</EstadoVacio>;

  return (
    <div className={estilos.bloques}>
      <p className={estilos.texto}>
        Reconstruye la experiencia del colaborador punta a punta desde antes del cambio hasta la sostenibilidad de la nueva rutina. Cada respuesta
        (A = 3, B = 2, C = 1) alimenta la curva de evolución por fase y previene el retorno a viejas costumbres.
      </p>

      <Pestanas
        etiqueta="Mapa de viaje del colaborador"
        pestanas={[
          {
            id: 'mapa',
            etiqueta: 'Mapa del colaborador',
            contenido: (
              <PanelMapaResultados
                datos={carga.datos}
                periodoFiltro={periodoFiltro}
                alCambiarPeriodo={setPeriodoFiltro}
                esLider={esLider}
              />
            ),
          },
          {
            id: 'encuesta',
            etiqueta: 'Responder encuesta',
            contenido: <FormularioViaje propias={carga.datos.propias} alGuardar={recargar} />,
          },
          {
            id: 'guia',
            etiqueta: 'Guía del taller y escala',
            contenido: <GuiaTallerViaje />,
          },
        ]}
      />
    </div>
  );
}

function PanelMapaResultados({
  datos,
  periodoFiltro,
  alCambiarPeriodo,
  esLider,
}: {
  datos: RespuestaViajeA;
  periodoFiltro: string;
  alCambiarPeriodo(p: string): void;
  esLider: boolean;
}) {
  const [faseActiva, setFaseActiva] = useState<IdFaseViaje>('antes');
  const [vista, setVista] = useState<'equipo' | 'propia'>('equipo');

  const propiaSeleccionada =
    periodoFiltro === 'todos' ? datos.propias[0] ?? null : datos.propias.find((p) => p.periodo === periodoFiltro) ?? null;

  const resumen: ResumenViaje = vista === 'propia' && propiaSeleccionada ? propiaSeleccionada.resumen : datos.resumenEquipo;
  const hayDatos = resumen.totalRespuestas > 0;

  // Hallazgos automáticos cuando hay al menos una respuesta
  const fasesConValor = resumen.fases.filter((f) => f.promedio !== null);
  const faseFuerte = [...fasesConValor].sort((a, b) => (b.promedio ?? 0) - (a.promedio ?? 0))[0] ?? null;
  const faseFriccion = [...fasesConValor].sort((a, b) => (a.promedio ?? 0) - (b.promedio ?? 0))[0] ?? null;
  const pregunta10 = resumen.preguntas[9];
  const prioridadMejora = hayDatos && pregunta10 ? opcionPredominante(9, pregunta10.conteos) : null;

  // Distribución global de selecciones A / B / C en las 12 preguntas
  const mezcla = resumen.preguntas.reduce(
    (acc, q) => ({ a: acc.a + q.conteos.a, b: acc.b + q.conteos.b, c: acc.c + q.conteos.c }),
    { a: 0, b: 0, c: 0 },
  );
  const totalSelecciones = mezcla.a + mezcla.b + mezcla.c;
  const pctA = totalSelecciones ? Math.round((mezcla.a / totalSelecciones) * 100) : 0;
  const pctB = totalSelecciones ? Math.round((mezcla.b / totalSelecciones) * 100) : 0;
  const pctC = totalSelecciones ? Math.max(0, 100 - pctA - pctB) : 0;

  const cfgFaseActiva = FASES_VIAJE_CONFIG.find((f) => f.id === faseActiva) ?? FASES_VIAJE_CONFIG[0]!;
  const datosFaseActiva = resumen.fases.find((f) => f.id === faseActiva);
  const preguntasFase = PREGUNTAS_VIAJE.filter((p) => p.fase === faseActiva);

  return (
    <div className={estilos.bloques}>
      <div className={estilos.panelMapa}>
        <div className={estilos.cabeceraMapa}>
          <div>
            <h3 className={estilos.tituloMapa}>Mapa del Colaborador</h3>
            <span className={estilos.apoyo}>
              Experiencia y evolución en el proceso de cambio ·{' '}
              {hayDatos
                ? `${resumen.totalRespuestas} ${resumen.totalRespuestas === 1 ? 'respuesta registrada' : 'respuestas registradas'}`
                : 'Sin respuestas aún'}
            </span>
          </div>

          <div className={estilos.pildoras}>
            <CampoSeleccion
              etiqueta="Periodo"
              value={periodoFiltro}
              onChange={(e) => alCambiarPeriodo(e.target.value)}
            >
              <option value="todos">Todos los periodos</option>
              {datos.periodosDisponibles.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </CampoSeleccion>
            {propiaSeleccionada && (
              <CampoSeleccion
                etiqueta="Vista"
                value={vista}
                onChange={(e) => setVista(e.target.value as 'equipo' | 'propia')}
              >
                <option value="equipo">Consolidado del equipo</option>
                <option value="propia">Mi recorrido personal</option>
              </CampoSeleccion>
            )}
          </div>
        </div>

        {/* Leyenda visual */}
        <div className={estilos.leyendaMapa} aria-label="Leyenda de estados del recorrido">
          {(['feliz', 'neutra', 'preocupada'] as EstadoCarita[]).map((c) => (
            <span key={c} className={estilos.itemLeyenda}>
              <span className={estilos.puntoLeyenda} data-carita={c} aria-hidden="true" />
              {REGLAS_CARITA[c].etiqueta} ({REGLAS_CARITA[c].rango})
            </span>
          ))}
        </div>

        {!hayDatos ? (
          <EstadoVacio titulo="Aún no hay respuestas en el mapa de viaje">
            Abre la pestaña «Responder encuesta» para diligenciar las 12 preguntas de los cuatro momentos del cambio y ver la curva interactiva.
          </EstadoVacio>
        ) : (
          <>
            <GraficoViaje fases={resumen.fases} faseActiva={faseActiva} alSeleccionar={setFaseActiva} />

            {/* Barra apilada de distribución global A / B / C */}
            <div className={estilos.bloqueMezcla} aria-label="Distribución global de respuestas por nivel de adopción">
              <div className={estilos.cabezaMezcla}>
                <span className={estilos.apoyo}>Distribución global de respuestas (12 preguntas)</span>
                <div className={estilos.cifrasMezcla}>
                  <span className="numero">
                    <strong>A:</strong> {pctA} %
                  </span>
                  <span className="numero">
                    <strong>B:</strong> {pctB} %
                  </span>
                  <span className="numero">
                    <strong>C:</strong> {pctC} %
                  </span>
                </div>
              </div>
              <div className={estilos.barraApilada} aria-hidden="true">
                {pctA > 0 && <div className={estilos.tramoApilado} data-letra="A" style={{ width: `${pctA}%` }} />}
                {pctB > 0 && <div className={estilos.tramoApilado} data-letra="B" style={{ width: `${pctB}%` }} />}
                {pctC > 0 && <div className={estilos.tramoApilado} data-letra="C" style={{ width: `${pctC}%` }} />}
              </div>
            </div>

            {/* Selector en tarjetas de las 4 fases */}
            <div className={estilos.gridFases}>
              {FASES_VIAJE_CONFIG.map((cfg) => {
                const f = resumen.fases.find((x) => x.id === cfg.id);
                const carita = f?.carita ?? 'neutra';
                return (
                  <button
                    key={cfg.id}
                    type="button"
                    className={estilos.botonFase}
                    aria-pressed={faseActiva === cfg.id}
                    onClick={() => setFaseActiva(cfg.id)}
                  >
                    <div className={estilos.faseCabeza}>
                      <span className={estilos.faseNumero}>{cfg.numero}</span>
                      <span className={estilos.chipCarita} data-carita={carita}>
                        {f?.porcentaje ?? 0} %
                      </span>
                    </div>
                    <span className={estilos.faseTitulo}>{cfg.titulo}</span>
                    <span className={estilos.faseSubtitulo}>
                      {cfg.subtitulo} · {formatearPromedioViaje(f?.promedio)} / 3,00
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Franja de hallazgos clave */}
            <div className={estilos.gridHallazgos}>
              <div className={estilos.tarjetaHallazgo}>
                <span className={estilos.apoyo}>Promedio general del viaje</span>
                <strong className="numero">
                  {formatearPromedioViaje(resumen.promedioGeneral)} / 3,00 ({resumen.porcentajeGeneral ?? 0} %)
                </strong>
                <span className={estilos.apoyo}>
                  {resumen.caritaGeneral ? REGLAS_CARITA[resumen.caritaGeneral].etiqueta : '—'}
                </span>
              </div>
              <div className={estilos.tarjetaHallazgo}>
                <span className={estilos.apoyo}>Punto de mayor fricción</span>
                <strong>
                  {faseFriccion
                    ? `${FASES_VIAJE_CONFIG.find((c) => c.id === faseFriccion.id)?.titulo} (${formatearPromedioViaje(faseFriccion.promedio)})`
                    : '—'}
                </strong>
                <span className={estilos.apoyo}>
                  {faseFuerte && faseFriccion && faseFuerte.id !== faseFriccion.id
                    ? `Mayor fortaleza: ${FASES_VIAJE_CONFIG.find((c) => c.id === faseFuerte.id)?.titulo} (${formatearPromedioViaje(faseFuerte.promedio)}).`
                    : 'Todas las fases muestran un puntaje equilibrado.'}
                </span>
              </div>
              <div className={estilos.tarjetaHallazgo}>
                <span className={estilos.apoyo}>Prioridad de mejora más señalada (P10)</span>
                <strong>{prioridadMejora ? `${prioridadMejora.porcentaje} %` : '—'}</strong>
                <span className={estilos.apoyo}>{prioridadMejora ? prioridadMejora.texto : 'Sin respuestas'}</span>
              </div>
            </div>

            {/* Detalle de la fase seleccionada */}
            <section className={estilos.detalleFase} aria-labelledby="titulo-detalle-fase">
              <div className={estilos.encabezadoPanel}>
                <div>
                  <h4 id="titulo-detalle-fase" className={estilos.subtitulo}>
                    {cfgFaseActiva.numero}. {cfgFaseActiva.titulo} ({cfgFaseActiva.subtitulo})
                  </h4>
                  <span className={estilos.apoyo}>{cfgFaseActiva.descripcion}</span>
                </div>
                {datosFaseActiva?.carita && (
                  <span className={estilos.chipCarita} data-carita={datosFaseActiva.carita}>
                    {REGLAS_CARITA[datosFaseActiva.carita].etiqueta} · {formatearPromedioViaje(datosFaseActiva.promedio)} / 3,00
                  </span>
                )}
              </div>

              {datosFaseActiva?.carita && <p className={estilos.texto}>{REGLAS_CARITA[datosFaseActiva.carita].interpretacion}</p>}

              <ul className={estilos.listaPreguntasDetalle}>
                {preguntasFase.map((preg) => {
                  const res = resumen.preguntas[preg.indice];
                  if (!res) return null;
                  const total = res.conteos.a + res.conteos.b + res.conteos.c;
                  const top = opcionPredominante(preg.indice, res.conteos);
                  return (
                    <li key={preg.numero} className={estilos.itemPreguntaDetalle}>
                      <div className={estilos.encabezadoPanel}>
                        <strong>
                          {preg.numero}. {preg.texto}
                        </strong>
                        <span className={`${estilos.apoyo} numero`}>Promedio {formatearPromedioViaje(res.promedio)} / 3,00</span>
                      </div>

                      {preg.opciones.map((op) => {
                        const cantidad = op.letra === 'A' ? res.conteos.a : op.letra === 'B' ? res.conteos.b : res.conteos.c;
                        const pct = total ? Math.round((cantidad / total) * 100) : 0;
                        return (
                          <div key={op.letra} className={estilos.barraOpcion}>
                            <span>
                              <strong>{op.letra}.</strong> {op.texto}
                            </span>
                            <span className="numero">
                              {cantidad} ({pct} %)
                            </span>
                            <div className={estilos.pistaOpcion} aria-hidden="true">
                              <div className={estilos.rellenoOpcion} data-letra={op.letra} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}

                      {preg.prioridad && top && (
                        <span className={estilos.apoyo}>
                          Opción más frecuente del equipo: <strong>{top.letra}</strong> ({top.porcentaje} %).
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </div>

      {/* Comentarios cualitativos del taller */}
      {datos.comentarios.length > 0 && (
        <section aria-labelledby="titulo-comentarios-viaje">
          <h3 id="titulo-comentarios-viaje" className={estilos.subtitulo}>
            {esLider ? 'Aportes y observaciones del taller (anónimos)' : 'Tus observaciones del taller'}
          </h3>
          <ul className={estilos.listaTarjetas}>
            {datos.comentarios.map((c) => (
              <li key={c.id} className={estilos.tarjetaRegistro}>
                <p>{c.comentario}</p>
                <span className={estilos.apoyo}>
                  {c.periodo}
                  {c.area ? ` · ${c.area}` : ''} · {formatearFechaVista(c.creadoEn)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FormularioViaje({ propias, alGuardar }: { propias: readonly RespuestaViajePropia[]; alGuardar(): void }) {
  const { estado, enviar, limpiar } = useEnvio();
  const [periodo, setPeriodo] = useState<string>(PERIODOS_VIAJE[0]);
  const [area, setArea] = useState('');
  const [comentario, setComentario] = useState('');
  const [respuestas, setRespuestas] = useState<string[]>(VACIAS_12);

  const existente = propias.find((p) => p.periodo === periodo);

  // Precarga la respuesta previa del usuario al cambiar de periodo si ya había respondido.
  useEffect(() => {
    if (existente) {
      setRespuestas(existente.respuestas.map(String));
      setArea(existente.area);
      setComentario(existente.comentario);
    } else {
      setRespuestas(VACIAS_12());
      setArea('');
      setComentario('');
    }
  }, [existente]);

  const contestadas = respuestas.filter((r) => r !== '').length;
  const completo = contestadas === 12;

  const cambiar = (indice: number, valor: string) => {
    setRespuestas((prev) => prev.map((v, i) => (i === indice ? valor : v)));
    limpiar();
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await enviar(
      () =>
        api.guardarViajeA({
          periodo,
          area,
          comentario,
          respuestas: respuestas.map(Number),
        }),
      existente ? 'Tu respuesta del mapa de viaje fue actualizada.' : 'Gracias, tu respuesta quedó registrada en el mapa de viaje.',
    );
    if (ok) alGuardar();
  };

  return (
    <form className={formulario.formulario} onSubmit={guardar}>
      <div className={formulario.fila}>
        <CampoSeleccion
          etiqueta="Periodo de evaluación"
          value={periodo}
          onChange={(e) => {
            setPeriodo(e.target.value);
            limpiar();
          }}
        >
          {PERIODOS_VIAJE.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </CampoSeleccion>
        <CampoTexto
          etiqueta="Área o equipo (opcional)"
          value={area}
          maxLength={80}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Ej. Producción, Logística, Comercial"
        />
      </div>

      {existente && (
        <p className={estilos.notaRegla}>
          Ya tienes una respuesta guardada para <strong>{periodo}</strong>. Puedes revisarla o modificarla y volver a guardar.
        </p>
      )}

      <div className={estilos.progresoEncuesta} aria-live="polite">
        <span className="numero">{contestadas} de 12 preguntas respondidas</span>
        <div className={estilos.pistaProgreso} aria-hidden="true">
          <div className={estilos.rellenoProgreso} style={{ width: `${Math.round((contestadas / 12) * 100)}%` }} />
        </div>
      </div>

      {FASES_VIAJE_CONFIG.map((fase) => {
        const preguntas = PREGUNTAS_VIAJE.filter((p) => p.fase === fase.id);
        return (
          <section key={fase.id} className={estilos.bloqueFaseForm} aria-labelledby={`fase-form-${fase.id}`}>
            <div>
              <h3 id={`fase-form-${fase.id}`} className={estilos.subtitulo}>
                {fase.numero}. {fase.titulo} · {fase.subtitulo}
              </h3>
              <span className={estilos.apoyo}>{fase.descripcion}</span>
            </div>

            {preguntas.map((preg) => (
              <OpcionesRespuesta
                key={preg.numero}
                etiqueta={`${preg.numero}. ${preg.texto}`}
                disposicion="lista"
                opciones={preg.opciones.map((op) => ({
                  valor: String(op.puntaje),
                  texto: `${op.letra}. ${op.texto}`,
                }))}
                valor={respuestas[preg.indice] ?? ''}
                alCambiar={(v) => cambiar(preg.indice, v)}
              />
            ))}
          </section>
        );
      })}

      <CampoArea
        etiqueta="Comentario o sugerencia adicional del taller (opcional)"
        value={comentario}
        maxLength={500}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="¿Hay algo puntual que facilite sostener el cambio en tu día a día?"
      />

      <div className={estilos.pieForm}>
        <Boton type="submit" disabled={!completo || estado.fase === 'enviando'}>
          {existente ? 'Actualizar respuesta' : 'Enviar respuesta'}
        </Boton>
        <MensajeEnvio estado={estado} />
      </div>
    </form>
  );
}

function GuiaTallerViaje() {
  return (
    <div className={estilos.bloques}>
      <section aria-labelledby="titulo-momentos-taller">
        <h3 id="titulo-momentos-taller" className={estilos.subtitulo}>
          Cómo realizar el taller del mapa del colaborador
        </h3>
        <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Guía de los cuatro momentos del taller">
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Momento</th>
                <th scope="col">Preguntas orientadoras del taller</th>
                <th scope="col">Enfoque</th>
              </tr>
            </thead>
            <tbody>
              {FASES_VIAJE_CONFIG.map((f) => (
                <tr key={f.id}>
                  <th scope="row">
                    {f.numero}. {f.tallerTitulo}
                  </th>
                  <td>{f.tallerPreguntas}</td>
                  <td>{f.tallerEnfoque}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="titulo-escala-caritas">
        <h3 id="titulo-escala-caritas" className={estilos.subtitulo}>
          Sistema de puntuación escalar y asignación de caritas
        </h3>
        <p className={estilos.texto}>
          Cada respuesta se convierte automáticamente en un valor numérico de 1 a 3 puntos (A = 3 puntos, B = 2 puntos, C = 1 punto). El puntaje de
          cada fase resulta del promedio de todas las respuestas sobre el número de colaboradores participantes:
        </p>
        <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Regla de asignación visual de caritas">
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Estado</th>
                <th scope="col">Promedio</th>
                <th scope="col">Interpretación</th>
              </tr>
            </thead>
            <tbody>
              {(['feliz', 'neutra', 'preocupada'] as EstadoCarita[]).map((c) => (
                <tr key={c}>
                  <th scope="row">
                    <span className={estilos.chipCarita} data-carita={c}>
                      {REGLAS_CARITA[c].etiqueta}
                    </span>
                  </th>
                  <td className="numero">{REGLAS_CARITA[c].rango}</td>
                  <td>{REGLAS_CARITA[c].interpretacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
