import type { LetraLiderazgo } from '../../lib/modelo/tipos';

/**
 * U1. Encuesta de liderazgo (RUTA_ANDI_R_U.md). La responden las personas
 * con cargos de liderazgo o reconocidas como referentes por sus equipos.
 */

export const LETRAS_LIDERAZGO: readonly LetraLiderazgo[] = ['A', 'B', 'C', 'D'];

export interface PreguntaLiderazgo {
  id: string;
  enunciado: string;
  opciones: Record<LetraLiderazgo, string>;
}

export const PREGUNTAS_LIDERAZGO: readonly PreguntaLiderazgo[] = [
  {
    id: 'l1',
    enunciado: 'Cuando debo tomar una decisión importante…',
    opciones: {
      A: 'Decido yo y comunico qué hacer.',
      B: 'Consulto al equipo antes de decidir.',
      C: 'Explico la visión y busco inspirar una solución.',
      D: 'Delego la decisión si alguien puede asumirla.',
    },
  },
  {
    id: 'l2',
    enunciado: 'Cuando un colaborador, trabajador u operario comete un error…',
    opciones: {
      A: 'Corrijo de inmediato y doy instrucciones concretas.',
      B: 'Escucho su explicación y buscamos una forma de solucionarlo.',
      C: 'Lo uso como oportunidad de aprendizaje y mejora.',
      D: 'Le pido que lo resuelva él solo por su cuenta.',
    },
  },
  {
    id: 'l3',
    enunciado: 'Cuando asigno responsabilidades…',
    opciones: {
      A: 'Defino tareas y superviso el cumplimiento.',
      B: 'Acordamos responsabilidades y escucho propuestas.',
      C: 'Relaciono las tareas con objetivos y propósitos.',
      D: 'Doy autonomía y reviso principalmente el resultado.',
    },
  },
  {
    id: 'l4',
    enunciado: 'Lo que más me importa en mi equipo es…',
    opciones: {
      A: 'La disciplina, el orden y el cumplimiento.',
      B: 'La participación y el trabajo conjunto.',
      C: 'La innovación, la motivación y el crecimiento.',
      D: 'La autonomía y la responsabilidad individual.',
    },
  },
  {
    id: 'l5',
    enunciado: 'Cuando hay presión o una crisis…',
    opciones: {
      A: 'Centralizo decisiones y doy instrucciones directas.',
      B: 'Busco opiniones, pero procuro decidir en conjunto.',
      C: 'Comunico el rumbo y movilizo al equipo.',
      D: 'Distribuyo autoridad para resolver con rapidez.',
    },
  },
  {
    id: 'l6',
    enunciado: 'Cuando un colaborador tiene bajo desempeño…',
    opciones: {
      A: 'Aumento la supervisión y establezco exigencias claras.',
      B: 'Converso con él y acordamos un plan de mejora.',
      C: 'Trabajo en su motivación y desarrollo.',
      D: 'Le doy responsabilidad para que plantee una solución.',
    },
  },
  {
    id: 'l7',
    enunciado: 'Mi equipo probablemente diría que yo…',
    opciones: {
      A: 'Soy exigente, claro y directo.',
      B: 'Soy abierto al diálogo y colaborativo.',
      C: 'Soy motivador y promuevo cambios.',
      D: 'Confío en las personas y doy libertad.',
    },
  },
  {
    id: 'l8',
    enunciado: 'Cuando quiero mejorar los resultados de la empresa…',
    opciones: {
      A: 'Establezco controles, metas y procedimientos.',
      B: 'Involucro al equipo en la búsqueda de mejoras.',
      C: 'Transmito una visión ambiciosa y promuevo nuevas ideas.',
      D: 'Entrego responsabilidades y dejo que surjan iniciativas.',
    },
  },
];

export interface EstiloLiderazgo {
  nombre: string;
  viabilidad: string;
  rol: string;
}

/** Metodología de clasificación: la letra con mayoría define el estilo. */
export const ESTILOS_LIDERAZGO: Readonly<Record<LetraLiderazgo, EstiloLiderazgo>> = {
  A: {
    nombre: 'Directo y estructurado',
    viabilidad: 'Media',
    rol: 'Aporta orden y exigencia clara, pero se aconseja emparejarlo con un líder informal o "campeón del cambio" para evitar que el mensaje se perciba como una imposición estricta.',
  },
  B: {
    nombre: 'Participativo y colaborativo',
    viabilidad: 'Alta (además de comunicar, escucha a los trabajadores)',
    rol: 'Dirige las sesiones del mapa de empatía, recoge dudas de los trabajadores y genera acuerdos.',
  },
  C: {
    nombre: 'Transformacional e inspirador',
    viabilidad: 'Alta (es la persona ideal para ser el vocero o informante del nuevo cambio)',
    rol: 'Transmite el propósito, moviliza con entusiasmo y conecta el cambio con la visión futura.',
  },
  D: {
    nombre: 'Delegativo y autónomo',
    viabilidad: 'Acompañamiento necesario',
    rol: 'Adecuado para respaldar la iniciativa con equipos maduros, pero requiere un guion de comunicación estructurado para no dejar vacíos de información en la fase inicial.',
  },
};
