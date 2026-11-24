import type { Cuadrante, Estrategia, Influencia, Postura } from '../../lib/modelo/tipos';

/** R1: el lienzo pide 3 motivos de urgencia, cada uno con su dato (CONTEXTO §3). */
export const LIENZO = { motivosUrgencia: 3 } as const;

/** Se conserva el formato de la decisión anterior para leer datos ya guardados. */
export const DECISION_R7 = { riesgos: 3 } as const;

/** Opciones del FODA R3 y del mapa de actores R4. */

export const CUADRANTES: readonly { valor: Cuadrante; nombre: string; escala: string }[] = [
  { valor: 'F', nombre: 'Fortaleza', escala: '5 = muy presente' },
  { valor: 'O', nombre: 'Oportunidad', escala: '5 = muy presente' },
  { valor: 'D', nombre: 'Debilidad', escala: '5 = muy grave' },
  { valor: 'A', nombre: 'Amenaza', escala: '5 = muy grave' },
];

export const PREGUNTAS_FODA = {
  F: [
    '¿Qué cambios anteriores salieron bien en esta organización y por qué?',
    '¿Qué habilidades o conocimientos del equipo ayudarán en esta transformación?',
    '¿Los líderes actuales tienen credibilidad y confianza ante sus equipos?',
    '¿Qué tan clara es hoy la razón del cambio para quienes lo van a vivir?',
    '¿Con qué recursos contamos (presupuesto, tecnología, tiempo y personas dedicadas)?',
    '¿Hay personas o áreas motivadas que puedan ser agentes de cambio?',
  ],
  D: [
    '¿Qué cambios anteriores fracasaron o se abandonaron y qué los frenó?',
    '¿Qué brechas de habilidades hay entre lo que se necesita y lo que el equipo sabe hacer hoy?',
    '¿Las áreas se comunican y colaboran bien, o trabajan aisladas?',
    '¿Los jefes intermedios tienen herramientas y tiempo para acompañar a sus equipos?',
    '¿Existe cansancio o saturación por otros proyectos simultáneos?',
    '¿Hay desconfianza entre la dirección y los equipos, o rumores frecuentes?',
    '¿Los procesos, sistemas o la cultura actual contradicen lo que se quiere lograr?',
  ],
  O: [
    '¿Qué tendencias del mercado, tecnología o normativa favorecen este cambio?',
    '¿Qué apoyos externos existen (ANDI, universidades, consultores, alianzas o formación)?',
    '¿Qué ventajas competitivas podríamos ganar si lo hacemos bien y rápido?',
    '¿Qué esperan nuestros clientes que este cambio nos permitiría ofrecer?',
    '¿Hay experiencias de otras empresas del sector que podamos tomar como referencia?',
  ],
  A: [
    '¿Qué cambios regulatorios, económicos o laborales podrían alterar el plan?',
    '¿Qué harían los competidores si ven a la organización en transición?',
    '¿Qué riesgos hay de perder clientes, proveedores o talento durante la transición?',
    '¿Hay dependencias externas (proveedores, tecnología o autoridades) que podrían retrasar el cambio?',
    '¿Qué podría pasar si no cambiamos o si lo hacemos tarde?',
  ],
} as const;

export const INFLUENCIAS: readonly { valor: Influencia; nombre: string }[] = [
  { valor: 'alta', nombre: 'Alta' },
  { valor: 'media', nombre: 'Media' },
  { valor: 'baja', nombre: 'Baja' },
];

export const POSTURAS: readonly { valor: Postura; nombre: string }[] = [
  { valor: 'se_opone', nombre: 'Se opone' },
  { valor: 'neutral', nombre: 'Neutral' },
  { valor: 'apoya', nombre: 'Apoya' },
];

export const ESTRATEGIAS: readonly { valor: Estrategia; nombre: string }[] = [
  { valor: 'educar', nombre: 'Educar' },
  { valor: 'hacer_participe', nombre: 'Hacer partícipe' },
  { valor: 'apoyar', nombre: 'Apoyar' },
  { valor: 'negociar', nombre: 'Negociar' },
];
