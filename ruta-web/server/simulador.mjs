/**
 * T2. Simulador de cada micro-curso: 3 preguntas y, aparte, una autoevaluación
 * de seguridad (1 a 5). La respuesta correcta nunca sale del servidor.
 *
 * BORRADOR: las preguntas están escritas a partir del tema de cada video.
 * Revísalas con quien dicta la capacitación y ajústalas al contenido real.
 * `correcta` es la posición (0, 1, 2…) de la opción correcta.
 */
export const APROBACION_MINIMA = 2; // aciertos de 3 para aprobar la práctica

export const PREGUNTAS = {
  'emp-1': [
    { texto: '¿Qué es un cambio organizacional?', opciones: ['Una modificación en la forma de trabajar, los procesos, la estructura o la tecnología', 'Un traslado de oficina de una sola persona', 'Una reunión mensual de seguimiento'], correcta: 0 },
    { texto: '¿Cuál es una reacción frecuente de las personas ante un cambio?', opciones: ['Aceptarlo siempre de inmediato', 'Sentir temor o dudas por lo desconocido', 'No notar que algo cambió'], correcta: 1 },
    { texto: '¿Qué ayuda más a que las personas acepten un cambio?', opciones: ['Enterarse el mismo día en que empieza', 'Entender por qué se hace y poder opinar', 'Que nadie pregunte'], correcta: 1 },
  ],
  'emp-2': [
    { texto: '¿Para qué sirve la gestión del cambio?', opciones: ['Para acompañar a las personas a adoptar el cambio', 'Para evitar que la empresa cambie', 'Solo para comprar nueva tecnología'], correcta: 0 },
    { texto: 'La gestión del cambio se ocupa sobre todo de…', opciones: ['Los equipos y las máquinas', 'El lado humano: cómo las personas viven y adoptan el cambio', 'Los precios de los productos'], correcta: 1 },
    { texto: '¿Cuándo conviene empezar a gestionar un cambio?', opciones: ['Antes del lanzamiento, desde la planeación', 'Cuando ya hay quejas', 'Un año después'], correcta: 0 },
  ],
  'emp-3': [
    { texto: 'Un cambio tiene más probabilidad de funcionar cuando hay…', opciones: ['Órdenes sin explicación', 'Comunicación clara y participación de las personas', 'Cambios constantes y sin aviso'], correcta: 1 },
    { texto: 'Si un cambio se impone sin explicar sus razones, lo más probable es que…', opciones: ['Aumente la resistencia', 'Todos lo adopten rápido', 'No pase nada'], correcta: 0 },
    { texto: '¿Qué se hace después del lanzamiento de un cambio?', opciones: ['Nada: ya terminó', 'Hacer seguimiento y ajustar lo que haga falta', 'Volver a la forma anterior'], correcta: 1 },
  ],
  'emp-4': [
    { texto: '¿Qué busca el desarrollo organizacional?', opciones: ['Mejorar el funcionamiento de la organización trabajando con las personas', 'Reducir el tamaño de la empresa', 'Cambiar el logo y los colores'], correcta: 0 },
    { texto: '¿Cuál es un ejemplo de actividad de desarrollo organizacional?', opciones: ['Un taller de trabajo en equipo', 'Una auditoría de inventario', 'Una factura'], correcta: 0 },
    { texto: 'Estas actividades funcionan mejor cuando…', opciones: ['Solo asiste la gerencia', 'Las personas participan activamente', 'Se hacen sin objetivo'], correcta: 1 },
  ],
  'emp-5': [
    { texto: 'La actitud de una persona frente al cambio…', opciones: ['No afecta a nadie más', 'Puede contagiarse al resto del equipo', 'Solo importa en los jefes'], correcta: 1 },
    { texto: 'Ante un comentario negativo sobre el cambio, lo más útil es…', opciones: ['Ignorarlo', 'Escuchar la preocupación y proponer cómo resolverla', 'Repetirlo a otros compañeros'], correcta: 1 },
    { texto: 'Tener una buena actitud significa…', opciones: ['Negar que hay dificultades', 'Reconocer las dificultades y buscar soluciones', 'Aceptar todo sin preguntar'], correcta: 1 },
  ],
  'lid-1': [
    { texto: 'En tiempos de incertidumbre, un líder debe…', opciones: ['Callar hasta tener todas las respuestas', 'Comunicar con claridad y frecuencia, aun sin tener todas las respuestas', 'Delegar toda la comunicación a otros'], correcta: 1 },
    { texto: '¿Qué papel tiene escuchar al equipo?', opciones: ['Es un gasto de tiempo', 'Permite detectar preocupaciones y ajustar el rumbo', 'Solo se hace al final del año'], correcta: 1 },
    { texto: 'En una etapa turbulenta, la prioridad del líder es…', opciones: ['Dar dirección y cuidar a las personas', 'Evitar el contacto con el equipo', 'Cambiar de objetivos cada semana'], correcta: 0 },
  ],
  'lid-2': [
    { texto: 'En el modelo de 8 pasos de Kotter, ¿cuál es el primero?', opciones: ['Crear sentido de urgencia', 'Anclar los cambios en la cultura', 'Celebrar la victoria final'], correcta: 0 },
    { texto: '¿Cuál es el segundo paso de Kotter?', opciones: ['Formar una coalición que guíe el cambio', 'Ignorar los obstáculos', 'Cerrar el proyecto'], correcta: 0 },
    { texto: '¿Cuál es el último paso de Kotter?', opciones: ['Crear una visión', 'Anclar los nuevos enfoques en la cultura', 'Generar victorias a corto plazo'], correcta: 1 },
  ],
};

/** Preguntas sin la respuesta, para enviar al navegador. */
export const preguntasPublicas = (videoId) =>
  (PREGUNTAS[videoId] ?? []).map(({ texto, opciones }) => ({ texto, opciones }));

/** Cuenta aciertos. Devuelve null si las respuestas no corresponden a las preguntas. */
export function calificar(videoId, respuestas) {
  const preguntas = PREGUNTAS[videoId];
  if (!preguntas || !Array.isArray(respuestas) || respuestas.length !== preguntas.length) return null;
  if (!respuestas.every((r, i) => Number.isInteger(r) && r >= 0 && r < preguntas[i].opciones.length)) return null;
  return { aciertos: preguntas.filter((p, i) => p.correcta === respuestas[i]).length, total: preguntas.length };
}
