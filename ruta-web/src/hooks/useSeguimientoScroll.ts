import { useEffect, useState } from 'react';

/** Franja horizontal en el centro de la pantalla: lo que cruce esta franja es "lo que se está leyendo". */
const FRANJA_LECTURA = '-40% 0px -55% 0px';

interface Seguimiento {
  /** Id del elemento que está en la franja de lectura. */
  actual: string | null;
  /** Ids que ya pasaron por la franja de lectura. */
  vistos: ReadonlySet<string>;
}

/**
 * Observa elementos por id y reporta cuál se está leyendo y cuáles ya se
 * vieron. Usa IntersectionObserver: no escucha el evento scroll.
 */
export function useSeguimientoScroll(ids: readonly string[]): Seguimiento {
  const [actual, setActual] = useState<string | null>(null);
  const [vistos, setVistos] = useState<ReadonlySet<string>>(new Set());
  const clave = ids.join('|');

  useEffect(() => {
    const elementos = clave
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (elementos.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        const visibles = entradas.filter((e) => e.isIntersecting).map((e) => e.target.id);
        if (visibles.length === 0) return;
        setActual(visibles[visibles.length - 1] ?? null);
        setVistos((previos) => {
          const nuevos = visibles.filter((id) => !previos.has(id));
          return nuevos.length === 0 ? previos : new Set([...previos, ...nuevos]);
        });
      },
      { rootMargin: FRANJA_LECTURA },
    );
    elementos.forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, [clave]);

  return { actual, vistos };
}
