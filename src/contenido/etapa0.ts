/**
 * Textos de la Etapa 0: qué es cada paso y qué es cada campo.
 * Salen de PLAN.md §4 y de CONTEXTO (§3, §5 y §6). Sin datos de ningún caso.
 */

/** Explicación breve bajo el título de cada paso 0.N. */
export const DESCRIPCION_PASO_ETAPA0: Readonly<Record<string, string>> = {
  '0.1':
    'Los datos básicos de la empresa y del cambio que se va a implementar. No se registran datos personales (Ley 1581 de 2012).',
  '0.2':
    'Las áreas a las que el cambio les modifica el trabajo diario y cuántas personas hay en cada una. Con estos números se calcula la participación (respuestas ÷ afectados) y se agrupan los resultados de los buzones.',
  '0.3':
    'El valor que debe alcanzar cada indicador. Vienen con las metas iniciales de la metodología y la empresa puede ajustarlas. El semáforo del tablero compara cada indicador con su meta.',
  '0.4':
    'Qué se cuenta para saber si la gente ya usa lo nuevo y cada cuánto se mide. Con esto se calculan la utilización y el uso de lo viejo en cada ciclo de la etapa Unir.',
};

/** Explicación de cada campo, en el tooltip. */
export const EXPLICACION_CAMPO = {
  nombre: 'Nombre de la empresa o de la unidad que hace el cambio. Sirve para distinguirla si registras varias empresas.',
  sector: 'Actividad principal de la empresa, por ejemplo manufactura, logística o servicios. Es solo de referencia.',
  total_colaboradores:
    'Todas las personas que trabajan en la empresa, estén o no afectadas por el cambio. Es de referencia: la participación se calcula con los afectados del paso 0.2.',
  fecha_lanzamiento:
    'Día previsto para lanzar el cambio. En R7 se decide si se lanza, se lanza con ajustes o se posterga.',
  que_cambia: 'El cambio en una frase: qué se va a hacer distinto en el trabajo diario. Se detalla en el lienzo del cambio (R1).',
  area: 'Nombre del área o grupo de trabajo. Los resultados de los buzones se muestran por área y solo si el área tiene al menos 5 respuestas.',
  afectados:
    'Personas del área a las que el cambio les modifica el trabajo diario. Es el total contra el que se calcula la participación del área.',
  turnos:
    'Turnos o sedes en que se divide el trabajo. Las respuestas se separan por área y turno solo si cada combinación tiene al menos 5 respuestas.',
  rangos_antiguedad:
    'Rangos de tiempo en la empresa, por ejemplo "menos de 1 año". Los buzones preguntan el rango, nunca la fecha exacta, para proteger el anonimato.',
  meta: 'Valor que debe alcanzar el indicador. Los porcentajes se escriben de 0 a 100; los puntajes, de 1 a 5.',
  sentido:
    'Mayor es mejor: el indicador debe llegar a la meta o superarla. Menor es mejor: debe quedarse en la meta o por debajo, como el uso de lo viejo.',
  del_documento: 'Meta inicial que propone la metodología. Si la cambias, aparece "Ajustada".',
  unidad:
    'Lo que se cuenta en cada ciclo: transacciones, casos, cargos o equipos. Debe poder contarse en el sistema o en los registros de la empresa.',
  dias_por_ciclo: 'Duración de cada ciclo de acompañamiento de la etapa Unir. La metodología usa ciclos de 2 semanas (14 días).',
} as const;
