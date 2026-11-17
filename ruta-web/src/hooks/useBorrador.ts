import { useEffect, useRef, useState } from 'react';

type EstadoGuardado = 'sin_cambios' | 'pendiente' | 'guardando' | 'guardado';

/**
 * Copia editable de un valor guardado. Se reinicia solo si el contenido de
 * origen cambia (por ejemplo, al elegir otro proyecto), no cuando el mismo
 * contenido vuelve del almacén después de guardar.
 */
export function useBorrador<T>(origen: T, guardar: (valor: T) => Promise<void>) {
  const [borrador, setBorrador] = useState<T>(origen);
  const [estado, setEstado] = useState<EstadoGuardado>('sin_cambios');
  const firma = JSON.stringify(origen);
  // El origen también cambia al guardar: en ese caso debe seguir viéndose "Guardado".
  const recienGuardado = useRef(false);

  useEffect(() => {
    setBorrador(JSON.parse(firma) as T);
    if (recienGuardado.current) recienGuardado.current = false;
    else setEstado('sin_cambios');
  }, [firma]);

  const editar = (cambio: (actual: T) => T) => {
    recienGuardado.current = false;
    setBorrador(cambio);
    setEstado('pendiente');
  };

  const confirmar = async (valor: T = borrador) => {
    recienGuardado.current = true;
    setEstado('guardando');
    try {
      await guardar(valor);
    } catch (error) {
      recienGuardado.current = false;
      setEstado('pendiente');
      throw error;
    }
    setEstado('guardado');
  };

  return { borrador, editar, confirmar, estado };
}

export const TEXTO_ESTADO_GUARDADO: Readonly<Record<EstadoGuardado, string>> = {
  sin_cambios: '',
  pendiente: 'Cambios sin guardar',
  guardando: 'Guardando…',
  guardado: 'Guardado',
};
