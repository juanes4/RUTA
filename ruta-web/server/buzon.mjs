import { randomUUID } from 'node:crypto';

/**
 * R5. Buzón 1 respondido desde la app por los colaboradores que hacen parte del cambio.
 *
 * Gestión del cambio (rol líder) abre el buzón y elige a quién convoca. Cada
 * colaborador convocado responde una sola vez desde su cuenta, de forma anónima.
 * Al cerrarlo, gestión del cambio trae las respuestas a R5.
 *
 * Cómo se mantiene el anonimato sin perder el "una sola vez":
 * - buzon_participaciones guarda solo que la persona ya respondió (buzón + usuario),
 *   sin hora ni respuesta.
 * - buzon_anonimas guarda la respuesta con un id aleatorio, solo la fecha (sin
 *   hora), el área y el grupo que la persona eligió. No tiene ninguna referencia
 *   al usuario.
 * - Las dos tablas son WITHOUT ROWID: se ordenan por su llave (usuario y id
 *   aleatorio), no por orden de llegada, así que tampoco se pueden emparejar por
 *   el orden en que se guardaron.
 * - Gestión del cambio solo ve cuántos respondieron, nunca quiénes, y las
 *   respuestas solo cuando el buzón está cerrado.
 */

const MAX_TEXTO = 5_000;
const ID_BUZON = /^[A-Za-z0-9_-]{3,80}$/;
/** Grupos que puede elegir quien responde (los mismos de R5). */
export const GRUPOS_BUZON = ['Operativo', 'Administrativo', 'Líder de área', 'Prefiero no decirlo'];
export const SIN_GRUPO = 'Sin grupo';

const texto = (v, max = MAX_TEXTO) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const hoy = () => new Date().toISOString().slice(0, 10);

/** Crea las tablas del buzón en la app (se llama desde abrirBase). */
export function crearTablasBuzon(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS buzones_app (
      buzon_id   TEXT PRIMARY KEY,
      estado     TEXT NOT NULL CHECK (estado IN ('abierto', 'cerrado')),
      empresa    TEXT NOT NULL,
      areas      TEXT NOT NULL,
      abierto_en TEXT NOT NULL DEFAULT (date('now')),
      cerrado_en TEXT
    );
    CREATE TABLE IF NOT EXISTS buzon_convocados (
      buzon_id   TEXT NOT NULL REFERENCES buzones_app(buzon_id) ON DELETE CASCADE,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      PRIMARY KEY (buzon_id, usuario_id)
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS buzon_participaciones (
      buzon_id   TEXT NOT NULL REFERENCES buzones_app(buzon_id) ON DELETE CASCADE,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      PRIMARY KEY (buzon_id, usuario_id)
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS buzon_anonimas (
      buzon_id TEXT NOT NULL REFERENCES buzones_app(buzon_id) ON DELETE CASCADE,
      id       TEXT NOT NULL,
      fecha    TEXT NOT NULL,
      area     TEXT NOT NULL,
      grupo    TEXT NOT NULL,
      p1       TEXT NOT NULL,
      p2       TEXT NOT NULL,
      p3       TEXT NOT NULL,
      PRIMARY KEY (buzon_id, id)
    ) WITHOUT ROWID;
  `);
}

export function rutasBuzon({ db, sesionDe, enviar, leerJson }) {
  const exigir = (req, res, rol) => {
    const u = sesionDe(req);
    if (!u) enviar(res, 401, { error: 'Inicia sesión.' });
    else if (rol === 'lider' && u.rol !== 'lider') enviar(res, 403, { error: 'Solo el equipo de gestión del cambio (rol líder) maneja el buzón.' });
    else if (rol === 'empleado' && u.rol !== 'empleado') enviar(res, 403, { error: 'El buzón lo responden los colaboradores (rol empleado).' });
    return u && u.rol === rol ? u : null;
  };

  const buzonDe = (url) => {
    const id = new URL(url ?? '/', 'http://localhost').searchParams.get('buzon') ?? '';
    return ID_BUZON.test(id) ? id : null;
  };

  const contar = (tabla, id) => db.prepare(`SELECT COUNT(*) AS n FROM ${tabla} WHERE buzon_id = ?`).get(id).n;

  /** Lo que ve gestión del cambio: estado y cantidades, nunca quién respondió. */
  const estado = (id) => {
    const b = db.prepare('SELECT estado, empresa, areas, abierto_en, cerrado_en FROM buzones_app WHERE buzon_id = ?').get(id);
    if (!b) return { buzon: id, estado: null, convocados: 0, respuestas: 0, areas: [], abiertoEn: null, cerradoEn: null };
    return {
      buzon: id,
      estado: b.estado,
      convocados: contar('buzon_convocados', id),
      respuestas: contar('buzon_anonimas', id),
      areas: JSON.parse(b.areas),
      abiertoEn: b.abierto_en,
      cerradoEn: b.cerrado_en,
    };
  };

  return {
    /** Colaboradores que se pueden convocar (cuentas con rol empleado). */
    'GET /api/buzon/colaboradores': async (req, res) => {
      if (!exigir(req, res, 'lider')) return;
      const filas = db.prepare("SELECT id, nombre, usuario FROM usuarios WHERE rol = 'empleado' ORDER BY nombre").all();
      enviar(res, 200, { colaboradores: filas.map((f) => ({ id: f.id, nombre: f.nombre, usuario: f.usuario })) });
    },

    'GET /api/buzon/estado': async (req, res) => {
      if (!exigir(req, res, 'lider')) return;
      const id = buzonDe(req.url);
      if (!id) return enviar(res, 400, { error: 'Identificador de buzón inválido.' });
      const e = estado(id);
      // Para marcar en la lista a quién ya se convocó (no dice quién respondió).
      const convocados = db.prepare('SELECT usuario_id FROM buzon_convocados WHERE buzon_id = ?').all(id).map((f) => f.usuario_id);
      enviar(res, 200, { ...e, idsConvocados: convocados });
    },

    /** Abre el buzón (o, si ya está abierto, suma convocados). Un buzón cerrado no se vuelve a abrir. */
    'POST /api/buzon/abrir': async (req, res) => {
      if (!exigir(req, res, 'lider')) return;
      const { buzon, empresa, areas, convocados } = await leerJson(req);
      if (typeof buzon !== 'string' || !ID_BUZON.test(buzon)) return enviar(res, 400, { error: 'Identificador de buzón inválido.' });
      const listaAreas = Array.isArray(areas) ? [...new Set(areas.map((a) => texto(a, 120)).filter(Boolean))].slice(0, 100) : [];
      if (listaAreas.length === 0) return enviar(res, 400, { error: 'El buzón necesita las áreas de la Etapa 0.' });
      const empleados = new Set(db.prepare("SELECT id FROM usuarios WHERE rol = 'empleado'").all().map((f) => f.id));
      const ids = Array.isArray(convocados) ? [...new Set(convocados.map(Number))].filter((n) => empleados.has(n)) : [];
      if (ids.length === 0) return enviar(res, 400, { error: 'Elige al menos un colaborador.' });

      const previo = db.prepare('SELECT estado FROM buzones_app WHERE buzon_id = ?').get(buzon);
      if (previo?.estado === 'cerrado') return enviar(res, 409, { error: 'Este buzón ya se cerró: no se puede volver a abrir.' });
      db.exec('BEGIN');
      try {
        if (previo) db.prepare('UPDATE buzones_app SET areas = ?, empresa = ? WHERE buzon_id = ?').run(JSON.stringify(listaAreas), texto(empresa, 200), buzon);
        else db.prepare("INSERT INTO buzones_app (buzon_id, estado, empresa, areas) VALUES (?, 'abierto', ?, ?)").run(buzon, texto(empresa, 200), JSON.stringify(listaAreas));
        const insertar = db.prepare('INSERT OR IGNORE INTO buzon_convocados (buzon_id, usuario_id) VALUES (?, ?)');
        for (const id of ids) insertar.run(buzon, id);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
      enviar(res, 200, estado(buzon));
    },

    'POST /api/buzon/cerrar': async (req, res) => {
      if (!exigir(req, res, 'lider')) return;
      const { buzon } = await leerJson(req);
      if (typeof buzon !== 'string' || !ID_BUZON.test(buzon)) return enviar(res, 400, { error: 'Identificador de buzón inválido.' });
      const r = db.prepare("UPDATE buzones_app SET estado = 'cerrado', cerrado_en = COALESCE(cerrado_en, date('now')) WHERE buzon_id = ?").run(buzon);
      if (r.changes === 0) return enviar(res, 404, { error: 'Ese buzón no existe.' });
      enviar(res, 200, estado(buzon));
    },

    /** Respuestas para R5: solo con el buzón cerrado, en orden aleatorio (por id) y sin nada de quien respondió. */
    'GET /api/buzon/respuestas': async (req, res) => {
      if (!exigir(req, res, 'lider')) return;
      const id = buzonDe(req.url);
      if (!id) return enviar(res, 400, { error: 'Identificador de buzón inválido.' });
      const e = estado(id);
      if (e.estado !== 'cerrado') return enviar(res, 409, { error: 'El buzón sigue abierto: ciérralo para ver las respuestas.' });
      const filas = db.prepare('SELECT id, fecha, area, grupo, p1, p2, p3 FROM buzon_anonimas WHERE buzon_id = ? ORDER BY id').all(id).map((f) => ({ ...f }));
      enviar(res, 200, { buzon: id, filas });
    },

    /** Para el colaborador: el buzón al que está convocado y si ya respondió. */
    'GET /api/buzon/mio': async (req, res) => {
      const u = exigir(req, res, 'empleado');
      if (!u) return;
      const filas = db
        .prepare(
          `SELECT b.buzon_id, b.estado, b.empresa, b.areas,
                  EXISTS (SELECT 1 FROM buzon_participaciones p WHERE p.buzon_id = b.buzon_id AND p.usuario_id = ?) AS respondio
           FROM buzones_app b JOIN buzon_convocados c ON c.buzon_id = b.buzon_id AND c.usuario_id = ?`,
        )
        .all(u.id, u.id);
      // Primero el abierto sin responder; si no hay, el último que le tocó.
      const elegido = filas.find((f) => f.estado === 'abierto' && !f.respondio) ?? filas.find((f) => f.estado === 'abierto') ?? filas.at(-1);
      if (!elegido) return enviar(res, 200, { buzon: null });
      enviar(res, 200, {
        buzon: {
          id: elegido.buzon_id,
          empresa: elegido.empresa,
          areas: JSON.parse(elegido.areas),
          grupos: GRUPOS_BUZON,
          estado: elegido.respondio ? 'respondido' : elegido.estado === 'cerrado' ? 'cerrado' : 'pendiente',
        },
      });
    },

    /** Guarda la respuesta anónima y marca que la persona ya participó, en una sola transacción. */
    'POST /api/buzon/responder': async (req, res) => {
      const u = exigir(req, res, 'empleado');
      if (!u) return;
      const r = await leerJson(req, 40_000);
      const buzon = typeof r.buzon === 'string' && ID_BUZON.test(r.buzon) ? r.buzon : null;
      if (!buzon) return enviar(res, 400, { error: 'Identificador de buzón inválido.' });
      const b = db.prepare('SELECT estado, areas FROM buzones_app WHERE buzon_id = ?').get(buzon);
      const convocado = b && db.prepare('SELECT 1 FROM buzon_convocados WHERE buzon_id = ? AND usuario_id = ?').get(buzon, u.id);
      if (!b || !convocado) return enviar(res, 404, { error: 'No tienes este buzón asignado.' });
      if (b.estado !== 'abierto') return enviar(res, 409, { error: 'El buzón ya se cerró.' });

      const area = texto(r.area, 120);
      if (!JSON.parse(b.areas).includes(area)) return enviar(res, 400, { error: 'Elige tu área.' });
      const grupo = GRUPOS_BUZON.includes(r.grupo) ? r.grupo : SIN_GRUPO;
      const p = { p1: texto(r.p1), p2: texto(r.p2), p3: texto(r.p3) };
      if (!p.p1 && !p.p2 && !p.p3) return enviar(res, 400, { error: 'Responde al menos una de las preguntas.' });

      db.exec('BEGIN');
      try {
        const ya = db.prepare('INSERT OR IGNORE INTO buzon_participaciones (buzon_id, usuario_id) VALUES (?, ?)').run(buzon, u.id);
        if (ya.changes === 0) {
          db.exec('ROLLBACK');
          return enviar(res, 409, { error: 'Ya respondiste este buzón. Solo se puede responder una vez.' });
        }
        db.prepare('INSERT INTO buzon_anonimas (buzon_id, id, fecha, area, grupo, p1, p2, p3) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
          buzon,
          randomUUID(),
          hoy(),
          area,
          grupo,
          p.p1,
          p.p2,
          p.p3,
        );
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
      enviar(res, 200, { ok: true });
    },
  };
}
