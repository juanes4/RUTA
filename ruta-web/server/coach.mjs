import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { construirPromptCoach, formatearDocumentosOficiales } from './prompts/coachRutaAndi.js';

const DIR_ACTUAL = dirname(fileURLToPath(import.meta.url));
const RUTAS_ENV = [
  resolve(DIR_ACTUAL, '../.env'), // ruta-web/.env (si existe)
  resolve(DIR_ACTUAL, '../../.env'), // raíz del repositorio (.env)
];

for (const rutaEnv of RUTAS_ENV) {
  if (existsSync(rutaEnv)) {
    dotenv.config({ path: rutaEnv, quiet: true });
  }
}

export const MODELO_COACH = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
const MODELOS_RESPALDO = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
export const TEMPERATURA_COACH = 0.4;
const TIMEOUT_MODELO_MS = 15_000;
const MAX_TURNS_HISTORIAL = 40;
const MAX_LARGO_MENSAJE = 4000;
const MAX_BODY_COACH = 250_000;

/**
 * Extrae el objeto JSON de escalamiento ("tipo": "sin_respuesta_oficial") si viene en la respuesta del modelo.
 */
export function extraerEscalamiento(texto) {
  if (typeof texto !== 'string' || !texto.includes('sin_respuesta_oficial')) return null;

  const candidatos = [];
  const regexBloque = /```(?:json)?\s*([\s\S]*?)```/gi;
  let coincidencia;
  while ((coincidencia = regexBloque.exec(texto)) !== null) {
    candidatos.push(coincidencia[1].trim());
  }

  // Fallback: buscar objetos JSON sueltos en el texto si no vino cercado con ```
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  if (inicio !== -1 && fin > inicio) {
    candidatos.push(texto.slice(inicio, fin + 1));
  }

  for (const bloque of candidatos) {
    try {
      const parsed = JSON.parse(bloque);
      if (parsed && typeof parsed === 'object' && parsed.tipo === 'sin_respuesta_oficial') {
        return {
          fecha: typeof parsed.fecha === 'string' ? parsed.fecha : new Date().toISOString().slice(0, 10),
          area: typeof parsed.area === 'string' ? parsed.area : '',
          pregunta: typeof parsed.pregunta === 'string' ? parsed.pregunta : '',
          tipo: 'sin_respuesta_oficial',
          estado: typeof parsed.estado === 'string' ? parsed.estado : 'pendiente',
          respuesta_oficial: parsed.respuesta_oficial ?? null,
        };
      }
    } catch {
      // Continuar con el siguiente candidato
    }
  }
  return null;
}

/**
 * Normaliza el historial de conversación al formato `contents` de @google/genai.
 */
function normalizarHistorial(history) {
  if (!Array.isArray(history)) return [];
  const limpio = [];
  for (const turno of history.slice(-MAX_TURNS_HISTORIAL)) {
    if (!turno || typeof turno !== 'object') continue;
    const role = turno.role === 'model' || turno.role === 'assistant' ? 'model' : turno.role === 'user' ? 'user' : null;
    if (!role) continue;
    let texto = '';
    if (typeof turno.text === 'string') {
      texto = turno.text.trim();
    } else if (typeof turno.content === 'string') {
      texto = turno.content.trim();
    } else if (Array.isArray(turno.parts)) {
      texto = turno.parts
        .map((p) => (typeof p?.text === 'string' ? p.text : ''))
        .join('\n')
        .trim();
    }
    if (!texto) continue;
    limpio.push({ role, parts: [{ text: texto.slice(0, 8000) }] });
  }
  return limpio;
}

/**
 * Combina documentos oficiales guardados en SQLite (si existen) con los enviados desde el estado activo del proyecto.
 */
function reunirDocumentosOficiales(db, documentosCliente) {
  const filaDocs = db.prepare("SELECT datos FROM registros WHERE tipo = 'coach_documentos' ORDER BY id DESC LIMIT 1").get();
  const docsGuardados = filaDocs ? JSON.parse(filaDocs.datos) : {};

  const escalamientosResueltos = db
    .prepare("SELECT datos FROM registros WHERE tipo = 'coach_escalamiento' ORDER BY id DESC LIMIT 50")
    .all()
    .map((f) => JSON.parse(f.datos))
    .filter((e) => typeof e?.respuesta_oficial === 'string' && e.respuesta_oficial.trim().length > 0);

  if (typeof documentosCliente === 'string') {
    return {
      ...docsGuardados,
      adicionales: [docsGuardados.adicionales, documentosCliente].filter(Boolean).join('\n\n'),
      escalamientosResueltos,
    };
  }

  return {
    ...docsGuardados,
    ...(documentosCliente && typeof documentosCliente === 'object' ? documentosCliente : {}),
    escalamientosResueltos,
  };
}

/**
 * Llama al SDK oficial @google/genai con temperature: 0.4.
 * Si el modelo principal devuelve 503 (alta demanda) o 404 (no disponible para la cuenta),
 * intenta automáticamente con los modelos Flash de respaldo.
 */
async function llamarGemini({ systemInstruction, contents }) {
  // Re-cargar .env si la clave no estaba presente aún (por ejemplo, si el usuario la pegó sin reiniciar).
  if (!process.env.GEMINI_API_KEY?.trim()) {
    for (const rutaEnv of RUTAS_ENV) {
      if (existsSync(rutaEnv)) {
        dotenv.config({ path: rutaEnv, override: true, quiet: true });
      }
    }
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const err = new Error('Falta configurar GEMINI_API_KEY en el archivo .env de la raíz del proyecto.');
    err.codigoHttp = 503;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });
  const candidatos = [...new Set([MODELO_COACH, ...MODELOS_RESPALDO])];
  let ultimoError = null;

  for (const modelo of candidatos) {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MODELO_MS);
    try {
      const response = await ai.models.generateContent({
        model: modelo,
        contents,
        config: {
          systemInstruction,
          temperature: TEMPERATURA_COACH,
          abortSignal: controlador.signal,
        },
      });
      const reply = (response.text ?? '').trim();
      if (!reply) {
        const err = new Error('El asistente devolvió una respuesta vacía. Intenta reformular tu consulta.');
        err.codigoHttp = 502;
        throw err;
      }
      return reply;
    } catch (e) {
      ultimoError = e;
      const estado = e?.status;
      const esTimeout = e?.name === 'AbortError' || controlador.signal.aborted;
      // Fallback automático ante alta demanda (503), modelo no disponible (404), límite temporal (429) o timeout.
      if (!esTimeout && estado !== 503 && estado !== 404 && estado !== 429) {
        throw e;
      }
      console.warn(`[Coach Gemini] ${modelo} falló (${esTimeout ? 'timeout' : estado}); intentando modelo de respaldo…`);
    } finally {
      clearTimeout(temporizador);
    }
  }

  throw ultimoError;
}

/**
 * Rutas del Coach de Comunicación para Líderes (Paso U3).
 */
export function rutasCoach({ db, sesionDe, enviar, leerJson, coachResponder = llamarGemini }) {
  const exigirSesion = (req, res) => {
    const u = sesionDe(req);
    if (!u) enviar(res, 401, { error: 'Inicia sesión para usar el Coach de Líderes.' });
    return u;
  };

  return {
    'POST /api/coach/chat': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;

      const cuerpo = await leerJson(req, MAX_BODY_COACH);
      const message = typeof cuerpo?.message === 'string' ? cuerpo.message.trim() : '';
      if (!message) {
        return enviar(res, 400, { error: 'Escribe un mensaje para consultar al Coach.' });
      }
      if (message.length > MAX_LARGO_MENSAJE) {
        return enviar(res, 400, { error: `El mensaje no debe superar ${MAX_LARGO_MENSAJE} caracteres.` });
      }

      const liderConfig = cuerpo?.liderConfig && typeof cuerpo.liderConfig === 'object' ? cuerpo.liderConfig : {};
      const area = typeof liderConfig.area === 'string' ? liderConfig.area.trim() : '';
      const estiloU1 = typeof liderConfig.estiloU1 === 'string' ? liderConfig.estiloU1.trim() : '';

      const documentosOficiales = reunirDocumentosOficiales(db, cuerpo?.documentosOficiales ?? null);
      const { detectados: documentosDetectados } = formatearDocumentosOficiales(documentosOficiales);

      const fechaActual = new Date().toISOString().slice(0, 10);
      const systemInstruction = construirPromptCoach({
        area,
        estiloU1,
        documentosOficiales,
        fechaActual,
      });

      const historialPrevio = normalizarHistorial(cuerpo?.history);
      const contents = [...historialPrevio, { role: 'user', parts: [{ text: message }] }];

      try {
        const reply = await coachResponder({
          model: MODELO_COACH,
          temperature: TEMPERATURA_COACH,
          systemInstruction,
          contents,
          liderConfig: { area, estiloU1 },
        });
        const escalamiento = extraerEscalamiento(reply);
        enviar(res, 200, {
          reply,
          escalamiento,
          documentosDetectados,
          modelo: MODELO_COACH,
        });
      } catch (e) {
        const codigo = Number.isInteger(e?.codigoHttp) ? e.codigoHttp : 502;
        const estadoSdk = e?.status;
        console.error('[Coach Gemini]', estadoSdk ?? codigo, e instanceof Error ? e.message : e);
        let mensaje;
        if (codigo === 503) {
          mensaje = e.message;
        } else if (estadoSdk === 503) {
          mensaje = 'Gemini está con alta demanda en este momento. Intenta de nuevo en unos segundos.';
        } else if (estadoSdk === 429) {
          mensaje = 'Se alcanzó el límite de solicitudes de Gemini. Espera unos segundos e intenta de nuevo.';
        } else if (estadoSdk === 401 || estadoSdk === 403) {
          mensaje = 'La clave GEMINI_API_KEY fue rechazada por Google. Verifica que sea válida y tenga permisos.';
        } else if (estadoSdk === 404) {
          mensaje = `El modelo configurado (${MODELO_COACH}) no está disponible para esta clave de Gemini.`;
        } else {
          mensaje = 'No se pudo obtener respuesta de Gemini. Verifica que GEMINI_API_KEY sea válida y que haya conexión.';
        }
        enviar(res, codigo, { error: mensaje });
      }
    },

    'GET /api/coach/escalamientos': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const filas = db.prepare("SELECT id, datos, creado_en FROM registros WHERE tipo = 'coach_escalamiento' ORDER BY id DESC").all();
      const escalamientos = filas.map((f) => ({
        id: f.id,
        creadoEn: f.creado_en,
        ...JSON.parse(f.datos),
      }));
      enviar(res, 200, { escalamientos });
    },

    'POST /api/coach/escalamientos': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const cuerpo = await leerJson(req);
      const pregunta = typeof cuerpo?.pregunta === 'string' ? cuerpo.pregunta.trim() : '';
      const area = typeof cuerpo?.area === 'string' ? cuerpo.area.trim() : '';
      const fecha = typeof cuerpo?.fecha === 'string' && cuerpo.fecha.trim() ? cuerpo.fecha.trim() : new Date().toISOString().slice(0, 10);
      if (!pregunta) {
        return enviar(res, 400, { error: 'La ficha de escalamiento necesita el resumen de la pregunta.' });
      }

      const ficha = {
        fecha: fecha.slice(0, 30),
        area: (area || 'No especificada').slice(0, 120),
        pregunta: pregunta.slice(0, 1000),
        tipo: 'sin_respuesta_oficial',
        estado: 'pendiente',
        respuesta_oficial: null,
      };

      const { lastInsertRowid } = db
        .prepare("INSERT INTO registros (tipo, usuario_id, datos) VALUES ('coach_escalamiento', NULL, ?)")
        .run(JSON.stringify(ficha));

      enviar(res, 200, {
        id: Number(lastInsertRowid),
        escalamiento: { id: Number(lastInsertRowid), ...ficha },
      });
    },
  };
}
