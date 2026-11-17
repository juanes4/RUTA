import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Etapa } from '../config/etapas';
import { hashDe, parsearRuta, type Ruta } from './rutas';

interface ValorRuta {
  ruta: Ruta;
  navegar(ruta: Ruta): void;
  /** Href para enlaces reales (<a>), que funcionan con clic central y teclado. */
  enlace(ruta: Ruta): string;
}

const Contexto = createContext<ValorRuta | null>(null);

interface Props {
  etapas: readonly Etapa[];
  children: ReactNode;
}

export function ProveedorRuta({ etapas, children }: Props) {
  const leer = useCallback(() => parsearRuta(window.location.hash, etapas), [etapas]);
  const [ruta, setRuta] = useState<Ruta>(leer);

  useEffect(() => {
    const alCambiar = () => setRuta(leer());
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, [leer]);

  const valor = useMemo<ValorRuta>(
    () => ({
      ruta,
      navegar: (destino) => {
        window.location.hash = hashDe(destino, etapas);
      },
      enlace: (destino) => hashDe(destino, etapas),
    }),
    [ruta, etapas],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useRuta(): ValorRuta {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useRuta debe usarse dentro de <ProveedorRuta>');
  return valor;
}
