import type { Etapa } from '../config/etapas';

/**
 * Rutas con # (sin dependencias; funcionan en hosting estático sin
 * configurar redirecciones). Formato:
 *   #/                    inicio
 *   #/tablero             tablero
 *   #/ingresar            inicio de sesión
 *   #/etapa/r             página de una etapa
 *   #/etapa/r/R6          página de una etapa, en un paso
 */

export type Ruta =
  | { pagina: 'inicio' }
  | { pagina: 'tablero' }
  | { pagina: 'ingresar' }
  | { pagina: 'etapa'; etapaId: string; pasoId: string | null }
  | { pagina: 'no_encontrada' };

/** Parte de la dirección que identifica una etapa: su letra en minúscula ("0", "r", "u"). */
export function segmentoEtapa(etapa: Etapa): string {
  return etapa.letra.toLowerCase();
}

export function parsearRuta(hash: string, etapas: readonly Etapa[]): Ruta {
  const partes = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [primera, segunda, tercera] = partes;

  if (partes.length === 0) return { pagina: 'inicio' };
  if (primera === 'tablero' && partes.length === 1) return { pagina: 'tablero' };
  if (primera === 'ingresar' && partes.length === 1) return { pagina: 'ingresar' };
  if (primera === 'etapa' && segunda && partes.length <= 3) {
    const etapa = etapas.find((e) => e.activa && segmentoEtapa(e) === segunda.toLowerCase());
    if (!etapa) return { pagina: 'no_encontrada' };
    if (!tercera) return { pagina: 'etapa', etapaId: etapa.id, pasoId: null };
    const paso = etapa.pasos.find((p) => p.id.toLowerCase() === tercera.toLowerCase());
    return paso ? { pagina: 'etapa', etapaId: etapa.id, pasoId: paso.id } : { pagina: 'no_encontrada' };
  }
  return { pagina: 'no_encontrada' };
}

export function hashDe(ruta: Ruta, etapas: readonly Etapa[]): string {
  switch (ruta.pagina) {
    case 'inicio':
    case 'no_encontrada':
      return '#/';
    case 'tablero':
      return '#/tablero';
    case 'ingresar':
      return '#/ingresar';
    case 'etapa': {
      const etapa = etapas.find((e) => e.id === ruta.etapaId);
      if (!etapa) return '#/';
      const base = `#/etapa/${segmentoEtapa(etapa)}`;
      return ruta.pasoId ? `${base}/${encodeURIComponent(ruta.pasoId)}` : base;
    }
  }
}
