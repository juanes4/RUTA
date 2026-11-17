import { DATOS_VACIOS, type DatosProyecto, type Proyecto } from '../modelo/proyecto';
import type { Almacen } from './almacen';

/** Implementación en memoria: base de la de localStorage y útil en pruebas. */
export class AlmacenMemoria implements Almacen {
  protected proyectos = new Map<string, Proyecto>();
  protected datos = new Map<string, DatosProyecto>();

  async listar(): Promise<Proyecto[]> {
    return [...this.proyectos.values()].sort((a, b) => b.actualizado.localeCompare(a.actualizado));
  }

  async obtener(id: string): Promise<Proyecto | null> {
    return this.proyectos.get(id) ?? null;
  }

  async guardar(proyecto: Proyecto): Promise<void> {
    this.proyectos.set(proyecto.id, structuredClone(proyecto));
    this.alCambiar();
  }

  async eliminar(id: string): Promise<void> {
    this.proyectos.delete(id);
    this.datos.delete(id);
    this.alCambiar();
  }

  async obtenerDatos(idProyecto: string): Promise<DatosProyecto> {
    // Se completa con las tablas vacías: los proyectos antiguos no tienen las tablas nuevas.
    return structuredClone({ ...DATOS_VACIOS, ...this.datos.get(idProyecto) });
  }

  async guardarDatos(idProyecto: string, datos: DatosProyecto): Promise<void> {
    this.datos.set(idProyecto, structuredClone(datos));
    this.alCambiar();
  }

  /** Punto de extensión para persistir; en memoria no hace nada. */
  protected alCambiar(): void {}
}
