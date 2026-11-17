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
  /** Letra del nodo. Las etapas vacías no muestran letra. */
  letra: string;
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
}

export const ETAPAS: readonly Etapa[] = [
  {
    id: 'etapa-0',
    letra: '0',
    nombre: 'Registro de la empresa',
    activa: true,
    color: 'var(--pastel-cream)',
    tarjetas: { fondos: ['var(--pastel-cream)'], manchas: true },
    pasos: [
      { id: '0.1', titulo: 'Empresa y cambio' },
      { id: '0.2', titulo: 'Grupos y afectados' },
      { id: '0.3', titulo: 'Metas' },
      { id: '0.4', titulo: 'Dato de uso' },
    ],
  },
  {
    id: 'etapa-r',
    letra: 'R',
    nombre: 'Reconocer',
    activa: true,
    color: 'var(--pastel-blue)',
    tonos: ['var(--tono-r-1)', 'var(--tono-r-2)', 'var(--tono-r-3)', 'var(--tono-r-4)', 'var(--tono-r-5)', 'var(--tono-r-6)', 'var(--tono-r-7)'],
    tarjetas: { fondos: ['var(--pastel-blue)', GRIS], manchas: false },
    paginasPorPaso: true,
    pasos: [
      { id: 'R1', titulo: 'Lienzo del cambio' },
      { id: 'R2', titulo: 'FODA del cambio' },
      { id: 'R3', titulo: 'Mapa de actores' },
      { id: 'R4', titulo: 'Análisis del tipo de liderazgo' },
      { id: 'R5', titulo: 'Ficha del cambio y narrativa' },
      { id: 'R6', titulo: 'Buzón 1 y mapa de empatía' },
      { id: 'R7', titulo: 'Decisión de lanzar, ajustar o postergar' },
    ],
  },
  {
    id: 'etapa-u',
    letra: 'U',
    nombre: 'Unir',
    activa: true,
    color: 'var(--pastel-lavender)',
    tonos: ['var(--tono-u-1)', 'var(--tono-u-2)'],
    tarjetas: { fondos: ['var(--pastel-lavender)'], manchas: false },
    pasos: [
      { id: 'U1', titulo: 'Comunicación por grupo' },
      { id: 'U2', titulo: 'Red de agentes de cambio' },
      { id: 'U3', titulo: 'Capacitación' },
      { id: 'U4', titulo: 'Buzón 2' },
      { id: 'U5', titulo: 'Indicadores y tablero' },
    ],
  },
  { id: 'etapa-t', letra: 'T', nombre: 'Por definir', activa: false, pasos: [] },
  { id: 'etapa-a', letra: 'A', nombre: 'Por definir', activa: false, pasos: [] },
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
