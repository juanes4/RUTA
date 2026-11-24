import { useEffect, useRef, useState } from 'react';
import { Boton } from '../../components/ui/Boton';
import { cargarYouTube } from '../../hooks/useYouTube';
import type { VideoCapacitacion } from '../../lib/api';
import estilos from './transformar.module.css';

/** Un video cuenta como visto al terminar o al llegar a este avance. */
const AVANCE_PARA_VISTO = 0.9;

interface Props {
  video: VideoCapacitacion;
  /** Se llama una sola vez, cuando el video cuenta como visto. */
  alVer(): void;
}

const urlEmbebida = (id: string) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0`;

/**
 * Reproductor de YouTube que avisa cuando la persona vio el video. Si la API
 * de YouTube no carga, muestra el reproductor simple y un botón para
 * marcarlo como visto a mano.
 */
export function ReproductorYouTube({ video, alVer }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const avisado = useRef(video.visto);
  const alVerRef = useRef(alVer);
  alVerRef.current = alVer;
  const [sinApi, setSinApi] = useState(false);

  useEffect(() => {
    const sitio = contenedor.current;
    if (!sitio) return;
    let cancelado = false;
    let intervalo: number | undefined;
    let jugador: { destroy(): void } | undefined;

    const avisar = () => {
      if (avisado.current) return;
      avisado.current = true;
      alVerRef.current();
    };

    cargarYouTube()
      .then((YT) => {
        if (cancelado) return;
        // YouTube reemplaza el elemento que recibe: se le da uno propio, aparte del que controla React.
        const hijo = document.createElement('div');
        sitio.appendChild(hijo);
        const p = new YT.Player(hijo, {
          videoId: video.youtubeId,
          host: 'https://www.youtube-nocookie.com',
          playerVars: { rel: 0, playsinline: 1 },
          events: { onStateChange: (e) => e.data === YT.PlayerState.ENDED && avisar() },
        });
        jugador = p;
        intervalo = window.setInterval(() => {
          if (p.getPlayerState() !== YT.PlayerState.PLAYING) return;
          const total = p.getDuration();
          if (total > 0 && p.getCurrentTime() / total >= AVANCE_PARA_VISTO) avisar();
        }, 2000);
      })
      .catch(() => !cancelado && setSinApi(true));

    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
      jugador?.destroy();
      sitio.replaceChildren();
    };
  }, [video.youtubeId]);

  return (
    <div className={estilos.reproductor}>
      <div ref={contenedor} className={estilos.marcoVideo}>
        {sinApi && (
          <iframe
            src={urlEmbebida(video.youtubeId)}
            title={video.titulo}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      {sinApi && !video.visto && (
        <p className={estilos.avisoReproductor}>
          No se pudo medir tu avance en este video.
          <Boton variante="secundario" onClick={alVer}>
            Marcar como visto
          </Boton>
        </p>
      )}
    </div>
  );
}
