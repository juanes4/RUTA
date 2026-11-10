import type { LetraLiderazgo, RespondenteLiderazgo } from '../../lib/modelo/tipos';

/**
 * Encuesta de liderazgo (CONTEXTO §5, texto corregido). La opción 3d está
 * pendiente de confirmar con administrativa. La versión para el equipo es
 * [PROPUESTA]: mismos enunciados del contexto, opciones en tercera persona.
 */

export const LETRAS_LIDERAZGO: readonly LetraLiderazgo[] = ['A', 'B', 'C', 'D'];

export interface PreguntaLiderazgo {
  id: string;
  enunciado: Record<RespondenteLiderazgo, string>;
  opciones: Record<LetraLiderazgo, Record<RespondenteLiderazgo, string>>;
}

const op = (auto: string, equipo: string): Record<RespondenteLiderazgo, string> => ({ auto, equipo });

export const PREGUNTAS_LIDERAZGO: readonly PreguntaLiderazgo[] = [
  {
    id: 'l1',
    enunciado: { auto: 'Cuando debo tomar una decisión importante…', equipo: 'Cuando mi jefe debe tomar una decisión importante…' },
    opciones: {
      A: op('Decido yo y comunico qué hacer.', 'Decide él y comunica qué hacer.'),
      B: op('Consulto al equipo antes de decidir.', 'Consulta al equipo antes de decidir.'),
      C: op('Explico la visión y busco inspirar una solución.', 'Explica la visión y busca inspirar una solución.'),
      D: op('Delego la decisión si alguien puede asumirla.', 'Delega la decisión si alguien puede asumirla.'),
    },
  },
  {
    id: 'l2',
    enunciado: { auto: 'Cuando un colaborador, trabajador u operario comete un error…', equipo: 'Cuando un colaborador comete un error, mi jefe…' },
    opciones: {
      A: op('Corrijo de inmediato y doy instrucciones concretas.', 'Corrige de inmediato y da instrucciones concretas.'),
      B: op('Escucho su explicación y buscamos una forma de solucionarlo.', 'Escucha su explicación y buscan una forma de solucionarlo.'),
      C: op('Lo uso como oportunidad de aprendizaje y mejora.', 'Lo usa como oportunidad de aprendizaje y mejora.'),
      D: op('Le pido que lo resuelva por su cuenta.', 'Le pide que lo resuelva por su cuenta.'),
    },
  },
  {
    id: 'l3',
    enunciado: { auto: 'Cuando asigno responsabilidades…', equipo: 'Cuando mi jefe asigna responsabilidades…' },
    opciones: {
      A: op('Defino tareas y superviso el cumplimiento.', 'Define tareas y supervisa el cumplimiento.'),
      B: op('Acordamos responsabilidades y escucho propuestas.', 'Acuerdan responsabilidades y escucha propuestas.'),
      C: op('Relaciono las tareas con objetivos y propósitos.', 'Relaciona las tareas con objetivos y propósitos.'),
      D: op('Doy autonomía y reviso principalmente los resultados.', 'Da autonomía y revisa principalmente los resultados.'),
    },
  },
  {
    id: 'l4',
    enunciado: { auto: 'Lo que más me importa en mi equipo es…', equipo: 'Lo que más le importa a mi jefe en el equipo es…' },
    opciones: {
      A: op('La disciplina, el orden y el cumplimiento.', 'La disciplina, el orden y el cumplimiento.'),
      B: op('La participación y el trabajo conjunto.', 'La participación y el trabajo conjunto.'),
      C: op('La innovación, la motivación y el crecimiento.', 'La innovación, la motivación y el crecimiento.'),
      D: op('La autonomía y la responsabilidad individual.', 'La autonomía y la responsabilidad individual.'),
    },
  },
  {
    id: 'l5',
    enunciado: { auto: 'Cuando hay presión o una crisis…', equipo: 'Cuando hay presión o una crisis, mi jefe…' },
    opciones: {
      A: op('Centralizo decisiones y doy instrucciones directas.', 'Centraliza decisiones y da instrucciones directas.'),
      B: op('Busco opiniones y procuro decidir en conjunto.', 'Busca opiniones y procura decidir en conjunto.'),
      C: op('Comunico el rumbo y movilizo al equipo.', 'Comunica el rumbo y moviliza al equipo.'),
      D: op('Distribuyo autoridad para resolver con rapidez.', 'Distribuye autoridad para resolver con rapidez.'),
    },
  },
  {
    id: 'l6',
    enunciado: { auto: 'Cuando un colaborador tiene bajo desempeño…', equipo: 'Cuando un colaborador tiene bajo desempeño, mi jefe…' },
    opciones: {
      A: op('Aumento la supervisión y establezco exigencias claras.', 'Aumenta la supervisión y establece exigencias claras.'),
      B: op('Converso con él y acordamos un plan de mejora.', 'Conversa con él y acuerdan un plan de mejora.'),
      C: op('Trabajo en su motivación y desarrollo.', 'Trabaja en su motivación y desarrollo.'),
      D: op('Le doy responsabilidad para que plantee una solución.', 'Le da responsabilidad para que plantee una solución.'),
    },
  },
  {
    id: 'l7',
    enunciado: { auto: 'Mi equipo probablemente diría que yo…', equipo: 'Yo diría que mi jefe…' },
    opciones: {
      A: op('Soy exigente, claro y directo.', 'Es exigente, claro y directo.'),
      B: op('Soy abierto al diálogo y colaborativo.', 'Es abierto al diálogo y colaborativo.'),
      C: op('Soy motivador y promuevo cambios.', 'Es motivador y promueve cambios.'),
      D: op('Confío en las personas y doy libertad.', 'Confía en las personas y da libertad.'),
    },
  },
  {
    id: 'l8',
    enunciado: { auto: 'Cuando quiero mejorar los resultados de la empresa…', equipo: 'Cuando mi jefe quiere mejorar los resultados…' },
    opciones: {
      A: op('Establezco controles, metas y procedimientos.', 'Establece controles, metas y procedimientos.'),
      B: op('Involucro al equipo en la búsqueda de mejoras.', 'Involucra al equipo en la búsqueda de mejoras.'),
      C: op('Transmito una visión ambiciosa y promuevo nuevas ideas.', 'Transmite una visión ambiciosa y promueve nuevas ideas.'),
      D: op('Entrego responsabilidades y dejo que surjan iniciativas.', 'Entrega responsabilidades y deja que surjan iniciativas.'),
    },
  },
];

/** Qué significa cada estilo para el cambio (CONTEXTO §3, R4). */
export const ESTILOS_LIDERAZGO: Readonly<Record<LetraLiderazgo, { nombre: string; implicacion: string }>> = {
  A: { nombre: 'Directivo y estructurado', implicacion: 'Viabilidad media; emparejar con agente de cambio.' },
  B: { nombre: 'Participativo y colaborativo', implicacion: 'Viabilidad alta; dirige el mapa de empatía.' },
  C: { nombre: 'Transformacional e inspirador', implicacion: 'Viabilidad alta; vocero ideal.' },
  D: { nombre: 'Delegativo y autónomo', implicacion: 'Requiere acompañamiento y guion.' },
};
