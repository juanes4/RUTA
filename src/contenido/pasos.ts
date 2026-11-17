/**
 * Texto de las fichas de paso. Fuente: tabla "Flujo de la etapa" del
 * documento maestro (R1–R5) y CONTEXTO §3 y §4. No se agrega texto propio.
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
    conQuien: 'Patrocinador, líder y 2 o 3 jefes',
    tiempo: '60 min',
    formato: 'Lienzo del cambio',
    detalle:
      'Una página en papelógrafo: urgencia (3 motivos con datos), afectados, visión en una frase, qué cambia y qué no, beneficios por grupo, criterios de éxito con números, riesgos e intentos previos fallidos. Define las metas de los indicadores.',
  },
  R2: {
    queSeHace: 'Analizar fortalezas, oportunidades, debilidades y amenazas del cambio',
    conQuien: 'Equipo de cambio y jefes',
    tiempo: '60 min',
    formato: 'FODA del cambio',
    detalle:
      'Analiza solo el cambio. Cada ítem es un hecho observable con evidencia, puntaje 1–5 (en F y O: 5 = muy presente; en D y A: 5 = muy grave), votación con 3 puntos por persona; los 5 más votados pasan al backlog de la etapa 2. Se repite el día 90.',
  },
  R3: {
    queSeHace: 'Mapear actores y resistencias',
    conQuien: 'Equipo de cambio',
    tiempo: '60 min',
    formato: 'Mapa de actores',
    detalle:
      'Por actor o grupo: nº de personas, qué le cambia, influencia (baja/media/alta), postura (se opone/neutral/apoya), interés como historia de usuario, motivo de resistencia, estrategia (educar, hacer partícipe, apoyar, negociar), acción con responsable y fecha. Cuadrante influencia × postura.',
  },
  R4: {
    queSeHace: 'Identificar quién comunica el cambio',
    conQuien: 'Líderes de la organización',
    tiempo: '1 semana',
    formato: 'Encuesta de liderazgo',
    detalle:
      'Encuesta de 8 preguntas (opciones a–d) a líderes y referentes. A: directivo y estructurado. B: participativo y colaborativo. C: transformacional e inspirador, vocero ideal. D: delegativo y autónomo, requiere acompañamiento y guion.',
  },
  R5: {
    queSeHace: 'Informar a los colaboradores',
    conQuien: 'Dirección y jefes',
    tiempo: '1 semana',
    formato: 'Ficha del cambio y narrativa',
    detalle:
      'Máximo 2 páginas, impresa y oral. Narrativa en 3 partes: de dónde venimos (por qué, por qué ahora, qué pasa si no) → hacia dónde vamos (visión, qué gano yo) → cómo será el camino (qué cambia, qué no, cronograma, a quién preguntar, cómo opinar).',
  },
  R6: {
    queSeHace: 'Escuchar cómo tomaron el cambio',
    formato: 'Buzón 1 y mapa de empatía',
    detalle:
      'Encuesta anónima. El punto de bloqueo de un grupo es la primera dimensión ADKAR con puntaje menor a 3,0: ahí se interviene primero. El mapa de empatía organiza las respuestas abiertas en: oye, ve, piensa y siente, dice y hace, dolores, necesidades.',
  },
  R7: {
    queSeHace: 'Decidir si se lanza, se ajusta o se pospone',
    formato: 'Registro de decisión',
    detalle:
      'Combina los puntos de bloqueo del buzón 1 con el chequeo Kotter parte A. La decisión se registra con fecha, responsable y los tres riesgos principales.',
  },
  U1: {
    queSeHace: 'Comunicar según el punto de bloqueo de cada grupo',
    detalle:
      'Lo personal lo dice el jefe directo; dudas respondidas en 2 días hábiles o menos (muro de dudas); preguntas frecuentes semanales.',
  },
  U2: {
    queSeHace: 'Formar la red de agentes de cambio',
    detalle: '1 agente por cada 15 a 20 personas; 1 a 2 horas por semana; resuelven dudas, observan y reportan barreras.',
  },
  U3: {
    queSeHace: 'Capacitar a los grupos que ya superaron Conciencia y Deseo',
    detalle:
      'Al menos 70 % práctica, dentro de la jornada; evidencia de competencia (prueba práctica); apoyo escalonado (segunda práctica → tutor → ajustar herramientas); seguimiento a 15 días. Regla de protección: no hay decisiones laborales sin agotar el apoyo escalonado.',
  },
  U4: {
    queSeHace: 'Tomar el pulso de la adaptación',
    formato: 'Buzón 2',
    detalle: 'Pulso corto cada ciclo; pulso completo los días 30, 60 y 90.',
  },
  U5: {
    queSeHace: 'Medir si el cambio está funcionando',
    formato: 'Indicadores y tablero',
    detalle:
      'Cada indicador muestra valor, meta y semáforo. Regla de lectura cruzada: si el uso sube pero la preparación no, hay cumplimiento sin convicción y riesgo de abandono; si la preparación sube pero el uso no, el problema está en Habilidad o Refuerzo.',
  },
};

/**
 * Descripción de cada etapa. Etapa 0: definición del equipo. R y U: objetivo
 * y duración del documento maestro ("Mapa de las etapas" y "Etapa 1").
 */
export const DESCRIPCION_ETAPA: Readonly<Record<string, string>> = {
  'etapa-0': 'Registro de los datos de la empresa: el cambio, los grupos, los afectados y las metas.',
  'etapa-r':
    'Dejar claro por qué se cambia, saber quién apoya y quién se resiste, medir desde dónde parte cada grupo y decidir con datos si se lanza, se ajusta o se pospone. De 2 a 3 semanas antes del lanzamiento.',
  'etapa-u':
    'Desde el lanzamiento hasta el día 90, en ciclos de 2 semanas. Salida: el cambio en uso, medido y ajustado cada ciclo.',
  'etapa-t': 'Acompañamiento de equipos: ¿cómo lo construimos con quienes lo van a vivir?',
};

/** Acciones de U1 según el punto de bloqueo (CONTEXTO §4). */
export const ACCIONES_POR_BLOQUEO: Readonly<Record<'C' | 'D' | 'K' | 'H' | 'R', string>> = {
  C: 'Patrocinador explica el porqué con datos; guion para jefes; corregir rumores.',
  D: 'Escuchar antes de convencer; responder la preocupación principal; qué gana cada puesto; involucrar en el piloto.',
  K: 'Capacitación en el formato preferido; guías de 1 página; videos; punto de contacto.',
  H: 'Tiempo protegido para practicar; acompañamiento en el puesto; resolver equipos y accesos.',
  R: 'Reconocimiento; ajustar metas; retirar la forma antigua; seguimiento mensual.',
};

export interface PasoRecorrido {
  verbo: string;
  pregunta: string;
  herramienta: string;
  /** Etapa a la que pertenece el paso; null si su etapa aún no está definida. */
  etapaId: string | null;
}

/** Recorrido en 10 pasos (CONTEXTO §2). */
export const RECORRIDO: readonly PasoRecorrido[] = [
  { verbo: 'Entender', pregunta: '¿Qué cambiamos y por qué?', herramienta: 'Lienzo del cambio (R1)', etapaId: 'etapa-r' },
  { verbo: 'Entender', pregunta: '¿Qué hay a favor y en contra?', herramienta: 'FODA del cambio (R2)', etapaId: 'etapa-r' },
  { verbo: 'Entender', pregunta: '¿Quién apoya y quién se resiste?', herramienta: 'Mapa de actores (R3)', etapaId: 'etapa-r' },
  { verbo: 'Comunicar', pregunta: '¿Quién da la noticia?', herramienta: 'Encuesta de liderazgo (R4)', etapaId: 'etapa-r' },
  { verbo: 'Comunicar', pregunta: '¿Qué decimos y cómo?', herramienta: 'Ficha del cambio y narrativa (R5)', etapaId: 'etapa-r' },
  { verbo: 'Escuchar', pregunta: '¿Cómo lo tomaron?', herramienta: 'Buzón 1 y mapa de empatía (R6)', etapaId: 'etapa-r' },
  { verbo: 'Decidir', pregunta: '¿Lanzamos ya?', herramienta: 'Registro de decisión (R7)', etapaId: 'etapa-r' },
  { verbo: 'Acompañar', pregunta: '¿Cómo los apoyamos?', herramienta: 'Ciclos de 2 semanas (U1 a U4)', etapaId: 'etapa-u' },
  { verbo: 'Acompañar', pregunta: '¿Está funcionando?', herramienta: 'Indicadores y tablero (U5)', etapaId: 'etapa-u' },
  { verbo: 'Comprobar', pregunta: '¿Ya se adoptó?', herramienta: 'Medición a 30, 60 y 90 días (por definir)', etapaId: null },
];
