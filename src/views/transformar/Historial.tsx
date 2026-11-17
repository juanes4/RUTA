import { useEffect, useState } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { ETIQUETA_ROL, useSesion } from '../../estado/SesionContexto';
import { api, ErrorApi, formatearFechaVista, type Historial as DatosHistorial, type VideoHistorial } from '../../lib/api';
import { InsigniaAudiencia } from './Capacitaciones';
import estilos from './transformar.module.css';

type Estado = { fase: 'cargando' } | { fase: 'error'; mensaje: string } | { fase: 'listo'; datos: DatosHistorial };

/**
 * T2. Lista de videos; cada uno se despliega y muestra quién lo vio.
 * Un líder ve a todas las personas; un empleado solo ve sus propias vistas.
 */
export function Historial() {
  const { expirar } = useSesion();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });

  useEffect(() => {
    let vigente = true;
    api
      .historial()
      .then((datos) => vigente && setEstado({ fase: 'listo', datos }))
      .catch((e: unknown) => {
        if (e instanceof ErrorApi && e.estado === 401) expirar();
        if (vigente) setEstado({ fase: 'error', mensaje: e instanceof Error ? e.message : 'Ocurrió un error.' });
      });
    return () => {
      vigente = false;
    };
  }, [expirar]);

  if (estado.fase === 'cargando') return <p role="status">Cargando historial…</p>;
  if (estado.fase === 'error') return <EstadoVacio titulo="No se pudo cargar el historial">{estado.mensaje}</EstadoVacio>;

  const { verTodos, videos } = estado.datos;
  if (videos.length === 0) return <EstadoVacio titulo="Aún no hay videos">El historial aparece cuando haya capacitaciones.</EstadoVacio>;

  return (
    <ul className={estilos.historial}>
      {videos.map((v) => (
        <li key={v.id}>
          <FilaHistorial video={v} verTodos={verTodos} />
        </li>
      ))}
    </ul>
  );
}

function FilaHistorial({ video, verTodos }: { video: VideoHistorial; verTodos: boolean }) {
  const resumen = verTodos
    ? `${video.vistas.length} de ${video.elegibles} ${video.elegibles === 1 ? 'persona' : 'personas'}`
    : video.vistas.length > 0
      ? 'Visto'
      : 'Pendiente';

  return (
    <details className={estilos.detalle}>
      <summary className={estilos.resumen}>
        <span className={estilos.flecha} aria-hidden="true">
          ›
        </span>
        <span className={estilos.nombreHistorial}>{video.titulo}</span>
        <InsigniaAudiencia audiencia={video.audiencia} />
        <span className={`${estilos.conteo} numero`}>{resumen}</span>
      </summary>
      <div className={estilos.cuerpoDetalle}>
        {video.vistas.length === 0 ? (
          <p className={estilos.sinVistas}>{verTodos ? 'Nadie ha visto este video todavía.' : 'Aún no has visto este video.'}</p>
        ) : (
          <table className={estilos.tabla}>
            <caption className="solo-lectores">Personas que vieron «{video.titulo}»</caption>
            <thead>
              <tr>
                <th scope="col">Persona</th>
                <th scope="col">Rol</th>
                <th scope="col">Visto el</th>
              </tr>
            </thead>
            <tbody>
              {video.vistas.map((s) => (
                <tr key={s.usuarioId}>
                  <th scope="row">{s.nombre}</th>
                  <td>{ETIQUETA_ROL[s.rol]}</td>
                  <td className="numero">{formatearFechaVista(s.vistoEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </details>
  );
}
