/** Textos de los formularios de la etapa Unir (RUTA_ANDI_R_U.md). */

/** Qué se registra en cada paso, bajo el título. */
export const DESCRIPCION_PASO_U: Readonly<Record<string, string>> = {
  U1: 'La encuesta se responde en papel o en línea. Aquí se digita cada respuesta y la herramienta clasifica el estilo de cada líder.',
  U2: 'Escribe el guion en sus 3 partes y elige al vocero. Puedes partir de lo que registraste en el lienzo del cambio (R1).',
  U3: 'Reúne lo que los jefes necesitan para acompañar a su equipo (mensajes clave, preguntas frecuentes y pautas) y usa el Coach de Comunicación para preparar o ensayar conversaciones.',
  U4: 'Después de comunicar el cambio, registra lo que encontraron en la sesión del mapa de empatía y las estrategias de acompañamiento que salen de ahí.',
};

export const EXPLICACION_LIDERAZGO = {
  lider_id: 'Un código que identifique al líder, por ejemplo L1. Usa siempre el mismo código para sus encuestas; no escribas el nombre.',
} as const;

export const EXPLICACION_NARRATIVA = {
  vocero:
    'Quién da el mensaje. Se sugieren primero los líderes de estilo transformacional e inspirador (C) y luego los participativos (B), según la encuesta de liderazgo (U1).',
} as const;

export const EXPLICACION_SOPORTE = {
  mensajes: 'Las ideas que todos los jefes deben repetir igual. Agrega una por una.',
  pregunta: 'Una duda que los colaboradores probablemente van a hacer.',
  respuesta: 'La respuesta acordada, honesta y en palabras sencillas.',
  pautas: 'Cómo conducir la conversación con el equipo: qué hacer y qué evitar.',
} as const;

export const EXPLICACION_EMPATIA = {
  cuadrante: 'Lo que encontraron en la sesión. Los ejemplos del documento sirven como guía.',
  estrategias: 'Acciones de acompañamiento que responden a lo que encontraron, para las siguientes fases.',
} as const;
