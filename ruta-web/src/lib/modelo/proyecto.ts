import type {
  AlcanceDespliegue,
  ElementoOrganizacion,
  FilaActor,
  FilaFoda,
  FilaLiderazgo,
  PuntajeTriaje,
  RespuestaBuzon1,
} from './tipos';

/** Etapa 0: registro de la empresa. Sin datos personales. */

/** 0.1 Empresa y cambio. */
export interface Empresa {
  nombre: string;
  sector: string;
  total_colaboradores: number | null;
  que_cambia: string;
  fecha_lanzamiento: string;
}

/** 0.2 Un área con su número de personas afectadas (base de la participación del buzón 1). */
export interface AreaAfectada {
  area: string;
  afectados: number;
}

/** 0.2 Áreas y afectados. */
export interface Segmentacion {
  areas: AreaAfectada[];
}

export interface Proyecto {
  id: string;
  creado: string;
  actualizado: string;
  empresa: Empresa;
  segmentacion: Segmentacion;
}

/** R1. Lienzo del cambio. */

export interface MotivoUrgencia {
  motivo: string;
  dato: string;
}

export interface BeneficioGrupo {
  grupo: string;
  beneficio: string;
}

export interface CriterioExito {
  criterio: string;
  /** El número que dirá que funcionó, por ejemplo "90 % de pedidos en el sistema nuevo". */
  meta: string;
}

/** Las 7 preguntas guía del lienzo. Es interno: lo usa el equipo de cambio. */
export interface Lienzo {
  urgencia: MotivoUrgencia[];
  afectados: string;
  vision: string;
  que_cambia: string;
  que_no_cambia: string;
  beneficios: BeneficioGrupo[];
  criterios: CriterioExito[];
  riesgos: string[];
  intentos_previos: string[];
}

export const LIENZO_VACIO: Lienzo = {
  urgencia: [],
  afectados: '',
  vision: '',
  que_cambia: '',
  que_no_cambia: '',
  beneficios: [],
  criterios: [],
  riesgos: [],
  intentos_previos: [],
};

/** R2. Triaje del cambio: preguntas orientadoras y matriz de puntuación. */
export interface Triaje {
  por_que_ahora: string;
  poblacion_afectada: string;
  dimension_tecnica: string;
  impacto_personas: PuntajeTriaje | null;
  /** Elementos impactados; de su número sale el puntaje de complejidad organizacional. */
  elementos: ElementoOrganizacion[];
  riesgo_operativo: PuntajeTriaje | null;
  alcance: AlcanceDespliegue | null;
}

export const TRIAJE_VACIO: Triaje = {
  por_que_ahora: '',
  poblacion_afectada: '',
  dimension_tecnica: '',
  impacto_personas: null,
  elementos: [],
  riesgo_operativo: null,
  alcance: null,
};

/** U2. Narrativa del cambio en 3 partes, y quién la comunica. */
export interface Narrativa {
  /** Código del líder que da el mensaje (U1). */
  vocero: string;
  /** 1. De dónde venimos y por qué ya no basta. */
  urgencia: string;
  /** 2. Hacia dónde vamos. */
  vision: string;
  /** 3. Cómo será el camino. */
  que_cambia: string;
  que_se_mantiene: string;
  acompanamiento: string;
  que_gano: string;
}

export const NARRATIVA_VACIA: Narrativa = {
  vocero: '',
  urgencia: '',
  vision: '',
  que_cambia: '',
  que_se_mantiene: '',
  acompanamiento: '',
  que_gano: '',
};

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

/** U3. Soporte de líderes: lo que los jefes necesitan para acompañar a sus equipos. */
export interface SoporteLideres {
  mensajes: string[];
  preguntas: PreguntaFrecuente[];
  pautas: string[];
}

export const SOPORTE_VACIO: SoporteLideres = { mensajes: [], preguntas: [], pautas: [] };

/** U4. Mapa de empatía posterior a la comunicación. */
export interface MapaEmpatia {
  oye: string[];
  ve: string[];
  piensa_siente: string[];
  dice_hace: string[];
  dolores: string[];
  necesidades: string[];
  /** Estrategias de acompañamiento que salen del mapa. */
  estrategias: string[];
}

export const EMPATIA_VACIA: MapaEmpatia = {
  oye: [],
  ve: [],
  piensa_siente: [],
  dice_hace: [],
  dolores: [],
  necesidades: [],
  estrategias: [],
};

/** Todo lo que se captura para un proyecto en las etapas R y U. */
export interface DatosProyecto {
  lienzo: Lienzo;
  triaje: Triaje;
  foda: FilaFoda[];
  actores: FilaActor[];
  buzon1: RespuestaBuzon1[];
  liderazgo: FilaLiderazgo[];
  narrativa: Narrativa;
  soporte: SoporteLideres;
  empatia: MapaEmpatia;
}

export const DATOS_VACIOS: DatosProyecto = {
  lienzo: LIENZO_VACIO,
  triaje: TRIAJE_VACIO,
  foda: [],
  actores: [],
  buzon1: [],
  liderazgo: [],
  narrativa: NARRATIVA_VACIA,
  soporte: SOPORTE_VACIO,
  empatia: EMPATIA_VACIA,
};
