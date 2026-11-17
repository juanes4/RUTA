import type { DecisionR7 } from '../calculo/decisionR7';
import type { RegistroDecision } from '../modelo/proyecto';

/** Lo que se está escribiendo en el registro de R7: la decisión puede no estar elegida aún. */
export interface BorradorDecision extends Omit<RegistroDecision, 'decision'> {
  decision: DecisionR7 | '';
}

export function borradorDecision(guardada: RegistroDecision | null, riesgos: number, fecha: string): BorradorDecision {
  const previos = guardada?.riesgos ?? [];
  return {
    decision: guardada?.decision ?? '',
    fecha: guardada?.fecha ?? fecha,
    responsable: guardada?.responsable ?? '',
    riesgos: Array.from({ length: riesgos }, (_, i) => previos[i] ?? ''),
  };
}

/** Errores del registro; vacío si se puede guardar. */
export function validarDecision({ decision, fecha, responsable, riesgos }: BorradorDecision, cuantosRiesgos: number): string[] {
  const escritos = riesgos.filter((r) => r.trim() !== '').length;
  return [
    !decision && 'Elige la decisión.',
    !fecha && 'Escribe la fecha.',
    !responsable.trim() && 'Escribe el cargo del responsable.',
    escritos < cuantosRiesgos && `Escribe los ${cuantosRiesgos} riesgos principales.`,
  ].filter((e): e is string => typeof e === 'string');
}

export function registroDe(borrador: BorradorDecision & { decision: DecisionR7 }): RegistroDecision {
  return { ...borrador, responsable: borrador.responsable.trim(), riesgos: borrador.riesgos.map((r) => r.trim()) };
}
