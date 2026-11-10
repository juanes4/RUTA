import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Almacen } from '../lib/almacen/almacen';
import { DATOS_VACIOS, type DatosProyecto, type Proyecto } from '../lib/modelo/proyecto';
import { crearProyecto } from '../lib/proyecto/crearProyecto';

interface ValorProyecto {
  cargando: boolean;
  proyectos: Proyecto[];
  activo: Proyecto | null;
  datos: DatosProyecto;
  crear(): Promise<void>;
  seleccionar(id: string): void;
  actualizar(cambio: (proyecto: Proyecto) => Proyecto): Promise<void>;
}

const Contexto = createContext<ValorProyecto | null>(null);

interface Props {
  almacen: Almacen;
  children: ReactNode;
}

/** Inyecta el almacén (DIP): la interfaz no sabe si los datos viven en localStorage o en un backend. */
export function ProveedorProyecto({ almacen, children }: Props) {
  const [cargando, setCargando] = useState(true);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [idActivo, setIdActivo] = useState<string | null>(null);
  const [datos, setDatos] = useState<DatosProyecto>(DATOS_VACIOS);

  const recargar = useCallback(async () => {
    const lista = await almacen.listar();
    setProyectos(lista);
    return lista;
  }, [almacen]);

  useEffect(() => {
    recargar().then((lista) => {
      setIdActivo((actual) => actual ?? lista[0]?.id ?? null);
      setCargando(false);
    });
  }, [recargar]);

  useEffect(() => {
    if (!idActivo) {
      setDatos(DATOS_VACIOS);
      return;
    }
    almacen.obtenerDatos(idActivo).then(setDatos);
  }, [almacen, idActivo]);

  const crear = useCallback(async () => {
    const proyecto = crearProyecto(new Date().toISOString(), crypto.randomUUID());
    await almacen.guardar(proyecto);
    await recargar();
    setIdActivo(proyecto.id);
  }, [almacen, recargar]);

  const activo = proyectos.find((p) => p.id === idActivo) ?? null;

  const actualizar = useCallback(
    async (cambio: (proyecto: Proyecto) => Proyecto) => {
      if (!activo) return;
      await almacen.guardar({ ...cambio(activo), actualizado: new Date().toISOString() });
      await recargar();
    },
    [almacen, activo, recargar],
  );

  const valor = useMemo<ValorProyecto>(
    () => ({ cargando, proyectos, activo, datos, crear, seleccionar: setIdActivo, actualizar }),
    [cargando, proyectos, activo, datos, crear, actualizar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useProyecto(): ValorProyecto {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useProyecto debe usarse dentro de <ProveedorProyecto>');
  return valor;
}
