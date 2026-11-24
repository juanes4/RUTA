/**
 * Contenido de la etapa T. Fuente: sección "ETAPA #3: TRANSFORMAR" del
 * documento de metodología (niveles de Kirkpatrick). Los textos son los del
 * documento; si el documento cambia, se cambia aquí.
 */

export interface NivelKirkpatrick {
  id: string;
  nivel: string;
  momento: string;
  plan: string;
  evalua: string;
  practica: string;
  evidencia: string;
}

/** Tabla "Flujo de la etapa". */
export const FLUJO_T: readonly NivelKirkpatrick[] = [
  {
    id: 'T1',
    nivel: 'Nivel 1 (T1): Reacción',
    momento: 'Satisfacción inicial',
    plan: 'Plan de comunicación',
    evalua: '¿El equipo entendió el mensaje y confía en el canal y el formato usado? (demostración en vivo, votación con adhesivos, rueda de respuestas, historia del equipo)',
    practica: 'Al cerrar cada sesión o reunión, el líder pide responder 2 o 3 preguntas breves de claridad y utilidad.',
    evidencia: 'Puntaje promedio de claridad y utilidad de la sesión.',
  },
  {
    id: 'T2',
    nivel: 'Nivel 2 (T2): Aprendizaje',
    momento: 'Capacidad técnica',
    plan: 'Plan de capacitación',
    evalua: '¿El colaborador comprendió el contenido del micro-curso y se siente seguro para ejecutarlo solo?',
    practica: 'Al final de cada micro-curso (5 a 10 minutos), el colaborador responde el simulador interactivo de 3 preguntas y una autoevaluación de seguridad.',
    evidencia: 'Resultado del simulador (aprobación práctica) y autoevaluación de seguridad, visibles en el tablero para líderes.',
  },
  {
    id: 'T3',
    nivel: 'Nivel 3 (T3): Comportamiento',
    momento: 'Adopción cotidiana',
    plan: 'Plan de acompañamiento',
    evalua: '¿El equipo aplica el nuevo método en su día a día y lo sostiene sin apoyo externo, o volvió a la costumbre vieja?',
    practica: 'El jefe de área y el agente observan al equipo con una lista de chequeo simple al inicio de cada ciclo, junto con la votación de escalones.',
    evidencia: 'Porcentaje de trabajadores que usan el nuevo método y escalón actual del equipo.',
  },
  {
    id: 'T4',
    nivel: 'Nivel 4 (T4): Resultados',
    momento: 'Impacto operativo',
    plan: 'Plan de victorias tempranas',
    evalua: '¿Los primeros logros están mostrando que el cambio avanza y ayudando a lograr los objetivos de negocio de la Fase R?',
    practica: 'El responsable del cambio identifica el avance en la ficha FIMT, lo valora con la matriz MRMT, reconoce a las personas o equipos y publica el mérito.',
    evidencia: 'Fichas FIMT, puntaje MRMT y méritos publicados.',
  },
];

export const INTRO_T =
  'Para saber si el acompañamiento de equipos está funcionando, en la etapa de transformación se usan los cuatro niveles de evaluación de Kirkpatrick: cómo reaccionan, qué aprenden, qué hacen distinto y qué resultados se logran. Cada nivel se apoya en el anterior, y entre más se avanza, más valor tiene lo que se mide.';

export const DESCRIPCION_PASO_T: Readonly<Record<string, string>> = {
  T1: 'Encuesta de pulso al cerrar cada sesión: ¿el equipo entendió el mensaje y confía en el formato?',
  T2: 'Micro-cursos en video con simulador de 3 preguntas y autoevaluación de seguridad.',
  T3: 'Escalera de autonomía, dinámicas de equipo y termómetro de apropiación.',
  T4: 'Identificar, valorar, reconocer y divulgar los primeros logros del cambio.',
};

/** La escala de las encuestas de T1 y T3. */
export const ESCALA_1_A_5 = ['1', '2', '3', '4', '5'] as const;

/** T1. Encuesta de pulso (herramienta de evaluación de la comunicación). */
export const CRITERIOS_PULSO = [
  { id: 'claridad', criterio: 'Claridad del mensaje', pregunta: '¿El objetivo del cambio y los pasos a seguir quedaron claros durante esta sesión?' },
  { id: 'utilidad', criterio: 'Utilidad de la información', pregunta: '¿La información compartida te resulta útil y aplicable para tu trabajo diario?' },
  { id: 'confianza', criterio: 'Confianza en el formato/canal', pregunta: '¿El formato utilizado facilitó tu comprensión y participación?' },
] as const;

export type IdCriterioPulso = (typeof CRITERIOS_PULSO)[number]['id'];

export const FORMATOS_COMUNICACION = ['Demostración en vivo', 'Votación con adhesivos', 'Rueda de respuestas', 'Historia del equipo'] as const;

/** T2. Autoevaluación de seguridad al final del simulador. */
export const PREGUNTA_SEGURIDAD = '¿Qué tan seguro te sientes para ponerlo en práctica solo?';
export const ETIQUETAS_SEGURIDAD = ['Nada seguro', 'Poco seguro', 'Medianamente seguro', 'Seguro', 'Muy seguro'] as const;

/** T3. Escalera de autonomía. */
export interface Escalon {
  nivel: number;
  nombre: string;
  descripcion: string;
  apoyo: string;
}

export const ESCALERA: readonly Escalon[] = [
  { nivel: 1, nombre: 'Acompañado', descripcion: 'Usa lo nuevo con ayuda constante', apoyo: 'agente en el puesto' },
  { nivel: 2, nombre: 'Guiado', descripcion: 'Usa lo nuevo solo, pero busca aprobación', apoyo: 'jefe, revisión quincenal' },
  { nivel: 3, nombre: 'Autónomo', descripcion: 'Trabaja sin apoyo y corrige sus desvíos', apoyo: 'seguimiento mensual del dueño' },
  { nivel: 4, nombre: 'Referente', descripcion: 'Enseña a otros equipos y propone mejoras', apoyo: 'mentoría y visita solo por alerta' },
];

export const PASOS_VOTACION: readonly string[] = [
  'El líder muestra la escalera de autonomía al equipo (virtual, en pantalla o en el espacio de la reunión en línea).',
  'Cada integrante vota en qué escalón ve hoy al equipo, sin conversar con nadie.',
  'El líder lee en voz alta dónde quedó la mayoría.',
  'Quienes votaron distinto explican en una frase qué vieron. El equipo acuerda su escalón actual.',
  'El equipo marca el escalón al que llegará al cierre del ciclo.',
];

export const GUION_VOTACION = 'Cada uno vota solo. Después miramos juntos dónde quedamos y por qué.';
export const NOTA_ESCALERA =
  'Esto se hace durante el proceso: se guarda el resultado del nivel actual y, al final, se repite la escalera de autonomía para saber si se llegó al nivel «Referente» o no.';

/** T3. Dinámicas de equipo. */
export type IdDinamica = 'parejas' | 'circulo' | 'simulacro';

export interface CampoHoja {
  id: string;
  etiqueta: string;
  tipo: 'texto' | 'area' | 'tareas';
}

export interface Dinamica {
  id: IdDinamica;
  nombre: string;
  nivel: string;
  tiempo: string;
  grupo: string;
  materiales: string;
  pasos: readonly string[];
  guion: string;
  hoja: readonly CampoHoja[];
}

export const DINAMICAS: readonly Dinamica[] = [
  {
    id: 'parejas',
    nombre: 'Parejas de práctica',
    nivel: 'Nivel 1 y 2',
    tiempo: '30 min por semana',
    grupo: '2 personas',
    materiales: 'Lista de observación',
    pasos: [
      'Se forman las parejas: una persona que domina lo nuevo con otra que lo está afianzando. Garantizar que uno de los participantes sea early adopter.',
      'Escogen una tarea real de la jornada y la hacen juntas con lo nuevo.',
      'Quien observa marca en la lista lo que la otra hace sin ayuda y lo que hace con ayuda.',
      'Al terminar, cada una nombra en voz alta un acierto y un ajuste.',
      'La pareja rota cada ciclo para que todos aprendan de todos.',
    ],
    guion: 'Hoy una persona hace y la otra observa. Quien observa solo marca; las correcciones se dicen al final.',
    hoja: [
      { id: 'tareas', etiqueta: 'Tarea observada', tipo: 'tareas' },
      { id: 'acierto', etiqueta: 'Acierto', tipo: 'texto' },
      { id: 'ajuste', etiqueta: 'Ajuste', tipo: 'texto' },
      { id: 'pareja', etiqueta: 'Pareja y fecha (nombres, dd/mm/aaaa)', tipo: 'texto' },
    ],
  },
  {
    id: 'circulo',
    nombre: 'Círculo de apropiación',
    nivel: 'Nivel 2',
    tiempo: '45 min',
    grupo: '6 a 10 personas',
    materiales: 'Post-it y papelógrafo (en virtual: tablero compartido)',
    pasos: [
      'Las personas se reúnen en círculo (en virtual, todas con la cámara visible).',
      'Cada integrante cuenta, en un minuto, una situación concreta de su día en la que usó lo nuevo.',
      'Mientras habla, otra persona escribe la situación en un post-it.',
      'El grupo ubica los post-it en dos columnas: «ya es normal» y «todavía se siente nuevo».',
      'El equipo escoge una tarjeta de la segunda columna y se compromete a trabajarla durante la semana.',
    ],
    guion: 'Cuenten algo que hicieron esta semana con la forma nueva. Cada relato cuenta, sin respuestas buenas ni malas.',
    hoja: [
      { id: 'normal', etiqueta: 'Ya es normal', tipo: 'area' },
      { id: 'nuevo', etiqueta: 'Todavía se siente nuevo', tipo: 'area' },
      { id: 'trabajar', etiqueta: 'Una cosa para trabajar esta semana', tipo: 'texto' },
    ],
  },
  {
    id: 'simulacro',
    nombre: 'Simulacro de recaída',
    nivel: 'Nivel 2 y 3',
    tiempo: '40 min',
    grupo: 'Todo el equipo',
    materiales: 'Guía de una página',
    pasos: [
      'Se escoge el escenario de la lista y el facilitador lo describe en tres frases.',
      'El equipo reparte tres roles: quien vive la situación, quien aplica la guía y quien observa.',
      'Representan la respuesta durante 10 minutos, usando la guía de una página.',
      'El observador cuenta lo que vio. El equipo anota la respuesta acordada y un ajuste a la guía.',
      'La hoja se guarda en la carpeta del equipo.',
    ],
    guion: 'Esto es un ensayo y nadie queda evaluado. Probamos la guía para ajustarla antes del pico real.',
    hoja: [
      { id: 'escenario', etiqueta: 'Escenario', tipo: 'texto' },
      { id: 'vive', etiqueta: 'Vive la situación', tipo: 'texto' },
      { id: 'aplica', etiqueta: 'Aplica la guía', tipo: 'texto' },
      { id: 'observa', etiqueta: 'Observa', tipo: 'texto' },
      { id: 'respuesta', etiqueta: 'Respuesta acordada', tipo: 'area' },
      { id: 'ajuste', etiqueta: 'Ajuste a la guía', tipo: 'area' },
      { id: 'fecha', etiqueta: 'Fecha (dd/mm/aaaa)', tipo: 'texto' },
    ],
  },
];

export const RUTA_POR_NIVEL: readonly { nivel: string; dinamicas: string }[] = [
  { nivel: 'Nivel 1', dinamicas: 'parejas de práctica y muro de logros' },
  { nivel: 'Nivel 2', dinamicas: 'círculo de apropiación y acuerdos de equipo' },
  { nivel: 'Nivel 3', dinamicas: 'simulacro de recaída y feria de buenas prácticas' },
];

export const REGLA_DINAMICAS =
  'Son dinámicas cortas, con materiales sencillos. Cada una trae su paso a paso, el guión del líder y una hoja de trabajo que el equipo completa y guarda: esas hojas son la evidencia. Se hacen en horario de trabajo sin descuento de producción, y cada equipo hace máximo dos por ciclo.';

/** T3. Termómetro de apropiación. */
export const AFIRMACIONES_TERMOMETRO: readonly string[] = [
  'Trabajo con la nueva forma sin pensar en la anterior',
  'Puedo enseñarle a una persona nueva cómo se hace',
  'Mi jefe revisa y habla de lo nuevo con regularidad',
  'Mi equipo tiene acuerdos claros sobre cómo trabajar',
  'La empresa cumplió lo que prometió en este cambio',
];

export const META_TERMOMETRO = 4.0;
export const MIN_GRUPO_TERMOMETRO = 5;

/** T4. Matriz de valoración (MRMT). */
export interface CriterioMrmt {
  id: string;
  dimension: 'Resultado' | 'Adopción' | 'Cultura';
  criterio: string;
  valora: string;
  pregunta: string;
}

export const CRITERIOS_MRMT: readonly CriterioMrmt[] = [
  { id: 'cumplimiento', dimension: 'Resultado', criterio: 'Cumplimiento', valora: 'Grado en que el avance contribuye a las metas iniciales del cambio.', pregunta: '¿Qué tanto acerca a la organización a lo que el cambio busca lograr?' },
  { id: 'impacto', dimension: 'Resultado', criterio: 'Impacto positivo', valora: 'Mejoras o beneficios generados por el avance.', pregunta: '¿Qué mejoró (tiempos, calidad, servicio, clima) gracias a este avance?' },
  { id: 'sostenibilidad', dimension: 'Resultado', criterio: 'Sostenibilidad', valora: 'Posibilidad de mantener o replicar el resultado.', pregunta: '¿Puede mantenerse sin un esfuerzo extraordinario y replicarse en otras áreas?' },
  { id: 'adaptacion', dimension: 'Adopción', criterio: 'Adaptación', valora: 'Capacidad de ajustarse a las nuevas condiciones.', pregunta: '¿Cómo están usando las nuevas herramientas, procesos o formas de trabajo?' },
  { id: 'participacion', dimension: 'Adopción', criterio: 'Participación', valora: 'Involucramiento de los colaboradores en el proceso.', pregunta: '¿Qué proporción de las personas involucradas participa activamente?' },
  { id: 'compromiso', dimension: 'Cultura', criterio: 'Compromiso', valora: 'Disposición y responsabilidad frente a la transformación.', pregunta: '¿Asumen responsabilidades y persisten ante las dificultades?' },
  { id: 'equipo', dimension: 'Cultura', criterio: 'Trabajo en equipo', valora: 'Colaboración y apoyo entre las personas.', pregunta: '¿Se apoyan y comparten conocimiento para avanzar juntos?' },
  { id: 'iniciativa', dimension: 'Cultura', criterio: 'Iniciativa', valora: 'Propuestas o acciones propias que facilitan el cambio.', pregunta: '¿Propusieron o hicieron algo que no se les pidió y que ayuda a implementar el cambio?' },
];

export const NOTA_MRMT =
  'Los ocho criterios se agrupan en tres dimensiones. Cada criterio se califica de 1 a 5 (1 = muy bajo o sin evidencia, 2 = bajo, 3 = medio, 4 = alto, 5 = sobresaliente). Para poner 4 o 5, se anota la evidencia que lo respalda. El puntaje es una guía, no la única base: también se considera el contexto y el esfuerzo realizado.';

/** T4. Matriz de reconocimiento. */
export type Clasificacion = 'destacado' | 'favorable' | 'desarrollo';

export const MATRIZ_RECONOCIMIENTO: readonly { id: Clasificacion; puntaje: string; clasificacion: string; queHacer: string }[] = [
  { id: 'destacado', puntaje: '32 a 40', clasificacion: 'Mérito destacado', queHacer: 'Reconocer y publicar.' },
  { id: 'favorable', puntaje: '24 a 31', clasificacion: 'Mérito favorable', queHacer: 'Reconocer; publicar si se desea.' },
  { id: 'desarrollo', puntaje: '8 a 23', clasificacion: 'En desarrollo', queHacer: 'Agradecer el esfuerzo, dar apoyo y revisar de nuevo más adelante.' },
];

export const PASOS_VICTORIAS: readonly { n: number; paso: string; queSeHace: string; herramienta: string }[] = [
  { n: 1, paso: 'Identificar', queSeHace: 'Observar y registrar un avance positivo, con su evidencia.', herramienta: 'Ficha (FIMT)' },
  { n: 2, paso: 'Valorar', queSeHace: 'Calificar el avance con ocho criterios.', herramienta: 'Matriz (MRMT)' },
  { n: 3, paso: 'Reconocer', queSeHace: 'Agradecer o destacar a las personas o equipos.', herramienta: 'Mención, certificado o agradecimiento' },
  { n: 4, paso: 'Divulgar', queSeHace: 'Compartir el mérito de forma interna.', herramienta: 'Formato de publicación' },
];

export const DEFINICION_VICTORIA =
  'Una victoria temprana es un avance positivo, que se puede ver y comprobar, y que ayuda al cambio. Puede ser un resultado, un cambio de comportamiento, un aprendizaje o una iniciativa.';

export const FUNCIONES_VICTORIAS: readonly string[] = [
  'Motivar: que las personas vean que su esfuerzo se nota y se valora.',
  'Verificar: comprobar si lo que se está haciendo va por buen camino.',
];

export const RECONOCIMIENTOS = [
  { id: 'mencion', texto: 'Mención' },
  { id: 'certificado', texto: 'Certificado' },
  { id: 'agradecimiento', texto: 'Agradecimiento' },
] as const;

export const CIERRE_VICTORIAS =
  'Este proceso es coordinado por el responsable del cambio con el apoyo de los líderes de área. Al cerrar cada ciclo, dicho responsable registra un breve balance con los méritos obtenidos, los factores que los impulsaron y las dificultades encontradas, información que sirve como insumo directo para la etapa Analizar.';

export const CICLOS = [1, 2, 3, 4, 5, 6, 7] as const;
