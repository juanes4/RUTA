import type { DatosProyecto, Proyecto } from '../modelo/proyecto';
import { AlmacenMemoria } from './almacenMemoria';

/** Lo mínimo de Storage que se usa; permite probar sin navegador. */
export interface AlmacenamientoClaveValor {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

const CLAVE = 'ruta:v1';

interface Instantanea {
  proyectos: Proyecto[];
  datos: Record<string, DatosProyecto>;
}

/**
 * Persiste en localStorage. Los datos quedan solo en este navegador; para
 * moverlos se usa exportar/importar (PLAN §4, Captura).
 */
export class AlmacenLocal extends AlmacenMemoria {
  constructor(private readonly almacenamiento: AlmacenamientoClaveValor) {
    super();
    this.cargar();
  }

  private cargar(): void {
    const texto = this.leerSeguro();
    if (!texto) return;
    try {
      const instantanea = JSON.parse(texto) as Instantanea;
      this.proyectos = new Map(instantanea.proyectos.map((p) => [p.id, p]));
      this.datos = new Map(Object.entries(instantanea.datos));
    } catch {
      // Datos dañados: se arranca vacío en lugar de romper la app.
    }
  }

  protected override alCambiar(): void {
    const instantanea: Instantanea = {
      proyectos: [...this.proyectos.values()],
      datos: Object.fromEntries(this.datos),
    };
    this.almacenamiento.setItem(CLAVE, JSON.stringify(instantanea));
  }

  private leerSeguro(): string | null {
    try {
      return this.almacenamiento.getItem(CLAVE);
    } catch {
      return null;
    }
  }
}
