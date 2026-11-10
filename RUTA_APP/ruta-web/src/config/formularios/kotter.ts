import type { PasoKotter } from '../../lib/modelo/tipos';

/**
 * Instrumento 2 (docs/instrumento2_kotter.md). Cada tipo de respuesta
 * define cómo se convierte a puntaje (§2.4).
 */

export type TipoPreguntaKotter =
  | 'escala' //            1–5 o "No sé"
  | 'si_no' //             Sí con evidencia = 5; No = 1
  | 'si_no_alerta' //      se invierte: No = 5; Sí = 1
  | 'proporcion' //        B1.2, B3.2
  | 'comunicaciones' //    B4.1
  | 'historia_cambios' //  A8.3
  | 'abierta' //           se analiza por temas, no suma
  | 'indicador'; //        B5.1 y B8.1, no se convierten

export interface PreguntaKotter {
  id: string;
  paso: PasoKotter | null;
  texto: string;
  tipo: TipoPreguntaKotter;
  /** Lo que se pide escribir si se responde "Sí". */
  pideEvidencia?: string;
  opciones?: readonly OpcionKotter[];
}

export interface OpcionKotter {
  valor: string;
  texto: string;
  /** null = no suma al puntaje. */
  puntaje: number | null;
}

export const NOMBRE_PASO_KOTTER: Readonly<Record<PasoKotter, string>> = {
  1: 'Sentido de urgencia',
  2: 'Coalición guía',
  3: 'Visión y estrategia',
  4: 'Comunicación del cambio',
  5: 'Eliminación de obstáculos',
  6: 'Victorias a corto plazo',
  7: 'Consolidación de mejoras',
  8: 'Institucionalización',
};

/** Escala 1 a 5 del Instrumento 2 §2.2. */
export const ESCALA_KOTTER: readonly OpcionKotter[] = [
  { valor: '1', texto: 'No existe o no se cumple', puntaje: 1 },
  { valor: '2', texto: 'Se cumple muy poco', puntaje: 2 },
  { valor: '3', texto: 'Se cumple parcialmente', puntaje: 3 },
  { valor: '4', texto: 'Se cumple en su mayoría', puntaje: 4 },
  { valor: '5', texto: 'Se cumple totalmente', puntaje: 5 },
  { valor: 'NS', texto: 'No sé', puntaje: null },
];

const HISTORIA_CAMBIOS: readonly OpcionKotter[] = [
  { valor: 'sostuvieron', texto: 'Se sostuvieron y hoy son parte del día a día', puntaje: 5 },
  { valor: 'en_parte', texto: 'Se sostuvieron en parte', puntaje: 3 },
  { valor: 'abandonaron', texto: 'Se abandonaron después de un tiempo', puntaje: 2 },
  { valor: 'no_implementaron', texto: 'No llegaron a implementarse', puntaje: 1 },
  { valor: 'no_conozco', texto: 'No conozco cambios anteriores', puntaje: null },
];

export const KOTTER_PARTE_A: readonly PreguntaKotter[] = [
  { id: 'A1.1', paso: 1, tipo: 'escala', texto: 'La dirección puede explicar con datos concretos por qué el cambio es necesario.' },
  { id: 'A1.2', paso: 1, tipo: 'escala', texto: 'Los colaboradores perciben que seguir trabajando como hoy tiene un costo o un riesgo real.' },
  { id: 'A1.3', paso: 1, tipo: 'si_no', pideEvidencia: 'Escribe cuál.', texto: '¿Existe un hecho o cifra (del mercado, clientes, costos o regulación) que obligue a actuar en los próximos 6 meses?' },
  { id: 'A2.1', paso: 2, tipo: 'si_no', pideEvidencia: 'Indica su cargo.', texto: '¿Hay un patrocinador de la alta dirección asignado formalmente al cambio?' },
  { id: 'A2.2', paso: 2, tipo: 'escala', texto: 'El grupo que liderará el cambio incluye personas de las áreas más afectadas.' },
  { id: 'A2.3', paso: 2, tipo: 'escala', texto: 'Los miembros de ese grupo tienen autoridad para tomar decisiones sobre el cambio.' },
  { id: 'A2.4', paso: 2, tipo: 'escala', texto: 'Los miembros de ese grupo pueden discutir problemas abiertamente entre ellos.' },
  { id: 'A3.1', paso: 3, tipo: 'si_no', pideEvidencia: 'Escríbela en una o dos frases.', texto: '¿Puedes explicar la visión del cambio en menos de un minuto?' },
  { id: 'A3.2', paso: 3, tipo: 'escala', texto: 'La visión describe cómo funcionará la empresa cuando el cambio esté completo.' },
  { id: 'A3.3', paso: 3, tipo: 'escala', texto: 'Existe un plan de trabajo que conecta la visión con acciones concretas.' },
  { id: 'A4.1', paso: 4, tipo: 'escala', texto: 'Existe un plan de comunicación con mensajes, canales y fechas definidos.' },
  { id: 'A4.2', paso: 4, tipo: 'escala', texto: 'Los líderes de área están preparados para explicar el cambio a sus equipos.' },
  { id: 'A4.3', paso: 4, tipo: 'si_no', pideEvidencia: 'Indica cuál.', texto: '¿Existe un canal para que los colaboradores hagan preguntas sobre el cambio y reciban respuesta?' },
  { id: 'A5.1', paso: 5, tipo: 'escala', texto: 'Se han identificado los principales obstáculos para el cambio.' },
  { id: 'A5.2', paso: 5, tipo: 'abierta', texto: '¿Cuáles son los tres obstáculos más importantes (procesos, sistemas, estructura, recursos o cultura)? Sin nombres de personas.' },
  { id: 'A5.3', paso: 5, tipo: 'si_no_alerta', pideEvidencia: 'Indica cuáles.', texto: '¿Hay políticas, incentivos o procedimientos actuales que contradicen el cambio?' },
  { id: 'A5.4', paso: 5, tipo: 'si_no_alerta', pideEvidencia: 'Describe el área y el motivo, sin nombres.', texto: '¿Hay áreas con influencia que se oponen abiertamente al cambio?' },
  { id: 'A6.1', paso: 6, tipo: 'escala', texto: 'Se han definido resultados visibles que se puedan lograr en los primeros 3 meses.' },
  { id: 'A6.2', paso: 6, tipo: 'escala', texto: 'Hay recursos asignados (presupuesto, personas) para lograr esos primeros resultados.' },
  { id: 'A7.1', paso: 7, tipo: 'escala', texto: 'El plan incluye etapas posteriores al lanzamiento, no termina con él.' },
  { id: 'A7.2', paso: 7, tipo: 'escala', texto: 'La empresa tiene capacidad para sostener el esfuerzo del cambio durante más de 12 meses sin descuidar la operación diaria.' },
  { id: 'A8.1', paso: 8, tipo: 'escala', texto: 'Se ha definido qué procesos, políticas o indicadores formales cambiarán para incorporar el cambio.' },
  { id: 'A8.2', paso: 8, tipo: 'escala', texto: 'Lo que hoy se valora y premia en la empresa es compatible con el cambio.' },
  { id: 'A8.3', paso: 8, tipo: 'historia_cambios', opciones: HISTORIA_CAMBIOS, texto: 'En cambios anteriores de la empresa, ¿qué sucedió normalmente?' },
  { id: 'A9', paso: null, tipo: 'abierta', texto: '¿Qué tendría que pasar antes del lanzamiento para que el cambio tenga éxito? (máximo 3 líneas)' },
];

/** Conversión de proporciones (B1.2, B3.2), Instrumento 2 §2.4. */
export const OPCIONES_PROPORCION: readonly OpcionKotter[] = [
  { valor: 'menos_25', texto: 'Menos de 25%', puntaje: 1 },
  { valor: '25_50', texto: '25% a 50%', puntaje: 2 },
  { valor: '51_75', texto: '51% a 75%', puntaje: 4 },
  { valor: 'mas_75', texto: 'Más de 75%', puntaje: 5 },
];

/** Conversión de B4.1, Instrumento 2 §2.4. */
export const OPCIONES_COMUNICACIONES: readonly OpcionKotter[] = [
  { valor: 'ninguna', texto: 'Ninguna', puntaje: 1 },
  { valor: 'menos_mitad', texto: 'Menos de la mitad', puntaje: 2 },
  { valor: 'mitad_o_mas', texto: 'La mitad o más', puntaje: 4 },
  { valor: 'todas', texto: 'Todas', puntaje: 5 },
];
