/**
 * Cliente mínimo de la API de Gemini (generateContent, REST).
 *
 * - Claves: GEMINI_API_KEY y, opcional, GEMINI_API_KEY_RESPALDO. Viven solo en
 *   el servidor, nunca se devuelven al navegador ni aparecen en los mensajes.
 * - Modelos: GEMINI_MODEL es el que se quiere usar. Si no funciona, se prueban
 *   en orden los de GEMINI_MODELOS_RESPALDO (separados por comas, del más al
 *   menos potente). Todo se cambia en el .env, sin tocar el código.
 *
 * Para cada modelo se prueba cada clave. Si el problema es del modelo
 * (saturado, sin respuesta, no existe, no acepta la solicitud) se pasa al
 * siguiente modelo; si es de la clave (sin cuota, rechazada) se prueba la otra.
 *
 * Razonamiento: los modelos Gemini 3 piensan antes de responder y, por omisión,
 * piensan mucho ("high"), que es lo que más demora cada respuesta. Las tareas
 * del copiloto son acotadas (clasificar, entrevistar, proponer), así que se
 * pide un nivel bajo. GEMINI_RAZONAMIENTO lo cambia (minimal, low, medium,
 * high); con "auto" se deja el del modelo. Solo se envía a los modelos gemini-3*;
 * si un modelo no lo acepta, se repite la solicitud sin él.
 */

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
/** Espera máxima del último intento, y de cada intento cuando quedan otros modelos por probar. */
const ESPERA_ULTIMO_MS = 120_000;
const ESPERA_CON_RESPALDO_MS = 75_000;
/** Esperas antes de reintentar una saturación (503), solo cuando ya no quedan otros modelos. */
const ESPERAS_REINTENTO = [2_000, 6_000];
const NIVELES_RAZONAMIENTO = ['minimal', 'low', 'medium', 'high'];
const RAZONAMIENTO_POR_OMISION = 'low';

export class ErrorGemini extends Error {
  /** @param {string} mensaje @param {number} estado código HTTP que la app devuelve al navegador */
  constructor(mensaje, estado = 502) {
    super(mensaje);
    this.estado = estado;
  }
}

const sinPrefijo = (m) => m.trim().replace(/^models\//, '');
const unicos = (xs) => xs.filter((x, i) => x && xs.indexOf(x) === i);

export function configGemini(env = process.env) {
  const clave = String(env.GEMINI_API_KEY ?? '').trim();
  const respaldo = String(env.GEMINI_API_KEY_RESPALDO ?? '').trim();
  const modelo = sinPrefijo(String(env.GEMINI_MODEL ?? ''));
  const respaldos = String(env.GEMINI_MODELOS_RESPALDO ?? '')
    .split(',')
    .map(sinPrefijo)
    .filter(Boolean);
  const faltan = [!clave && 'GEMINI_API_KEY', !modelo && 'GEMINI_MODEL'].filter(Boolean);
  const claves = unicos([clave, respaldo]);
  const nivel = String(env.GEMINI_RAZONAMIENTO ?? '').trim().toLowerCase();
  const razonamiento = nivel === 'auto' ? null : NIVELES_RAZONAMIENTO.includes(nivel) ? nivel : RAZONAMIENTO_POR_OMISION;
  return { configurado: faltan.length === 0, modelo: modelo || null, modelos: unicos([modelo, ...respaldos]), faltan, claves, conRespaldo: claves.length > 1, razonamiento };
}

/** Solo la familia Gemini 3 entiende thinkingLevel; a Gemma y a los anteriores no se les envía. */
const aceptaNivel = (modelo) => /^gemini-3/.test(modelo);

/** Mensaje claro para cada error de la API, sin repetir la clave. */
function mensajeDeError(estado, detalle, modelo) {
  // Con una clave inválida Gemini responde 400 y lo dice en el detalle.
  if (estado === 400 && /api key/i.test(detalle)) return 'Gemini rechazó la clave: revisa GEMINI_API_KEY en el servidor.';
  if (estado === 400) return `Gemini rechazó la solicitud con el modelo "${modelo}": ${detalle || 'solicitud inválida'}.`;
  if (estado === 401 || estado === 403) return 'Gemini rechazó la clave: revisa GEMINI_API_KEY en el servidor.';
  if (estado === 404) return `Gemini no encontró el modelo "${modelo}".${detalle ? ` Detalle de Google: ${detalle}` : ''}`;
  if (estado === 429 && /quota|billing|plan/i.test(detalle)) {
    return `La clave de Gemini no tiene cuota disponible para el modelo "${modelo}" (plan o facturación en Google AI Studio).`;
  }
  if (estado === 429) return `Se alcanzó el límite de uso de Gemini con el modelo "${modelo}".`;
  if (estado === 503) return `El modelo "${modelo}" de Gemini está saturado en este momento (alta demanda).`;
  if (estado >= 500) return `Gemini no está disponible en este momento (modelo "${modelo}").`;
  return `Gemini respondió con un error (${estado}) con el modelo "${modelo}".`;
}

/** Errores que dependen de la clave: vale la pena probar la otra clave con el mismo modelo. */
const esDeClave = (estado, detalle) => estado === 401 || estado === 403 || estado === 429 || (estado === 400 && /api key/i.test(detalle));

/** Lee el texto (o el JSON) de una respuesta exitosa. Un problema aquí es del contenido, no del modelo ni de la clave. */
async function leerRespuesta(respuesta, esquema) {
  const datos = await respuesta.json().catch(() => ({}));
  if (datos?.promptFeedback?.blockReason) throw new ErrorGemini(`Gemini bloqueó la solicitud (${datos.promptFeedback.blockReason}).`);
  const candidato = datos?.candidates?.[0];
  const razon = candidato?.finishReason;
  // Las partes de razonamiento (thought: true) no son la respuesta.
  const texto = (candidato?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text)
    .join('');
  if (razon === 'MAX_TOKENS') throw new ErrorGemini('La respuesta de Gemini quedó incompleta (límite de longitud). Inténtalo de nuevo.');
  if (razon && razon !== 'STOP') throw new ErrorGemini(`Gemini no completó la respuesta (${razon}).`);
  if (!texto.trim()) throw new ErrorGemini('Gemini devolvió una respuesta vacía.');
  if (!esquema) return texto;
  try {
    return JSON.parse(texto);
  } catch {
    throw new ErrorGemini('Gemini devolvió un JSON que no se pudo leer.');
  }
}

/**
 * Pide una respuesta a Gemini.
 * @param {object} p
 * @param {string} p.sistema instrucción del sistema
 * @param {Array<{rol:'usuario'|'copiloto', texto:string}>} p.contenidos conversación (empieza por el usuario)
 * @param {object} [p.esquema] JSON Schema: si se da, la respuesta es JSON y se devuelve ya interpretada
 * @param {{modelo?: string}} [p.registro] si se da, aquí queda el modelo que respondió
 */
export async function generar({ sistema, contenidos, esquema, env = process.env, fetchImpl = fetch, esperas = ESPERAS_REINTENTO, registro }) {
  const config = configGemini(env);
  if (!config.configurado) throw new ErrorGemini(`Gemini no está configurado en el servidor (falta ${config.faltan.join(' y ')}).`, 503);

  const base = {
    systemInstruction: { parts: [{ text: sistema }] },
    contents: contenidos.map((c) => ({ role: c.rol === 'copiloto' ? 'model' : 'user', parts: [{ text: c.texto }] })),
  };
  /** Cuerpo para un modelo: con el nivel de razonamiento solo si el modelo lo acepta. */
  const cuerpoPara = (modelo, conNivel) => {
    const generationConfig = {
      ...(esquema ? { responseMimeType: 'application/json', responseJsonSchema: esquema } : {}),
      ...(conNivel ? { thinkingConfig: { thinkingLevel: config.razonamiento } } : {}),
    };
    return JSON.stringify(Object.keys(generationConfig).length ? { ...base, generationConfig } : base);
  };
  // Modelos que rechazaron thinkingLevel: se les pide sin él.
  const sinNivel = new Set();
  const ocultarClaves = (texto) => config.claves.reduce((t, k) => t.split(k).join('[clave]'), String(texto ?? ''));

  /** Una llamada. Devuelve la respuesta, o un ErrorGemini si no hubo respuesta a tiempo. */
  const pedirUna = (modelo, clave, esperaMs) =>
    fetchImpl(`${URL_BASE}/${encodeURIComponent(modelo)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': clave },
      body: cuerpoPara(modelo, Boolean(config.razonamiento) && aceptaNivel(modelo) && !sinNivel.has(modelo)),
      signal: AbortSignal.timeout(esperaMs),
    });
  const pedir = async (modelo, clave, esperaMs) => {
    try {
      const respuesta = await pedirUna(modelo, clave, esperaMs);
      // Un modelo que no acepta el nivel de razonamiento responde 400 y lo nombra: se repite sin él.
      if (respuesta.status === 400 && !sinNivel.has(modelo) && aceptaNivel(modelo) && config.razonamiento) {
        const detalle = await respuesta.clone().text().catch(() => '');
        if (/thinking/i.test(detalle)) {
          sinNivel.add(modelo);
          return await pedirUna(modelo, clave, esperaMs);
        }
      }
      return respuesta;
    } catch (e) {
      const tiempo = e?.name === 'TimeoutError' || e?.name === 'AbortError';
      return new ErrorGemini(tiempo ? `El modelo "${modelo}" de Gemini no respondió a tiempo.` : 'No se pudo conectar con Gemini. Revisa la conexión del servidor.', 504);
    }
  };

  const fallas = [];
  for (const [m, modelo] of config.modelos.entries()) {
    const ultimoModelo = m === config.modelos.length - 1;
    const esperaMs = ultimoModelo ? ESPERA_ULTIMO_MS : ESPERA_CON_RESPALDO_MS;
    for (const clave of config.claves) {
      let respuesta = await pedir(modelo, clave, esperaMs);
      // Sin otros modelos que probar, una saturación pasajera se reintenta un par de veces.
      if (ultimoModelo) {
        for (const espera of esperas) {
          if (respuesta instanceof ErrorGemini || respuesta.status !== 503) break;
          await new Promise((r) => setTimeout(r, espera));
          respuesta = await pedir(modelo, clave, esperaMs);
        }
      }
      if (respuesta instanceof ErrorGemini) {
        if (respuesta.estado === 504 && /conectar/.test(respuesta.message)) throw respuesta; // sin red: ningún modelo va a responder
        fallas.push(respuesta);
        break; // no respondió: es el modelo, no la clave
      }
      if (respuesta.ok) {
        if (registro) registro.modelo = modelo;
        return leerRespuesta(respuesta, esquema);
      }
      const datos = await respuesta.json().catch(() => ({}));
      const detalle = ocultarClaves(datos?.error?.message).slice(0, 300);
      fallas.push(new ErrorGemini(mensajeDeError(respuesta.status, detalle, modelo), respuesta.status === 429 ? 429 : 502));
      if (!esDeClave(respuesta.status, detalle)) break; // saturado, no existe o no acepta la solicitud: siguiente modelo
    }
  }

  // Ningún modelo funcionó: se informa la última falla y qué se intentó.
  const ultima = fallas.at(-1) ?? new ErrorGemini('Gemini no respondió.');
  const intentos = [
    config.modelos.length > 1 && `se probaron ${config.modelos.length} modelos (${config.modelos.join(', ')})`,
    config.claves.length > 1 && 'con la clave principal y la de respaldo',
  ].filter(Boolean);
  ultima.message = `${ultima.message}${intentos.length ? ` Ninguno funcionó: ${intentos.join(' ')}.` : ''} Inténtalo en unos minutos o usa el modo simulado.`;
  throw ultima;
}
