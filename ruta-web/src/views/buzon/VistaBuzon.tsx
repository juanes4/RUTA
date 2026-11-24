import { useEffect, useState, type FormEvent } from 'react';
import { IconoBuzon } from '../../components/marco/Iconos';
import { Aviso } from '../../components/ui/Aviso';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoSeleccion } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { PREGUNTAS_BUZON1 } from '../../config/formularios/buzon1';
import { useSesion } from '../../estado/SesionContexto';
import { api, type BuzonColaborador } from '../../lib/api';
import { useRuta } from '../../navegacion/RutaContexto';
import estilos from './VistaBuzon.module.css';

/** Las tres preguntas del buzón 1, con el campo que viaja al servidor (p1, p2, p3). */
const PREGUNTAS = PREGUNTAS_BUZON1.map((p, i) => ({ ...p, clave: `p${i + 1}` as 'p1' | 'p2' | 'p3' }));
const VACIA = { area: '', grupo: '', p1: '', p2: '', p3: '' };

/** El buzón que le toca al colaborador que entró, o null si no tiene ninguno. */
export function useBuzonPropio(activo: boolean) {
  const [buzon, setBuzon] = useState<BuzonColaborador | null | undefined>(undefined);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!activo) return;
    let vigente = true;
    api.buzon
      .mio()
      .then((r) => vigente && setBuzon(r.buzon))
      .catch((e: unknown) => vigente && setError(e instanceof Error ? e.message : 'No se pudo consultar el buzón.'));
    return () => {
      vigente = false;
    };
  }, [activo]);
  return { buzon, setBuzon, error };
}

/**
 * Página del colaborador para responder el buzón 1 (#/buzon). Anónimo y una
 * sola vez: el servidor guarda que ya respondió, aparte y sin vínculo con la respuesta.
 */
export function VistaBuzon() {
  const { usuario } = useSesion();
  const { enlace } = useRuta();
  const esColaborador = usuario?.rol === 'empleado';
  const { buzon, setBuzon, error: errorCarga } = useBuzonPropio(esColaborador);
  const [respuesta, setRespuesta] = useState(VACIA);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const inicio = <a href={enlace({ pagina: 'inicio' })}>Volver al inicio</a>;

  if (!esColaborador) {
    return (
      <EstadoVacio titulo="El buzón lo responden los colaboradores" accion={inicio}>
        Gestión del cambio abre el buzón y ve el avance en R5 (Buzón 1). Las respuestas llegan de las cuentas de los colaboradores.
      </EstadoVacio>
    );
  }
  if (errorCarga) {
    return (
      <Aviso tono="peligro" role="alert" titulo="No se pudo consultar el buzón">
        {errorCarga}
      </Aviso>
    );
  }
  if (buzon === undefined) return <p className={estilos.nota}>Consultando tu buzón…</p>;
  if (buzon === null) {
    return (
      <EstadoVacio titulo="No tienes buzones pendientes" accion={inicio}>
        Cuando el equipo de gestión del cambio te invite a un buzón, lo verás aquí.
      </EstadoVacio>
    );
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!respuesta.area) return setError('Elige tu área.');
    if (!respuesta.p1.trim() && !respuesta.p2.trim() && !respuesta.p3.trim()) return setError('Responde al menos una de las preguntas.');
    if (!window.confirm('¿Enviar tu respuesta? Solo se puede responder una vez y después no se puede cambiar.')) return;
    setEnviando(true);
    try {
      await api.buzon.responder({ buzon: buzon.id, ...respuesta });
      setBuzon({ ...buzon, estado: 'respondido' });
      setRespuesta(VACIA);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className={estilos.pagina} aria-labelledby="titulo-buzon">
      <header className={estilos.cabecera}>
        <span className={estilos.icono} aria-hidden="true">
          <IconoBuzon tamano={24} />
        </span>
        <div>
          <p className={estilos.antetitulo}>Buzón de escucha{buzon.empresa ? ` · ${buzon.empresa}` : ''}</p>
          <h1 id="titulo-buzon" className={estilos.titulo}>
            Queremos escucharte
          </h1>
          <p className={estilos.bajada}>Tres preguntas cortas sobre cómo se trabaja hoy. Responde con tus palabras: no hay respuestas buenas ni malas.</p>
        </div>
      </header>

      {buzon.estado === 'respondido' && (
        <div className={estilos.gracias} role="status">
          <span className={estilos.visto} aria-hidden="true">
            ✓
          </span>
          <div>
            <p className={estilos.graciasTitulo}>¡Gracias! Tu respuesta quedó guardada</p>
            <p>Es anónima: no se guardó tu nombre ni la hora. Ya participaste en este buzón, así que no hace falta hacer nada más.</p>
          </div>
        </div>
      )}

      {buzon.estado === 'cerrado' && (
        <Aviso tono="info" titulo="Este buzón ya se cerró">
          El equipo de gestión del cambio cerró el buzón antes de que respondieras. Si te invitan a otro, lo verás aquí.
        </Aviso>
      )}

      {buzon.estado === 'pendiente' && (
        <>
          <Aviso tono="info" titulo="Tu respuesta es anónima" etiquetas={['Sin tu nombre', 'Sin la hora', 'Una sola vez']}>
            Solo se guardan tus respuestas, tu área y el grupo que elijas. Nadie puede saber qué escribiste tú. Evita escribir nombres de personas.
          </Aviso>

          <form className={estilos.formulario} onSubmit={(e) => void enviar(e)}>
            <div className={estilos.rejilla}>
              <CampoSeleccion etiqueta="Tu área" value={respuesta.area} onChange={(e) => setRespuesta((r) => ({ ...r, area: e.target.value }))}>
                <option value="">Elegir…</option>
                {buzon.areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </CampoSeleccion>
              <CampoSeleccion etiqueta="Tu grupo (opcional)" value={respuesta.grupo} onChange={(e) => setRespuesta((r) => ({ ...r, grupo: e.target.value }))}>
                <option value="">Prefiero no elegir</option>
                {buzon.grupos.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </CampoSeleccion>
            </div>

            {PREGUNTAS.map((p, i) => (
              <div key={p.clave} className={estilos.pregunta}>
                <span className={`${estilos.numeroPregunta} numero`}>{i + 1}</span>
                <CampoArea etiqueta={p.texto} value={respuesta[p.clave]} onChange={(e) => setRespuesta((r) => ({ ...r, [p.clave]: e.target.value }))} />
              </div>
            ))}

            {error && (
              <Aviso tono="peligro" role="alert" titulo="Revisa tu respuesta">
                {error}
              </Aviso>
            )}
            <div className={estilos.pie}>
              <Boton type="submit" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Enviar mi respuesta'}
              </Boton>
              <span className={estilos.nota}>Al enviarla no se puede cambiar.</span>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
