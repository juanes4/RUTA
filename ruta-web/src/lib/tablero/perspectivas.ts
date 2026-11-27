import { INDICADORES_TABLERO_A, type IdIndicadorA, type IndicadorAuditoria } from '../../config/analizar';
import { formatearValorA, semaforoIndicadorA } from '../analizar/calculos';
import type { EstadoSemaforo } from '../analizar/semaforo';

/**
 * Tablero: lo que se calcula para los gráficos de adopción y los hallazgos priorizados.
 * Funciones puras: la vista solo dibuja. Los hallazgos salen de reglas fijas, no de la IA.
 */

/* ---------- Indicadores A1 frente a su meta ---------- */

export interface AuditoriaMinima {
  periodo: string;
  valores: Partial<Record<IdIndicadorA, number | null>>;
  metas: Partial<Record<IdIndicadorA, number>>;
}

export interface FilaIndicador {
  id: IdIndicadorA;
  nombre: string;
  indicador: IndicadorAuditoria;
  meta: number;
  inicial: number | null;
  actual: number | null;
  /** Cumplimiento de la meta (100 = en la meta), en la primera y la última auditoría. Tope 120. */
  cumplimientoInicial: number | null;
  cumplimientoActual: number | null;
  estado: EstadoSemaforo | null;
  /** Valores de todas las auditorías, de la más antigua a la más reciente (minitendencia). */
  serie: (number | null)[];
}

const TOPE_CUMPLIMIENTO = 120;

/** Qué tanto de la meta se cumple, en %. Para «menor es mejor» se invierte: estar por debajo del tope cumple. */
export function cumplimientoMeta(valor: number | null | undefined, meta: number, indicador: Pick<IndicadorAuditoria, 'sentido'>): number | null {
  if (valor === null || valor === undefined || !Number.isFinite(valor) || meta <= 0) return null;
  const bruto = indicador.sentido === 'menor_mejor' ? (valor <= 0 ? TOPE_CUMPLIMIENTO : (meta / valor) * 100) : (valor / meta) * 100;
  return Math.round(Math.min(TOPE_CUMPLIMIENTO, Math.max(0, bruto)) * 10) / 10;
}

/**
 * Una fila por indicador con la primera y la última auditoría. `auditorias` llega como la entrega la API
 * (la más reciente primero). Ordena de la más lejana a la más cercana a la meta.
 */
export function filasIndicadores(auditorias: readonly AuditoriaMinima[]): FilaIndicador[] {
  if (auditorias.length === 0) return [];
  const cronologicas = [...auditorias].reverse();
  const ultima = cronologicas.at(-1)!;
  const primera = cronologicas[0];
  return INDICADORES_TABLERO_A.map((ind) => {
    const meta = ultima.metas[ind.id] ?? ind.metaInicial;
    const actual = ultima.valores[ind.id] ?? null;
    const inicial = cronologicas.length > 1 ? (primera?.valores[ind.id] ?? null) : null;
    return {
      id: ind.id,
      nombre: ind.nombre,
      indicador: ind,
      meta,
      inicial,
      actual,
      cumplimientoInicial: cumplimientoMeta(inicial, meta, ind),
      cumplimientoActual: cumplimientoMeta(actual, meta, ind),
      estado: semaforoIndicadorA(actual, meta, ind),
      serie: cronologicas.map((a) => a.valores[ind.id] ?? null),
    };
  }).sort((a, b) => (a.cumplimientoActual ?? 999) - (b.cumplimientoActual ?? 999));
}

/* ---------- Hallazgos priorizados ---------- */

export type Prioridad = 'actuar' | 'vigilar' | 'bien';
export type LetraEtapa = 'R' | 'U' | 'T' | 'A';

export interface Hallazgo {
  prioridad: Prioridad;
  etapa: LetraEtapa;
  titulo: string;
  detalle: string;
}

export interface EntradaHallazgos {
  periodoActual: string | null;
  indicadores: readonly FilaIndicador[];
  temas: readonly { tema: string; p1: number; p2: number; total: number }[];
  respuestasBuzon: number;
  /** Actores con brecha de compromiso, de mayor a menor. */
  actores: readonly { actor: string; brecha: number }[];
  /** Fases de la curva del colaborador en el periodo más reciente. */
  fases: readonly { titulo: string; promedio: number | null }[];
  periodoFases: string | null;
  apropiacion: { anterior: number | null; actual: number | null; meta: number };
  /** Resultados del simulador por lectura; null si la persona no puede verlos. */
  simulador: Partial<Record<'sobreconfianza' | 'subestima' | 'necesita_apoyo' | 'alineado', number>> | null;
}

const ORDEN: Record<Prioridad, number> = { actuar: 0, vigilar: 1, bien: 2 };
const DOS_DECIMALES = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
/** Hasta 2 decimales: 3,98 no se muestra como 4 (parecería que ya está en la meta). */
const num = (n: number) => DOS_DECIMALES.format(n);

export function hallazgos(e: EntradaHallazgos, maximo = 6): Hallazgo[] {
  const lista: Hallazgo[] = [];

  // 1. El indicador más lejos de la meta y cuántos no la alcanzan.
  const evaluados = e.indicadores.filter((f) => f.estado !== null);
  const fuera = evaluados.filter((f) => f.estado !== 'en_meta');
  const peor = fuera[0];
  if (peor && peor.actual !== null) {
    lista.push({
      prioridad: peor.estado === 'intervenir' ? 'actuar' : 'vigilar',
      etapa: 'A',
      titulo: `${peor.nombre}: ${formatearValorA(peor.actual, peor.indicador.unidad)} frente a una meta de ${formatearValorA(peor.meta, peor.indicador.unidad)}`,
      detalle: `Es el indicador más lejos de la meta${e.periodoActual ? ` en ${e.periodoActual}` : ''}. ${fuera.length} de ${evaluados.length} indicadores todavía no la alcanzan.`,
    });
  } else if (evaluados.length > 0) {
    lista.push({ prioridad: 'bien', etapa: 'A', titulo: `Los ${evaluados.length} indicadores de adopción están en la meta`, detalle: 'Mantén las auditorías para confirmar que el resultado se sostiene.' });
  }

  // 2. Lo que más mejoró desde la primera auditoría.
  const mejoras = e.indicadores
    .filter((f) => f.cumplimientoInicial !== null && f.cumplimientoActual !== null)
    .map((f) => ({ f, delta: f.cumplimientoActual! - f.cumplimientoInicial! }))
    .sort((a, b) => b.delta - a.delta);
  const mejor = mejoras[0];
  if (mejor && mejor.delta > 0 && mejor.f.inicial !== null && mejor.f.actual !== null) {
    lista.push({
      prioridad: 'bien',
      etapa: 'A',
      titulo: `${mejor.f.nombre} es lo que más avanzó: de ${formatearValorA(mejor.f.inicial, mejor.f.indicador.unidad)} a ${formatearValorA(mejor.f.actual, mejor.f.indicador.unidad)}`,
      detalle: `Ganó ${num(mejor.delta)} puntos de cumplimiento de la meta desde la primera auditoría.`,
    });
  }

  // 3. Apropiación (termómetro T3).
  const { actual, anterior, meta } = e.apropiacion;
  if (actual !== null) {
    const subio = anterior !== null ? ` (venía de ${num(anterior)})` : '';
    lista.push(
      actual >= meta
        ? { prioridad: 'bien', etapa: 'T', titulo: `La apropiación llegó a ${num(actual)} de 5${subio}`, detalle: `Supera la meta de ${num(meta)} del termómetro: el equipo ya trabaja con la nueva forma.` }
        : { prioridad: 'vigilar', etapa: 'T', titulo: `La apropiación está en ${num(actual)} de 5${subio}`, detalle: `Falta para la meta de ${num(meta)}: revisa las afirmaciones más bajas del termómetro.` },
    );
  }

  // 4. Sobreconfianza en el simulador (T2).
  const sobre = e.simulador?.sobreconfianza ?? 0;
  if (sobre > 0) {
    const total = Object.values(e.simulador ?? {}).reduce((s, n) => s + (n ?? 0), 0);
    lista.push({
      prioridad: 'vigilar',
      etapa: 'T',
      titulo: `${sobre} de ${total} resultados del simulador muestran sobreconfianza`,
      detalle: 'Se sienten seguros, pero no aprobaron: conviene un repaso antes de que apliquen lo nuevo solos.',
    });
  }

  // 5. Actor con la mayor brecha de compromiso (R4).
  const actor = e.actores[0];
  if (actor) {
    lista.push({
      prioridad: actor.brecha >= 2 ? 'actuar' : 'vigilar',
      etapa: 'R',
      titulo: `${actor.actor}: ${actor.brecha} ${actor.brecha === 1 ? 'nivel' : 'niveles'} por subir en compromiso`,
      detalle: `Es el actor más lejos de donde necesita estar${e.actores.length > 1 ? `; ${e.actores.length} actores tienen brecha` : ''}.`,
    });
  }

  // 6. Tema más mencionado en el buzón (R5).
  const tema = [...e.temas].sort((a, b) => b.total - a.total)[0];
  if (tema) {
    lista.push({
      prioridad: 'vigilar',
      etapa: 'R',
      titulo: `«${tema.tema}» es lo que más se repite en el buzón`,
      detalle: `${tema.total} menciones en ${e.respuestasBuzon} respuestas: ${tema.p1} sobre lo que falla hoy y ${tema.p2} sobre lo que preocupa del cambio.`,
    });
  }

  // 7. La fase más baja de la curva del colaborador (A2).
  const fases = e.fases.filter((f): f is { titulo: string; promedio: number } => f.promedio !== null);
  const baja = [...fases].sort((a, b) => a.promedio - b.promedio)[0];
  if (baja) {
    lista.push({
      prioridad: baja.promedio < 1.8 ? 'actuar' : baja.promedio < 2.5 ? 'vigilar' : 'bien',
      etapa: 'A',
      titulo: `«${baja.titulo}» es el momento más bajo de la curva (${num(baja.promedio)} de 3)`,
      detalle: `Según el mapa de viaje${e.periodoFases ? ` de ${e.periodoFases}` : ''}: ahí es donde las personas necesitan más acompañamiento.`,
    });
  }

  return lista.sort((a, b) => ORDEN[a.prioridad] - ORDEN[b.prioridad]).slice(0, maximo);
}
