import { timingSafeEqual } from 'node:crypto';

/**
 * R5. Buzón 1 desde Google Forms (opción 2: Apps Script al enviar).
 *
 * - POST /api/buzon/recibir: lo llama el Apps Script con la clave en X-Api-Key
 *   (RUTA_BUZON_API_KEY). Guarda la respuesta sin IP ni datos del navegador.
 * - Mientras el buzón está abierto, gestión del cambio solo ve cuántas
 *   respuestas van (GET /api/buzon/estado), sin leerlas una por una.
 * - Al cerrarlo (POST /api/buzon/cerrar) se pueden traer todas
 *   (GET /api/buzon/respuestas) en la tabla id, fecha, area, grupo, p1, p2, p3.
 */

const MAX_TEXTO = 5_000;
const ID_BUZON = /^[A-Za-z0-9_-]{3,80}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function claveValida(recibida, esperada) {
  if (!esperada || typeof recibida !== 'string') return false;
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

const texto = (v, max = MAX_TEXTO) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function rutasBuzonForms({ db, sesionDe, enviar, leerJson, env = process.env }) {
  const exigirLider = (req, res) => {
    const u = sesionDe(req);
    if (!u) enviar(res, 401, { error: 'Inicia sesión.' });
    else if (u.rol !== 'lider') enviar(res, 403, { error: 'Solo el equipo de gestión del cambio (rol líder) maneja el buzón.' });
    return u?.rol === 'lider';
  };

  const buzonDe = (url) => {
    const id = new URL(url ?? '/', 'http://localhost').searchParams.get('buzon') ?? '';
    return ID_BUZON.test(id) ? id : null;
  };

  const estado = (id) => {
    const b = db.prepare('SELECT estado, cerrado_en FROM buzones WHERE buzon_id = ?').get(id);
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM buzon_respuestas WHERE buzon_id = ?').get(id);
    return { buzon: id, estado: b?.estado ?? 'abierto', existe: Boolean(b), respuestas: n, cerradoEn: b?.cerrado_en ?? null };
  };

  return {
    'POST /api/buzon/recibir': async (req, res) => {
      const esperada = String(env.RUTA_BUZON_API_KEY ?? '').trim();
      if (!esperada) return enviar(res, 503, { error: 'El buzón en línea no está configurado (falta RUTA_BUZON_API_KEY).' });
      if (!claveValida(req.headers['x-api-key'], esperada)) return enviar(res, 401, { error: 'Clave inválida.' });
      const r = await leerJson(req);
      const buzon = texto(r.buzon_id, 80);
      const id = texto(r.id, 80);
      if (!ID_BUZON.test(buzon) || !id) return enviar(res, 400, { error: 'Faltan buzon_id o id.' });
      const respuesta = { p1: texto(r.p1), p2: texto(r.p2), p3: texto(r.p3) };
      if (!respuesta.p1 && !respuesta.p2 && !respuesta.p3) return enviar(res, 400, { error: 'La respuesta está vacía.' });
      const b = db.prepare('SELECT estado FROM buzones WHERE buzon_id = ?').get(buzon);
      if (b?.estado === 'cerrado') return enviar(res, 409, { error: 'El buzón está cerrado.' });
      if (!b) db.prepare("INSERT INTO buzones (buzon_id, estado) VALUES (?, 'abierto')").run(buzon);
      // Solo la fecha (sin hora), el área y el grupo: nada de IP ni del navegador.
      const fecha = FECHA.test(String(r.fecha ?? '')) ? r.fecha : new Date().toISOString().slice(0, 10);
      // Reenviar la misma respuesta (mismo id) no la duplica.
      db.prepare(
        `INSERT OR IGNORE INTO buzon_respuestas (buzon_id, id, fecha, area, grupo, p1, p2, p3) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(buzon, id, fecha, texto(r.area, 120), texto(r.grupo, 60), respuesta.p1, respuesta.p2, respuesta.p3);
      enviar(res, 200, { ok: true });
    },

    'GET /api/buzon/estado': async (req, res) => {
      if (!exigirLider(req, res)) return;
      const id = buzonDe(req.url);
      if (!id) return enviar(res, 400, { error: 'Identificador de buzón inválido (letras, números, - y _).' });
      enviar(res, 200, estado(id));
    },

    'POST /api/buzon/cerrar': async (req, res) => {
      if (!exigirLider(req, res)) return;
      const { buzon } = await leerJson(req);
      if (typeof buzon !== 'string' || !ID_BUZON.test(buzon)) return enviar(res, 400, { error: 'Identificador de buzón inválido.' });
      db.prepare(
        `INSERT INTO buzones (buzon_id, estado, cerrado_en) VALUES (?, 'cerrado', datetime('now'))
         ON CONFLICT(buzon_id) DO UPDATE SET estado = 'cerrado', cerrado_en = COALESCE(cerrado_en, datetime('now'))`,
      ).run(buzon);
      enviar(res, 200, estado(buzon));
    },

    'GET /api/buzon/respuestas': async (req, res) => {
      if (!exigirLider(req, res)) return;
      const id = buzonDe(req.url);
      if (!id) return enviar(res, 400, { error: 'Identificador de buzón inválido.' });
      if (estado(id).estado !== 'cerrado') return enviar(res, 409, { error: 'El buzón sigue abierto: ciérralo para ver las respuestas.' });
      const filas = db
        .prepare('SELECT id, fecha, area, grupo, p1, p2, p3 FROM buzon_respuestas WHERE buzon_id = ? ORDER BY fecha, rowid')
        .all(id)
        .map((f) => ({ ...f }));
      enviar(res, 200, { buzon: id, filas });
    },
  };
}
