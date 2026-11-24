import { BLOQUES_LIENZO as BLOQUES, type BloqueLienzo } from '../../config/formularios/reconocer';
import type { Lienzo } from '../modelo/proyecto';

/** Reglas puras del lienzo R1: qué bloques están completos y cómo se limpia al guardar. */

const lleno = (texto: string) => texto.trim() !== '';
const algunoLleno = (lista: readonly string[]) => lista.some(lleno);

const COMPLETO: Readonly<Record<BloqueLienzo, (l: Lienzo, motivos: number) => boolean>> = {
  urgencia: (l, motivos) => l.urgencia.filter((m) => lleno(m.motivo) && lleno(m.dato)).length >= motivos,
  afectados: (l) => lleno(l.afectados),
  vision: (l) => lleno(l.vision),
  cambios: (l) => lleno(l.que_cambia) && lleno(l.que_no_cambia),
  beneficios: (l) => l.beneficios.some((b) => lleno(b.grupo) && lleno(b.beneficio)),
  criterios: (l) => l.criterios.some((c) => lleno(c.criterio) && lleno(c.meta)),
  riesgos: (l) => algunoLleno(l.riesgos) && algunoLleno(l.intentos_previos),
};

export const BLOQUES_LIENZO: readonly BloqueLienzo[] = BLOQUES.map((b) => b.id);

/** Bloques sin contenido. El paso R1 solo cuenta como hecho cuando no falta ninguno. */
export function bloquesFaltantes(lienzo: Lienzo, motivos: number): BloqueLienzo[] {
  return BLOQUES_LIENZO.filter((b) => !COMPLETO[b](lienzo, motivos));
}

/** Asegura una fila editable por cada motivo de urgencia que pide el lienzo. */
export function conFilasDeUrgencia(lienzo: Lienzo, motivos: number): Lienzo {
  const faltan = Math.max(0, motivos - lienzo.urgencia.length);
  return { ...lienzo, urgencia: [...lienzo.urgencia, ...Array.from({ length: faltan }, () => ({ motivo: '', dato: '' }))] };
}

/** Quita espacios sobrantes y las filas de beneficios o criterios que quedaron en blanco. */
export function limpiarLienzo(lienzo: Lienzo): Lienzo {
  return {
    ...lienzo,
    urgencia: lienzo.urgencia.map((m) => ({ motivo: m.motivo.trim(), dato: m.dato.trim() })),
    afectados: lienzo.afectados.trim(),
    vision: lienzo.vision.trim(),
    que_cambia: lienzo.que_cambia.trim(),
    que_no_cambia: lienzo.que_no_cambia.trim(),
    beneficios: lienzo.beneficios.map((b) => ({ grupo: b.grupo.trim(), beneficio: b.beneficio.trim() })).filter((b) => b.grupo || b.beneficio),
    criterios: lienzo.criterios.map((c) => ({ criterio: c.criterio.trim(), meta: c.meta.trim() })).filter((c) => c.criterio || c.meta),
  };
}
