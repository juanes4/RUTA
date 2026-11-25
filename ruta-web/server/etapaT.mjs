import { ErrorDatos, MAX_DINAMICAS_POR_CICLO, MIN_GRUPO_TERMOMETRO, VALIDADORES } from './reglasT.mjs';
import { APROBACION_MINIMA, calificar, detalleDeRespuestas, preguntasDe, preguntasPublicas, resultadoPublico } from './simulador.mjs';

/** Quién puede guardar cada tipo de registro. */
const ESCRIBEN = {
  pulso: ['lider', 'empleado'],
  voto: ['lider', 'empleado'],
  termometro: ['lider', 'empleado'],
  acuerdo: ['lider'],
  dinamica: ['lider'],
  balance: ['lider'],
  merito: ['lider'],
};
/** Tipos de los que el líder ve el detalle completo. Los demás se leen con las reglas de leerRegistros. */
const TIPOS = Object.keys(ESCRIBEN);

const promedio = (nums) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : null);
const analizar = (fila) => ({ ...JSON.parse(fila.datos), id: fila.id, creadoEn: fila.creado_en });

/**
 * Rutas de la etapa T (pulso, simulador, escalera, dinámicas, termómetro,
 * victorias tempranas). Se suman a las de api.mjs.
 */
export function rutasEtapaT({ db, sesionDe, enviar, leerJson, audienciasDe }) {
  const exigirSesion = (req, res) => {
    const u = sesionDe(req);
    if (!u) enviar(res, 401, { error: 'Inicia sesión.' });
    return u;
  };

  function leerRegistros(tipo, u) {
    const esLider = u.rol === 'lider';
    const filas = db.prepare('SELECT * FROM registros WHERE tipo = ? ORDER BY id DESC').all(tipo);
    const nombres = new Map(db.prepare('SELECT id, nombre FROM usuarios').all().map((x) => [x.id, x.nombre]));

    switch (tipo) {
      case 'pulso': {
        const visibles = esLider ? filas : filas.filter((f) => f.usuario_id === u.id);
        return { registros: visibles.map((f) => ({ ...analizar(f), nombre: nombres.get(f.usuario_id) ?? null })) };
      }
      case 'voto': {
        const todos = filas.map(analizar);
        const propios = filas.filter((f) => f.usuario_id === u.id).map(analizar);
        if (!esLider) return { propios, conteos: null };
        // El líder ve cuántas personas votaron cada escalón, no quién votó qué.
        const mapa = new Map();
        for (const v of todos) {
          const k = `${v.ciclo}-${v.momento}`;
          const c = mapa.get(k) ?? { ciclo: v.ciclo, momento: v.momento, niveles: [0, 0, 0, 0] };
          c.niveles[v.nivel - 1] += 1;
          mapa.set(k, c);
        }
        return { propios, conteos: [...mapa.values()].sort((a, b) => a.ciclo - b.ciclo || (a.momento === 'inicio' ? -1 : 1)) };
      }
      case 'acuerdo':
        return { registros: filas.map(analizar) };
      case 'termometro': {
        if (!esLider) return null;
        const porCiclo = new Map();
        for (const f of filas) {
          const d = JSON.parse(f.datos);
          porCiclo.set(d.ciclo, [...(porCiclo.get(d.ciclo) ?? []), d.respuestas]);
        }
        const ciclos = [...porCiclo.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([ciclo, resp]) => {
            // Se reporta solo en grupos de 5 o más personas, para que nadie quede expuesto.
            const visible = resp.length >= MIN_GRUPO_TERMOMETRO;
            return {
              ciclo,
              respuestas: resp.length,
              promedio: visible ? promedio(resp.map((r) => promedio(r))) : null,
              porAfirmacion: visible ? [0, 1, 2, 3, 4].map((i) => promedio(resp.map((r) => r[i]))) : null,
            };
          });
        return { minimo: MIN_GRUPO_TERMOMETRO, ciclos };
      }
      case 'dinamica':
      case 'balance':
        if (!esLider) return null;
        return { registros: filas.map((f) => ({ ...analizar(f), nombre: nombres.get(f.usuario_id) ?? null })) };
      case 'merito': {
        const todos = filas.map((f) => ({ ...analizar(f), nombre: nombres.get(f.usuario_id) ?? null }));
        if (esLider) return { registros: todos };
        // Las demás personas solo ven lo que se publicó.
        return {
          registros: todos
            .filter((m) => m.publicar)
            .map((m) => ({ id: m.id, creadoEn: m.creadoEn, publicar: true, publicacion: m.publicacion, clasificacion: m.clasificacion })),
        };
      }
      default:
        return null;
    }
  }

  return {
    'GET /api/preguntas': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const id = new URL(req.url, 'http://localhost').searchParams.get('videoId') ?? '';
      const video = db.prepare('SELECT id, audiencia FROM videos WHERE id = ?').get(id);
      if (!video || !audienciasDe(u.rol).includes(video.audiencia)) return enviar(res, 404, { error: 'Video no encontrado.' });
      enviar(res, 200, { videoId: id, preguntas: preguntasPublicas(preguntasDe(db, id)), aprobacionMinima: APROBACION_MINIMA });
    },

    'POST /api/simulador': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const { videoId, respuestas, seguridad } = await leerJson(req);
      const video = typeof videoId === 'string' ? db.prepare('SELECT id, audiencia FROM videos WHERE id = ?').get(videoId) : null;
      if (!video || !audienciasDe(u.rol).includes(video.audiencia)) return enviar(res, 404, { error: 'Video no encontrado.' });
      if (!Number.isInteger(seguridad) || seguridad < 1 || seguridad > 5) {
        return enviar(res, 400, { error: 'Responde qué tan seguro te sientes de aplicarlo solo.' });
      }
      const visto = db.prepare('SELECT 1 FROM vistas WHERE usuario_id = ? AND video_id = ?').get(u.id, video.id);
      if (!visto) return enviar(res, 409, { error: 'Primero mira el video completo.' });
      const preguntas = preguntasDe(db, video.id);
      const nota = calificar(preguntas, respuestas);
      if (!nota) return enviar(res, 400, { error: 'Responde las 3 preguntas.' });
      db.prepare(
        `INSERT INTO simulacros (usuario_id, video_id, aciertos, total, seguridad) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (usuario_id, video_id) DO UPDATE SET aciertos = excluded.aciertos, total = excluded.total,
           seguridad = excluded.seguridad, hecho_en = datetime('now')`,
      ).run(u.id, video.id, nota.aciertos, nota.total, seguridad);
      enviar(res, 200, { ...resultadoPublico(nota.aciertos, nota.total, seguridad), detalle: detalleDeRespuestas(preguntas, respuestas) });
    },

    'POST /api/registros': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const { tipo, datos } = await leerJson(req);
      if (!TIPOS.includes(tipo)) return enviar(res, 400, { error: 'Tipo de registro desconocido.' });
      if (!ESCRIBEN[tipo].includes(u.rol)) return enviar(res, 403, { error: 'Esta acción es solo para líderes.' });
      let limpio;
      try {
        limpio = VALIDADORES[tipo](datos && typeof datos === 'object' ? datos : {});
      } catch (e) {
        if (e instanceof ErrorDatos) return enviar(res, 400, { error: e.message });
        throw e;
      }

      if (tipo === 'dinamica') {
        const hechas = db.prepare("SELECT datos FROM registros WHERE tipo = 'dinamica'").all().filter((f) => JSON.parse(f.datos).ciclo === limpio.ciclo);
        if (hechas.length >= MAX_DINAMICAS_POR_CICLO) {
          return enviar(res, 409, { error: `Ya hay ${MAX_DINAMICAS_POR_CICLO} dinámicas en el ciclo ${limpio.ciclo}: es el máximo por ciclo.` });
        }
      }
      // Un voto o un acuerdo por ciclo y momento: volver a guardar reemplaza el anterior.
      if (tipo === 'voto' || tipo === 'acuerdo') {
        const previos = db.prepare('SELECT id, datos FROM registros WHERE tipo = ? AND (usuario_id = ? OR ? = 0)').all(tipo, u.id, tipo === 'acuerdo' ? 0 : 1);
        for (const p of previos) {
          const d = JSON.parse(p.datos);
          if (d.ciclo === limpio.ciclo && d.momento === limpio.momento) db.prepare('DELETE FROM registros WHERE id = ?').run(p.id);
        }
      }
      const dueno = tipo === 'termometro' ? null : u.id;
      const { lastInsertRowid } = db.prepare('INSERT INTO registros (tipo, usuario_id, datos) VALUES (?, ?, ?)').run(tipo, dueno, JSON.stringify(limpio));
      enviar(res, 200, { id: Number(lastInsertRowid), tipo });
    },

    'GET /api/registros': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const tipo = new URL(req.url, 'http://localhost').searchParams.get('tipo') ?? '';
      if (!TIPOS.includes(tipo)) return enviar(res, 400, { error: 'Tipo de registro desconocido.' });
      const datos = leerRegistros(tipo, u);
      if (!datos) return enviar(res, 403, { error: 'Esta información es solo para líderes.' });
      enviar(res, 200, datos);
    },
  };
}
