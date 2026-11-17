import type { Lienzo } from '../modelo/proyecto';

/** Reglas puras del lienzo R1: qué bloques están completos y cómo se limpia al guardar. */

const lleno = (texto: string) => texto.trim() !== '';
const algunoLleno = (lista: readonly string[]) => lista.some(lleno);

const COMPLETO = {
  urgencia: (l: Lienzo, motivos: number) => l.urgencia.filter((m) => lleno(m.motivo) && lleno(m.dato)).length >= motivos,
  afectados: (l: Lienzo) => lleno(l.afectados),
  vision: (l: Lienzo) => lleno(l.vision),
  cambios: (l: Lienzo) => lleno(l.que_cambia) && lleno(l.que_no_cambia),
  beneficios: (l: Lienzo) => l.beneficios.some((b) => lleno(b.grupo) && lleno(b.beneficio)),
  riesgos: (l: Lienzo) => algunoLleno(l.riesgos),
  intentos: (l: Lienzo) => algunoLleno(l.intentos_previos),
} as const;

export type BloqueLienzo = keyof typeof COMPLETO;

export const BLOQUES_LIENZO = Object.keys(COMPLETO) as BloqueLienzo[];

/** Bloques sin contenido. El paso R1 solo cuenta como hecho cuando no falta ninguno. */
export function bloquesFaltantes(lienzo: Lienzo, motivos: number): BloqueLienzo[] {
  return BLOQUES_LIENZO.filter((b) => !COMPLETO[b](lienzo, motivos));
}

/** Asegura una fila editable por cada motivo de urgencia que pide el lienzo. */
export function conFilasDeUrgencia(lienzo: Lienzo, motivos: number): Lienzo {
  const faltan = Math.max(0, motivos - lienzo.urgencia.length);
  return { ...lienzo, urgencia: [...lienzo.urgencia, ...Array.from({ length: faltan }, () => ({ motivo: '', dato: '' }))] };
}

/** Quita espacios sobrantes y las filas de beneficios que quedaron en blanco. */
export function limpiarLienzo(lienzo: Lienzo): Lienzo {
  return {
    ...lienzo,
    urgencia: lienzo.urgencia.map((m) => ({ motivo: m.motivo.trim(), dato: m.dato.trim() })),
    afectados: lienzo.afectados.trim(),
    vision: lienzo.vision.trim(),
    que_cambia: lienzo.que_cambia.trim(),
    que_no_cambia: lienzo.que_no_cambia.trim(),
    beneficios: lienzo.beneficios.map((b) => ({ grupo: b.grupo.trim(), beneficio: b.beneficio.trim() })).filter((b) => b.grupo || b.beneficio),
  };
}
