import { GRIS, type Fondo, type Pastel } from './paleta';

/**
 * Etapas de RUTA y sus pasos (PLAN §3). Activar una etapa nueva =
 * agregar sus pasos, su color y cambiar `activa: true`. Nada más cambia.
 */

export interface PasoEtapa {
  id: string;
  titulo: string;
}

/** Cómo se pintan las tarjetas de los pasos de una etapa. */
export interface TarjetasEtapa {
  /** Fondos en orden; si hay más pasos que fondos, se repiten. */
  fondos: readonly Fondo[];
  /** Manchas de luz suaves como las del fondo de la página. */
  manchas: boolean;
}

/** Estilo de la tarjeta de un paso. */
export interface EstiloTarjeta {
  fondo: Fondo;
  manchas: boolean;
}

export interface Etapa {
  id: string;
  /** Letra del nodo y de la dirección (#/etapa/r). Las etapas vacías no muestran letra. */
  letra: string;
  /**
   * Si se da, se dibuja este icono en lugar de la letra (nodo, encabezado,
   * accesos). La Etapa 0 no es una letra de RUTA: un "0" no dice nada.
   */
  icono?: 'empresa';
  nombre: string;
  activa: boolean;
  /** Pastel que identifica la etapa (nodo, encabezado, acceso). Las vacías no tienen. */
  color?: Pastel;
  /** Tonos de la etapa para sus pasos en el recorrido del Inicio, en orden. */
  tonos?: readonly string[];
  /** Tarjetas de los pasos. Las vacías no tienen. */
  tarjetas?: TarjetasEtapa;
  /** true: índice de pasos y una página por paso. false: todos los pasos en una página. */
  paginasPorPaso?: boolean;
  pasos: readonly PasoEtapa[];
  /**
   * Páginas de apoyo que no son pasos de la metodología (no cuentan en el
   * avance ni en la barra de pasos). Se abren desde el índice de la etapa.
   */
  extras?: readonly PasoEtapa[];
}

/** Página del Copiloto de Reconocimiento, dentro de la etapa R. */
export const ID_COPILOTO = 'copiloto';

export const ETAPAS: readonly Etapa[] = [
  {
    id: 'etapa-0',
    letra: '0',
    icono: 'empresa',
    nombre: 'Registro de la empresa',
    activa: true,
    color: 'var(--pastel-durazno)',
    tarjetas: { fondos: ['var(--pastel-durazno)'], manchas: false },
    pasos: [
      { id: '0.1', titulo: 'Empresa y cambio' },
      { id: '0.2', titulo: 'Áreas y afectados' },
    ],
  },
  {
    id: 'etapa-r',
    letra: 'R',
    nombre: 'Reconocer',
    activa: true,
    color: 'var(--pastel-blue)',
    tonos: ['var(--tono-r-1)', 'var(--tono-r-2)', 'var(--tono-r-3)', 'var(--tono-r-4)', 'var(--tono-r-5)'],
    tarjetas: { fondos: ['var(--pastel-blue)', GRIS], manchas: false },
    paginasPorPaso: true,
    pasos: [
      { id: 'R1', titulo: 'Lienzo del cambio' },
      { id: 'R2', titulo: 'Triaje del cambio' },
      { id: 'R3', titulo: 'FODA del cambio' },
      { id: 'R4', titulo: 'Mapa de actores' },
      { id: 'R5', titulo: 'Buzón 1: escucha inicial' },
    ],
    extras: [{ id: ID_COPILOTO, titulo: 'Copiloto de Reconocimiento' }],
  },
  {
    id: 'etapa-u',
    letra: 'U',
    nombre: 'Unir',
    activa: true,
    color: 'var(--pastel-lavender)',
    tonos: ['var(--tono-u-1)', 'var(--tono-u-2)', 'var(--tono-u-3)', 'var(--tono-u-4)'],
    tarjetas: { fondos: ['var(--pastel-lavender)', GRIS], manchas: false },
    paginasPorPaso: true,
    pasos: [
      { id: 'U1', titulo: 'Análisis del tipo de liderazgo' },
      { id: 'U2', titulo: 'Narrativa del cambio' },
      { id: 'U3', titulo: 'Soporte para líderes' },
      { id: 'U4', titulo: 'Mapa de empatía' },
    ],
  },
  {
    id: 'etapa-t',
    letra: 'T',
    nombre: 'Transformar',
    activa: true,
    color: 'var(--pastel-mint)',
    tarjetas: { fondos: ['var(--pastel-mint)'], manchas: false },
    paginasPorPaso: true,
    pasos: [
      { id: 'T1', titulo: 'Comunicación' },
      { id: 'T2', titulo: 'Capacitación' },
      { id: 'T3', titulo: 'Acompañamiento' },
      { id: 'T4', titulo: 'Victorias tempranas' },
    ],
  },
  {
    id: 'etapa-a',
    letra: 'A',
    nombre: 'Analizar',
    activa: true,
    color: 'var(--pastel-cream)',
    tonos: ['var(--pastel-cream)'],
    tarjetas: { fondos: ['var(--pastel-cream)'], manchas: false },
    paginasPorPaso: true,
    pasos: [
      { id: 'A1', titulo: 'Auditorías de adopción' },
      { id: 'A2', titulo: 'Mapa de viaje del colaborador' },
    ],
  },
];

/** Id del elemento HTML de un paso, usado por la navegación para saltar a él. */
export function anclaPaso(idPaso: string): string {
  return `paso-${idPaso.replace('.', '-')}`;
}

/** Estilo de la tarjeta del paso en la posición `indice` de la etapa. */
export function tarjetaDePaso(etapa: Etapa, indice: number): EstiloTarjeta {
  const fondos = etapa.tarjetas?.fondos ?? [];
  return {
    fondo: fondos[indice % Math.max(fondos.length, 1)] ?? GRIS,
    manchas: etapa.tarjetas?.manchas ?? false,
  };
}
