/**
 * Textos de los formularios de la etapa Reconocer. Salen de CONTEXTO §3,
 * §5 y §12.5. Regla: la actividad se hace en taller o en papel; aquí solo
 * se registra el resultado para poder medirlo.
 */

/** Qué se registra en cada paso, bajo el título. */
export const DESCRIPCION_PASO_R: Readonly<Record<string, string>> = {
  R1: 'El lienzo se hace en papelógrafo y aquí se registra su resultado. Es interno: lo usa el equipo de cambio, no se muestra a colaboradores y no alimenta el tablero.',
  R2: 'El FODA se hace en sesión. Aquí se registra cada ítem con su evidencia, su puntaje y sus votos.',
  R3: 'El mapa se construye en taller. Aquí se registra cada actor o grupo para medir cuántos tienen una acción definida.',
  R4: 'La encuesta se responde en papel o en línea. Aquí se digita cada respuesta para contar los estilos de liderazgo.',
  R5: 'La ficha y la narrativa son un texto, no generan datos: este paso solo se explica.',
  R6: 'Los colaboradores responden en Google Forms o en papel. El papel se digita aquí y lo de Google Forms se carga como CSV.',
  R7: 'Quienes dirigen el cambio responden el chequeo Kotter parte A. Con eso y el buzón 1, la herramienta recomienda; la decisión la toma una persona y se registra aquí.',
};

export const NOMBRE_BLOQUE_LIENZO = {
  urgencia: 'Urgencia',
  afectados: 'Afectados',
  vision: 'Visión en una frase',
  cambios: 'Qué cambia y qué no',
  beneficios: 'Beneficios por grupo',
  riesgos: 'Riesgos',
  intentos: 'Intentos previos fallidos',
} as const;

export const EXPLICACION_LIENZO = {
  motivo: 'Por qué hay que cambiar ahora.',
  dato: 'El número o hecho que respalda este motivo.',
  afectados: 'Quiénes viven el cambio, por área o cargo. No escribas nombres de colaboradores.',
  vision: 'Cómo será el trabajo cuando el cambio funcione, en una sola frase.',
  que_cambia: 'Lo que será distinto en el trabajo diario.',
  que_no_cambia: 'Lo que se mantiene igual. Decirlo reduce la incertidumbre.',
  grupo: 'Área o cargo que recibe el beneficio.',
  beneficio: 'Qué gana ese grupo con el cambio.',
  riesgos: 'Lo que puede hacer fallar el cambio. Agrega uno por uno.',
  intentos: 'Cambios parecidos que no funcionaron y por qué. Si no hubo, escribe "Ninguno".',
} as const;

export const EXPLICACION_DECISION = {
  decision: 'Lo que decidió la persona responsable. Puede ser distinto de lo que recomienda la herramienta.',
  fecha: 'Día en que se tomó la decisión.',
  responsable: 'Quién toma la decisión, por su cargo. No escribas nombres.',
  riesgo: 'Uno de los tres riesgos principales de lanzar con esta decisión.',
} as const;

export const EXPLICACION_FODA = {
  cuadrante: 'Fortaleza y Debilidad son internas al cambio; Oportunidad y Amenaza vienen de afuera.',
  item: 'Un hecho observable sobre el cambio, no una opinión. Se analiza solo el cambio, no toda la empresa.',
  evidencia: 'El dato o la observación que demuestra el hecho.',
  puntaje: 'De 1 a 5. En Fortaleza y Oportunidad, 5 = muy presente. En Debilidad y Amenaza, 5 = muy grave.',
  votos: 'Total de puntos que recibió el ítem. Cada persona reparte 3 puntos en la sesión.',
} as const;

export const EXPLICACION_ACTORES = {
  actor: 'El actor o grupo, por su cargo o función. No escribas nombres de colaboradores.',
  n_personas: 'Cuántas personas representa este actor o grupo.',
  influencia: 'Cuánto puede favorecer o frenar el cambio.',
  postura: 'Cómo se ubica hoy frente al cambio.',
  motivo: 'Por qué se resiste o qué le preocupa.',
  estrategia: 'Cómo se va a trabajar con este actor.',
  accion: 'Lo que se va a hacer con este actor. Sin acción no cuenta para la cobertura.',
  responsable: 'Quién la lleva a cabo, por su cargo.',
  fecha: 'Fecha acordada para la acción.',
} as const;

export const EXPLICACION_LIDERAZGO = {
  lider_id: 'Un código que identifique al líder, por ejemplo L1. Usa siempre el mismo código para sus encuestas; no escribas el nombre.',
  respondente: 'Autoevaluación: responde el líder. Su equipo: responde una persona que trabaja con el líder ("Mi jefe…").',
} as const;

export const EXPLICACION_BUZON1 = {
  area: 'Área de quien respondió, de las registradas en la Etapa 0. Los resultados se muestran por área.',
  turno: 'Turno o sede de quien respondió.',
  antiguedad: 'Rango de antigüedad de quien respondió. Nunca la fecha exacta.',
  archivo: 'El CSV que descargas de Google Forms o de Google Sheets, o uno con las columnas de la plantilla.',
} as const;

export const EXPLICACION_KOTTER = {
  rol: 'Papel de quien responde en el cambio. Los resultados se comparan por rol.',
} as const;
