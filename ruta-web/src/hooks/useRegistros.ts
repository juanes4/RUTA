import { useCallback, useEffect, useState } from 'react';
import { useSesion } from '../estado/SesionContexto';
import { api, ErrorApi, type TipoRegistro } from '../lib/api';

export type EstadoCarga<T> = { fase: 'cargando' } | { fase: 'error'; mensaje: string } | { fase: 'listo'; datos: T };

const mensajeDe = (e: unknown) => (e instanceof Error ? e.message : 'Ocurrió un error.');

/** Lee los registros de la etapa T de un tipo. `habilitado: false` evita pedirlos (por ejemplo, si el rol no puede verlos). */
export function useRegistros<T>(tipo: TipoRegistro, habilitado = true) {
  const { expirar } = useSesion();
  const [estado, setEstado] = useState<EstadoCarga<T>>({ fase: 'cargando' });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!habilitado) return;
    let vigente = true;
    api
      .registros<T>(tipo)
      .then((datos) => vigente && setEstado({ fase: 'listo', datos }))
      .catch((e: unknown) => {
        if (e instanceof ErrorApi && e.estado === 401) expirar();
        if (vigente) setEstado({ fase: 'error', mensaje: mensajeDe(e) });
      });
    return () => {
      vigente = false;
    };
  }, [tipo, habilitado, version, expirar]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { estado, recargar };
}

export type EstadoEnvio = { fase: 'libre' } | { fase: 'enviando' } | { fase: 'ok'; mensaje: string } | { fase: 'error'; mensaje: string };

/** Guardado de un formulario: estado del envío y manejo de sesión vencida. Devuelve true si se guardó. */
export function useEnvio() {
  const { expirar } = useSesion();
  const [estado, setEstado] = useState<EstadoEnvio>({ fase: 'libre' });

  const enviar = useCallback(
    async (accion: () => Promise<unknown>, mensajeOk = 'Guardado.') => {
      setEstado({ fase: 'enviando' });
      try {
        await accion();
        setEstado({ fase: 'ok', mensaje: mensajeOk });
        return true;
      } catch (e) {
        if (e instanceof ErrorApi && e.estado === 401) expirar();
        setEstado({ fase: 'error', mensaje: mensajeDe(e) });
        return false;
      }
    },
    [expirar],
  );

  const limpiar = useCallback(() => setEstado({ fase: 'libre' }), []);
  return { estado, enviar, limpiar };
}
