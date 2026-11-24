import type { MapaEmpatia, Narrativa } from '../../lib/modelo/proyecto';

/** Textos fijos de los formularios de la etapa Unir (RUTA_ANDI_R_U.md). */

export interface ParteNarrativa {
  numero: number;
  titulo: string;
  proposito: string;
  mensajeClave: string;
  campos: readonly { clave: Exclude<keyof Narrativa, 'vocero'>; etiqueta: string }[];
}

/** U2. Las 3 partes del guion comunicacional. */
export const PARTES_NARRATIVA: readonly ParteNarrativa[] = [
  {
    numero: 1,
    titulo: 'De dónde venimos y por qué ya no basta (la urgencia)',
    proposito:
      'Explicar las razones externas e internas que hacen inevitable la transformación (tendencias del sector, nueva regulación, tecnologías emergentes o necesidades de los clientes).',
    mensajeClave:
      'Aclarar por qué mantener el statu quo o trabajar "como siempre se ha hecho" representa un riesgo para la competitividad y la sostenibilidad de la empresa.',
    campos: [{ clave: 'urgencia', etiqueta: 'Por qué cambiamos' }],
  },
  {
    numero: 2,
    titulo: 'Hacia dónde vamos (la visión y la esperanza)',
    proposito: 'Pintar una imagen clara, atractiva y alcanzable del futuro deseado.',
    mensajeClave: 'Inspirar al equipo mostrando cómo la empresa se fortalecerá y qué beneficios traerá esta evolución a los clientes y al sector.',
    campos: [{ clave: 'vision', etiqueta: 'El futuro que buscamos' }],
  },
  {
    numero: 3,
    titulo: 'Cómo será el camino (la transición y la transparencia)',
    proposito: 'Explicar las etapas del proceso, definiendo claramente qué cambia, qué se mantiene (para reducir la ansiedad) y el compromiso de acompañamiento.',
    mensajeClave: 'Responder de manera honesta a la pregunta individual de cada colaborador: ¿Qué gano yo y qué cambia en mi día a día?',
    campos: [
      { clave: 'que_cambia', etiqueta: 'Qué cambia' },
      { clave: 'que_se_mantiene', etiqueta: 'Qué se mantiene' },
      { clave: 'acompanamiento', etiqueta: 'Cómo los vamos a acompañar' },
      { clave: 'que_gano', etiqueta: '¿Qué gano yo?' },
    ],
  },
];

export type CuadranteEmpatia = Exclude<keyof MapaEmpatia, 'estrategias'>;

/** U4. Cuadrantes del mapa de empatía con los ejemplos del documento como guía. */
export const CUADRANTES_EMPATIA: readonly { clave: CuadranteEmpatia; titulo: string; ejemplos: readonly string[] }[] = [
  {
    clave: 'oye',
    titulo: '¿Qué oye?',
    ejemplos: ['Rumores de pasillo sobre despidos o sobre carga laboral.', 'Comentarios de compañeros o sindicatos.'],
  },
  {
    clave: 've',
    titulo: '¿Qué ve?',
    ejemplos: [
      'Señales de apoyo o desinterés por parte de los líderes y compañeros frente al cambio.',
      'Ajustes en la forma de trabajar o en la dinámica diaria de las áreas.',
    ],
  },
  {
    clave: 'piensa_siente',
    titulo: '¿Qué piensa y siente?',
    ejemplos: ['Temor a no ser capaz o a quedar obsoleto en su rol.', 'Dudas sobre la estabilidad o claridad del proyecto.'],
  },
  {
    clave: 'dice_hace',
    titulo: '¿Qué dice y hace?',
    ejemplos: [
      '¿Las personas aceptan el cambio en público, pero siguen usando el método viejo?',
      '¿Expresan dudas e inquietudes de forma abierta o prefieren mantenerse al margen del proceso?',
    ],
  },
  {
    clave: 'dolores',
    titulo: 'Dolores y frustraciones',
    ejemplos: [
      'Temor a cometer errores o a perder el control sobre sus tareas habituales.',
      'Desgaste por procesos de cambio anteriores que no tuvieron continuidad.',
      'Sobrecarga de trabajo durante la etapa de transición.',
      'Falta de claridad sobre cómo el cambio afectará su rol o estabilidad laboral.',
      'Sensación de que el cambio es impuesto sin haber escuchado su experiencia.',
      'Inseguridad por no contar con las habilidades o herramientas necesarias para el nuevo proceso.',
    ],
  },
  {
    clave: 'necesidades',
    titulo: 'Necesidades y ganancias',
    ejemplos: [
      'Necesidad de capacitación práctica y tiempo protegido en la jornada.',
      'Deseo de reconocimiento y acompañamiento en su puesto.',
      'Claridad sobre cómo el nuevo proceso facilitará su trabajo.',
    ],
  },
];
