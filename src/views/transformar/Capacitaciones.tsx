import { useState } from 'react';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { useCapacitaciones } from '../../hooks/useCapacitaciones';
import { formatearFechaVista, type Rol, type VideoCapacitacion } from '../../lib/api';
import { ReproductorYouTube } from './ReproductorYouTube';
import estilos from './transformar.module.css';

type Estado = ReturnType<typeof useCapacitaciones>['estado'];

interface Props {
  estado: Estado;
  alVer(videoId: string): void;
  esLider: boolean;
}

export const NOMBRE_AUDIENCIA: Readonly<Record<Rol, string>> = { lider: 'Para líderes', empleado: 'Para empleados' };

export function InsigniaAudiencia({ audiencia }: { audiencia: Rol }) {
  return (
    <span className={estilos.insignia} data-audiencia={audiencia}>
      {NOMBRE_AUDIENCIA[audiencia]}
    </span>
  );
}

/**
 * T1. Reproductor y lista de videos. El servidor solo entrega los videos del
 * rol de la persona: los de líder no llegan nunca al navegador de un empleado.
 */
export function Capacitaciones({ estado, alVer, esLider }: Props) {
  const [elegido, setElegido] = useState<string | null>(null);

  if (estado.fase === 'cargando') return <p role="status">Cargando videos…</p>;
  if (estado.fase === 'error') return <EstadoVacio titulo="No se pudieron cargar los videos">{estado.mensaje}</EstadoVacio>;
  if (estado.videos.length === 0) {
    return <EstadoVacio titulo="Aún no hay videos">Cuando haya capacitaciones para tu rol, aparecen aquí.</EstadoVacio>;
  }

  const { videos } = estado;
  const actual = videos.find((v) => v.id === elegido) ?? videos[0];
  const vistos = videos.filter((v) => v.visto).length;
  const grupos: { audiencia: Rol; videos: VideoCapacitacion[] }[] = (['lider', 'empleado'] as const)
    .map((audiencia) => ({ audiencia, videos: videos.filter((v) => v.audiencia === audiencia) }))
    .filter((g) => g.videos.length > 0);

  return (
    <div className={estilos.capacitaciones}>
      {actual && (
        <div className={estilos.visor}>
          <ReproductorYouTube key={actual.id} video={actual} alVer={() => alVer(actual.id)} />
          <div className={estilos.infoVideo}>
            <InsigniaAudiencia audiencia={actual.audiencia} />
            <h3 className={estilos.tituloVideo}>{actual.titulo}</h3>
            <p className={estilos.estadoVideo} role="status">
              {actual.visto && actual.vistoEn ? `Visto el ${formatearFechaVista(actual.vistoEn)}` : 'Aún no lo has visto completo'}
            </p>
          </div>
        </div>
      )}

      <p className={`${estilos.progreso} numero`}>
        Has visto {vistos} de {videos.length} videos
      </p>

      {grupos.map((grupo) => (
        <section key={grupo.audiencia} aria-labelledby={`grupo-${grupo.audiencia}`}>
          <h3 id={`grupo-${grupo.audiencia}`} className={estilos.tituloGrupo}>
            {esLider ? NOMBRE_AUDIENCIA[grupo.audiencia] : 'Videos para empleados'}
            <span className={`${estilos.cuenta} numero`}>{grupo.videos.length}</span>
          </h3>
          <ul className={estilos.listaVideos}>
            {grupo.videos.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  className={estilos.tarjetaVideo}
                  aria-pressed={v.id === actual?.id}
                  onClick={() => setElegido(v.id)}
                >
                  <img
                    className={estilos.miniatura}
                    src={`https://i.ytimg.com/vi/${encodeURIComponent(v.youtubeId)}/mqdefault.jpg`}
                    alt=""
                    loading="lazy"
                  />
                  <span className={estilos.textoVideo}>
                    <span className={estilos.nombreVideo}>{v.titulo}</span>
                    {v.visto && <span className={estilos.visto}>✓ Visto</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
