import type { DatosProyecto, Proyecto } from '../modelo/proyecto';

/**
 * Contrato de acceso a datos (PLAN §5). La interfaz de usuario y el cálculo
 * dependen de esta abstracción, no de localStorage: cambiar a un backend
 * es escribir otra implementación. Es asíncrono por esa misma razón.
 */
export interface RepositorioProyectos {
  listar(): Promise<Proyecto[]>;
  obtener(id: string): Promise<Proyecto | null>;
  guardar(proyecto: Proyecto): Promise<void>;
  eliminar(id: string): Promise<void>;
}

export interface RepositorioDatos {
  obtenerDatos(idProyecto: string): Promise<DatosProyecto>;
  guardarDatos(idProyecto: string, datos: DatosProyecto): Promise<void>;
}

export type Almacen = RepositorioProyectos & RepositorioDatos;
