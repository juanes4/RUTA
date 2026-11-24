import { useCallback, useEffect, useState } from 'react';
import { useSesion } from '../estado/SesionContexto';
import { api, ErrorApi, type VideoCapacitacion } from '../lib/api';

type Estado = { fase: 'cargando' } | { fase: 'error'; mensaje: string } | { fase: 'listo'; videos: VideoCapacitacion[] };

/** Videos que el usuario puede ver (el servidor ya filtra por rol) y registro de los que ve. */
export function useCapacitaciones() {
  const { expirar } = useSesion();
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });

  const fallo = useCallback(
    (e: unknown) => {
      if (e instanceof ErrorApi && e.estado === 401) expirar();
      return e instanceof Error ? e.message : 'Ocurrió un error.';
    },
    [expirar],
  );

  useEffect(() => {
    let vigente = true;
    api
      .videos()
      .then((r) => vigente && setEstado({ fase: 'listo', videos: r.videos }))
      .catch((e) => vigente && setEstado({ fase: 'error', mensaje: fallo(e) }));
    return () => {
      vigente = false;
    };
  }, [fallo]);

  const marcarVisto = useCallback(
    async (videoId: string) => {
      try {
        const r = await api.marcarVisto(videoId);
        setEstado((e) =>
          e.fase === 'listo'
            ? { fase: 'listo', videos: e.videos.map((v) => (v.id === videoId ? { ...v, visto: true, vistoEn: r.vistoEn } : v)) }
            : e,
        );
      } catch (e) {
        fallo(e);
      }
    },
    [fallo],
  );

  return { estado, marcarVisto };
}
