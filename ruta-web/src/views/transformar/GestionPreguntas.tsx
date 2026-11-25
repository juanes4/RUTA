import { useEffect, useState } from 'react';
import { Boton } from '../../components/ui/Boton';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { useSesion } from '../../estado/SesionContexto';
import { api, ErrorApi, type BrechaSeguridad, type GestionPreguntasIA, type GestionVideo, type JuegoPreguntas } from '../../lib/api';
import { InsigniaAudiencia } from './Capacitaciones';
import etapaT from './etapaT.module.css';
import estilos from './transformar.module.css';

export const NOMBRE_BRECHA: Readonly<Record<BrechaSeguridad, string>> = {
  sobreconfianza: 'Sobreconfianza',
  subestima: 'Se subestima',
  necesita_apoyo: 'Necesita apoyo',
  alineado: 'Alineado',
};

type Estado = { fase: 'cargando' } | { fase: 'error'; mensaje: string } | { fase: 'listo'; datos: GestionPreguntasIA };
type Cambio = Partial<Pick<GestionVideo, 'publicadas' | 'borrador'>>;

/**
 * T2, solo líderes. Genera preguntas del simulador con IA a partir de un texto del video.
 * Quedan como borrador: los empleados siguen viendo las publicadas hasta que un líder apruebe.
 */
export function GestionPreguntas() {
  const { expirar } = useSesion();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });

  useEffect(() => {
    let vigente = true;
    api
      .gestionPreguntasIA()
      .then((datos) => vigente && setEstado({ fase: 'listo', datos }))
      .catch((e: unknown) => {
        if (e instanceof ErrorApi && e.estado === 401) expirar();
        if (vigente) setEstado({ fase: 'error', mensaje: e instanceof Error ? e.message : 'Ocurrió un error.' });
      });
    return () => {
      vigente = false;
    };
  }, [expirar]);

  if (estado.fase === 'cargando') return <p role="status">Cargando preguntas…</p>;
  if (estado.fase === 'error') return <EstadoVacio titulo="No se pudieron cargar las preguntas">{estado.mensaje}</EstadoVacio>;

  const { datos } = estado;
  const cambiar = (id: string, cambio: Cambio) =>
    setEstado((e) => (e.fase === 'listo' ? { fase: 'listo', datos: { ...e.datos, videos: e.datos.videos.map((v) => (v.id === id ? { ...v, ...cambio } : v)) } } : e));

  return (
    <div className={etapaT.gestion}>
      <p className={etapaT.texto}>
        {datos.iaDisponible
          ? 'La IA propone 3 preguntas por video a partir del texto que pegues. Quedan como borrador: los empleados no las ven hasta que las apruebes.'
          : 'La IA no está configurada: falta GEMINI_API_KEY en el archivo .env (ver .env.example). Mientras tanto se usan las preguntas base.'}
      </p>
      <ul className={estilos.historial}>
        {datos.videos.map((v) => (
          <li key={v.id}>
            <FilaPreguntas video={v} iaDisponible={datos.iaDisponible} alCambiar={(c) => cambiar(v.id, c)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListaPreguntas({ juego }: { juego: JuegoPreguntas }) {
  return (
    <ol className={etapaT.revision}>
      {juego.preguntas.map((q) => (
        <li key={q.texto} className={etapaT.itemRevision}>
          <p className={etapaT.enunciadoRevision}>{q.texto}</p>
          <ul className={etapaT.opcionesGestion}>
            {q.opciones.map((o, j) => (
              <li key={o} data-correcta={j === q.correcta}>
                {j === q.correcta && <span className="solo-lectores">Correcta: </span>}
                {o}
              </li>
            ))}
          </ul>
          {q.explicacion && <p className={etapaT.texto}>{q.explicacion}</p>}
        </li>
      ))}
    </ol>
  );
}

function FilaPreguntas({ video, iaDisponible, alCambiar }: { video: GestionVideo; iaDisponible: boolean; alCambiar(c: Cambio): void }) {
  const { expirar } = useSesion();
  const [contexto, setContexto] = useState('');
  const [trabajando, setTrabajando] = useState<'' | 'generar' | 'aprobar' | 'descartar'>('');
  const [error, setError] = useState('');

  const ejecutar = async (que: 'generar' | 'aprobar' | 'descartar') => {
    setError('');
    setTrabajando(que);
    try {
      if (que === 'generar') alCambiar({ borrador: (await api.generarPreguntasIA(video.id, contexto)).borrador });
      if (que === 'aprobar') alCambiar({ publicadas: (await api.aprobarPreguntasIA(video.id)).publicadas, borrador: null });
      if (que === 'descartar') {
        await api.descartarPreguntasIA(video.id);
        alCambiar({ borrador: null });
      }
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 401) expirar();
      setError(e instanceof Error ? e.message : 'Ocurrió un error.');
    } finally {
      setTrabajando('');
    }
  };

  return (
    <details className={estilos.detalle}>
      <summary className={estilos.resumen}>
        <span className={estilos.flecha} aria-hidden="true">
          ›
        </span>
        <span className={estilos.nombreHistorial}>{video.titulo}</span>
        <InsigniaAudiencia audiencia={video.audiencia} />
        <span className={estilos.conteo}>{video.borrador ? 'Borrador por aprobar' : video.publicadas.base ? 'Preguntas base' : 'Aprobadas (IA)'}</span>
      </summary>
      <div className={estilos.cuerpoDetalle}>
        <div className={etapaT.gestion}>
          {video.borrador && (
            <section aria-label="Borrador">
              <h4 className={etapaT.subtitulo}>Borrador generado con IA</h4>
              <p className={etapaT.texto}>Revisa que la opción marcada sea de verdad la correcta antes de aprobar.</p>
              <ListaPreguntas juego={video.borrador} />
              <div className={etapaT.pie}>
                <Boton onClick={() => void ejecutar('aprobar')} disabled={trabajando !== ''}>
                  {trabajando === 'aprobar' ? 'Aprobando…' : 'Aprobar y publicar'}
                </Boton>
                <Boton variante="secundario" onClick={() => void ejecutar('descartar')} disabled={trabajando !== ''}>
                  Descartar
                </Boton>
              </div>
            </section>
          )}
          <section aria-label="Preguntas publicadas">
            <h4 className={etapaT.subtitulo}>Publicadas ({video.publicadas.base ? 'banco base' : 'generadas con IA'})</h4>
            <ListaPreguntas juego={video.publicadas} />
          </section>
          <section aria-label="Generar con IA">
            <label className={etapaT.etiquetaContexto} htmlFor={`contexto-${video.id}`}>
              Texto del video (resumen o transcripción, opcional)
            </label>
            <textarea
              id={`contexto-${video.id}`}
              className={etapaT.areaContexto}
              rows={4}
              maxLength={12000}
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder="Pega aquí lo que dice el video. Sin texto, la IA se basa solo en el título."
              disabled={!iaDisponible}
            />
            {error && (
              <p className={etapaT.mensajeError} role="alert">
                {error}
              </p>
            )}
            <div className={etapaT.pie}>
              <Boton variante="secundario" onClick={() => void ejecutar('generar')} disabled={!iaDisponible || trabajando !== ''}>
                {trabajando === 'generar' ? 'Generando…' : video.borrador ? 'Generar otra propuesta' : 'Generar preguntas con IA'}
              </Boton>
            </div>
          </section>
        </div>
      </div>
    </details>
  );
}
