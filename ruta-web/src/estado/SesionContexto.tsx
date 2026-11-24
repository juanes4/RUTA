import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type Usuario } from '../lib/api';

interface ValorSesion {
  /** true mientras se pregunta al servidor si ya hay una sesión abierta. */
  cargando: boolean;
  usuario: Usuario | null;
  /** Devuelve el mensaje de error, o null si entró. */
  iniciar(usuario: string, clave: string): Promise<string | null>;
  cerrar(): Promise<void>;
  /** La sesión venció o el servidor la rechazó: vuelve a pedir el ingreso. */
  expirar(): void;
}

const Contexto = createContext<ValorSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    let vigente = true;
    api
      .sesion()
      .then((r) => vigente && setUsuario(r.usuario))
      .catch(() => undefined)
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, []);

  const iniciar = useCallback(async (nombre: string, clave: string) => {
    try {
      setUsuario((await api.iniciarSesion(nombre, clave)).usuario);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'No se pudo iniciar sesión.';
    }
  }, []);

  const cerrar = useCallback(async () => {
    await api.cerrarSesion().catch(() => undefined);
    setUsuario(null);
  }, []);

  const expirar = useCallback(() => setUsuario(null), []);

  const valor = useMemo(() => ({ cargando, usuario, iniciar, cerrar, expirar }), [cargando, usuario, iniciar, cerrar, expirar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): ValorSesion {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>');
  return valor;
}

export const ETIQUETA_ROL = { lider: 'Líder', empleado: 'Empleado' } as const;
