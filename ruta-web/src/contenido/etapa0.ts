/** Textos de la Etapa 0: qué es cada paso y qué es cada campo. Sin datos de ningún caso. */

/** Explicación breve bajo el título de cada paso 0.N. */
export const DESCRIPCION_PASO_ETAPA0: Readonly<Record<string, string>> = {
  '0.1':
    'Los datos básicos de la empresa y del cambio que se va a implementar. No se registran datos personales (Ley 1581 de 2012).',
  '0.2':
    'Las áreas a las que el cambio les modifica el trabajo diario y cuántas personas hay en cada una. Con estos números se calcula la participación del buzón 1 (respuestas ÷ afectados).',
};

/** Explicación de cada campo, en el tooltip. */
export const EXPLICACION_CAMPO = {
  nombre: 'Nombre de la empresa o de la unidad que hace el cambio. Sirve para distinguirla si registras varias empresas.',
  sector: 'Actividad principal de la empresa, por ejemplo manufactura, logística o servicios. Es solo de referencia.',
  total_colaboradores:
    'Todas las personas que trabajan en la empresa, estén o no afectadas por el cambio. Es de referencia: la participación se calcula con los afectados del paso 0.2.',
  fecha_lanzamiento: 'Día previsto para comunicar oficialmente el cambio a los colaboradores.',
  que_cambia: 'El cambio en una frase: qué se va a hacer distinto en el trabajo diario. Se detalla en el lienzo del cambio (R1).',
  area: 'Nombre del área o grupo de trabajo. Cada respuesta del buzón 1 pertenece a un área.',
  afectados:
    'Personas del área a las que el cambio les modifica el trabajo diario. Es el total contra el que se calcula la participación del área.',
} as const;
