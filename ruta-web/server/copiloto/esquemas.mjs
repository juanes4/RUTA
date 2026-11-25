import { CRITERIOS_AJUSTABLES } from './ajustes.mjs';
import { CODIGOS_TEMA, SENTIMIENTOS, TIPOS_REVISION } from './taxonomia.mjs';

/**
 * Esquemas JSON de la salida estructurada que se le pide a Gemini
 * (generationConfig.responseJsonSchema). Sin valores null: lo que no se sabe
 * va como "" o lista vacía, y el código lo valida igual al recibirlo.
 */

const texto = { type: 'string' };
const textos = { type: 'array', items: texto };
const objeto = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });

export const ESQUEMA_CLASIFICACION = objeto({
  clasificacion: {
    type: 'array',
    items: objeto({
      id: texto,
      pregunta: { type: 'string', enum: ['p1', 'p2', 'p3'] },
      temas: { type: 'array', items: { type: 'string', enum: CODIGOS_TEMA } },
      otro: texto,
      sentimiento: { type: 'string', enum: SENTIMIENTOS },
      intensidad: { type: 'integer', minimum: 1, maximum: 3 },
      revision: { type: 'string', enum: TIPOS_REVISION },
      identificable: { type: 'boolean' },
    }),
  },
});

/** Segunda parte del paso 3: con el buzón ya clasificado, síntesis y ajustes al diagnóstico. */
export const ESQUEMA_SINTESIS_BUZON = objeto({
  sintesis: { type: 'array', items: objeto({ codigo: { type: 'string', enum: CODIGOS_TEMA }, frase: texto }) },
  propuestas: { type: 'array', items: objeto({ idea: texto, ids: textos }) },
  lectura: textos,
  ajustes: objeto({
    riesgos: { type: 'array', items: objeto({ riesgo: texto, fuente: texto }) },
    triaje: {
      type: 'array',
      items: objeto({ criterio: { type: 'string', enum: CRITERIOS_AJUSTABLES }, puntaje: { type: 'integer', minimum: 1, maximum: 3 }, motivo: texto, fuente: texto }),
    },
  }),
});

const ESTADO = { type: 'string', enum: ['completo', 'por_verificar', 'por_completar'] };

export const ESQUEMA_LIENZO = objeto({
  urgencia: { type: 'array', items: objeto({ motivo: texto, dato: texto }) },
  afectados: texto,
  vision: texto,
  que_cambia: texto,
  que_no_cambia: texto,
  beneficios: { type: 'array', items: objeto({ grupo: texto, beneficio: texto }) },
  criterios: { type: 'array', items: objeto({ criterio: texto, meta: texto }) },
  riesgos: textos,
  intentos_previos: textos,
  estados: objeto({
    urgencia: ESTADO,
    afectados: ESTADO,
    vision: ESTADO,
    cambios: ESTADO,
    beneficios: ESTADO,
    criterios: ESTADO,
    riesgos: ESTADO,
  }),
});

const CRITERIO = objeto({
  puntaje: { type: 'integer', minimum: 1, maximum: 3 },
  justificacion: texto,
  fuente: texto,
  cambiaria: texto,
});

export const ELEMENTOS = ['estrategia', 'estructura', 'sistemas', 'habilidades', 'liderazgo', 'valores'];
export const ALCANCES = ['piloto', 'departamento', 'organizacion', 'sin_dato'];

export const ESQUEMA_TRIAJE = objeto({
  impacto_personas: CRITERIO,
  complejidad: objeto({
    elementos: { type: 'array', items: { type: 'string', enum: ELEMENTOS } },
    justificacion: texto,
    fuente: texto,
    cambiaria: texto,
  }),
  riesgo_operativo: CRITERIO,
  alcance: { type: 'string', enum: ALCANCES },
  por_que_ahora: texto,
  poblacion_afectada: texto,
  dimension_tecnica: texto,
});

export const ESQUEMA_DOSSIER = objeto({
  resumen: texto,
  recomendaciones: { type: 'array', items: objeto({ texto, fuente: texto }) },
  vocero: objeto({ perfil: texto, motivo: texto, fuente: texto }),
  preguntas_jefes: textos,
});
