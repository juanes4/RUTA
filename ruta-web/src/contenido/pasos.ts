/**
 * Texto de las fichas de paso. Fuente: RUTA_ANDI_R_U.md (tablas "Flujo de
 * la etapa" y la explicación de cada paso). No se agrega texto propio.
 */

export interface FichaPaso {
  queSeHace: string;
  conQuien?: string;
  tiempo?: string;
  formato?: string;
  detalle: string;
}

export const FICHAS: Readonly<Record<string, FichaPaso>> = {
  R1: {
    queSeHace: 'Definir el cambio en una página',
    formato: 'Lienzo del cambio (interno)',
    detalle:
      'En un ejercicio visual con post-it se responden las 7 preguntas guía de sus bloques: urgencia, afectados, visión, qué cambia y qué no, beneficios, criterios de éxito y riesgos. Sus respuestas son los insumos técnicos para la ficha del cambio y el plan de la etapa 2.',
  },
  R2: {
    queSeHace: 'Evaluar cualquier iniciativa de cambio que ingrese a la organización',
    formato: 'Triaje del cambio',
    detalle:
      'Determina el nivel de complejidad e impacto humano y técnico del cambio, para saber cómo será su gestión y qué requiere antes de invertir tiempo y recursos en un despliegue completo. El equipo de gestión del cambio puntúa de 1 a 3 el impacto en las personas, la complejidad organizacional y el riesgo operativo.',
  },
  R3: {
    queSeHace: 'Analizar fortalezas, oportunidades, debilidades y amenazas del cambio',
    formato: 'FODA del cambio',
    detalle:
      'Un FODA híbrido, cualitativo y cuantitativo, tomando como referencia el FODA matemático: la empresa identifica sus fortalezas, oportunidades, debilidades y amenazas, y la aplicación les da seguimiento con un sistema de puntaje.',
  },
  R4: {
    queSeHace: 'Mapear actores y resistencias',
    formato: 'Mapa de actores',
    detalle:
      'Identifica, categoriza y visualiza a las personas, grupos u organizaciones que influyen o se ven afectados por el cambio, y los clasifica según su poder e interés para anticipar riesgos, construir alianzas clave y diseñar estrategias de comunicación.',
  },
  R5: {
    queSeHace: 'Escuchar a los colaboradores',
    formato: 'Buzón 1 y mapa de empatía',
    detalle:
      'Un buzón corto y sencillo, con preguntas abiertas, para dar participación a todos los integrantes de la organización. No sirve para informar el cambio: esta es una fase de diagnóstico y reconocimiento.',
  },
  U1: {
    queSeHace: 'Identificar quién comunica el cambio',
    formato: 'Encuesta de liderazgo',
    detalle:
      'Identifica si los líderes cuentan con las capacidades para orientar, acompañar y motivar a las personas durante el proceso y para comunicar adecuadamente el cambio. La responden quienes ocupan cargos de liderazgo o son referentes para sus equipos.',
  },
  U2: {
    queSeHace: 'Informar a los colaboradores',
    formato: 'Ficha del cambio y narrativa',
    detalle:
      'Con la persona más adecuada para transmitir el mensaje ya identificada, se estructura un guion comunicacional para que los colaboradores comprendan las razones y los objetivos de la transformación.',
  },
  U3: {
    queSeHace: 'Alinear y preparar a los jefes para guiar y resolver dudas de sus equipos',
    formato: 'Soporte de líderes',
    detalle:
      'Tras el anuncio oficial, los líderes inmediatos se convierten en el principal punto de referencia y confianza. Este formato les da mensajes clave, respuestas a preguntas frecuentes y pautas de conversación para gestionar inquietudes, mitigar resistencias y llevar el cambio al día a día.',
  },
  U4: {
    queSeHace: 'Comprender las emociones, miedos y expectativas de los colaboradores frente al cambio',
    formato: 'Mapa de empatía',
    detalle:
      'Después de comunicar el cambio por medio del vocero, el mapa de empatía muestra cómo interpretan la información los colaboradores, qué temores, inquietudes o expectativas surgieron y cuáles son sus necesidades. De ahí salen las estrategias de acompañamiento.',
  },
};

/** Descripción de cada etapa: la pregunta que responde (RUTA_ANDI_R_U.md). */
export const DESCRIPCION_ETAPA: Readonly<Record<string, string>> = {
  'etapa-0': 'Registro de los datos de la empresa: el cambio, las áreas y las personas afectadas.',
  'etapa-r': '¿Qué cambio es, a quién afecta y qué ruta necesita?',
  'etapa-u': '¿Quién lo lidera y por qué la gente lo va a apoyar?',
  'etapa-t':
    'Acompañamiento de equipos con los cuatro niveles de Kirkpatrick: cómo reaccionan, qué aprenden, qué hacen distinto y qué resultados se logran.',  'etapa-a':
    'Sostenibilidad y evaluación continua: auditorías periódicas de adopción en el tablero del equipo y mapa de viaje del colaborador.',
};

export interface PasoRecorrido {
  verbo: string;
  pregunta: string;
  herramienta: string;
  /** Etapa a la que pertenece el paso; null si su etapa aún no está definida. */
  etapaId: string | null;
}

/** Recorrido en 11 pasos: los pasos de R y U, Transformar y Analizar. */
export const RECORRIDO: readonly PasoRecorrido[] = [
  { verbo: 'Entender', pregunta: '¿Qué cambiamos y por qué?', herramienta: 'Lienzo del cambio (R1)', etapaId: 'etapa-r' },
  { verbo: 'Entender', pregunta: '¿Qué tan grande es el cambio?', herramienta: 'Triaje del cambio (R2)', etapaId: 'etapa-r' },
  { verbo: 'Entender', pregunta: '¿Qué hay a favor y en contra?', herramienta: 'FODA del cambio (R3)', etapaId: 'etapa-r' },
  { verbo: 'Entender', pregunta: '¿Quién apoya y quién se resiste?', herramienta: 'Mapa de actores (R4)', etapaId: 'etapa-r' },
  { verbo: 'Escuchar', pregunta: '¿Qué dicen los colaboradores?', herramienta: 'Buzón 1 (R5)', etapaId: 'etapa-r' },
  { verbo: 'Comunicar', pregunta: '¿Quién da la noticia?', herramienta: 'Encuesta de liderazgo (U1)', etapaId: 'etapa-u' },
  { verbo: 'Comunicar', pregunta: '¿Qué decimos y cómo?', herramienta: 'Ficha del cambio y narrativa (U2)', etapaId: 'etapa-u' },
  { verbo: 'Acompañar', pregunta: '¿Cómo preparamos a los jefes?', herramienta: 'Soporte para líderes (U3)', etapaId: 'etapa-u' },
  { verbo: 'Acompañar', pregunta: '¿Cómo lo tomaron?', herramienta: 'Mapa de empatía (U4)', etapaId: 'etapa-u' },
  { verbo: 'Transformar', pregunta: '¿Cómo lo construimos con los equipos?', herramienta: 'Comunicación, capacitación, acompañamiento y victorias (T1 a T4)', etapaId: 'etapa-t' },
  { verbo: 'Comprobar', pregunta: '¿Cómo hacemos que se quede?', herramienta: 'Tablero del equipo y mapa de viaje (A1 y A2)', etapaId: 'etapa-a' },
];
