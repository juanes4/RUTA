import type { PasoRecorrido } from '../contenido/pasos';

export interface PasoNumerado extends PasoRecorrido {
  numero: number;
  /** Posición del paso dentro de su etapa, para elegir su tono. */
  posicionEnEtapa: number;
}

export interface FaseRecorrido {
  verbo: string;
  pasos: PasoNumerado[];
}

/** Une los pasos seguidos con el mismo verbo, para mostrar cada verbo una sola vez. */
export function fasesDelRecorrido(recorrido: readonly PasoRecorrido[]): FaseRecorrido[] {
  const fases: FaseRecorrido[] = [];
  const vistosPorEtapa = new Map<string | null, number>();
  recorrido.forEach((paso, i) => {
    const posicionEnEtapa = vistosPorEtapa.get(paso.etapaId) ?? 0;
    vistosPorEtapa.set(paso.etapaId, posicionEnEtapa + 1);
    const numerado = { ...paso, numero: i + 1, posicionEnEtapa };
    const ultima = fases.at(-1);
    if (ultima?.verbo === paso.verbo) ultima.pasos.push(numerado);
    else fases.push({ verbo: paso.verbo, pasos: [numerado] });
  });
  return fases;
}
