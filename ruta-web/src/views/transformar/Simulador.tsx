import { useEffect, useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { ESCALA_1_A_5, ETIQUETAS_SEGURIDAD, PREGUNTA_SEGURIDAD } from '../../config/transformar';
import { useEnvio } from '../../hooks/useRegistros';
import { api, ErrorApi, type PreguntaSimulador, type ResultadoSimulador, type VideoCapacitacion } from '../../lib/api';
import { useSesion } from '../../estado/SesionContexto';
import { MensajeEnvio } from './MensajeEnvio';
import estilos from './etapaT.module.css';

interface Props {
  video: VideoCapacitacion;
  alResponder(resultado: ResultadoSimulador): void;
}

type Carga = { fase: 'cargando' } | { fase: 'error'; mensaje: string } | { fase: 'listo'; preguntas: PreguntaSimulador[]; minimo: number };

const OPCIONES_SEGURIDAD = ESCALA_1_A_5.map((n, i) => ({ valor: n, texto: `${n} · ${ETIQUETAS_SEGURIDAD[i] ?? ''}` }));

/**
 * T2. Al terminar el micro-curso: simulador de 3 preguntas (aprobación
 * práctica) y autoevaluación de seguridad. El servidor califica; la
 * respuesta correcta nunca llega al navegador.
 */
export function Simulador({ video, alResponder }: Props) {
  const { expirar } = useSesion();
  const { estado, enviar, limpiar } = useEnvio();
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' });
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [seguridad, setSeguridad] = useState('');
  const [repitiendo, setRepitiendo] = useState(false);

  useEffect(() => {
    if (!video.visto) return;
    let vigente = true;
    api
      .preguntas(video.id)
      .then((r) => {
        if (!vigente) return;
        setCarga({ fase: 'listo', preguntas: r.preguntas, minimo: r.aprobacionMinima });
        setRespuestas(r.preguntas.map(() => ''));
      })
      .catch((e: unknown) => {
        if (e instanceof ErrorApi && e.estado === 401) expirar();
        if (vigente) setCarga({ fase: 'error', mensaje: e instanceof Error ? e.message : 'Ocurrió un error.' });
      });
    return () => {
      vigente = false;
    };
  }, [video.id, video.visto, expirar]);

  if (!video.visto) {
    return (
      <section className={estilos.simulador} aria-labelledby={`sim-${video.id}`}>
        <h3 id={`sim-${video.id}`} className={estilos.subtitulo}>
          Simulador
        </h3>
        <p className={estilos.texto}>Cuando termines de ver el video, aquí aparece el simulador de 3 preguntas y la autoevaluación de seguridad.</p>
      </section>
    );
  }

  if (carga.fase === 'cargando') return <p role="status">Cargando el simulador…</p>;
  if (carga.fase === 'error') return <p role="alert">No se pudo cargar el simulador: {carga.mensaje}</p>;

  if (video.simulador && !repitiendo) {
    const r = video.simulador;
    return (
      <section className={estilos.simulador} aria-labelledby={`sim-${video.id}`}>
        <h3 id={`sim-${video.id}`} className={estilos.subtitulo}>
          Tu resultado en el simulador
        </h3>
        <p className={estilos.resultado} data-aprobado={r.aprobado} role="status">
          {r.aprobado ? 'Práctica aprobada' : 'Aún no alcanzas la aprobación'}: {r.aciertos} de {r.total} respuestas correctas.
        </p>
        <p className={estilos.texto}>
          Seguridad para aplicarlo solo: {r.seguridad} de 5 ({ETIQUETAS_SEGURIDAD[r.seguridad - 1]}). Tu líder ve este resultado en el historial.
        </p>
        <Boton variante="secundario" onClick={() => { limpiar(); setSeguridad(''); setRespuestas(carga.preguntas.map(() => '')); setRepitiendo(true); }}>
          Repetir el simulador
        </Boton>
      </section>
    );
  }

  const completo = respuestas.every((r) => r !== '') && seguridad !== '';

  const enviarRespuestas = async (e: FormEvent) => {
    e.preventDefault();
    let resultado: ResultadoSimulador | null = null;
    const ok = await enviar(async () => {
      resultado = await api.responderSimulador(video.id, respuestas.map(Number), Number(seguridad));
    }, 'Resultado guardado.');
    if (ok && resultado) {
      alResponder(resultado);
      setRepitiendo(false);
    }
  };

  return (
    <form className={estilos.simulador} onSubmit={enviarRespuestas} aria-labelledby={`sim-${video.id}`}>
      <h3 id={`sim-${video.id}`} className={estilos.subtitulo}>
        Simulador: 3 preguntas
      </h3>
      {carga.preguntas.map((p, i) => (
        <OpcionesRespuesta
          key={p.texto}
          etiqueta={`${i + 1}. ${p.texto}`}
          disposicion="lista"
          opciones={p.opciones.map((texto, j) => ({ valor: String(j), texto }))}
          valor={respuestas[i] ?? ''}
          alCambiar={(v) => setRespuestas((rs) => rs.map((r, k) => (k === i ? v : r)))}
        />
      ))}
      <OpcionesRespuesta etiqueta={`Autoevaluación. ${PREGUNTA_SEGURIDAD}`} disposicion="lista" opciones={OPCIONES_SEGURIDAD} valor={seguridad} alCambiar={setSeguridad} />
      <div className={estilos.pie}>
        <Boton type="submit" disabled={!completo || estado.fase === 'enviando'}>
          Enviar respuestas
        </Boton>
        <MensajeEnvio estado={estado} />
      </div>
    </form>
  );
}
