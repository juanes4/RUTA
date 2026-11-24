import type { AlcanceDespliegue, ElementoOrganizacion, PuntajeTriaje } from '../modelo/tipos';

/**
 * Copiloto de Reconocimiento: lo que devuelve el servidor
 * (server/copiloto). Los conteos ya vienen calculados en código.
 */

export type ModoCopiloto = 'gemini' | 'simulado';

export interface EstadoCopiloto {
  gemini: { configurado: boolean; modelo: string | null; respaldos: string[]; faltan: string[] };
  /** true solo si el servidor tiene RUTA_IA_DATOS_REALES=permitido. */
  datosReales: boolean;
}

export interface TemaInforme {
  codigo: string;
  tema: string;
  p1: number;
  p2: number;
  pctP1: number | null;
  pctP2: number | null;
  total: number;
  sintesis: string;
}

export interface DiferenciaSegmento {
  segmento: string;
  respuestas: number;
  codigo: string;
  tema: string;
  pctSegmento: number;
  pctResto: number;
}

export interface SegmentacionInforme {
  diferencias: DiferenciaSegmento[];
  visibles: { segmento: string; respuestas: number }[];
  ocultos: string[];
}

export interface InformeBuzon {
  participacion: { respuestas: number; personas: number | null; porcentaje: number | null };
  respondidas: { p1: number; p2: number; p3: number };
  temas: TemaInforme[];
  otrosTemas: { nombre: string; menciones: number }[];
  diferencias: { grupo: SegmentacionInforme; area: SegmentacionInforme };
  propuestas: { idea: string; menciones: number }[];
  alertas: {
    intensas: { tema: string; casos: number }[];
    transversales: { tema: string; dimension: 'grupo' | 'area'; segmentos: number }[];
  };
  revision: { tipo: string; nombre: string; cantidad: number }[];
  sentimientos: Record<string, number>;
  lectura: string[];
  limites: string[];
  clasificadas: number;
}

export interface FilaClasificacion {
  id: string;
  pregunta: 'p1' | 'p2' | 'p3';
  /** Texto ya enmascarado, sin área ni grupo. */
  texto: string;
  temas: string[];
  otro: string;
  sentimiento: string;
  intensidad: number;
  revision: string;
  identificable: boolean;
}

/** Riesgo que el buzón muestra y que el lienzo (R1) no tiene. */
export interface AjusteRiesgo {
  riesgo: string;
  fuente: string;
}

export type CriterioAjustable = 'impacto_personas' | 'riesgo_operativo';

/** Puntaje del triaje (R2) que el buzón muestra subestimado o sobrestimado. */
export interface AjusteTriaje {
  criterio: CriterioAjustable;
  puntaje: PuntajeTriaje;
  motivo: string;
  fuente: string;
}

/** Lo que el buzón propone cambiar en el lienzo y el triaje. La persona acepta o descarta cada uno. */
export interface AjustesBuzon {
  riesgos: AjusteRiesgo[];
  triaje: AjusteTriaje[];
}

export interface ResultadoBuzon {
  modo: ModoCopiloto;
  /** Modelo de Gemini que respondió (puede ser uno de respaldo). */
  modelo?: string;
  informe: InformeBuzon;
  clasificacion: FilaClasificacion[];
  enmascarados: { correo: number; telefono: number; cedula: number; persona: number };
  ajustes: AjustesBuzon;
}

export type EstadoBloque = 'completo' | 'por_verificar' | 'por_completar';
export type BloqueFicha = 'urgencia' | 'afectados' | 'vision' | 'cambios' | 'beneficios' | 'criterios' | 'riesgos';

/** Ficha del cambio extraída de la conversación (mismo formato que el lienzo R1, más los estados). */
export interface PropuestaLienzo {
  urgencia: { motivo: string; dato: string }[];
  afectados: string;
  vision: string;
  que_cambia: string;
  que_no_cambia: string;
  beneficios: { grupo: string; beneficio: string }[];
  criterios: { criterio: string; meta: string }[];
  riesgos: string[];
  intentos_previos: string[];
  estados: Record<BloqueFicha, EstadoBloque>;
}

export interface CriterioPropuesto {
  /** null si el modelo no dio un puntaje válido (1, 2 o 3). */
  puntaje: PuntajeTriaje | null;
  justificacion: string;
  fuente: string;
  cambiaria: string;
}

export interface PropuestaTriaje {
  impacto_personas: CriterioPropuesto;
  complejidad: { elementos: ElementoOrganizacion[]; justificacion: string; fuente: string; cambiaria: string };
  riesgo_operativo: CriterioPropuesto;
  alcance: AlcanceDespliegue | 'sin_dato';
  por_que_ahora: string;
  poblacion_afectada: string;
  dimension_tecnica: string;
}

export interface PartesDossier {
  resumen: string;
  recomendaciones: { texto: string; fuente: string }[];
  vocero: { perfil: string; motivo: string; fuente: string };
  preguntas_jefes: string[];
}

export interface MensajeCopiloto {
  rol: 'usuario' | 'copiloto';
  texto: string;
}

/** Lo que el copiloto guarda en el proyecto (en este navegador). */
export interface DatosCopiloto {
  /** Identificador del formulario de Google Forms en el Apps Script (BUZON_ID). */
  buzonFormsId: string;
  /** decididos: claves de los ajustes ya aceptados o descartados (ver claveAjuste). */
  informe: { resultado: ResultadoBuzon; fecha: string; decididos: string[] } | null;
  mensajesLienzo: MensajeCopiloto[];
  modoLienzo: ModoCopiloto | null;
  /** Estados de los bloques la última vez que se pasó la ficha a R1. */
  estadosLienzo: Record<BloqueFicha, EstadoBloque> | null;
  triaje: { propuesta: PropuestaTriaje; modo: ModoCopiloto; modelo?: string; fecha: string } | null;
  dossier: { partes: PartesDossier; modo: ModoCopiloto; modelo?: string; fecha: string } | null;
}

export const COPILOTO_VACIO: DatosCopiloto = {
  buzonFormsId: '',
  informe: null,
  mensajesLienzo: [],
  modoLienzo: null,
  estadosLienzo: null,
  triaje: null,
  dossier: null,
};
