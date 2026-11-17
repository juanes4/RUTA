import {
  ESCALA_KOTTER,
  OPCIONES_COMUNICACIONES,
  OPCIONES_PROPORCION,
  type OpcionKotter,
  type PreguntaKotter,
} from '../../config/formularios/kotter';
import type { FilaKotter, PasoKotter, RolKotter } from '../modelo/tipos';
import { contarPersonas, EPSILON, promedio } from './estadistica';

/** Instrumento 2 (docs/instrumento2_kotter.md), §2.4 y §2.5. */

export const PASOS_KOTTER: readonly PasoKotter[] = [1, 2, 3, 4, 5, 6, 7, 8];

const SI = 'si';
const NO = 'no';

function puntajeDeOpcion(opciones: readonly OpcionKotter[], valor: string): number | null {
  return opciones.find((o) => o.valor === valor)?.puntaje ?? null;
}

/** Un "Sí" sin evidencia se registra como "No" (Instrumento 2 §2.2, parte B, regla 3). */
function siConEvidencia(respuesta: string, evidencia: string | null): boolean {
  return respuesta === SI && (evidencia ?? '').trim().length > 0;
}

/**
 * Convierte una respuesta a puntaje 1–5 (§2.4). Devuelve null cuando la
 * respuesta no suma: "No sé", "No conozco", abiertas e indicadores.
 */
export function puntajeRespuesta(
  pregunta: PreguntaKotter,
  respuesta: string,
  evidencia: string | null,
): number | null {
  switch (pregunta.tipo) {
    case 'escala':
      return puntajeDeOpcion(ESCALA_KOTTER, respuesta);
    case 'si_no':
      if (respuesta !== SI && respuesta !== NO) return null;
      return siConEvidencia(respuesta, evidencia) ? 5 : 1;
    case 'si_no_alerta':
      if (respuesta !== SI && respuesta !== NO) return null;
      return siConEvidencia(respuesta, evidencia) ? 1 : 5;
    case 'proporcion':
      return puntajeDeOpcion(OPCIONES_PROPORCION, respuesta);
    case 'comunicaciones':
      return puntajeDeOpcion(OPCIONES_COMUNICACIONES, respuesta);
    case 'historia_cambios':
      return puntajeDeOpcion(pregunta.opciones ?? [], respuesta);
    case 'abierta':
    case 'indicador':
      return null;
  }
}

export type PuntajesPorPaso = Record<PasoKotter, number | null>;

/** Puntaje del paso = promedio de sus preguntas de escala y convertidas (§2.5). */
export function puntajesPorPaso(
  filas: readonly FilaKotter[],
  preguntas: readonly PreguntaKotter[],
): PuntajesPorPaso {
  const porId = new Map(preguntas.map((p) => [p.id, p]));
  const valores = new Map<PasoKotter, number[]>(PASOS_KOTTER.map((p) => [p, []]));

  for (const fila of filas) {
    const pregunta = porId.get(fila.pregunta_id);
    if (!pregunta || pregunta.paso === null) continue;
    const puntaje = puntajeRespuesta(pregunta, fila.respuesta_original, fila.evidencia);
    if (puntaje !== null) valores.get(pregunta.paso)?.push(puntaje);
  }

  const resultado = {} as PuntajesPorPaso;
  for (const paso of PASOS_KOTTER) resultado[paso] = promedio(valores.get(paso) ?? []);
  return resultado;
}

export type NivelKotter = 'bajo' | 'medio' | 'alto';

export const PALABRA_NIVEL: Readonly<Record<NivelKotter, string>> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
};

export function nivelPaso(puntaje: number, limites: { limiteBajo: number; limiteMedio: number }): NivelKotter {
  if (puntaje < limites.limiteBajo - EPSILON) return 'bajo';
  if (puntaje < limites.limiteMedio - EPSILON) return 'medio';
  return 'alto';
}

// ── Grupos por rol y brecha ────────────────────────────────────────────

/**
 * - completo: dirección, líderes de área y equipo de cambio por separado.
 * - aproximado: un rol se unió a otro por tener pocas respuestas.
 * - solo_total: no hay grupos comparables; solo se muestra el total.
 */
export type ModoGruposKotter = 'completo' | 'aproximado' | 'solo_total';

export interface GrupoRol {
  id: 'direccion' | 'lider_area' | 'equipo_cambio' | 'coalicion';
  roles: RolKotter[];
  personas: number;
  filas: FilaKotter[];
}

export interface AgrupacionKotter {
  modo: ModoGruposKotter;
  grupos: GrupoRol[];
  personasPorRol: Record<RolKotter, number>;
  /** true si la dirección tiene menos del mínimo: hay que invitar al comité directivo. */
  faltanRespuestasDireccion: boolean;
}

function grupoDe(id: GrupoRol['id'], roles: RolKotter[], filas: readonly FilaKotter[]): GrupoRol {
  const propias = filas.filter((f) => roles.includes(f.rol));
  return { id, roles, personas: contarPersonas(propias), filas: propias };
}

/**
 * Unión de grupos [PROPUESTA del equipo, PLAN §6]:
 * 1. Líderes de área con menos del mínimo → solo total.
 * 2. Dirección con menos del mínimo → se une al equipo de cambio
 *    ("coalición"); si la coalición sigue con menos del mínimo → solo total.
 * 3. Equipo de cambio con 1 a (mínimo − 1) personas y dirección completa →
 *    se une a la dirección [PENDIENTE DE CONFIRMAR: caso no definido por el equipo].
 */
export function agruparPorRol(filas: readonly FilaKotter[], minimo: number): AgrupacionKotter {
  const direccion = grupoDe('direccion', ['direccion'], filas);
  const lideres = grupoDe('lider_area', ['lider_area'], filas);
  const equipo = grupoDe('equipo_cambio', ['equipo_cambio'], filas);
  const coalicion = grupoDe('coalicion', ['direccion', 'equipo_cambio'], filas);

  const base = {
    personasPorRol: {
      direccion: direccion.personas,
      lider_area: lideres.personas,
      equipo_cambio: equipo.personas,
    },
    faltanRespuestasDireccion: direccion.personas < minimo,
  };

  if (lideres.personas < minimo) return { ...base, modo: 'solo_total', grupos: [] };

  if (direccion.personas < minimo) {
    return coalicion.personas < minimo
      ? { ...base, modo: 'solo_total', grupos: [] }
      : { ...base, modo: 'aproximado', grupos: [coalicion, lideres] };
  }

  if (equipo.personas === 0) return { ...base, modo: 'completo', grupos: [direccion, lideres] };
  if (equipo.personas < minimo) return { ...base, modo: 'aproximado', grupos: [coalicion, lideres] };
  return { ...base, modo: 'completo', grupos: [direccion, lideres, equipo] };
}

export interface Brecha {
  paso: PasoKotter;
  grupoA: GrupoRol['id'];
  grupoB: GrupoRol['id'];
  /** Puntaje A − puntaje B. Positivo: A ve el paso mejor que B. */
  diferencia: number;
  alerta: boolean;
  aproximada: boolean;
}

/**
 * Brecha entre roles por paso (§2.5): la dirección (o la coalición, si la
 * dirección se unió) frente a cada uno de los otros grupos.
 */
export function calcularBrechas(
  agrupacion: AgrupacionKotter,
  preguntas: readonly PreguntaKotter[],
  umbralAlerta: number,
): Brecha[] {
  if (agrupacion.modo === 'solo_total') return [];
  const referencia = agrupacion.grupos.find((g) => g.id === 'direccion' || g.id === 'coalicion');
  if (!referencia) return [];

  const puntajesReferencia = puntajesPorPaso(referencia.filas, preguntas);
  const comparados = agrupacion.grupos.filter((g) => g !== referencia);
  const brechas: Brecha[] = [];

  for (const grupo of comparados) {
    const puntajes = puntajesPorPaso(grupo.filas, preguntas);
    for (const paso of PASOS_KOTTER) {
      const a = puntajesReferencia[paso];
      const b = puntajes[paso];
      if (a === null || b === null) continue;
      const diferencia = a - b;
      brechas.push({
        paso,
        grupoA: referencia.id,
        grupoB: grupo.id,
        diferencia,
        alerta: Math.abs(diferencia) >= umbralAlerta - EPSILON,
        aproximada: agrupacion.modo === 'aproximado',
      });
    }
  }
  return brechas;
}
