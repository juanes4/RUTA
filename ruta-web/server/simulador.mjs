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

/**
 * Si es true, al responder se muestra cuál era la correcta y por qué. Sirve para aprender,
 * pero como el simulador se puede repetir, quien lo repite ya conoce las respuestas.
 */
export const MOSTRAR_RESPUESTAS = true;

/** Preguntas vigentes de un video: las aprobadas (generadas con IA) o, si no hay, las base de este archivo. */
export function preguntasDe(db, videoId) {
  const fila = db.prepare("SELECT preguntas FROM preguntas_ia WHERE video_id = ? AND estado = 'aprobada'").get(videoId);
  return fila ? JSON.parse(fila.preguntas) : (PREGUNTAS[videoId] ?? []);
}

/** Preguntas sin la respuesta, para enviar al navegador. */
export const preguntasPublicas = (preguntas) => preguntas.map(({ texto, opciones }) => ({ texto, opciones }));

/** Cuenta aciertos. Devuelve null si las respuestas no corresponden a las preguntas. */
export function calificar(preguntas, respuestas) {
  if (!preguntas.length || !Array.isArray(respuestas) || respuestas.length !== preguntas.length) return null;
  if (!respuestas.every((r, i) => Number.isInteger(r) && r >= 0 && r < preguntas[i].opciones.length)) return null;
  return { aciertos: preguntas.filter((p, i) => p.correcta === respuestas[i]).length, total: preguntas.length };
}

/** Qué acertó cada pregunta y por qué; solo si MOSTRAR_RESPUESTAS. */
export function detalleDeRespuestas(preguntas, respuestas) {
  if (!MOSTRAR_RESPUESTAS) return null;
  return preguntas.map((p, i) => ({ acerto: p.correcta === respuestas[i], elegida: respuestas[i], correcta: p.correcta, explicacion: p.explicacion ?? null }));
}

/* ---------- Seguridad frente a resultado ---------- */

/**
 * Cruza lo que la persona acertó con lo seguro que se siente (autoevaluación 1 a 5).
 * sobreconfianza: muy segura pero no aprobó. subestima: acertó todo y se siente insegura.
 * necesita_apoyo: insegura y sin aprobar. alineado: lo demás.
 */
export function clasificarBrecha(aciertos, total, seguridad) {
  const aprobo = aciertos >= APROBACION_MINIMA;
  if (seguridad >= 4 && !aprobo) return 'sobreconfianza';
  if (seguridad <= 2 && aciertos === total) return 'subestima';
  if (seguridad <= 2 && !aprobo) return 'necesita_apoyo';
  return 'alineado';
}

export const MENSAJE_BRECHA = {
  sobreconfianza: 'Te sientes más seguro de lo que mostró el simulador. Vuelve a ver el video y repasa antes de aplicarlo solo.',
  subestima: 'Acertaste todo y aun así te sientes inseguro. Tienes más dominio del que crees; practícalo con un compañero.',
  necesita_apoyo: 'Todavía no te sientes seguro y el simulador lo confirma. Es normal: vuelve a ver el video y pide acompañamiento a tu líder.',
  alineado: 'Tu seguridad coincide con tu resultado.',
};

/** Forma única del resultado que sale en /api/videos, /api/historial y al responder. */
export function resultadoPublico(aciertos, total, seguridad) {
  const brecha = clasificarBrecha(aciertos, total, seguridad);
  return { aciertos, total, aprobado: aciertos >= APROBACION_MINIMA, seguridad, brecha, mensaje: MENSAJE_BRECHA[brecha] };
}

/* ---------- Preguntas generadas: validación ---------- */

const esTexto = (v, min, max) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;

/** Valida y normaliza 3 preguntas {texto, opciones[3], correcta, explicacion}. Lanza Error si algo no cumple. */
export function validarPreguntas(lista) {
  if (!Array.isArray(lista) || lista.length !== 3) throw new Error('Deben ser exactamente 3 preguntas.');
  return lista.map((q, i) => {
    const n = i + 1;
    if (!q || typeof q !== 'object') throw new Error(`La pregunta ${n} no es válida.`);
    if (!esTexto(q.texto, 5, 300)) throw new Error(`La pregunta ${n} necesita un enunciado.`);
    if (!Array.isArray(q.opciones) || q.opciones.length !== 3 || !q.opciones.every((o) => esTexto(o, 1, 200))) {
      throw new Error(`La pregunta ${n} necesita exactamente 3 opciones.`);
    }
    if (new Set(q.opciones.map((o) => o.trim().toLowerCase())).size !== 3) throw new Error(`La pregunta ${n} tiene opciones repetidas.`);
    if (!Number.isInteger(q.correcta) || q.correcta < 0 || q.correcta > 2) throw new Error(`La pregunta ${n} necesita una respuesta correcta (0 a 2).`);
    if (!esTexto(q.explicacion, 5, 500)) throw new Error(`La pregunta ${n} necesita una explicación.`);
    return { texto: q.texto.trim(), opciones: q.opciones.map((o) => o.trim()), correcta: q.correcta, explicacion: q.explicacion.trim() };
  });
}
