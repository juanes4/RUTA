import { REGLAS } from '../../config/reglas';
import { promediosDe, puntoDeBloqueo, resumirAdkar } from '../calculo/adkar';
import { formatearValor } from '../formato';
import type { FilaRespuesta } from '../modelo/tipos';
import type { FilaIndicador } from './construirTablero';

export interface BarraItem {
  id: string;
  nombre: string;
  etiquetaCorta: string;
  porcentajeValor: number | null;
  porcentajeMeta: number;
  textoValor: string;
  textoMeta: string;
  estado: FilaIndicador['estado'];
  esPuntoBloqueo?: boolean;
}

const ETIQUETAS_CORTAS: Record<string, string> = {
  participacion: 'Part.',
  cobertura_actores: 'Actores',
  utilizacion: 'Utiliz.',
  uso_residual: 'Residual',
  competencia: 'Compet.',
  dudas_atendidas: 'Dudas',
  conducta_lideres: 'Líderes',
  preparacion: 'ADKAR',
};

/** Normaliza un valor (porcentaje 0-1 o escala 1-5) a porcentaje 0-100. */
export function normalizarAPorcentaje(valor: number | null, unidad: 'porcentaje' | 'escala_1_5'): number | null {
  if (valor === null) return null;
  if (unidad === 'escala_1_5') {
    return Math.round(Math.min(Math.max(valor / 5, 0), 1) * 100);
  }
  return Math.round(Math.min(Math.max(valor, 0), 1) * 100);
}

/** Prepara la lista de barras a partir de los indicadores del tablero. */
export function prepararBarrasIndicadores(filas: readonly FilaIndicador[]): BarraItem[] {
  return filas.map((f) => {
    const pctVal = normalizarAPorcentaje(f.valor, f.meta.unidad);
    const pctMeta = normalizarAPorcentaje(f.meta.meta, f.meta.unidad) ?? 0;

    return {
      id: f.meta.id,
      nombre: f.meta.nombre,
      etiquetaCorta: ETIQUETAS_CORTAS[f.meta.id] ?? f.meta.nombre.slice(0, 6),
      porcentajeValor: pctVal,
      porcentajeMeta: pctMeta,
      textoValor: f.valor === null ? '—' : formatearValor(f.valor, f.meta.unidad),
      textoMeta: formatearValor(f.meta.meta, f.meta.unidad),
      estado: f.estado,
    };
  });
}

/** Prepara las barras de las 5 dimensiones ADKAR (C, D, K, H, R). */
export function prepararBarrasAdkar(respuestas: readonly FilaRespuesta[]): BarraItem[] {
  const buzon1 = respuestas.filter((r) => r.instrumento === 'buzon1' || r.momento === 'base');
  const perfil = resumirAdkar(buzon1, REGLAS.adkar.valorFavorableMinimo);
  const promedios = promediosDe(perfil);
  const bloqueo = puntoDeBloqueo(promedios, REGLAS.adkar.umbralBloqueo);

  const nombres: Record<string, string> = {
    C: 'Conciencia',
    D: 'Deseo',
    K: 'Conocimiento',
    H: 'Habilidad',
    R: 'Refuerzo',
  };

  const dimensiones = ['C', 'D', 'K', 'H', 'R'] as const;

  return dimensiones.map((dim) => {
    const prom = promedios[dim];
    const pctVal = prom === null ? null : Math.round(Math.min(Math.max(prom / 5, 0), 1) * 100);
    const esBloqueo = dim === bloqueo;

    let estado: FilaIndicador['estado'] = null;
    if (prom !== null) {
      if (prom >= REGLAS.adkar.umbralBloqueo) {
        estado = 'en_meta';
      } else if (esBloqueo) {
        estado = 'intervenir';
      } else {
        estado = 'atencion';
      }
    }

    return {
      id: dim,
      nombre: `${dim} · ${nombres[dim]}`,
      etiquetaCorta: dim,
      porcentajeValor: pctVal,
      porcentajeMeta: Math.round((REGLAS.adkar.umbralBloqueo / 5) * 100), // 60%
      textoValor: prom === null ? '—' : prom.toFixed(1),
      textoMeta: REGLAS.adkar.umbralBloqueo.toFixed(1),
      estado,
      esPuntoBloqueo: esBloqueo,
    };
  });
}
