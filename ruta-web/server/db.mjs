import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { hashClave } from './clave.mjs';
import { USUARIOS_DEMO, VIDEOS_INICIALES } from './videos.mjs';

/**
 * Abre (o crea) la base SQLite del proyecto. `node:sqlite` viene con Node
 * 22.13 o superior; no hay que instalar nada.
 */
export async function abrirBase(ruta = process.env.RUTA_DB ?? resolve(process.cwd(), 'server/data/ruta.db')) {
  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import('node:sqlite'));
  } catch {
    throw new Error('RUTA necesita Node 22.13 o superior (usa node:sqlite). Versión actual: ' + process.version);
  }
  if (ruta !== ':memory:') mkdirSync(dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS usuarios (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario    TEXT NOT NULL UNIQUE COLLATE NOCASE,
      nombre     TEXT NOT NULL,
      rol        TEXT NOT NULL CHECK (rol IN ('lider', 'empleado')),
      clave_hash TEXT NOT NULL,
      creado_en  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sesiones (
      token_hash TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      expira_en  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS videos (
      id         TEXT PRIMARY KEY,
      titulo     TEXT NOT NULL,
      youtube_id TEXT NOT NULL,
      audiencia  TEXT NOT NULL CHECK (audiencia IN ('lider', 'empleado')),
      orden      INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS vistas (
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      video_id   TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      visto_en   TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (usuario_id, video_id)
    );
  `);

  if (db.prepare('SELECT COUNT(*) AS n FROM videos').get().n === 0) {
    const insertar = db.prepare('INSERT INTO videos (id, titulo, youtube_id, audiencia, orden) VALUES (?, ?, ?, ?, ?)');
    VIDEOS_INICIALES.forEach((v, i) => insertar.run(v.id, v.titulo, v.youtubeId, v.audiencia, i + 1));
  }
  if (db.prepare('SELECT COUNT(*) AS n FROM usuarios').get().n === 0) {
    const insertar = db.prepare('INSERT INTO usuarios (usuario, nombre, rol, clave_hash) VALUES (?, ?, ?, ?)');
    for (const u of USUARIOS_DEMO) insertar.run(u.usuario, u.nombre, u.rol, hashClave(u.clave));
  }
  return db;
}
