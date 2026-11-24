import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Aviso } from '../../../components/ui/Aviso';
import { Boton } from '../../../components/ui/Boton';
import { REGLAS } from '../../../config/reglas';
import { useProyecto } from '../../../estado/ProyectoContexto';
import { api } from '../../../lib/api';
import { aplicarLienzo, contextoCopiloto, type CambioCampo } from '../../../lib/copiloto/logica';
import { normalizarPropuestaLienzo } from '../../../lib/copiloto/normalizar';
import type { MensajeCopiloto, PropuestaLienzo } from '../../../lib/copiloto/tipos';
import estilos from './copiloto.module.css';
import { Markdown } from './Markdown';
import { ErrorCopiloto, Esperando, InsigniaModo, type PropsModo } from './comun';

const INICIO = 'Empecemos con el lienzo del cambio.';

/** Paso 1 de 4: entrevista del lienzo (R1), bloque por bloque, con repreguntas. No depende del buzón. */
export function PanelLienzo({ modo, usarSimulado, incrustado }: PropsModo) {
  const { activo, datos, actualizarDatos } = useProyecto();
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [propuesta, setPropuesta] = useState<{ ficha: PropuestaLienzo; cambios: CambioCampo[] } | null>(null);
  const [mensaje, setMensaje] = useState('');
  const fin = useRef<HTMLDivElement>(null);
  const mensajes = datos.copiloto.mensajesLienzo;

  // Con llaves: en navegadores recientes scrollIntoView devuelve una promesa, y un efecto solo puede devolver su función de limpieza.
  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'nearest' });
  }, [mensajes.length]);
  if (!activo) return null;

  const contexto = () => contextoCopiloto(activo, datos, REGLAS.triaje);

  const enviar = async (contenido: string) => {
    const limpio = contenido.trim();
    if (!limpio || ocupado) return;
    setOcupado(true);
    setError(null);
    setMensaje('');
    const conUsuario: MensajeCopiloto[] = [...mensajes, { rol: 'usuario', texto: limpio }];
    // El mensaje de la persona se guarda enseguida: si la respuesta falla, no se pierde.
    await actualizarDatos((d) => ({ ...d, copiloto: { ...d.copiloto, mensajesLienzo: conUsuario, modoLienzo: d.copiloto.modoLienzo ?? modo } }));
    setTexto('');
    try {
      const r = await api.copiloto.lienzo(modo, conUsuario, contexto());
      await actualizarDatos((d) => ({ ...d, copiloto: { ...d.copiloto, mensajesLienzo: [...conUsuario, { rol: 'copiloto', texto: r.texto }] } }));
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  };

  /** Si falló la última respuesta, se vuelve a pedir sin repetir el mensaje de la persona. */
  const reintentar = async () => {
    setOcupado(true);
    setError(null);
    try {
      const r = await api.copiloto.lienzo(modo, mensajes, contexto());
      await actualizarDatos((d) => ({ ...d, copiloto: { ...d.copiloto, mensajesLienzo: [...mensajes, { rol: 'copiloto', texto: r.texto }] } }));
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  };

  const prepararPaso = async () => {
    setOcupado(true);
    setError(null);
    setMensaje('');
    try {
      const ficha = normalizarPropuestaLienzo((await api.copiloto.extraerLienzo(modo, mensajes, contexto())).lienzo);
      setPropuesta({ ficha, cambios: aplicarLienzo(datos.lienzo, ficha).cambios });
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  };

  const confirmarPaso = async () => {
    if (!propuesta) return;
    await actualizarDatos((d) => ({
      ...d,
      lienzo: aplicarLienzo(d.lienzo, propuesta.ficha).lienzo,
      copiloto: { ...d.copiloto, estadosLienzo: propuesta.ficha.estados },
    }));
    setPropuesta(null);
    setMensaje('Ficha pasada a R1. Puedes revisarla y corregirla en el formulario del lienzo.');
  };

  const reiniciar = async () => {
    if (!window.confirm('¿Borrar la conversación del lienzo? Lo que ya pasaste a R1 se mantiene.')) return;
    await actualizarDatos((d) => ({ ...d, copiloto: { ...d.copiloto, mensajesLienzo: [], modoLienzo: null } }));
    setPropuesta(null);
    setError(null);
  };

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(texto);
  };
  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void enviar(texto);
    }
  };

  const esperaRespuesta = mensajes.at(-1)?.rol === 'usuario';
  const modoDistinto = datos.copiloto.modoLienzo && datos.copiloto.modoLienzo !== modo;

  return (
    <div className={estilos.panel}>
      {!incrustado && (
        <p className={estilos.nota}>
          <strong>Paso 1 de 4 · Lienzo.</strong> El copiloto te pregunta por los 7 bloques del lienzo, uno a la vez, y repregunta cuando falta un dato. El lienzo va
          primero: el buzón se lanza después a los grupos afectados que definas aquí. Nada pasa a R1 hasta que uses el botón.
        </p>
      )}
      {modoDistinto && (
        <Aviso tono="atencion" titulo={`Esta conversación empezó en modo ${datos.copiloto.modoLienzo === 'gemini' ? 'Gemini' : 'simulado'}`}>
          Si cambias de modo a mitad de camino, reinicia la conversación.
        </Aviso>
      )}

      {mensajes.length === 0 ? (
        <div className={estilos.acciones}>
          <Boton onClick={() => void enviar(INICIO)} disabled={ocupado}>
            {ocupado ? 'Empezando…' : 'Empezar la entrevista'}
          </Boton>
        </div>
      ) : (
        <>
          <div className={estilos.chat} aria-live="polite">
            {mensajes.map((m, i) => (
              <div key={i} className={estilos.mensaje} data-rol={m.rol}>
                <span className="solo-lectores">{m.rol === 'copiloto' ? 'Copiloto:' : 'Tú:'}</span>
                {m.rol === 'copiloto' ? <Markdown texto={m.texto} /> : m.texto}
              </div>
            ))}
            {ocupado && (
              <div className={estilos.mensaje} data-rol="copiloto">
                <Esperando texto="Pensando…" />
              </div>
            )}
            <div ref={fin} />
          </div>
          <form className={estilos.escribir} onSubmit={alEnviar}>
            <label className="solo-lectores" htmlFor="respuesta-lienzo">
              Tu respuesta
            </label>
            <textarea
              id="respuesta-lienzo"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={alTeclear}
              placeholder="Escribe tu respuesta (Ctrl + Enter para enviar). No escribas nombres de colaboradores."
              disabled={ocupado}
            />
            <Boton type="submit" disabled={ocupado || !texto.trim()}>
              Enviar
            </Boton>
          </form>
          <div className={estilos.acciones}>
            {esperaRespuesta && !ocupado && (
              <Boton variante="secundario" onClick={() => void reintentar()}>
                Volver a pedir la respuesta
              </Boton>
            )}
            <Boton variante="secundario" onClick={() => void prepararPaso()} disabled={ocupado || mensajes.length < 3}>
              Pasar a R1
            </Boton>
            <Boton variante="secundario" onClick={() => void reiniciar()} disabled={ocupado}>
              Reiniciar la conversación
            </Boton>
            {datos.copiloto.modoLienzo && <InsigniaModo modo={datos.copiloto.modoLienzo} />}
          </div>
        </>
      )}

      <ErrorCopiloto error={error} usarSimulado={usarSimulado} />
      <p className={estilos.nota} aria-live="polite">
        {mensaje}
      </p>

      {propuesta && (
        <section className={estilos.confirmar} aria-labelledby="titulo-pasar-r1">
          <h3 id="titulo-pasar-r1" className={estilos.subtitulo}>
            Esto cambiará en R1
          </h3>
          {propuesta.cambios.length === 0 ? (
            <p>La ficha no trae nada nuevo frente a lo que ya tiene R1.</p>
          ) : (
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th scope="col">Campo</th>
                  <th scope="col">Hoy en R1</th>
                  <th scope="col">Queda así</th>
                </tr>
              </thead>
              <tbody>
                {propuesta.cambios.map((c) => (
                  <tr key={c.campo}>
                    <th scope="row">{c.campo}</th>
                    <td>{c.antes || '—'}</td>
                    <td>{c.despues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className={estilos.nota}>Los campos que la conversación no cubrió se quedan como están en R1.</p>
          <div className={estilos.acciones}>
            <Boton onClick={() => void confirmarPaso()} disabled={propuesta.cambios.length === 0}>
              Confirmar y pasar a R1
            </Boton>
            <Boton variante="secundario" onClick={() => setPropuesta(null)}>
              Cancelar
            </Boton>
          </div>
        </section>
      )}
    </div>
  );
}
