import type {
  AlcanceDespliegue,
  Cuadrante,
  ElementoOrganizacion,
  NivelAB,
  NivelCompromiso,
  PuntajeTriaje,
} from '../../lib/modelo/tipos';

/** Opciones y textos fijos de los formularios de la etapa Reconocer (RUTA_ANDI_R_U.md). */

/** R1: el lienzo pide los 3 motivos para cambiar ahora, cada uno con su dato. */
export const LIENZO = { motivosUrgencia: 3 } as const;

/** R1: los 7 bloques del lienzo con su pregunta guía. */
export const BLOQUES_LIENZO = [
  { id: 'urgencia', nombre: 'Urgencia', pregunta: '¿Cuáles son los 3 motivos para cambiar ahora, con datos?' },
  { id: 'afectados', nombre: 'Afectados', pregunta: '¿A quién le cambia el trabajo y cuánto?' },
  { id: 'vision', nombre: 'Visión', pregunta: '¿Cómo será el día a día cuando funcione? (una frase)' },
  { id: 'cambios', nombre: 'Qué cambia y qué no', pregunta: '¿Qué tareas cambian y qué se mantiene?' },
  { id: 'beneficios', nombre: 'Beneficios por grupo', pregunta: '¿Qué gana cada grupo?' },
  { id: 'criterios', nombre: 'Criterios de éxito', pregunta: '¿Cómo sabremos que funcionó? (con números)' },
  { id: 'riesgos', nombre: 'Riesgos', pregunta: '¿Qué puede salir mal y qué intentos previos fallaron?' },
] as const;

export type BloqueLienzo = (typeof BLOQUES_LIENZO)[number]['id'];

/** R2: preguntas orientadoras del triaje. */
export const PREGUNTAS_TRIAJE = {
  por_que_ahora: { nombre: 'Recepción y registro inicial', pregunta: '¿Por qué hay que cambiar ahora y qué pasa si no se hace?' },
  poblacion_afectada: { nombre: 'Alcance y población afectada', pregunta: '¿A quiénes y cuántas personas les cambia la rutina y el trabajo?' },
  dimension_tecnica: { nombre: 'Dimensión técnica', pregunta: '¿Afecta procesos, herramientas tecnológicas, estructura u objetivos del negocio?' },
} as const;

export interface NivelTriaje {
  puntaje: PuntajeTriaje;
  nombre: string;
  descripcion: string;
}

export const NIVELES_IMPACTO_PERSONAS: readonly NivelTriaje[] = [
  {
    puntaje: 1,
    nombre: 'Bajo',
    descripcion:
      'Ajuste leve en procedimientos o tareas habituales; no requiere desaprender conductas arraigadas ni genera impacto en la estabilidad laboral.',
  },
  {
    puntaje: 2,
    nombre: 'Medio',
    descripcion: 'Modificación de herramientas o flujos de trabajo que exige nuevas capacitaciones, pero sin alterar los roles ni la estructura de los equipos.',
  },
  {
    puntaje: 3,
    nombre: 'Alto',
    descripcion:
      'Transformación drástica en la forma de trabajar, redefinición de cargos, pérdida de hábitos conocidos o necesidad de adquirir competencias totalmente nuevas (alto riesgo de resistencia).',
  },
];

export const NIVELES_COMPLEJIDAD: readonly NivelTriaje[] = [
  { puntaje: 1, nombre: 'Bajo', descripcion: 'Impacta 1 solo elemento (por ejemplo, una actualización aislada de un software o procedimiento en un área).' },
  {
    puntaje: 2,
    nombre: 'Medio',
    descripcion: 'Impacta 2 o 3 elementos simultáneamente (por ejemplo, requiere adaptar Sistemas y desarrollar Habilidades en un departamento completo).',
  },
  { puntaje: 3, nombre: 'Alto', descripcion: 'Impacta 4 o más elementos al mismo tiempo, abarcando múltiples áreas o a toda la organización.' },
];

export const NIVELES_RIESGO_OPERATIVO: readonly NivelTriaje[] = [
  {
    puntaje: 1,
    nombre: 'Bajo',
    descripcion: 'Un fallo en la adopción no interrumpe la operación ni la facturación; la disposición previa del equipo hacia los cambios es positiva.',
  },
  { puntaje: 2, nombre: 'Medio', descripcion: 'Genera retrasos o sobrecostos temporales manejables; el historial de iniciativas previas en el área es mixto.' },
  {
    puntaje: 3,
    nombre: 'Alto',
    descripcion:
      'Riesgo crítico para la continuidad del negocio, el servicio al cliente o la seguridad; existen antecedentes de proyectos fallidos o alta fatiga por cambios recientes.',
  },
];

export const CRITERIOS_TRIAJE = {
  impacto_personas: {
    nombre: 'Impacto en las personas',
    pregunta: '¿En qué medida el cambio altera la rutina diaria, los roles o la zona de confort de los colaboradores afectados?',
  },
  complejidad: { nombre: 'Complejidad organizacional', pregunta: '¿Cuántos elementos de la organización impacta el cambio al mismo tiempo?' },
  riesgo_operativo: {
    nombre: 'Riesgo operativo',
    pregunta: '¿Cuál es el impacto en la operación si la adopción falla y cuál es el historial de cambio en los equipos involucrados?',
  },
  alcance: { nombre: 'Alcance de despliegue', pregunta: '¿Afecta a un equipo puntual (piloto), a un departamento completo o a toda la organización?' },
} as const;

export const ELEMENTOS_ORGANIZACION: readonly { valor: ElementoOrganizacion; nombre: string }[] = [
  { valor: 'estrategia', nombre: 'Estrategia' },
  { valor: 'estructura', nombre: 'Estructura' },
  { valor: 'sistemas', nombre: 'Sistemas' },
  { valor: 'habilidades', nombre: 'Habilidades' },
  { valor: 'liderazgo', nombre: 'Liderazgo' },
  { valor: 'valores', nombre: 'Valores' },
];

export const ALCANCES: readonly { valor: AlcanceDespliegue; nombre: string }[] = [
  { valor: 'piloto', nombre: 'Un equipo puntual (piloto)' },
  { valor: 'departamento', nombre: 'Un departamento completo' },
  { valor: 'organizacion', nombre: 'Toda la organización' },
];

export type NivelSemaforoTriaje = 'verde' | 'amarillo' | 'rojo';

/** R2: caracterización y asignación de ruta según el puntaje total. */
export const RUTAS_TRIAJE: Readonly<Record<NivelSemaforoTriaje, { rango: string; clasificacion: string; descripcion: string }>> = {
  verde: {
    rango: '3 a 4',
    clasificacion: 'Cambio ágil o estándar',
    descripcion: 'La organización está lista y cuenta con los recursos de acompañamiento.',
  },
  amarillo: {
    rango: '5 a 7',
    clasificacion: 'Cambio moderado',
    descripcion:
      'Se detectan barreras, ya sea de recursos o de resistencia de los trabajadores; deben comunicarse o corregirse antes del lanzamiento.',
  },
  rojo: {
    rango: '8 a 9',
    clasificacion: 'Cambio mayor',
    descripcion:
      'Alta complejidad y riesgo transformacional. El cambio impactará de forma severa la cultura, estructura u operación transversal de la empresa.',
  },
};

/** R3: cuadrantes del FODA con su matriz de preguntas. */
export const CUADRANTES: readonly { valor: Cuadrante; nombre: string; plural: string; preguntas: readonly string[] }[] = [
  {
    valor: 'F',
    nombre: 'Fortaleza',
    plural: 'Fortalezas',
    preguntas: [
      '¿Qué cambios anteriores salieron bien en esta organización y por qué?',
      '¿Qué habilidades o conocimientos de nuestro equipo nos ayudarán en esta transformación?',
      '¿Los líderes actuales tienen credibilidad y confianza ante sus equipos?',
      '¿Qué tan clara es hoy la razón del cambio para quienes lo van a vivir?',
      '¿Con qué recursos contamos (presupuesto, tecnología, tiempo, personas dedicadas)?',
      '¿Hay personas o áreas que ya están motivadas y pueden ser agentes de cambio?',
    ],
  },
  {
    valor: 'O',
    nombre: 'Oportunidad',
    plural: 'Oportunidades',
    preguntas: [
      '¿Qué tendencias del mercado, tecnología o normativa favorecen este cambio?',
      '¿Qué apoyos externos existen (gremios como la ANDI, universidades, consultores, alianzas, programas de formación)?',
      '¿Qué ventajas competitivas podríamos ganar si lo hacemos bien y rápido?',
      '¿Qué piden o esperan nuestros clientes que este cambio nos permitiría ofrecer?',
      '¿Hay experiencias de otras empresas del sector que podamos tomar como referencia?',
    ],
  },
  {
    valor: 'D',
    nombre: 'Debilidad',
    plural: 'Debilidades',
    preguntas: [
      '¿Qué cambios anteriores fracasaron o se abandonaron y qué los frenó?',
      '¿Qué brechas de habilidades hay entre lo que se necesita y lo que el equipo sabe hacer hoy?',
      '¿Las áreas se comunican y colaboran bien, o trabajan aisladas?',
      '¿Los jefes intermedios tienen herramientas y tiempo para acompañar a sus equipos?',
      '¿Existe cansancio o saturación por otros proyectos simultáneos?',
      '¿Hay desconfianza entre la dirección y los equipos, o rumores que circulan con frecuencia?',
      '¿Los procesos, sistemas o la cultura actual contradicen lo que se quiere lograr?',
    ],
  },
  {
    valor: 'A',
    nombre: 'Amenaza',
    plural: 'Amenazas',
    preguntas: [
      '¿Qué cambios regulatorios, económicos o laborales podrían alterar el plan?',
      '¿Qué harían los competidores si ven a la organización en transición?',
      '¿Qué riesgos hay de perder clientes, proveedores o talento durante la transición?',
      '¿Hay dependencias externas (proveedores, tecnología, autoridades) que podrían retrasar el cambio?',
      '¿Qué podría pasar si no cambiamos o si lo hacemos tarde?',
    ],
  },
];

/** R4: actores sugeridos; la empresa ajusta la redacción a su realidad. */
export const ACTORES_SUGERIDOS: readonly { actor: string; descripcion: string; necesidades: string }[] = [
  {
    actor: 'Propietarios y alta dirección',
    descripcion: 'Aprueban el cambio, asignan recursos y fijan prioridades.',
    necesidades: 'Resultados y retorno de la inversión; riesgos controlados; información clara y oportuna del avance.',
  },
  {
    actor: 'Mandos medios y líderes de área',
    descripcion: 'Traducen el cambio al día a día de sus equipos.',
    necesidades: 'Herramientas, tiempo y claridad para acompañar a su gente; no quedar «en medio».',
  },
  {
    actor: 'Colaboradores operativos',
    descripcion: 'Ejecutan los procesos que van a cambiar.',
    necesidades: 'Capacitación práctica, tiempo protegido en la jornada, estabilidad laboral y saber qué cambia en su día a día.',
  },
  {
    actor: 'Colaboradores administrativos y de apoyo',
    descripcion: 'Manejan información, compras, talento humano y soporte.',
    necesidades: 'Claridad sobre nuevos procedimientos y sistemas; reconocimiento y acompañamiento.',
  },
  {
    actor: 'Sindicato o representantes de los trabajadores',
    descripcion: 'Velan por las condiciones laborales del personal.',
    necesidades: 'Información oportuna, garantías laborales y participación en el proceso.',
  },
];

export const NIVELES_AB: readonly { valor: NivelAB; nombre: string }[] = [
  { valor: 'A', nombre: 'Alto (A)' },
  { valor: 'B', nombre: 'Bajo (B)' },
];

/** R4: posiciones del mapa de compromiso, de menor a mayor. */
export const NIVELES_COMPROMISO: readonly { valor: NivelCompromiso; nombre: string }[] = [
  { valor: 'desconoce', nombre: 'Desconoce el cambio' },
  { valor: 'se_resiste', nombre: 'Se resiste' },
  { valor: 'neutral', nombre: 'Neutral' },
  { valor: 'apoya', nombre: 'Apoya' },
  { valor: 'lidera', nombre: 'Lidera' },
];

/**
 * R4: qué hacer con cada combinación de poder e interés. Es la lectura
 * clásica de la matriz poder × interés que el documento usa para "anticipar
 * riesgos, construir alianzas clave y diseñar estrategias de comunicación".
 */
export const CUADRANTES_PODER_INTERES: readonly { poder: NivelAB; interes: NivelAB; nombre: string; estrategia: string }[] = [
  { poder: 'A', interes: 'A', nombre: 'Gestionar de cerca', estrategia: 'Involucrarlos en las decisiones y mantener contacto frecuente.' },
  { poder: 'A', interes: 'B', nombre: 'Mantener satisfechos', estrategia: 'Informar avances y riesgos clave sin saturarlos.' },
  { poder: 'B', interes: 'A', nombre: 'Mantener informados', estrategia: 'Comunicar con frecuencia y escuchar sus dudas.' },
  { poder: 'B', interes: 'B', nombre: 'Monitorear', estrategia: 'Observar cambios en su postura con un esfuerzo mínimo.' },
];

export type EstrategiaFoda = 'FO' | 'DO' | 'FA' | 'DA';

/**
 * R3: lectura del FODA matemático. El balance interno (F − D) y el externo
 * (O − A) ubican al cambio en uno de los cuatro cuadrantes estratégicos.
 */
export const ESTRATEGIAS_FODA: Readonly<Record<EstrategiaFoda, { nombre: string; descripcion: string }>> = {
  FO: { nombre: 'Ofensiva (FO)', descripcion: 'Usar las fortalezas para aprovechar las oportunidades: el cambio tiene terreno favorable.' },
  DO: { nombre: 'Reorientación (DO)', descripcion: 'Corregir las debilidades internas para poder aprovechar las oportunidades.' },
  FA: { nombre: 'Defensiva (FA)', descripcion: 'Apoyarse en las fortalezas para reducir el efecto de las amenazas.' },
  DA: { nombre: 'Supervivencia (DA)', descripcion: 'Reducir debilidades y protegerse de amenazas antes de desplegar el cambio.' },
};
