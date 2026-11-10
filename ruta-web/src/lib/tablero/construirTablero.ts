import { KOTTER_PARTE_A } from '../../config/formularios/kotter';
import type { Reglas } from '../../config/reglas';
import { promediosDe, puntoDeBloqueo, resumirAdkar } from '../calculo/adkar';
import { decidirR7, type EntradaR7, type ResultadoR7 } from '../calculo/decisionR7';
import { contarPersonas } from '../calculo/estadistica';
import { agruparConAnonimato } from '../calculo/grupos';
import { puntajesPorPaso, PASOS_KOTTER, type PuntajesPorPaso } from '../calculo/kotter';
import { participacionPorArea, type ParticipacionArea } from '../calculo/participacion';
import { evaluarSemaforo, type EstadoSemaforo } from '../calculo/semaforo';
import type { DatosProyecto, Proyecto } from '../modelo/proyecto';
import type { Dimension } from '../modelo/tipos';
import { resolverMetas, type MetaResuelta } from '../proyecto/etapa0';
import { calcularIndicador } from './indicadores';

/** Todo lo que muestra el tablero, ya calculado. La vista solo lo dibuja. */

export interface FilaIndicador {
  meta: MetaResuelta;
  valor: number | null;
  motivo: string | null;
  estado: EstadoSemaforo | null;
}

export interface Tablero {
  decision: ResultadoR7;
  participacion: ParticipacionArea[];
  indicadores: FilaIndicador[];
}

/** Punto de bloqueo de cada grupo visible del buzón 1 (agrupado por área). */
export function bloqueosPorArea(datos: DatosProyecto, reglas: Reglas): (Dimension | null)[] {
  const buzon1 = datos.respuestas.filter((r) => r.instrumento === 'buzon1');
  const { grupos } = agruparConAnonimato(buzon1, (f) => f.area, reglas.anonimato.minimoColaboradores);
  return grupos.map((g) =>
    puntoDeBloqueo(promediosDe(resumirAdkar(g.filas, reglas.adkar.valorFavorableMinimo)), reglas.adkar.umbralBloqueo),
  );
}

/**
 * Datos de la decisión R7. Con menos personas que el mínimo de Kotter no se
 * usa ningún puntaje: un total de 1 o 2 personas las identificaría.
 */
export function entradaR7(datos: DatosProyecto, reglas: Reglas): EntradaR7 {
  const kotterA = datos.kotter.filter((k) => k.parte === 'A');
  const sinPuntajes = Object.fromEntries(PASOS_KOTTER.map((p) => [p, null])) as PuntajesPorPaso;
  return {
    puntajesKotter:
      contarPersonas(kotterA) >= reglas.anonimato.minimoKotter ? puntajesPorPaso(kotterA, KOTTER_PARTE_A) : sinPuntajes,
    bloqueosPorGrupo: bloqueosPorArea(datos, reglas),
  };
}

export function construirTablero(proyecto: Proyecto, datos: DatosProyecto, reglas: Reglas): Tablero {
  const decision = decidirR7(entradaR7(datos, reglas), { ...reglas.kotter, ...reglas.decisionR7 });

  const indicadores = resolverMetas(proyecto.metas).map<FilaIndicador>((meta) => {
    const resultado = calcularIndicador(meta.id, { proyecto, datos });
    return {
      meta,
      valor: resultado.valor,
      motivo: resultado.motivo ?? null,
      estado: resultado.valor === null ? null : evaluarSemaforo(resultado.valor, meta, reglas.semaforo.margen),
    };
  });

  const participacion = participacionPorArea(
    datos.respuestas.filter((r) => r.instrumento === 'buzon1'),
    proyecto.segmentacion.areas,
  );

  return { decision, participacion, indicadores };
}
