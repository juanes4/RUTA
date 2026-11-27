import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CONFIG_IA } from '../../config/ia';
import { useSesion } from '../../estado/SesionContexto';
import {
  api,
  ErrorApi,
  type AccionAsistenteA,
  type EstadoAsistenteA,
  type RespuestaAsistenteA,
} from '../../lib/api';
import estilos from './AsistenteEtapaA.module.css';

interface Props {
  pasoActual: 'A1' | 'A2' | null;
  esLider: boolean;
}

type MensajeChat =
  | { id: number; autor: 'usuario'; texto: string }
  | { id: number; autor: 'asistente'; datos: RespuestaAsistenteA }
  | { id: number; autor: 'error'; texto: string };

interface AccionRapida {
  etiqueta: string;
  accion: AccionAsistenteA;
  mensaje?: string;
}

const claveSesionChat = (usuarioId: number | undefined) => `ruta:asistente-a:v1:${usuarioId ?? 'anon'}`;

function leerHistorialGuardado(clave: string): MensajeChat[] {
  try {
    const raw = window.localStorage.getItem(clave);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MensajeChat[]).slice(-30) : [];
  } catch {
    return [];
  }
}

/**
 * Asistente contextual exclusivo de la Etapa A (Analizar).
 * Integra las 3 capacidades elegidas:
 *  1) Diagnóstico de semáforos A1 y plan de rescate a 15 días.
 *  2) Lectura cruzada A1 + insumos de Etapa T (solo líderes).
 *  4) Intérprete de la curva emocional y prioridades de mejora (A2).
 */
export function AsistenteEtapaA({ pasoActual, esLider }: Props) {
  const { usuario, expirar } = useSesion();
  const claveStorage = claveSesionChat(usuario?.id);
  const [abierto, setAbierto] = useState(false);
  const [estadoMotor, setEstadoMotor] = useState<EstadoAsistenteA | null>(null);
  const [mensajes, setMensajes] = useState<MensajeChat[]>(() => leerHistorialGuardado(claveStorage));
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const seqRef = useRef(Date.now());

  // Si cambia la cuenta iniciada, carga su conversación aislada.
  useEffect(() => {
    setMensajes(leerHistorialGuardado(claveStorage));
  }, [claveStorage]);

  // Persiste la conversación en localStorage: no se borra al cambiar de etapa ni al cerrar el navegador.
  useEffect(() => {
    try {
      window.localStorage.setItem(claveStorage, JSON.stringify(mensajes.slice(-30)));
    } catch {
      // Ignora si el navegador bloquea localStorage.
    }
  }, [claveStorage, mensajes]);

  useEffect(() => {
    if (!CONFIG_IA.habilitada) return;
    let vigente = true;
    api
      .estadoAsistenteA()
      .then((d) => vigente && setEstadoMotor(d))
      .catch(() => {
        // Silencioso: si falla el estado inicial, el botón sigue operativo.
      });
    return () => {
      vigente = false;
    };
  }, [pasoActual]);

  useEffect(() => {
    if (!abierto) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    window.addEventListener('keydown', alTecla);
    return () => window.removeEventListener('keydown', alTecla);
  }, [abierto]);

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [mensajes, cargando, abierto]);

  if (!CONFIG_IA.habilitada) return null;

  const accionesRapidas: AccionRapida[] = esLider
    ? [
        { etiqueta: 'Diagnóstico A1 y plan 15 días', accion: 'diagnostico_a1' },
        { etiqueta: 'Cruzar A1 con Etapa T', accion: 'cruce_a1_t' },
        { etiqueta: 'Curva A2 y prioridades', accion: 'curva_a2' },
      ]
    : [
        { etiqueta: 'Interpretar curva A2 y prioridades', accion: 'curva_a2' },
        { etiqueta: 'Estado del tablero A1', accion: 'diagnostico_a1' },
        { etiqueta: '¿Cómo se calculan las caritas?', accion: 'libre', mensaje: '¿Cómo se calculan las caritas en A2?' },
      ];

  const consultar = async (accion: AccionAsistenteA, textoVisible: string, mensajeLibre?: string) => {
    if (cargando) return;
    const historialCorto = mensajes
      .filter((m): m is Extract<MensajeChat, { autor: 'usuario' | 'asistente' }> => m.autor !== 'error')
      .slice(-4)
      .map((m) => ({
        autor: m.autor,
        texto: m.autor === 'usuario' ? m.texto : `${m.datos.titulo}: ${m.datos.resumen}`,
      }));

    setMensajes((prev) => [...prev, { id: seqRef.current++, autor: 'usuario', texto: textoVisible }]);
    setCargando(true);
    try {
      const resp = await api.consultarAsistenteA({
        accion,
        mensaje: mensajeLibre ?? (accion === 'libre' ? textoVisible : undefined),
        pasoActual,
        historial: historialCorto,
      });
      setMensajes((prev) => [...prev, { id: seqRef.current++, autor: 'asistente', datos: resp }]);
      setEstadoMotor((prev) => (prev ? { ...prev, modo: resp.motor } : prev));
    } catch (e: unknown) {
      if (e instanceof ErrorApi && e.estado === 401) expirar();
      setMensajes((prev) => [
        ...prev,
        { id: seqRef.current++, autor: 'error', texto: e instanceof Error ? e.message : 'No se pudo obtener respuesta.' },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const enviarLibre = (e: FormEvent) => {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || cargando) return;
    setTexto('');
    void consultar('libre', limpio, limpio);
  };

  const rojas = estadoMotor?.alertas.rojas ?? 0;

  return (
    <>
      <button
        type="button"
        className={estilos.disparador}
        aria-expanded={abierto}
        aria-controls="panel-asistente-etapa-a"
        onClick={() => setAbierto((v) => !v)}
      >
        <IconoChispa />
        <span>Asistente Etapa A</span>
        {rojas > 0 && (
          <span className={`${estilos.badgeAlerta} numero`} title={`${rojas} indicador(es) en rojo en A1`}>
            {rojas} {rojas === 1 ? 'alerta' : 'alertas'}
          </span>
        )}
      </button>

      {abierto && (
        <aside
          id="panel-asistente-etapa-a"
          className={estilos.panel}
          role="dialog"
          aria-label="Asistente inteligente de la Etapa A"
        >
          <header className={estilos.cabecera}>
            <div className={estilos.tituloGrupo}>
              <h2 className={estilos.titulo}>Asistente RUTA · Etapa A</h2>
              <span className={estilos.chipMotor} data-modo={estadoMotor?.modo ?? 'local'}>
                <span className={estilos.puntoMotor} aria-hidden="true" />
                {estadoMotor?.modo === 'gemini' ? 'Gemini + Motor RUTA' : 'Motor analítico RUTA'}
              </span>
            </div>
            <div className={estilos.accionesCabecera}>
              {mensajes.length > 0 && (
                <button type="button" className={estilos.botonIcono} onClick={() => setMensajes([])}>
                  Limpiar
                </button>
              )}
              <button
                type="button"
                className={estilos.botonIcono}
                aria-label="Cerrar asistente"
                onClick={() => setAbierto(false)}
              >
                Cerrar
              </button>
            </div>
          </header>

          <div className={estilos.barraRapida} aria-label="Consultas rápidas">
            {accionesRapidas.map((a) => (
              <button
                key={a.etiqueta}
                type="button"
                className={estilos.chipAccion}
                disabled={cargando}
                onClick={() => void consultar(a.accion, a.etiqueta, a.mensaje)}
              >
                {a.etiqueta}
              </button>
            ))}
          </div>

          <div className={estilos.mensajes} aria-live="polite">
            <div className={estilos.bienvenida}>
              <p>
                <strong>Hola, soy tu copiloto de la Etapa A (Analizar).</strong> Leo en tiempo real los datos agregados de{' '}
                {pasoActual === 'A1'
                  ? 'tus auditorías en A1'
                  : pasoActual === 'A2'
                    ? 'el Mapa del Colaborador en A2'
                    : 'A1, A2 y los insumos de Etapa T'}
                .
              </p>
              <p>
                Usa los botones rápidos de arriba o pregúntame por cualquier indicador (por ejemplo, <em>«¿por qué está en rojo regreso a lo anterior?»</em> o{' '}
                <em>«¿qué priorizar según el mapa de viaje?»</em>).
              </p>
            </div>

            {mensajes.map((m) => {
              if (m.autor === 'usuario') {
                return (
                  <div key={m.id} className={estilos.burbujaUsuario}>
                    {m.texto}
                  </div>
                );
              }
              if (m.autor === 'error') {
                return (
                  <p key={m.id} className={estilos.errorMsg} role="alert">
                    {m.texto}
                  </p>
                );
              }
              const d = m.datos;
              return (
                <article key={m.id} className={estilos.tarjetaRespuesta}>
                  <h3 className={estilos.respuestaTitulo}>{d.titulo}</h3>
                  <p className={estilos.respuestaResumen}>{d.resumen}</p>

                  {d.secciones.map((sec) => (
                    <div key={sec.encabezado} className={estilos.bloqueSeccion}>
                      <h4 className={estilos.encabezadoSeccion}>{sec.encabezado}</h4>
                      <ul className={estilos.listaItems}>
                        {sec.items.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {d.acciones15Dias.length > 0 && (
                    <div className={estilos.bloquePlan}>
                      <h4 className={estilos.bloquePlanTitulo}>Plan sugerido (próximos 15 días)</h4>
                      <ol className={estilos.listaPlan}>
                        {d.acciones15Dias.map((acc, idx) => (
                          <li key={idx}>{acc}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {d.sugerencias.length > 0 && (
                    <div className={estilos.sugerencias}>
                      {d.sugerencias.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          className={estilos.chipSugerencia}
                          disabled={cargando}
                          onClick={() => void consultar('libre', sug, sug)}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}

            {cargando && (
              <p className={estilos.estadoCarga} role="status">
                Analizando datos en tiempo real de la Etapa A…
              </p>
            )}
            <div ref={finRef} />
          </div>

          <div className={estilos.pie}>
            <form className={estilos.formChat} onSubmit={enviarLibre}>
              <input
                type="text"
                className={estilos.entrada}
                value={texto}
                maxLength={400}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Pregunta por un indicador, la curva o Etapa T…"
                aria-label="Escribe tu consulta para el asistente de Etapa A"
              />
              <button type="submit" className={estilos.botonEnviar} disabled={!texto.trim() || cargando}>
                Enviar
              </button>
            </form>
            <p className={estilos.aviso}>Recomendación asistida con datos agregados · la decisión final es del equipo.</p>
          </div>
        </aside>
      )}
    </>
  );
}

function IconoChispa() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L14.6 9.4L22 12L14.6 14.6L12 22L9.4 14.6L2 12L9.4 9.4L12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}
