import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { MATRIZ_RECONOCIMIENTO } from '../../config/transformar';
import { useRegistros } from '../../hooks/useRegistros';
import { formatearFechaVista, type Merito } from '../../lib/api';
import estilos from './etapaT.module.css';

const nombreClase = (id?: string) => MATRIZ_RECONOCIMIENTO.find((m) => m.id === id)?.clasificacion ?? '—';

/** Pieza de publicación con el formato del documento. */
function PiezaMerito({ m }: { m: Merito }) {
  const p = m.publicacion;
  if (!p) return null;
  return (
    <article className={estilos.pieza}>
      <p className={estilos.piezaTitulo}>¡UN MÉRITO QUE NOS IMPULSA!</p>
      <p className={estilos.piezaMarca}>RUTA-ANDI │ Méritos Tempranos</p>
      <h4>{p.titulo}</h4>
      <p>
        <strong>¿Qué logramos?</strong> {p.logramos}
      </p>
      <p>
        <strong>Protagonistas:</strong> {p.protagonistas}
      </p>
      <p>
        <strong>¿Por qué es importante?</strong> {p.importancia}
      </p>
      <p>
        <strong>Mensaje de reconocimiento:</strong> {p.mensaje}
      </p>
      <p className={estilos.piezaCierre}>¡Cada pequeño mérito construye un gran cambio!</p>
    </article>
  );
}

/**
 * Líder: todas las fichas registradas, con su valoración. Resto del equipo:
 * solo las piezas publicadas (sin puntajes ni evidencia).
 */
export function MeritosRegistrados({ esLider }: { esLider: boolean }) {
  const { estado } = useRegistros<{ registros: Merito[] }>('merito');
  if (estado.fase === 'cargando') return <p role="status">Cargando méritos…</p>;
  if (estado.fase === 'error') return <EstadoVacio titulo="No se pudieron cargar los méritos">{estado.mensaje}</EstadoVacio>;

  const { registros } = estado.datos;
  if (registros.length === 0) {
    return (
      <EstadoVacio titulo={esLider ? 'Aún no hay méritos registrados' : 'Aún no hay méritos publicados'}>
        {esLider ? 'Registra el primer avance con la ficha FIMT.' : 'Cuando se publique un mérito, aparece aquí.'}
      </EstadoVacio>
    );
  }

  const publicados = registros.filter((m) => m.publicar);

  return (
    <div className={estilos.bloques}>
      {esLider && (
        <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Fichas de méritos registradas">
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Empresa / área</th>
                <th scope="col">Avance</th>
                <th scope="col">Puntaje</th>
                <th scope="col">Clasificación</th>
                <th scope="col">Publicado</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((m) => (
                <tr key={m.id}>
                  <td className="numero">{m.fecha ?? formatearFechaVista(m.creadoEn)}</td>
                  <td>{m.area}</td>
                  <td>{m.avance}</td>
                  <td className="numero">{m.pasaAValoracion ? `${m.total} de 40` : 'Sin valorar'}</td>
                  <td>{m.pasaAValoracion ? nombreClase(m.clasificacion) : 'Falta evidencia'}</td>
                  <td>{m.publicar ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {publicados.length > 0 && (
        <section aria-labelledby="titulo-publicados">
          <h3 id="titulo-publicados" className={estilos.subtitulo}>
            Méritos publicados
          </h3>
          <div className={estilos.piezas}>
            {publicados.map((m) => (
              <PiezaMerito key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
