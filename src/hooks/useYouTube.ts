/** Carga única de la API de reproductor de YouTube (IFrame Player API). */

export interface JugadorYouTube {
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface EventoEstado {
  data: number;
}

interface EspacioYouTube {
  Player: new (
    elemento: HTMLElement,
    opciones: {
      videoId: string;
      host?: string;
      playerVars?: Record<string, number | string>;
      events?: { onStateChange?: (e: EventoEstado) => void; onReady?: () => void };
    },
  ) => JugadorYouTube;
  PlayerState: { ENDED: number; PLAYING: number };
}

declare global {
  interface Window {
    YT?: EspacioYouTube;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let promesa: Promise<EspacioYouTube> | null = null;

/** Rechaza si el script no carga (sin internet, bloqueado) para que la vista use el reproductor simple. */
export function cargarYouTube(): Promise<EspacioYouTube> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  promesa ??= new Promise<EspacioYouTube>((resolver, rechazar) => {
    const limite = window.setTimeout(() => {
      promesa = null;
      rechazar(new Error('YouTube no respondió'));
    }, 8000);
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(limite);
      if (window.YT) resolver(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(limite);
      promesa = null;
      rechazar(new Error('No se pudo cargar YouTube'));
    };
    document.head.appendChild(script);
  });
  return promesa;
}
