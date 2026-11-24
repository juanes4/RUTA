import type { Sentido } from '../lib/analizar/semaforo';

/**
 * Textos y reglas visibles de la etapa A (Analizar).
 * Fuente: sección «Etapa #4: Analizar» del documento de metodología RUTA ANDI 02.
 */

export const INTRO_A =
  '¿Cómo hacemos que se quede? La etapa Analizar consolida la sostenibilidad del cambio mediante auditorías periódicas de adopción en la operación diaria (A1) y la lectura continua de la experiencia punta a punta del colaborador (A2).';

export const DESCRIPCION_PASO_A: Readonly<Record<string, string>> = {
  A1: 'Verificar el nivel real de apropiación de las nuevas prácticas en la operación diaria mediante el tablero del equipo con semáforo.',
  A2: 'Comparar y evaluar la experiencia del colaborador antes, durante, actualmente y hacia dónde mejorar mediante el mapa de viaje.',
};

export interface FilaFlujoA {
  id: 'A1' | 'A2';
  paso: string;
  queSeHace: string;
  formato: string;
}

export const FLUJO_A: readonly FilaFlujoA[] = [
  {
    id: 'A1',
    paso: 'A1 · Auditorías de adopción',
    queSeHace: 'Verificar el nivel real de apropiación de las nuevas prácticas en la operación diaria.',
    formato: 'Tablero del equipo',
  },
  {
    id: 'A2',
    paso: 'A2 · Mapa de viaje del colaborador',
    queSeHace: 'Comparar y evaluar la experiencia del colaborador antes y después del cambio.',
    formato: 'Mapa de viaje del colaborador',
  },
];

/* ---------- A1 · Auditorías de adopción (Tablero del equipo) ---------- */

export type IdIndicadorA =
  | 'autonomia'
  | 'uso_sostenido'
  | 'regreso_anterior'
  | 'traspaso'
  | 'participacion'
  | 'comunicacion'
  | 'apropiacion'
  | 'recaidas';

export type UnidadIndicadorA = 'porcentaje' | 'escala_5';

export interface IndicadorAuditoria {
  id: IdIndicadorA;
  nombre: string;
  formula: string;
  metaTexto: string;
  metaInicial: number;
  unidad: UnidadIndicadorA;
  sentido: Sentido;
  min: number;
  max: number;
  paso: number;
  /** Etiquetas para la calculadora auxiliar (numerador ÷ denominador × 100). */
  calculadora?: {
    numerador: string;
    denominador: string;
  };
}

export const MARGEN_SEMAFORO_A = 0.15;

export const INDICADORES_TABLERO_A: readonly IndicadorAuditoria[] = [
  {
    id: 'autonomia',
    nombre: 'Autonomía',
    formula: 'Equipos en nivel 3 o 4 ÷ total de equipos × 100',
    metaTexto: '80 % al día 180',
    metaInicial: 80,
    unidad: 'porcentaje',
    sentido: 'mayor_mejor',
    min: 0,
    max: 100,
    paso: 1,
    calculadora: { numerador: 'Equipos en nivel 3 o 4', denominador: 'Total de equipos' },
  },
  {
    id: 'uso_sostenido',
    nombre: 'Uso sostenido',
    formula: 'Usuarios o transacciones con lo nuevo ÷ total × 100',
    metaTexto: '90 % o más en 3 mediciones',
    metaInicial: 90,
    unidad: 'porcentaje',
    sentido: 'mayor_mejor',
    min: 0,
    max: 100,
    paso: 1,
    calculadora: { numerador: 'Usuarios o transacciones con lo nuevo', denominador: 'Total' },
  },
  {
    id: 'regreso_anterior',
    nombre: 'Regreso a lo anterior',
    formula: 'Registros en la forma antigua ÷ total × 100',
    metaTexto: 'Menos de 5 %',
    metaInicial: 5,
    unidad: 'porcentaje',
    sentido: 'menor_mejor',
    min: 0,
    max: 100,
    paso: 0.5,
    calculadora: { numerador: 'Registros en la forma antigua', denominador: 'Total de registros' },
  },
  {
    id: 'traspaso',
    nombre: 'Traspaso',
    formula: 'Equipos con acta ÷ equipos en nivel 3 o 4 × 100',
    metaTexto: '100 %',
    metaInicial: 100,
    unidad: 'porcentaje',
    sentido: 'mayor_mejor',
    min: 0,
    max: 100,
    paso: 1,
    calculadora: { numerador: 'Equipos con acta', denominador: 'Equipos en nivel 3 o 4' },
  },
  {
    id: 'participacion',
    nombre: 'Participación',
    formula: 'Asistentes a dinámicas ÷ convocados × 100',
    metaTexto: '80 % o más',
    metaInicial: 80,
    unidad: 'porcentaje',
    sentido: 'mayor_mejor',
    min: 0,
    max: 100,
    paso: 1,
    calculadora: { numerador: 'Asistentes a dinámicas', denominador: 'Convocados' },
  },
  {
    id: 'comunicacion',
    nombre: 'Comunicación',
    formula: 'Piezas ejecutadas con respuesta ÷ piezas programadas × 100',
    metaTexto: '90 % o más',
    metaInicial: 90,
    unidad: 'porcentaje',
    sentido: 'mayor_mejor',
    min: 0,
    max: 100,
    paso: 1,
    calculadora: { numerador: 'Piezas ejecutadas con respuesta', denominador: 'Piezas programadas' },
  },
  {
    id: 'apropiacion',
    nombre: 'Apropiación',
    formula: 'Promedio del termómetro (Etapa T3)',
    metaTexto: '4,0 de 5',
    metaInicial: 4,
    unidad: 'escala_5',
    sentido: 'mayor_mejor',
    min: 1,
    max: 5,
    paso: 0.1,
  },
  {
    id: 'recaidas',
    nombre: 'Recaídas',
    formula: 'Señales atendidas a tiempo ÷ señales detectadas × 100',
    metaTexto: '90 % o más',
    metaInicial: 90,
    unidad: 'porcentaje',
    sentido: 'mayor_mejor',
    min: 0,
    max: 100,
    paso: 1,
    calculadora: { numerador: 'Señales atendidas a tiempo', denominador: 'Señales detectadas' },
  },
];

export const REGLA_SEMAFORO_A =
  'Verde (En meta): el equipo cumple la meta. Amarillo (Atención): se encuentra a menos de un 15 % de alcanzarla. Rojo (Intervenir): desviación mayor que requiere intervención y acompañamiento inmediato.';

/* ---------- A2 · Mapa de viaje del colaborador ---------- */

export type IdFaseViaje = 'antes' | 'durante' | 'actual' | 'mejorar';
export type EstadoCarita = 'feliz' | 'neutra' | 'preocupada';

export interface PreguntaViaje {
  numero: number;
  indice: number;
  fase: IdFaseViaje;
  texto: string;
  /** Opciones en orden A (3 pts), B (2 pts), C (1 pt). */
  opciones: readonly [
    { letra: 'A'; puntaje: 3; texto: string },
    { letra: 'B'; puntaje: 2; texto: string },
    { letra: 'C'; puntaje: 1; texto: string },
  ];
  /** Indica si la pregunta también recoge categorías de prioridad o apoyo para lectura cualitativa. */
  prioridad?: boolean;
}

export interface FaseViajeConfig {
  id: IdFaseViaje;
  numero: number;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  tallerTitulo: string;
  tallerPreguntas: string;
  tallerEnfoque: string;
}

export const PERIODOS_VIAJE = ['Últimos 3 meses', 'Ciclo 1', 'Ciclo 2', 'Ciclo 3', 'Cierre (Día 90)'] as const;

export const FASES_VIAJE_CONFIG: readonly FaseViajeConfig[] = [
  {
    id: 'antes',
    numero: 1,
    titulo: 'Antes del cambio',
    subtitulo: 'Línea base',
    descripcion: 'Identifica cómo percibía el colaborador la organización antes de la transformación.',
    tallerTitulo: 'Situación inicial',
    tallerPreguntas: '¿Cómo desarrollaba sus actividades antes del cambio? ¿Qué conocimientos, herramientas y procesos utilizaba?',
    tallerEnfoque: 'Punto de partida',
  },
  {
    id: 'durante',
    numero: 2,
    titulo: 'Durante el cambio',
    subtitulo: 'Transición',
    descripcion: 'Representa cómo ha experimentado el colaborador el proceso de transición.',
    tallerTitulo: 'Experiencia de transformación',
    tallerPreguntas: '¿Qué cambios ha experimentado? ¿Qué situaciones facilitaron o dificultaron su adaptación?',
    tallerEnfoque: 'Experiencia',
  },
  {
    id: 'actual',
    numero: 3,
    titulo: 'Situación actual',
    subtitulo: 'Adopción real',
    descripcion: 'Permite identificar cómo se encuentra el colaborador frente al cambio implementado.',
    tallerTitulo: 'Nivel de adaptación actual',
    tallerPreguntas: '¿Qué actividades ya realiza con normalidad? ¿Qué procesos todavía le generan dificultades? ¿Qué conocimientos ha adquirido?',
    tallerEnfoque: 'Evolución',
  },
  {
    id: 'mejorar',
    numero: 4,
    titulo: 'Hacia dónde mejorar',
    subtitulo: 'Sostenibilidad',
    descripcion: 'Identifica las oportunidades de mejora y las necesidades de los colaboradores para fortalecer el cambio.',
    tallerTitulo: 'Necesidades y oportunidades',
    tallerPreguntas: '¿Qué necesita para adaptarse completamente? ¿Qué debería fortalecer la empresa? ¿Qué acciones deben mantenerse?',
    tallerEnfoque: 'Sostenibilidad',
  },
];

export const PREGUNTAS_VIAJE: readonly PreguntaViaje[] = [
  // Fase 1: Antes del cambio
  {
    numero: 1,
    indice: 0,
    fase: 'antes',
    texto: '¿Qué aspectos de su trabajo conocía y dominaba antes del cambio?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Conocía y dominaba completamente todas mis actividades y responsabilidades.' },
      { letra: 'B', puntaje: 2, texto: 'Conocía la mayoría de mis actividades, aunque tenía algunas dificultades.' },
      { letra: 'C', puntaje: 1, texto: 'Conocía solamente las actividades básicas de mi cargo.' },
    ],
  },
  {
    numero: 2,
    indice: 1,
    fase: 'antes',
    texto: '¿Qué expectativas tenía frente al cambio organizacional?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Consideraba que el cambio generaría grandes oportunidades de mejora.' },
      { letra: 'B', puntaje: 2, texto: 'Esperaba que el cambio trajera algunos beneficios para la empresa y los trabajadores.' },
      { letra: 'C', puntaje: 1, texto: 'Tenía dudas sobre los beneficios que podría generar el cambio.' },
    ],
  },
  {
    numero: 3,
    indice: 2,
    fase: 'antes',
    texto: '¿Qué preocupaciones tenía frente a los cambios que se iban a implementar?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'No tenía preocupaciones porque comprendía y aceptaba la necesidad del cambio.' },
      { letra: 'B', puntaje: 2, texto: 'Me preocupaba principalmente tener que aprender nuevas actividades.' },
      { letra: 'C', puntaje: 1, texto: 'Me preocupaba no contar con las herramientas o conocimientos necesarios.' },
    ],
  },

  // Fase 2: Durante el cambio
  {
    numero: 4,
    indice: 3,
    fase: 'durante',
    texto: '¿Qué situaciones le han resultado más difíciles durante la implementación del cambio?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Ninguna, he logrado adaptarme sin mayores dificultades.' },
      { letra: 'B', puntaje: 2, texto: 'Aprender y comprender los nuevos procedimientos.' },
      { letra: 'C', puntaje: 1, texto: 'Utilizar las nuevas herramientas o tecnologías.' },
    ],
  },
  {
    numero: 5,
    indice: 4,
    fase: 'durante',
    prioridad: true,
    texto: '¿Qué aspectos le han facilitado la adaptación al cambio?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'La capacitación y formación proporcionada por la empresa.' },
      { letra: 'B', puntaje: 2, texto: 'El acompañamiento y apoyo de mis líderes y compañeros.' },
      { letra: 'C', puntaje: 1, texto: 'La disponibilidad de herramientas y recursos necesarios.' },
    ],
  },
  {
    numero: 6,
    indice: 5,
    fase: 'durante',
    prioridad: true,
    texto: '¿En qué momentos ha necesitado mayor acompañamiento durante el cambio?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Durante todo el proceso de implementación.' },
      { letra: 'B', puntaje: 2, texto: 'Principalmente durante las capacitaciones y el aprendizaje.' },
      { letra: 'C', puntaje: 1, texto: 'Al momento de aplicar los nuevos procesos en mis actividades.' },
    ],
  },

  // Fase 3: Situación actual
  {
    numero: 7,
    indice: 6,
    fase: 'actual',
    texto: '¿Cómo considera que se encuentra actualmente frente al cambio implementado?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Totalmente adaptado y cómodo con los nuevos cambios.' },
      { letra: 'B', puntaje: 2, texto: 'Adaptado en la mayoría de mis actividades.' },
      { letra: 'C', puntaje: 1, texto: 'Estoy parcialmente adaptado, todavía tengo algunas dificultades.' },
    ],
  },
  {
    numero: 8,
    indice: 7,
    fase: 'actual',
    texto: '¿Qué tanto comprende los nuevos procesos y procedimientos de la empresa?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Los comprendo completamente y puedo aplicarlos sin dificultad.' },
      { letra: 'B', puntaje: 2, texto: 'Comprendo la mayoría, aunque tengo algunas dudas.' },
      { letra: 'C', puntaje: 1, texto: 'Comprendo solamente los aspectos básicos.' },
    ],
  },
  {
    numero: 9,
    indice: 8,
    fase: 'actual',
    texto: '¿Cuenta con las herramientas y recursos necesarios para desarrollar sus actividades bajo las nuevas condiciones?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Sí, cuento con todos los recursos necesarios.' },
      { letra: 'B', puntaje: 2, texto: 'Cuento con la mayoría de los recursos, aunque algunos podrían mejorarse.' },
      { letra: 'C', puntaje: 1, texto: 'Cuento con recursos limitados que dificultan algunas actividades.' },
    ],
  },

  // Fase 4: Hacia dónde mejorar
  {
    numero: 10,
    indice: 9,
    fase: 'mejorar',
    prioridad: true,
    texto: '¿Qué aspecto considera que debería mejorar la empresa para fortalecer la adaptación al cambio?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Fortalecer los procesos de capacitación y formación.' },
      { letra: 'B', puntaje: 2, texto: 'Mejorar la comunicación entre directivos y colaboradores.' },
      { letra: 'C', puntaje: 1, texto: 'Proporcionar mejores herramientas y recursos de trabajo.' },
    ],
  },
  {
    numero: 11,
    indice: 10,
    fase: 'mejorar',
    prioridad: true,
    texto: '¿Qué aspecto considera que debería mantenerse del proceso de cambio implementado?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Las nuevas formas de trabajo y los procedimientos establecidos.' },
      { letra: 'B', puntaje: 2, texto: 'Los espacios de capacitación y formación.' },
      { letra: 'C', puntaje: 1, texto: 'Los canales de comunicación y participación.' },
    ],
  },
  {
    numero: 12,
    indice: 11,
    fase: 'mejorar',
    prioridad: true,
    texto: '¿Qué apoyo adicional necesita para adaptarse mejor al cambio?',
    opciones: [
      { letra: 'A', puntaje: 3, texto: 'Mayor capacitación sobre los nuevos procesos.' },
      { letra: 'B', puntaje: 2, texto: 'Acompañamiento personalizado de mis líderes.' },
      { letra: 'C', puntaje: 1, texto: 'Acceso a mejores herramientas y recursos.' },
    ],
  },
];

export const REGLAS_CARITA: Readonly<
  Record<
    EstadoCarita,
    {
      etiqueta: string;
      rango: string;
      rol: string;
      interpretacion: string;
    }
  >
> = {
  feliz: {
    etiqueta: 'Promotor (A)',
    rango: '2,50 a 3,00',
    rol: 'Estado óptimo',
    interpretacion: 'La fase se considera superada con éxito: alta conciencia, autonomía y adopción voluntaria.',
  },
  neutra: {
    etiqueta: 'En adaptación (B)',
    rango: '1,80 a 2,49',
    rol: 'Requiere refuerzo',
    interpretacion: 'La fase requiere atención o refuerzo leve: fricción manejable, sobrecarga temporal o dudas puntuales.',
  },
  preocupada: {
    etiqueta: 'Riesgo (C)',
    rango: '1,00 a 1,79',
    rol: 'Punto crítico',
    interpretacion: 'La fase presenta un punto crítico de bloqueo: fricción alta, resistencia, falta de apoyo o retorno al método antiguo.',
  },
};
