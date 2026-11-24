import { MIN_GRUPO_TERMOMETRO } from './reglasT.mjs';
import {
  ErrorDatosA,
  INDICADORES_A,
  resumirViaje,
  validarAuditoria,
  validarViaje,
} from './reglasA.mjs';

const promedio = (nums) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : null);
const analizar = (fila) => ({ ...JSON.parse(fila.datos), id: fila.id, creadoEn: fila.creado_en });

/**
 * Rutas de la etapa A (Analizar):
 * - A1: Auditorías de adopción (Tablero del equipo con 8 indicadores y semáforo)
 * - A2: Mapa de viaje del colaborador (encuesta de 4 momentos y curva interactiva)
 */
export function rutasEtapaA({ db, sesionDe, enviar, leerJson }) {
  const exigirSesion = (req, res) => {
    const u = sesionDe(req);
    if (!u) enviar(res, 401, { error: 'Inicia sesión.' });
    return u;
  };

  function leerSugeridosEtapaT() {
    // 1. Termómetro de apropiación (T3): solo se reporta si el ciclo tiene >= MIN_GRUPO_TERMOMETRO respuestas.
    const filasTerm = db.prepare("SELECT datos FROM registros WHERE tipo = 'termometro'").all();
    const porCiclo = new Map();
    for (const f of filasTerm) {
      const d = JSON.parse(f.datos);
      porCiclo.set(d.ciclo, [...(porCiclo.get(d.ciclo) ?? []), d.respuestas]);
    }
    let apropiacion = null;
    for (const [ciclo, resp] of [...porCiclo.entries()].sort((a, b) => b[0] - a[0])) {
      if (resp.length >= MIN_GRUPO_TERMOMETRO) {
        apropiacion = {
          valor: promedio(resp.map((r) => promedio(r))),
          ciclo,
          respuestas: resp.length,
        };
        break;
      }
    }

    // 2. Último escalón acordado en la escalera de autonomía (T3).
    const filaAcuerdo = db.prepare("SELECT datos FROM registros WHERE tipo = 'acuerdo' ORDER BY id DESC LIMIT 1").get();
    const acuerdo = filaAcuerdo ? JSON.parse(filaAcuerdo.datos) : null;

    // 3. Sesiones con pulso registrado en T1.
    const filasPulso = db.prepare("SELECT datos FROM registros WHERE tipo = 'pulso'").all();
    const sesionesPulso = new Set(filasPulso.map((f) => JSON.parse(f.datos).sesion)).size;

    return {
      apropiacion,
      ultimoAcuerdo: acuerdo ? { ciclo: acuerdo.ciclo, momento: acuerdo.momento, nivel: acuerdo.nivel, meta: acuerdo.meta ?? null } : null,
      sesionesPulso,
    };
  }

  return {
    'GET /api/etapa-a/tablero': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const esLider = u.rol === 'lider';
      const nombres = new Map(db.prepare('SELECT id, nombre FROM usuarios').all().map((x) => [x.id, x.nombre]));

      const filasAud = db.prepare("SELECT * FROM registros WHERE tipo = 'auditoria_a' ORDER BY id DESC").all();
      const auditorias = filasAud.map((f) => ({
        ...analizar(f),
        registradoPor: nombres.get(f.usuario_id) ?? null,
      }));

      const metasDefecto = Object.fromEntries(INDICADORES_A.map((i) => [i.id, i.metaInicial]));
      const metasActuales = auditorias[0]?.metas ? { ...metasDefecto, ...auditorias[0].metas } : metasDefecto;

      const balancesT = esLider
        ? db
            .prepare("SELECT * FROM registros WHERE tipo = 'balance' ORDER BY id DESC")
            .all()
            .map((f) => ({ ...analizar(f), nombre: nombres.get(f.usuario_id) ?? null }))
        : [];

      enviar(res, 200, {
        auditorias,
        metasActuales,
        sugeridosT: leerSugeridosEtapaT(),
        balancesT,
      });
    },

    'POST /api/etapa-a/auditoria': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      if (u.rol !== 'lider') return enviar(res, 403, { error: 'Solo los líderes pueden registrar auditorías de adopción.' });

      const cuerpo = await leerJson(req);
      let limpio;
      try {
        limpio = validarAuditoria(cuerpo && typeof cuerpo === 'object' ? cuerpo : {});
      } catch (e) {
        if (e instanceof ErrorDatosA) return enviar(res, 400, { error: e.message });
        throw e;
      }

      const { lastInsertRowid } = db
        .prepare("INSERT INTO registros (tipo, usuario_id, datos) VALUES ('auditoria_a', ?, ?)")
        .run(u.id, JSON.stringify(limpio));
      enviar(res, 200, { id: Number(lastInsertRowid), auditoria: limpio });
    },

    'GET /api/etapa-a/viaje': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;
      const esLider = u.rol === 'lider';
      const periodoFiltro = (new URL(req.url, 'http://localhost').searchParams.get('periodo') ?? '').trim();

      const filas = db.prepare("SELECT * FROM registros WHERE tipo = 'viaje_a' ORDER BY id DESC").all();
      const todas = filas.map((f) => ({ ...analizar(f), usuarioId: f.usuario_id }));

      const periodosDisponibles = [...new Set(todas.map((r) => r.periodo))];
      const filtradas = periodoFiltro && periodoFiltro !== 'todos' ? todas.filter((r) => r.periodo === periodoFiltro) : todas;

      const resumenEquipo = resumirViaje(filtradas);

      const propias = todas
        .filter((r) => r.usuarioId === u.id)
        .map(({ usuarioId: _uid, ...resto }) => ({
          ...resto,
          resumen: resumirViaje([resto]),
        }));

      const comentariosFuente = esLider ? filtradas : filtradas.filter((r) => r.usuarioId === u.id);
      const comentarios = comentariosFuente
        .filter((r) => r.comentario)
        .map((r) => ({
          id: r.id,
          periodo: r.periodo,
          area: r.area,
          comentario: r.comentario,
          creadoEn: r.creadoEn,
        }));

      enviar(res, 200, {
        periodo: periodoFiltro || 'todos',
        periodosDisponibles,
        resumenEquipo,
        propias,
        comentarios,
      });
    },

    'POST /api/etapa-a/viaje': async (req, res) => {
      const u = exigirSesion(req, res);
      if (!u) return;

      const cuerpo = await leerJson(req);
      let limpio;
      try {
        limpio = validarViaje(cuerpo && typeof cuerpo === 'object' ? cuerpo : {});
      } catch (e) {
        if (e instanceof ErrorDatosA) return enviar(res, 400, { error: e.message });
        throw e;
      }

      // Una respuesta vigente por persona y periodo: volver a responder actualiza la anterior.
      const previas = db.prepare("SELECT id, datos FROM registros WHERE tipo = 'viaje_a' AND usuario_id = ?").all(u.id);
      for (const p of previas) {
        if (JSON.parse(p.datos).periodo === limpio.periodo) {
          db.prepare('DELETE FROM registros WHERE id = ?').run(p.id);
        }
      }

      const { lastInsertRowid } = db
        .prepare("INSERT INTO registros (tipo, usuario_id, datos) VALUES ('viaje_a', ?, ?)")
        .run(u.id, JSON.stringify(limpio));
      enviar(res, 200, { id: Number(lastInsertRowid), resumen: resumirViaje([limpio]) });
    },
  };
}
