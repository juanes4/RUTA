import { createHash, randomBytes } from 'node:crypto';
import { hashClave, verificarClave } from './clave.mjs';

const COOKIE = 'ruta_sesion';
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;
const MAX_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
/** Hash de relleno: así una clave se verifica aunque el usuario no exista (no revela qué usuarios hay). */
const HASH_RELLENO = hashClave('relleno-sin-uso');

const sha256 = (texto) => createHash('sha256').update(texto).digest('hex');

function enviar(res, estado, cuerpo, cabeceras = {}) {
  res.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cabeceras });
  res.end(JSON.stringify(cuerpo));
}

function leerCookie(req, nombre) {
  for (const par of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = par.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return null;
}

function leerJson(req) {
  return new Promise((resolver, rechazar) => {
    let texto = '';
    req.on('data', (trozo) => {
      texto += trozo;
      if (texto.length > 10_000) {
        rechazar(new Error('Cuerpo demasiado grande'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolver(texto ? JSON.parse(texto) : {});
      } catch {
        rechazar(new Error('JSON inválido'));
      }
    });
    req.on('error', rechazar);
  });
}

const publico = (u) => ({ id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol });

/**
 * Crea el manejador de la API (/api/*). Devuelve false si la ruta no es de la
 * API, para que el servidor siga con lo suyo. `db` es una base de abrirBase().
 */
export function crearApi(db, { seguro = false } = {}) {
  const intentos = new Map(); // usuario -> { n, hasta }

  const sesionDe = (req) => {
    const token = leerCookie(req, COOKIE);
    if (!token) return null;
    const fila = db
      .prepare(
        `SELECT u.id, u.usuario, u.nombre, u.rol, s.expira_en FROM sesiones s
         JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ?`,
      )
      .get(sha256(token));
    if (!fila) return null;
    if (fila.expira_en < Date.now()) {
      db.prepare('DELETE FROM sesiones WHERE token_hash = ?').run(sha256(token));
      return null;
    }
    return fila;
  };

  const cookie = (valor, maxAgeSeg) =>
    `${COOKIE}=${encodeURIComponent(valor)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeg}${seguro ? '; Secure' : ''}`;

  /** Videos que el usuario puede ver: los líderes ven todos; los empleados solo los de empleado. */
  const audienciasDe = (rol) => (rol === 'lider' ? ['lider', 'empleado'] : ['empleado']);

  const rutas = {
    'POST /api/login': async (req, res) => {
      const { usuario, clave } = await leerJson(req);
      if (typeof usuario !== 'string' || typeof clave !== 'string' || !usuario || !clave) {
        return enviar(res, 400, { error: 'Escribe tu usuario y tu clave.' });
      }
      const llave = usuario.toLowerCase();
      const previo = intentos.get(llave);
      if (previo && previo.n >= MAX_INTENTOS && previo.hasta > Date.now()) {
        return enviar(res, 429, { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' });
      }
      const fila = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario);
      const ok = verificarClave(clave, fila?.clave_hash ?? HASH_RELLENO) && Boolean(fila);
      if (!ok) {
        intentos.set(llave, { n: (previo && previo.hasta > Date.now() ? previo.n : 0) + 1, hasta: Date.now() + BLOQUEO_MS });
        return enviar(res, 401, { error: 'Usuario o clave incorrectos.' });
      }
      intentos.delete(llave);
      db.prepare('DELETE FROM sesiones WHERE expira_en < ?').run(Date.now());
      const token = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sesiones (token_hash, usuario_id, expira_en) VALUES (?, ?, ?)').run(
        sha256(token),
        fila.id,
        Date.now() + DURACION_SESION_MS,
      );
      enviar(res, 200, { usuario: publico(fila) }, { 'Set-Cookie': cookie(token, DURACION_SESION_MS / 1000) });
    },

    'POST /api/logout': async (req, res) => {
      const token = leerCookie(req, COOKIE);
      if (token) db.prepare('DELETE FROM sesiones WHERE token_hash = ?').run(sha256(token));
      enviar(res, 200, { ok: true }, { 'Set-Cookie': cookie('', 0) });
    },

    'GET /api/sesion': async (req, res) => {
      const u = sesionDe(req);
      enviar(res, 200, { usuario: u ? publico(u) : null });
    },

    'GET /api/videos': async (req, res) => {
      const u = sesionDe(req);
      if (!u) return enviar(res, 401, { error: 'Inicia sesión.' });
      const aud = audienciasDe(u.rol);
      const filas = db
        .prepare(
          `SELECT v.id, v.titulo, v.youtube_id, v.audiencia, v.orden, s.visto_en
           FROM videos v LEFT JOIN vistas s ON s.video_id = v.id AND s.usuario_id = ?
           WHERE v.audiencia IN (${aud.map(() => '?').join(',')})
           ORDER BY v.audiencia = 'lider' DESC, v.orden`,
        )
        .all(u.id, ...aud);
      enviar(res, 200, {
        videos: filas.map((f) => ({
          id: f.id,
          titulo: f.titulo,
          youtubeId: f.youtube_id,
          audiencia: f.audiencia,
          visto: Boolean(f.visto_en),
          vistoEn: f.visto_en,
        })),
      });
    },

    'POST /api/vistas': async (req, res) => {
      const u = sesionDe(req);
      if (!u) return enviar(res, 401, { error: 'Inicia sesión.' });
      const { videoId } = await leerJson(req);
      const video = typeof videoId === 'string' ? db.prepare('SELECT id, audiencia FROM videos WHERE id = ?').get(videoId) : null;
      // Un video exclusivo de líderes responde igual que uno que no existe.
      if (!video || !audienciasDe(u.rol).includes(video.audiencia)) return enviar(res, 404, { error: 'Video no encontrado.' });
      db.prepare('INSERT OR IGNORE INTO vistas (usuario_id, video_id) VALUES (?, ?)').run(u.id, video.id);
      const { visto_en } = db.prepare('SELECT visto_en FROM vistas WHERE usuario_id = ? AND video_id = ?').get(u.id, video.id);
      enviar(res, 200, { videoId: video.id, vistoEn: visto_en });
    },

    'GET /api/historial': async (req, res) => {
      const u = sesionDe(req);
      if (!u) return enviar(res, 401, { error: 'Inicia sesión.' });
      const esLider = u.rol === 'lider';
      const aud = audienciasDe(u.rol);
      const videos = db
        .prepare(
          `SELECT id, titulo, youtube_id, audiencia FROM videos
           WHERE audiencia IN (${aud.map(() => '?').join(',')}) ORDER BY audiencia = 'lider' DESC, orden`,
        )
        .all(...aud);
      // Un líder ve quién vio cada video; un empleado solo ve sus propias vistas.
      const vistas = db
        .prepare(
          `SELECT s.video_id, s.visto_en, u.id AS usuario_id, u.nombre, u.rol FROM vistas s
           JOIN usuarios u ON u.id = s.usuario_id
           ${esLider ? '' : 'WHERE u.id = ?'} ORDER BY s.visto_en DESC`,
        )
        .all(...(esLider ? [] : [u.id]));
      const totalUsuarios = db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n;
      const totalLideres = db.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'lider'").get().n;
      enviar(res, 200, {
        verTodos: esLider,
        videos: videos.map((v) => ({
          id: v.id,
          titulo: v.titulo,
          youtubeId: v.youtube_id,
          audiencia: v.audiencia,
          // Personas que pueden ver el video: todos los usuarios (empleado) o solo los líderes.
          elegibles: v.audiencia === 'lider' ? totalLideres : totalUsuarios,
          vistas: vistas
            .filter((s) => s.video_id === v.id)
            .map((s) => ({ usuarioId: s.usuario_id, nombre: s.nombre, rol: s.rol, vistoEn: s.visto_en })),
        })),
      });
    },
  };

  return async function manejar(req, res) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/')) return false;
    const manejador = rutas[`${req.method} ${url.pathname}`];
    if (!manejador) {
      enviar(res, 404, { error: 'No existe.' });
      return true;
    }
    // Defensa CSRF básica: las escrituras deben ser JSON y del mismo origen.
    if (req.method === 'POST') {
      const origen = req.headers.origin;
      const tipo = String(req.headers['content-type'] ?? '');
      if (!tipo.includes('application/json') || (origen && new URL(origen).host !== req.headers.host)) {
        enviar(res, 403, { error: 'Solicitud no permitida.' });
        return true;
      }
    }
    try {
      await manejador(req, res);
    } catch (e) {
      if (!res.headersSent) enviar(res, 400, { error: e instanceof Error ? e.message : 'Error' });
    }
    return true;
  };
}
