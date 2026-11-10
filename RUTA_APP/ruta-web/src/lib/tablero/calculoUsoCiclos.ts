import type { FilaUso } from '../modelo/tipos';
import { proporcion } from '../calculo/estadistica';

export interface ResumenCicloUso {
  ciclo: number;
  transaccionesNuevo: number;
  transaccionesAntiguo: number;
  totalTransacciones: number;
  tasaAdopcion: number | null;
  tasaResidual: number | null;
}

/** Agrupa las filas de uso por ciclo y calcula las tasas de adopción y uso residual. */
export function resumirUsoPorCiclo(uso: readonly FilaUso[]): ResumenCicloUso[] {
  if (uso.length === 0) return [];

  const gruposPorCiclo = new Map<number, { nuevo: number; antiguo: number }>();

  for (const fila of uso) {
    const actual = gruposPorCiclo.get(fila.ciclo) ?? { nuevo: 0, antiguo: 0 };
    gruposPorCiclo.set(fila.ciclo, {
      nuevo: actual.nuevo + Math.max(0, fila.transacciones_nuevo),
      antiguo: actual.antiguo + Math.max(0, fila.transacciones_antiguo),
    });
  }

  const ciclosOrdenados = Array.from(gruposPorCiclo.keys()).sort((a, b) => a - b);

  return ciclosOrdenados.map((ciclo) => {
    const { nuevo, antiguo } = gruposPorCiclo.get(ciclo)!;
    const total = nuevo + antiguo;
    return {
      ciclo,
      transaccionesNuevo: nuevo,
      transaccionesAntiguo: antiguo,
      totalTransacciones: total,
      tasaAdopcion: proporcion(nuevo, total),
      tasaResidual: proporcion(antiguo, total),
    };
  });
}
