import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { ESTILOS_LIDERAZGO, LETRAS_LIDERAZGO } from '../../config/formularios/liderazgo';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useSesion } from '../../estado/SesionContexto';
import { api, ErrorApi, type EscalamientoCoach, type TurnoCoach } from '../../lib/api';
import { resumirLiderazgo } from '../../lib/calculo/liderazgo';
import type { DatosProyecto, Proyecto, SoporteLideres } from '../../lib/modelo/proyecto';
import estilos from './CoachLideres.module.css';

interface MensajeChat extends TurnoCoach {
  id: string;
  escalamiento?: EscalamientoCoach | null;
}

const SUGERENCIAS = [
  'Un colaborador me preguntó si este cambio va a implicar despidos o recorte de personal.',
  'Siento resistencia abierta en una persona del equipo que dice que antes todo funcionaba mejor.',
  'Me preguntaron por fechas de un bono por adopción del nuevo sistema y no tengo esa información.',
];

function extraerEscalamientoCliente(texto: string): EscalamientoCoach | null {
  if (!texto.includes('sin_respuesta_oficial')) return null;
  const candidatos: string[] = [];
  const regex = /```(?:json)?\s*([\s\S]*?)```/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(texto)) !== null) {
    if (match[1]) candidatos.push(match[1].trim());
  }
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (inicio !== -1 && fin > inicio) {
    candidatos.push(texto.slice(inicio, fin + 1));
  }
  for (const bloque of candidatos) {
    try {
      const obj = JSON.parse(bloque) as Partial<EscalamientoCoach>;
      if (obj && obj.tipo === 'sin_respuesta_oficial') {
        return {
          fecha: typeof obj.fecha === 'string' ? obj.fecha : new Date().toISOString().slice(0, 10),
          area: typeof obj.area === 'string' ? obj.area : '',
          pregunta: typeof obj.pregunta === 'string' ? obj.pregunta : '',
          tipo: 'sin_respuesta_oficial',
          estado: typeof obj.estado === 'string' ? obj.estado : 'pendiente',
          respuesta_oficial: obj.respuesta_oficial ?? null,
        };
      }
    } catch {
      // Seguir intentando
    }
  }
  return null;
}

function resumirFuentesDisponibles(activo: Proyecto | null, datos: DatosProyecto, soporte: SoporteLideres, textoAdicional: string): string[] {
  const fuentes: string[] = [];
  const hayR1 =
    Boolean(activo?.empresa.nombre.trim() || activo?.empresa.que_cambia.trim() || activo?.empresa.fecha_lanzamiento.trim()) ||
    Boolean(
      datos.lienzo.vision.trim() ||
        datos.lienzo.que_cambia.trim() ||
        datos.lienzo.que_no_cambia.trim() ||
        datos.lienzo.afectados.trim() ||
        datos.lienzo.urgencia.length ||
        datos.lienzo.beneficios.length ||
        datos.lienzo.criterios.length ||
        datos.lienzo.riesgos.length,
    );
  if (hayR1) fuentes.push('Ficha R1');

  const hayU2 = Boolean(
    datos.narrativa.vocero.trim() ||
      datos.narrativa.urgencia.trim() ||
      datos.narrativa.vision.trim() ||
      datos.narrativa.que_cambia.trim() ||
      datos.narrativa.que_se_mantiene.trim() ||
      datos.narrativa.acompanamiento.trim() ||
      datos.narrativa.que_gano.trim(),
  );
  if (hayU2) fuentes.push('Narrativa U2');

  const hayU3 =
    soporte.mensajes.some((m) => m.trim()) ||
    soporte.pautas.some((p) => p.trim()) ||
    soporte.preguntas.some((q) => q.pregunta.trim() || q.respuesta.trim());
  if (hayU3) fuentes.push('FAQs U3');

  const hayU4 =
    datos.empatia.oye.length > 0 ||
    datos.empatia.ve.length > 0 ||
    datos.empatia.piensa_siente.length > 0 ||
    datos.empatia.dice_hace.length > 0 ||
    datos.empatia.dolores.length > 0 ||
    datos.empatia.necesidades.length > 0 ||
    datos.empatia.estrategias.length > 0;
  if (hayU4) fuentes.push('Mapa de empatía U4');

  if (datos.buzon1.length > 0) fuentes.push(`Buzón R5 (${datos.buzon1.length})`);
  if (textoAdicional.trim()) fuentes.push('Anexo manual');
  return fuentes;
}

interface Props {
  /** Borrador vivo de U3 (mensajes, FAQs, pautas) para que el Coach vea incluso cambios recién editados. */
  soporteActual?: SoporteLideres;
}

/**
 * Coach de Comunicación para Líderes (RUTA ANDI - Paso U3).
 * Asistente conversacional conectado a POST /api/coach/chat (@google/genai · gemini-2.5-flash).
 */
export function CoachLideres({ soporteActual }: Props) {
  const { activo, datos } = useProyecto();
  const { usuario, expirar } = useSesion();

  const lideresU1 = useMemo(() => resumirLiderazgo(datos.liderazgo), [datos.liderazgo]);
  const areasProyecto = useMemo(
    () => (activo?.segmentacion.areas ?? []).map((a) => a.area.trim()).filter(Boolean),
    [activo],
  );

  const liderInicial = useMemo(() => {
    if (lideresU1.length === 0) return null;
    const porVocero = datos.narrativa.vocero ? lideresU1.find((l) => l.lider_id === datos.narrativa.vocero) : null;
    return porVocero ?? lideresU1[0];
  }, [lideresU1, datos.narrativa.vocero]);

  const [liderSeleccionado, setLiderSeleccionado] = useState<string>(liderInicial?.lider_id ?? '');
  const [estiloU1, setEstiloU1] = useState<string>(liderInicial?.dominantes[0] ?? '');
  const [area, setArea] = useState<string>(areasProyecto[0] ?? '');
  const [textoAdicional, setTextoAdicional] = useState('');

  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [entrada, setEntrada] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [modoEnsayo, setModoEnsayo] = useState(false);
  const [error, setError] = useState('');

  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [guardadosIds, setGuardadosIds] = useState<Record<string, boolean>>({});
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [escalamientosGuardados, setEscalamientosGuardados] = useState<EscalamientoCoach[]>([]);

  const finChatRef = useRef<HTMLDivElement | null>(null);

  // Sincroniza selección inicial cuando cambian encuestas U1 o áreas del proyecto si el usuario no eligió aún.
  useEffect(() => {
    if (!estiloU1 && liderInicial?.dominantes[0]) {
      setLiderSeleccionado(liderInicial.lider_id);
      setEstiloU1(liderInicial.dominantes[0]);
    }
  }, [liderInicial, estiloU1]);

  useEffect(() => {
    if (!area && areasProyecto[0]) {
      setArea(areasProyecto[0]);
    }
  }, [areasProyecto, area]);

  // Cargar escalamientos guardados en SQLite al abrir U3.
  useEffect(() => {
    let activoEfecto = true;
    api
      .coachEscalamientos()
      .then((res) => {
        if (activoEfecto) setEscalamientosGuardados(res.escalamientos);
      })
      .catch(() => undefined);
    return () => {
      activoEfecto = false;
    };
  }, []);

  useEffect(() => {
    finChatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [mensajes, enviando]);

  const soporteVigente = soporteActual ?? datos.soporte;
  const fuentesLocales = useMemo(
    () => resumirFuentesDisponibles(activo, datos, soporteVigente, textoAdicional),
    [activo, datos, soporteVigente, textoAdicional],
  );

  const alElegirLiderU1 = (idLider: string) => {
    setLiderSeleccionado(idLider);
    const encontrado = lideresU1.find((l) => l.lider_id === idLider);
    if (encontrado?.dominantes[0]) {
      setEstiloU1(encontrado.dominantes[0]);
    }
  };

  const enviarMensaje = async (textoDirecto?: string) => {
    const contenido = (textoDirecto ?? entrada).trim();
    if (!contenido || enviando) return;

    setError('');
    setEnviando(true);
    if (!textoDirecto) setEntrada('');

    const historialPrevio: TurnoCoach[] = mensajes.map(({ role, text }) => ({ role, text }));
    const nuevoTurnoUsuario: MensajeChat = {
      id: crypto.randomUUID(),
      role: 'user',
      text: contenido,
    };

    const normalizado = contenido.toLowerCase();
    const iniciaEnsayo = /quiero practicar|practicar|modo ensayo|ensayar/.test(normalizado);
    const terminaEnsayo = /^terminar\b|terminar ensayo|salir del ensayo/.test(normalizado);

    setMensajes((prev) => [...prev, nuevoTurnoUsuario]);
    if (iniciaEnsayo) setModoEnsayo(true);

    try {
      const respuesta = await api.coachChat({
        message: contenido,
        history: historialPrevio,
        liderConfig: {
          area: area.trim(),
          estiloU1,
          ...(liderSeleccionado ? { liderId: liderSeleccionado } : {}),
        },
        documentosOficiales: {
          empresa: activo?.empresa ?? null,
          r1Lienzo: datos.lienzo,
          u2Narrativa: datos.narrativa,
          u3Soporte: soporteVigente,
          u4Empatia: datos.empatia,
          r5Buzon: datos.buzon1,
          adicionales: textoAdicional.trim(),
        },
      });

      const escalamiento = respuesta.escalamiento ?? extraerEscalamientoCliente(respuesta.reply);
      const turnoCoach: MensajeChat = {
        id: crypto.randomUUID(),
        role: 'model',
        text: respuesta.reply,
        escalamiento,
      };
      setMensajes((prev) => [...prev, turnoCoach]);
      if (terminaEnsayo) setModoEnsayo(false);
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 401) {
        expirar();
        return;
      }
      setError(e instanceof Error ? e.message : 'No se pudo consultar al Coach de Líderes.');
      // Restaurar el texto si falló para no perder lo que escribió el líder
      if (!textoDirecto) setEntrada(contenido);
      setMensajes((prev) => prev.filter((m) => m.id !== nuevoTurnoUsuario.id));
    } finally {
      setEnviando(false);
    }
  };

  const alEnviarFormulario = (e: FormEvent) => {
    e.preventDefault();
    void enviarMensaje();
  };

  const alPresionarTecla = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void enviarMensaje();
    }
  };

  const copiarJson = async (idMensaje: string, escalamiento: EscalamientoCoach) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(escalamiento, null, 2));
      setCopiadoId(idMensaje);
      window.setTimeout(() => setCopiadoId((actual) => (actual === idMensaje ? null : actual)), 2200);
    } catch {
      setError('No se pudo copiar automáticamente al portapapeles. Puedes seleccionar y copiar el JSON manualmente.');
    }
  };

  const guardarEscalamiento = async (idMensaje: string, escalamiento: EscalamientoCoach) => {
    if (guardadosIds[idMensaje] || guardandoId) return;
    setGuardandoId(idMensaje);
    setError('');
    try {
      const { escalamiento: guardado } = await api.guardarEscalamientoCoach({
        fecha: escalamiento.fecha,
        area: escalamiento.area || area.trim() || 'No especificada',
        pregunta: escalamiento.pregunta,
        tipo: 'sin_respuesta_oficial',
        estado: escalamiento.estado || 'pendiente',
        respuesta_oficial: escalamiento.respuesta_oficial ?? null,
      });
      setGuardadosIds((prev) => ({ ...prev, [idMensaje]: true }));
      setEscalamientosGuardados((prev) => [guardado, ...prev]);
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 401) {
        expirar();
        return;
      }
      setError(e instanceof Error ? e.message : 'No se pudo guardar el escalamiento.');
    } finally {
      setGuardandoId(null);
    }
  };

  const limpiarChat = () => {
    setMensajes([]);
    setModoEnsayo(false);
    setError('');
  };

  return (
    <div className={estilos.contenedor}>
      <header className={estilos.encabezado}>
        <div className={estilos.tituloGrupo}>
          <h3 className={estilos.titulo}>Coach de Comunicación para Líderes (Paso U3)</h3>
          <p className={estilos.subtitulo}>
            Prepara conversaciones reales con tu equipo con base exclusiva en los documentos oficiales del cambio y tu estilo U1.
          </p>
        </div>
        <div className={estilos.insignias}>
          {usuario && <span className={estilos.insignia}>Sesión: {usuario.nombre}</span>}
          {modoEnsayo && <span className={`${estilos.insignia} ${estilos.insigniaEnsayo}`}>Modo ensayo activo</span>}
        </div>
      </header>

      <section className={estilos.panelConfig} aria-label="Configuración del líder y documentos oficiales">
        <div className={estilos.rejillaConfig}>
          {lideresU1.length > 0 && (
            <CampoSeleccion
              etiqueta="Líder clasificado (U1)"
              value={liderSeleccionado}
              onChange={(e) => alElegirLiderU1(e.target.value)}
            >
              <option value="">Personalizado…</option>
              {lideresU1.map((l) => (
                <option key={l.lider_id} value={l.lider_id}>
                  {l.lider_id} · {l.dominantes.map((d) => `${d} (${ESTILOS_LIDERAZGO[d].nombre})`).join(' / ')}
                </option>
              ))}
            </CampoSeleccion>
          )}

          <CampoSeleccion
            etiqueta="Estilo de liderazgo (U1)"
            value={estiloU1}
            onChange={(e) => setEstiloU1(e.target.value)}
          >
            <option value="">Sin definir (el Coach preguntará)</option>
            {LETRAS_LIDERAZGO.map((letra) => (
              <option key={letra} value={letra}>
                {letra} · {ESTILOS_LIDERAZGO[letra].nombre}
              </option>
            ))}
          </CampoSeleccion>

          {areasProyecto.length > 0 ? (
            <CampoSeleccion etiqueta="Área del líder" value={area} onChange={(e) => setArea(e.target.value)}>
              <option value="">Sin definir…</option>
              {areasProyecto.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </CampoSeleccion>
          ) : (
            <CampoTexto
              etiqueta="Área del líder"
              placeholder="Ej. Operaciones, Logística, Comercial"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          )}
        </div>

        <div className={estilos.fuentes}>
          <span>Documentos oficiales detectados:</span>
          {fuentesLocales.length > 0 ? (
            fuentesLocales.map((f) => (
              <span key={f} className={`${estilos.insignia} ${estilos.insigniaActiva}`}>
                {f}
              </span>
            ))
          ) : (
            <span className={`${estilos.insignia} ${estilos.insigniaAlerta}`}>
              Sin documentos cargados todavía (diligencia R1/U2/U3/U4/R5 o pega información oficial abajo)
            </span>
          )}
        </div>

        <details className={estilos.anexos}>
          <summary>Pegar o complementar documentos oficiales adicionales (opcional)</summary>
          <CampoArea
            etiqueta="Texto oficial complementario"
            ayuda="Si aún no has llenado R1, U2, FAQs, U4 o R5 en la app, puedes pegar aquí información oficial aprobada (sin nombres propios)."
            placeholder="Ej. Cronograma oficial, lineamientos aprobados, respuestas de RR. HH. o Gestión del Cambio…"
            value={textoAdicional}
            onChange={(e) => setTextoAdicional(e.target.value)}
          />
        </details>
      </section>

      <section className={estilos.chatCaja} aria-label="Conversación con el Coach de Líderes">
        <div className={estilos.barraModo}>
          <div className={estilos.accionesRapidas}>
            <Boton
              variante={modoEnsayo ? 'secundario' : 'principal'}
              disabled={enviando || modoEnsayo}
              onClick={() => void enviarMensaje('Quiero practicar')}
            >
              Quiero practicar
            </Boton>
            <Boton
              variante="secundario"
              disabled={enviando || !modoEnsayo}
              onClick={() => void enviarMensaje('Terminar')}
            >
              Terminar
            </Boton>
          </div>
          {mensajes.length > 0 && (
            <Boton variante="secundario" disabled={enviando} onClick={limpiarChat}>
              Nueva conversación
            </Boton>
          )}
        </div>

        <div className={estilos.mensajes} aria-live="polite">
          {mensajes.length === 0 ? (
            <div className={estilos.vacio}>
              <strong>¿Qué conversación necesitas preparar hoy?</strong>
              <span>
                Cuéntame una duda, objeción o reacción de tu equipo, o pulsa <strong>«Quiero practicar»</strong> para ensayar un juego de roles con un colaborador.
              </span>
              <div className={estilos.ejemplos}>
                {SUGERENCIAS.map((s) => (
                  <button key={s} type="button" className={estilos.chipEjemplo} onClick={() => void enviarMensaje(s)} disabled={enviando}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            mensajes.map((m) => (
              <div key={m.id} className={`${estilos.filaMensaje} ${m.role === 'user' ? estilos.filaUsuario : estilos.filaCoach}`}>
                <span className={estilos.autor}>{m.role === 'user' ? 'Líder' : 'Coach RUTA ANDI'}</span>
                <div className={`${estilos.burbuja} ${m.role === 'user' ? estilos.burbujaUsuario : estilos.burbujaCoach}`}>{m.text}</div>

                {m.role === 'model' && m.escalamiento && (
                  <div className={estilos.tarjetaEscalamiento} role="region" aria-label="Ficha de escalamiento">
                    <div className={estilos.encabezadoEscalamiento}>
                      <h4 className={estilos.tituloEscalamiento}>Ficha de escalamiento (sin respuesta oficial)</h4>
                      <span className={estilos.insignia}>Estado: {m.escalamiento.estado}</span>
                    </div>
                    <pre className={estilos.codigoJson}>{JSON.stringify(m.escalamiento, null, 2)}</pre>
                    <div className={estilos.accionesEscalamiento}>
                      <Boton variante="secundario" onClick={() => void copiarJson(m.id, m.escalamiento!)}>
                        {copiadoId === m.id ? 'JSON copiado' : 'Copiar JSON'}
                      </Boton>
                      <Boton
                        variante="principal"
                        disabled={Boolean(guardadosIds[m.id]) || guardandoId === m.id}
                        onClick={() => void guardarEscalamiento(m.id, m.escalamiento!)}
                      >
                        {guardadosIds[m.id]
                          ? 'Escalamiento guardado'
                          : guardandoId === m.id
                            ? 'Guardando…'
                            : 'Guardar escalamiento'}
                      </Boton>
                      {guardadosIds[m.id] && <span className={estilos.confirmacion}>Registrado de forma anónima</span>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {enviando && <p className={estilos.cargando}>El Coach está preparando su respuesta…</p>}
          <div ref={finChatRef} />
        </div>

        <form className={estilos.compositor} onSubmit={alEnviarFormulario}>
          {error && (
            <p className={estilos.error} role="alert">
              {error}
            </p>
          )}
          <div className={estilos.entradaFila}>
            <textarea
              className={estilos.entradaTexto}
              rows={2}
              aria-label="Escribe tu consulta para el Coach"
              placeholder={
                modoEnsayo
                  ? 'Responde como jefe al colaborador (o pulsa «Terminar» para recibir retroalimentación)…'
                  : 'Escribe la situación o pregunta de tu equipo… (Enter para enviar, Shift+Enter para salto de línea)'
              }
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              onKeyDown={alPresionarTecla}
              disabled={enviando}
            />
            <Boton type="submit" disabled={enviando || !entrada.trim()}>
              {enviando ? 'Enviando…' : 'Enviar'}
            </Boton>
          </div>
        </form>
      </section>

      {escalamientosGuardados.length > 0 && (
        <details className={estilos.historialEscalamientos}>
          <summary>Escalamientos guardados ({escalamientosGuardados.length})</summary>
          <ul className={estilos.listaEscalamientos}>
            {escalamientosGuardados.map((esc, idx) => (
              <li key={esc.id ?? idx} className={estilos.itemEscalamiento}>
                <strong>{esc.pregunta}</strong>
                <span className={estilos.metaEscalamiento}>
                  Área: {esc.area || 'No especificada'} · Fecha: {esc.fecha} · Estado: {esc.estado}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
