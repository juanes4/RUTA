import { configIA, agregarEquipo, generarPreguntasIA, minimoGrupoIA, resumenPorReglas, resumirEquipoIA } from './ia.mjs';
import { PREGUNTAS, resultadoPublico } from './simulador.mjs';

/**
 * Rutas de los agentes de IA de T2 (solo líderes). Se suman a las de api.mjs.
 * Las preguntas generadas son borrador hasta que un líder las aprueba.
 */
export function rutasIaT({ db, sesionDe, enviar, leerJson, ia }) {
  /** Sesión de un líder; si no hay o no es líder, responde el error y devuelve null. */
  const soloLider = (req, res) => {
    const u = sesionDe(req);
    if (!u) enviar(res, 401, { error: 'Inicia sesión.' });
    else if (u.rol !== 'lider') enviar(res, 403, { error: 'Esto es solo para líderes.' });
    else return u;
    return null;
  };

  const videoPorId = (id) => (typeof id === 'string' ? db.prepare('SELECT id, titulo, audiencia FROM videos WHERE id = ?').get(id) : undefined);

  return {
    'GET /api/ia/preguntas': async (req, res) => {
      if (!soloLider(req, res)) return;
      const videos = db.prepare("SELECT id, titulo, audiencia FROM videos ORDER BY audiencia = 'lider' DESC, orden").all();
      const filas = db.prepare('SELECT video_id, estado, preguntas, creado_en FROM preguntas_ia').all();
      const de = (id, estado) => {
        const f = filas.find((x) => x.video_id === id && x.estado === estado);
        return f ? { creadoEn: f.creado_en, preguntas: JSON.parse(f.preguntas) } : null;
      };
      enviar(res, 200, {
        iaDisponible: Boolean(configIA(ia)),
        videos: videos.map((v) => ({
          ...v,
          // Las publicadas son las aprobadas; si no hay, el banco base de server/simulador.mjs.
          publicadas: de(v.id, 'aprobada') ?? { creadoEn: null, preguntas: PREGUNTAS[v.id] ?? [], base: true },
          borrador: de(v.id, 'borrador'),
        })),
      });
    },

    'POST /api/ia/preguntas/generar': async (req, res) => {
      if (!soloLider(req, res)) return;
      const { videoId, contexto } = await leerJson(req);
      const video = videoPorId(videoId);
      if (!video) return enviar(res, 404, { error: 'Video no encontrado.' });
      if (contexto !== undefined && (typeof contexto !== 'string' || contexto.length > 12_000)) {
        return enviar(res, 400, { error: 'El texto de apoyo es demasiado largo (máximo 12 000 caracteres).' });
      }
      const config = configIA(ia);
      if (!config) return enviar(res, 503, { error: 'La IA no está configurada. Agrega GEMINI_API_KEY en el archivo .env y reinicia el servidor.' });
      let preguntas;
      try {
        preguntas = await generarPreguntasIA({ titulo: video.titulo, audiencia: video.audiencia, contexto }, config);
      } catch (e) {
        return enviar(res, 502, { error: e instanceof Error ? e.message : 'No se pudieron generar las preguntas.' });
      }
      db.prepare("INSERT OR REPLACE INTO preguntas_ia (video_id, estado, preguntas) VALUES (?, 'borrador', ?)").run(video.id, JSON.stringify(preguntas));
      enviar(res, 200, { videoId: video.id, borrador: { creadoEn: null, preguntas } });
    },

    'POST /api/ia/preguntas/aprobar': async (req, res) => {
      if (!soloLider(req, res)) return;
      const { videoId } = await leerJson(req);
      const fila = typeof videoId === 'string' ? db.prepare("SELECT preguntas FROM preguntas_ia WHERE video_id = ? AND estado = 'borrador'").get(videoId) : undefined;
      if (!fila) return enviar(res, 404, { error: 'No hay un borrador para aprobar.' });
      db.exec('BEGIN');
      try {
        db.prepare("INSERT OR REPLACE INTO preguntas_ia (video_id, estado, preguntas) VALUES (?, 'aprobada', ?)").run(videoId, fila.preguntas);
        db.prepare("DELETE FROM preguntas_ia WHERE video_id = ? AND estado = 'borrador'").run(videoId);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
      enviar(res, 200, { videoId, publicadas: { creadoEn: null, preguntas: JSON.parse(fila.preguntas) } });
    },

    'POST /api/ia/preguntas/descartar': async (req, res) => {
      if (!soloLider(req, res)) return;
      const { videoId } = await leerJson(req);
      if (typeof videoId !== 'string') return enviar(res, 400, { error: 'Falta el video.' });
      db.prepare("DELETE FROM preguntas_ia WHERE video_id = ? AND estado = 'borrador'").run(videoId);
      enviar(res, 200, { ok: true });
    },

    'POST /api/ia/resumen': async (req, res) => {
      if (!soloLider(req, res)) return;
      const videos = db.prepare("SELECT id, titulo, audiencia FROM videos ORDER BY audiencia = 'lider' DESC, orden").all();
      const filas = db
        .prepare('SELECT video_id, aciertos, total, seguridad FROM simulacros')
        .all()
        .map((f) => ({ ...f, ...resultadoPublico(f.aciertos, f.total, f.seguridad) }));
      const agregado = agregarEquipo(videos, filas);
      const config = configIA(ia);
      if (config) {
        try {
          const texto = await resumirEquipoIA(agregado, config);
          if (texto) return enviar(res, 200, { texto, origen: 'ia' });
          return enviar(res, 200, {
            texto: `Todavía no hay ${minimoGrupoIA()} o más personas con resultado en un mismo video: la IA no analiza grupos más pequeños para proteger a las personas.\n\n${resumenPorReglas(agregado)}`,
            origen: 'reglas',
          });
        } catch {
          // Si la IA falla, el líder igual recibe el resumen por reglas.
        }
      }
      enviar(res, 200, { texto: resumenPorReglas(agregado), origen: 'reglas' });
    },
  };
}
