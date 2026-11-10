import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Pasos que ya pasaron por pantalla, en todas las páginas. Vive arriba de
 * las rutas para que los contadores de la barra no se reinicien al cambiar
 * de etapa.
 */
interface ValorPasosVistos {
  vistos: ReadonlySet<string>;
  marcar(anclas: Iterable<string>): void;
}

const Contexto = createContext<ValorPasosVistos | null>(null);

export function ProveedorPasosVistos({ children }: { children: ReactNode }) {
  const [vistos, setVistos] = useState<ReadonlySet<string>>(new Set());

  const marcar = useCallback((anclas: Iterable<string>) => {
    setVistos((previos) => {
      const nuevos = [...anclas].filter((a) => !previos.has(a));
      return nuevos.length === 0 ? previos : new Set([...previos, ...nuevos]);
    });
  }, []);

  const valor = useMemo(() => ({ vistos, marcar }), [vistos, marcar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePasosVistos(): ValorPasosVistos {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('usePasosVistos debe usarse dentro de <ProveedorPasosVistos>');
  return valor;
}
