import { NOMBRE_DIMENSION, type Dimension, type PasoKotter } from '../modelo/tipos';
import { PASOS_KOTTER, nivelPaso, type PuntajesPorPaso } from './kotter';

/**
 * Decisión R7 (PLAN §6): combina los puntos de bloqueo del buzón 1 con el
 * chequeo Kotter parte A. Se evalúa en orden; gana la primera regla que se
 * cumpla. La herramienta recomienda; la persona decide.
 */

export type DecisionR7 = 'postergar' | 'lanzar_con_ajustes' | 'lanzar';

export const TEXTO_DECISION: Readonly<Record<DecisionR7, string>> = {
  postergar: 'Postergar de 4 a 8 semanas',
  lanzar_con_ajustes: 'Lanzar con ajustes en el primer ciclo',
  lanzar: 'Lanzar según el plan',
};

export interface ReglasR7 {
  limiteBajo: number;
  limiteMedio: number;
  pasosBase: readonly number[];
  pasosBajosParaPostergar: number;
  fraccionMayoriaGrupos: number;
}

export interface EntradaR7 {
  puntajesKotter: PuntajesPorPaso;
  /** Punto de bloqueo de cada grupo visible del buzón 1 (null = sin bloqueo). */
  bloqueosPorGrupo: readonly (Dimension | null)[];
}

export type ResultadoR7 =
  | { estado: 'datos_insuficientes'; faltantes: string[] }
  | { estado: 'calculada'; decision: DecisionR7; motivos: string[] };

function faltantes({ puntajesKotter, bloqueosPorGrupo }: EntradaR7): string[] {
  const lista: string[] = [];
  const pasosSinDato = PASOS_KOTTER.filter((p) => puntajesKotter[p] === null);
  if (pasosSinDato.length > 0) {
    lista.push(`Chequeo Kotter parte A: faltan puntajes de los pasos ${pasosSinDato.join(', ')}.`);
  }
  if (bloqueosPorGrupo.length === 0) {
    lista.push('Buzón 1: no hay ningún grupo con el mínimo de respuestas.');
  }
  return lista;
}

export function decidirR7(entrada: EntradaR7, reglas: ReglasR7): ResultadoR7 {
  const falta = faltantes(entrada);
  if (falta.length > 0) return { estado: 'datos_insuficientes', faltantes: falta };

  const pasosBajos = PASOS_KOTTER.filter(
    (p) => nivelPaso(entrada.puntajesKotter[p] as number, reglas) === 'bajo',
  );
  const baseBajos = pasosBajos.filter((p) => reglas.pasosBase.includes(p));
  const posterioresBajos = pasosBajos.filter((p) => !reglas.pasosBase.includes(p));

  const totalGrupos = entrada.bloqueosPorGrupo.length;
  const gruposConciencia = entrada.bloqueosPorGrupo.filter((b) => b === 'C').length;
  const gruposDeseo = entrada.bloqueosPorGrupo.filter((b) => b === 'D').length;
  const mayoriaEnConciencia = gruposConciencia / totalGrupos > reglas.fraccionMayoriaGrupos;

  const motivosPostergar = [
    baseBajos.length > 0 && `Dirección no alineada: ${describirPasos(baseBajos)} en nivel bajo.`,
    pasosBajos.length >= reglas.pasosBajosParaPostergar &&
      `${pasosBajos.length} pasos de Kotter en nivel bajo.`,
    mayoriaEnConciencia &&
      `${gruposConciencia} de ${totalGrupos} grupos con punto de bloqueo en ${NOMBRE_DIMENSION.C}.`,
  ].filter(esTexto);
  if (motivosPostergar.length > 0) {
    return { estado: 'calculada', decision: 'postergar', motivos: motivosPostergar };
  }

  const motivosAjustes = [
    posterioresBajos.length > 0 && `Kotter: ${describirPasos(posterioresBajos)} en nivel bajo.`,
    gruposDeseo > 0 && `${gruposDeseo} de ${totalGrupos} grupos con punto de bloqueo en ${NOMBRE_DIMENSION.D}.`,
    gruposConciencia > 0 &&
      `${gruposConciencia} de ${totalGrupos} grupos con punto de bloqueo en ${NOMBRE_DIMENSION.C} (no la mayoría).`,
  ].filter(esTexto);
  if (motivosAjustes.length > 0) {
    return { estado: 'calculada', decision: 'lanzar_con_ajustes', motivos: motivosAjustes };
  }

  return {
    estado: 'calculada',
    decision: 'lanzar',
    motivos: ['Pasos 1 a 3 en nivel medio o alto, ningún paso bajo y ningún grupo bloqueado en Conciencia ni en Deseo.'],
  };
}

function describirPasos(pasos: readonly PasoKotter[]): string {
  return pasos.length === 1 ? `paso ${pasos[0]}` : `pasos ${pasos.join(', ')}`;
}

function esTexto(valor: string | false): valor is string {
  return typeof valor === 'string';
}
