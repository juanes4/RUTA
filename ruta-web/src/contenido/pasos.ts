/**
 * Texto de las fichas de paso. Fuente: tabla "Flujo de la etapa" del
 * documento maestro (R1–R5 y U1–U4). No se agrega texto propio.
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
    queSeHace: 'Evaluar el impacto y la complejidad de la iniciativa para asignarle una ruta',
    conQuien: 'Equipo de gestión del cambio',
    formato: 'Matriz de triaje (escala de 1 a 3)',
    detalle:
      'Registra por qué cambiar ahora, a quién afecta y qué dimensiones técnicas toca. Puntúa el impacto en las personas, la complejidad organizacional y el riesgo operativo. El total caracteriza el cambio como ágil o estándar (3–4), moderado (5–7) o mayor (8–9).',
  },
  R3: {
    queSeHace: 'Analizar fortalezas, oportunidades, debilidades y amenazas del cambio',
    conQuien: 'Equipo de cambio y jefes',
    tiempo: '60 min',
    formato: 'FODA del cambio',
    detalle:
      'Usa las preguntas orientadoras para identificar factores internos y externos. Registra cada ítem con evidencia, puntaje y votos para combinar el análisis cualitativo con el seguimiento cuantitativo.',
  },
  R4: {
    queSeHace: 'Identificar actores, necesidades, poder, interés y brechas de compromiso',
    conQuien: 'Alta dirección, jefes y equipo de cambio',
    formato: 'Mapa de actores y mapa de compromiso',
    detalle:
      'Registra qué representa y necesita cada grupo; clasifica su poder y su interés como altos o bajos. Compara su posición actual con la deseada en la escala desde “desconoce” hasta “lidera” para anticipar las acciones de acompañamiento.',
  },
  R5: {
    queSeHace: 'Escuchar a los colaboradores antes de anunciar o desplegar un cambio',
    conQuien: 'Colaboradores de las áreas involucradas',
    formato: 'Buzón de escucha inicial',
    detalle:
      'Una consulta breve y anónima para reconocer qué falla hoy, qué inquietudes existen frente a posibles cambios y qué mejoras proponen las personas. No presupone que ya haya un cambio anunciado.',
  },
  U1: {
    queSeHace: 'Identificar quién comunica el cambio',
    conQuien: 'Líderes y referentes de los equipos',
    formato: 'Encuesta de liderazgo',
    detalle:
      'Aplica las 8 preguntas a líderes o referentes, en autoevaluación y desde la mirada de su equipo. Cuenta las respuestas A, B, C y D para identificar el estilo, su viabilidad como vocero y el acompañamiento que requiere.',
  },
  U2: {
    queSeHace: 'Definir la forma y la estrategia para comunicar el cambio',
    formato: 'Ficha del cambio y narrativa',
    detalle:
      'Organiza el mensaje en tres partes: de dónde venimos y por qué ya no basta; hacia dónde vamos y qué beneficios trae; cómo será el camino, qué cambia, qué se mantiene y cómo se acompañará a las personas.',
  },
  U3: {
    queSeHace: 'Preparar a los jefes para guiar y resolver dudas de sus equipos',
    conQuien: 'Mandos medios y jefes de área',
    formato: 'Soporte para líderes',
    detalle:
      'Entrega una guía práctica con mensajes clave, respuestas a preguntas frecuentes y pautas de conversación para gestionar inquietudes y traducir el cambio al día a día de cada equipo.',
  },
  U4: {
    queSeHace: 'Comprender las emociones, miedos y expectativas después de comunicar el cambio',
    formato: 'Mapa de empatía',
    detalle:
      'Registra por grupo qué oye, qué ve, qué piensa y siente, qué dice y hace, sus dolores y frustraciones, y sus necesidades y ganancias. Usa el diagnóstico para definir el acompañamiento.',
  },
};

/**
 * Descripción de cada etapa. Etapa 0: definición del equipo. R y U: objetivo
 * y duración del documento maestro ("Mapa de las etapas" y "Etapa 1").
 */
export const DESCRIPCION_ETAPA: Readonly<Record<string, string>> = {
  'etapa-0': 'Registro de los datos de la empresa: el cambio, los grupos, los afectados y las metas.',
  'etapa-r':
    'Reconocer qué iniciativa necesita la organización, a quién afecta y qué ruta requiere. Incluye el diagnóstico del cambio, el análisis FODA, el mapa de actores y la escucha inicial antes de cualquier despliegue.',
  'etapa-u':
    'Alinear la comunicación del cambio: elegir quién lo comunica, preparar la narrativa, apoyar a los líderes y comprender cómo reciben el mensaje los colaboradores.',
  'etapa-t':
    'Acompañamiento de equipos con los cuatro niveles de Kirkpatrick: cómo reaccionan, qué aprenden, qué hacen distinto y qué resultados se logran.',
};

export interface PasoRecorrido {
  verbo: string;
  pregunta: string;
  herramienta: string;
  /** Etapa a la que pertenece el paso; null si su etapa aún no está definida. */
  etapaId: string | null;
}

/** Recorrido visible en Inicio, actualizado con el flujo vigente de las etapas. */
export const RECORRIDO: readonly PasoRecorrido[] = [
  { verbo: 'Entender', pregunta: '¿Qué cambiamos y por qué?', herramienta: 'Lienzo del cambio (R1)', etapaId: 'etapa-r' },
  { verbo: 'Entender', pregunta: '¿Qué ruta necesita la iniciativa?', herramienta: 'Triaje del cambio (R2)', etapaId: 'etapa-r' },
  { verbo: 'Entender', pregunta: '¿Qué factores pueden favorecer o dificultar el cambio?', herramienta: 'FODA del cambio (R3)', etapaId: 'etapa-r' },
  { verbo: 'Entender', pregunta: '¿A quién afecta y qué necesita cada grupo?', herramienta: 'Mapa de actores (R4)', etapaId: 'etapa-r' },
  { verbo: 'Escuchar', pregunta: '¿Qué falla hoy y qué proponen las personas?', herramienta: 'Escucha inicial (R5)', etapaId: 'etapa-r' },
  { verbo: 'Comunicar', pregunta: '¿Quién comunica el cambio?', herramienta: 'Encuesta de liderazgo (U1)', etapaId: 'etapa-u' },
  { verbo: 'Comunicar', pregunta: '¿Qué decimos y cómo?', herramienta: 'Ficha y narrativa (U2)', etapaId: 'etapa-u' },
  { verbo: 'Acompañar', pregunta: '¿Cómo guían los líderes a sus equipos?', herramienta: 'Soporte para líderes (U3)', etapaId: 'etapa-u' },
  { verbo: 'Comprender', pregunta: '¿Cómo recibieron el mensaje?', herramienta: 'Mapa de empatía (U4)', etapaId: 'etapa-u' },
  { verbo: 'Comprobar', pregunta: '¿Ya se adoptó?', herramienta: 'Medición a 30, 60 y 90 días (por definir)', etapaId: null },
];
