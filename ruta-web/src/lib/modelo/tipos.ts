/**
 * Tablas de captura de las etapas R y U (RUTA_ANDI_R_U.md). Sin datos
 * personales: los actores y líderes se registran por cargo o código.
 */

/** R2. Puntaje de un criterio del triaje (escala de 1 a 3). */
export type PuntajeTriaje = 1 | 2 | 3;

/** R2. Elementos de la organización que el cambio puede impactar (complejidad organizacional). */
export type ElementoOrganizacion = 'estrategia' | 'estructura' | 'sistemas' | 'habilidades' | 'liderazgo' | 'valores';

/** R2. Alcance de despliegue: no suma puntos, caracteriza la ruta. */
export type AlcanceDespliegue = 'piloto' | 'departamento' | 'organizacion';

/** R3. Fortalezas, Oportunidades, Debilidades y Amenazas. */
export type Cuadrante = 'F' | 'O' | 'D' | 'A';

/** R3. Un ítem del FODA con su puntaje. */
export interface FilaFoda {
  id: string;
  cuadrante: Cuadrante;
  item: string;
  puntaje: number;
}

/** R4. Alto (A) o Bajo (B). */
export type NivelAB = 'A' | 'B';

/** R4. Mapa de compromiso, de menor a mayor. */
export type NivelCompromiso = 'desconoce' | 'se_resiste' | 'neutral' | 'apoya' | 'lidera';

/** R4. Un actor o grupo del mapa de actores. */
export interface FilaActor {
  id: string;
  actor: string;
  descripcion: string;
  necesidades: string;
  poder: NivelAB | null;
  interes: NivelAB | null;
  /** "¿Cuál es la realidad?": cómo se ve hoy este actor en la empresa. */
  realidad: string;
  /** C: dónde está hoy. */
  compromiso_actual: NivelCompromiso | null;
  /** D: dónde necesita estar. */
  compromiso_deseado: NivelCompromiso | null;
}

/** R5. Una respuesta del buzón 1 (escucha inicial). Anónima: solo se guarda el área. */
export interface RespuestaBuzon1 {
  id: string;
  fecha: string;
  area: string;
  /** ¿Qué es lo que más falla hoy en este proceso? */
  falla: string;
  /** ¿Qué te preocupa del cambio? */
  preocupa: string;
  /** Si tú decidieras, ¿qué harías? */
  harias: string;
}

/** U1. Opciones de la encuesta de liderazgo. */
export type LetraLiderazgo = 'A' | 'B' | 'C' | 'D';

/** U1. Una encuesta de liderazgo respondida por un líder o referente. */
export interface FilaLiderazgo {
  id: string;
  /** Código del líder (por ejemplo L1), nunca su nombre. */
  lider_id: string;
  conteo_A: number;
  conteo_B: number;
  conteo_C: number;
  conteo_D: number;
}
