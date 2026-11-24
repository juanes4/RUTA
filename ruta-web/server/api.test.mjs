import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApi } from './api.mjs';
import { abrirBase } from './db.mjs';

let servidor;
let base;

beforeAll(async () => {
  const api = crearApi(await abrirBase(':memory:'));
  servidor = createServer((req, res) => {
    api(req, res).then((atendida) => {
      if (!atendida) res.writeHead(404).end();
    });
  });
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

afterAll(() => servidor.close());

async function pedir(ruta, { metodo = 'GET', cuerpo, cookie } = {}) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { estado: r.status, json: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] };
}

const entrar = async (usuario, clave = 'ruta2026') => (await pedir('/api/login', { metodo: 'POST', cuerpo: { usuario, clave } })).cookie;

describe('API de sesión y videos', () => {
  it('sin sesión no entrega videos ni historial', async () => {
    expect((await pedir('/api/videos')).estado).toBe(401);
    expect((await pedir('/api/historial')).estado).toBe(401);
    expect((await pedir('/api/sesion')).json.usuario).toBeNull();
  });

  it('rechaza claves incorrectas con el mismo mensaje para usuario y clave', async () => {
    const mal = await pedir('/api/login', { metodo: 'POST', cuerpo: { usuario: 'lider', clave: 'x' } });
    const noExiste = await pedir('/api/login', { metodo: 'POST', cuerpo: { usuario: 'nadie', clave: 'x' } });
    expect(mal.estado).toBe(401);
    expect(mal.json).toEqual(noExiste.json);
  });

  it('el empleado solo ve videos de empleado; el líder ve los dos grupos', async () => {
    const emp = await pedir('/api/videos', { cookie: await entrar('empleado1') });
    expect(emp.json.videos).toHaveLength(5);
    expect(emp.json.videos.every((v) => v.audiencia === 'empleado')).toBe(true);

    const lid = await pedir('/api/videos', { cookie: await entrar('lider') });
    expect(lid.json.videos).toHaveLength(7);
    expect(lid.json.videos.filter((v) => v.audiencia === 'lider')).toHaveLength(2);
  });

  it('un empleado no puede registrar vista de un video de líder', async () => {
    const r = await pedir('/api/vistas', { metodo: 'POST', cuerpo: { videoId: 'lid-1' }, cookie: await entrar('empleado1') });
    expect(r.estado).toBe(404);
  });

  it('el historial: el líder ve quién vio cada video; el empleado solo lo suyo', async () => {
    const c1 = await entrar('empleado1');
    const c2 = await entrar('empleado2');
    await pedir('/api/vistas', { metodo: 'POST', cuerpo: { videoId: 'emp-1' }, cookie: c1 });
    await pedir('/api/vistas', { metodo: 'POST', cuerpo: { videoId: 'emp-1' }, cookie: c1 }); // repetir no duplica
    await pedir('/api/vistas', { metodo: 'POST', cuerpo: { videoId: 'emp-1' }, cookie: c2 });

    const lider = (await pedir('/api/historial', { cookie: await entrar('lider') })).json;
    expect(lider.verTodos).toBe(true);
    expect(lider.videos.find((v) => v.id === 'emp-1').vistas.map((s) => s.nombre).sort()).toEqual(['Julián Mesa', 'Laura Gómez']);

    const empleado = (await pedir('/api/historial', { cookie: c2 })).json;
    expect(empleado.videos.some((v) => v.audiencia === 'lider')).toBe(false);
    expect(empleado.videos.find((v) => v.id === 'emp-1').vistas.map((s) => s.nombre)).toEqual(['Julián Mesa']);
  });

  it('cerrar sesión invalida la cookie', async () => {
    const cookie = await entrar('empleado3');
    await pedir('/api/logout', { metodo: 'POST', cuerpo: {}, cookie });
    expect((await pedir('/api/videos', { cookie })).estado).toBe(401);
  });

  it('bloquea tras varios intentos fallidos', async () => {
    let ultimo;
    for (let i = 0; i < 6; i++) ultimo = await pedir('/api/login', { metodo: 'POST', cuerpo: { usuario: 'empleado2', clave: 'mala' } });
    expect(ultimo.estado).toBe(429);
  });
});

const post = (ruta, cuerpo, cookie) => pedir(ruta, { metodo: 'POST', cuerpo, cookie });

describe('Etapa T · simulador (T2)', () => {
  it('no entrega las respuestas correctas y exige haber visto el video', async () => {
    const c = await entrar('empleado1');
    const p = await pedir('/api/preguntas?videoId=emp-2', { cookie: c });
    expect(p.json.preguntas).toHaveLength(3);
    expect(JSON.stringify(p.json)).not.toContain('correcta');
    expect((await post('/api/simulador', { videoId: 'emp-2', respuestas: [0, 1, 0], seguridad: 4 }, c)).estado).toBe(409);
  });

  it('califica, guarda y se ve en videos y en el historial del líder', async () => {
    const c = await entrar('empleado3'); // empleado2 queda bloqueado por la prueba de intentos fallidos
    await post('/api/vistas', { videoId: 'emp-2' }, c);
    const r = await post('/api/simulador', { videoId: 'emp-2', respuestas: [0, 1, 1], seguridad: 3 }, c);
    expect(r.json).toMatchObject({ aciertos: 2, total: 3, aprobado: true, seguridad: 3 });
    const mis = await pedir('/api/videos', { cookie: c });
    expect(mis.json.videos.find((v) => v.id === 'emp-2').simulador).toMatchObject({ aciertos: 2, aprobado: true });
    const h = (await pedir('/api/historial', { cookie: await entrar('lider') })).json;
    expect(h.videos.find((v) => v.id === 'emp-2').vistas.find((s) => s.nombre === 'Daniela Ríos').simulador.seguridad).toBe(3);
  });

  it('un empleado no accede a preguntas de videos de líder', async () => {
    expect((await pedir('/api/preguntas?videoId=lid-1', { cookie: await entrar('empleado1') })).estado).toBe(404);
  });
});

describe('Etapa T · registros (T1, T3, T4)', () => {
  it('pulso: el empleado guarda y ve lo suyo; el líder ve todo', async () => {
    const e = await entrar('empleado1');
    expect((await post('/api/registros', { tipo: 'pulso', datos: { sesion: 'Reunión 1', claridad: 5, utilidad: 4, confianza: 3 } }, e)).estado).toBe(200);
    expect((await post('/api/registros', { tipo: 'pulso', datos: { sesion: 'Reunión 1', claridad: 9, utilidad: 4, confianza: 3 } }, e)).estado).toBe(400);
    expect((await pedir('/api/registros?tipo=pulso', { cookie: e })).json.registros.every((r) => r.nombre === 'Laura Gómez')).toBe(true);
    expect((await pedir('/api/registros?tipo=pulso', { cookie: await entrar('lider') })).json.registros.length).toBeGreaterThan(0);
  });

  it('votos de escalera: uno por ciclo y momento; el líder solo ve conteos', async () => {
    const e = await entrar('empleado1');
    await post('/api/registros', { tipo: 'voto', datos: { ciclo: 1, momento: 'inicio', nivel: 1 } }, e);
    await post('/api/registros', { tipo: 'voto', datos: { ciclo: 1, momento: 'inicio', nivel: 2 } }, e);
    await post('/api/registros', { tipo: 'voto', datos: { ciclo: 1, momento: 'inicio', nivel: 2 } }, await entrar('empleado3'));
    const lider = (await pedir('/api/registros?tipo=voto', { cookie: await entrar('lider') })).json;
    expect(lider.conteos).toEqual([{ ciclo: 1, momento: 'inicio', niveles: [0, 2, 0, 0] }]);
    expect((await pedir('/api/registros?tipo=voto', { cookie: e })).json.conteos).toBeNull();
  });

  it('solo el líder acuerda el escalón, guarda dinámicas, méritos y balances', async () => {
    const e = await entrar('empleado1');
    for (const tipo of ['acuerdo', 'dinamica', 'balance', 'merito']) {
      expect((await post('/api/registros', { tipo, datos: {} }, e)).estado).toBe(403);
    }
    expect((await pedir('/api/registros?tipo=dinamica', { cookie: e })).estado).toBe(403);
    expect((await pedir('/api/registros?tipo=termometro', { cookie: e })).estado).toBe(403);
  });

  it('dinámicas: máximo dos por ciclo', async () => {
    const l = await entrar('lider');
    const hoja = { escenario: 'Cliente molesto' };
    expect((await post('/api/registros', { tipo: 'dinamica', datos: { dinamica: 'simulacro', ciclo: 2, hoja } }, l)).estado).toBe(200);
    expect((await post('/api/registros', { tipo: 'dinamica', datos: { dinamica: 'circulo', ciclo: 2, hoja } }, l)).estado).toBe(200);
    expect((await post('/api/registros', { tipo: 'dinamica', datos: { dinamica: 'parejas', ciclo: 2, hoja } }, l)).estado).toBe(409);
  });

  it('termómetro: anónimo y solo se reporta con 5 respuestas o más', async () => {
    const l = await entrar('lider');
    const enviar = (cookie) => post('/api/registros', { tipo: 'termometro', datos: { ciclo: 1, respuestas: [4, 4, 4, 4, 4] } }, cookie);
    for (const u of ['empleado1', 'empleado3', 'lider', 'empleado1']) await enviar(await entrar(u));
    let r = (await pedir('/api/registros?tipo=termometro', { cookie: l })).json;
    expect(r.ciclos[0]).toMatchObject({ respuestas: 4, promedio: null, porAfirmacion: null });
    await enviar(await entrar('empleado1'));
    r = (await pedir('/api/registros?tipo=termometro', { cookie: l })).json;
    expect(r.ciclos[0]).toMatchObject({ respuestas: 5, promedio: 4 });
  });

  const merito = (puntajes, extra = {}) => ({
    area: 'Planta', fecha: '2026-11-20', cambio: 'Nuevo sistema', avance: 'Registran sin ayuda', participantes: 'Turno 1', comoAyuda: 'Menos errores',
    pasaAValoracion: true,
    criterios: Object.fromEntries(['cumplimiento', 'impacto', 'sostenibilidad', 'adaptacion', 'participacion', 'compromiso', 'equipo', 'iniciativa'].map((c, i) => [c, { puntaje: puntajes[i], evidencia: 'Registro semanal' }])),
    ...extra,
  });
  const publicacion = { titulo: 'Turno 1 sin papel', logramos: 'Todo el turno registra en el sistema.', protagonistas: 'Turno 1', importancia: 'Ahorra tiempo.', mensaje: 'Gracias.', autorizacion: true };

  it('méritos: suma, clasifica y solo publica con 24 puntos o más y autorización', async () => {
    const l = await entrar('lider');
    const alto = await post('/api/registros', { tipo: 'merito', datos: merito([4, 4, 4, 4, 4, 4, 4, 4], { publicar: true, publicacion }) }, l);
    expect(alto.estado).toBe(200);
    const bajo = await post('/api/registros', { tipo: 'merito', datos: merito([3, 3, 3, 3, 3, 3, 3, 2], { publicar: true, publicacion }) }, l);
    expect(bajo.estado).toBe(400);
    const sinAut = await post('/api/registros', { tipo: 'merito', datos: merito([4, 4, 4, 4, 4, 4, 4, 4], { publicar: true, publicacion: { ...publicacion, autorizacion: false } }) }, l);
    expect(sinAut.estado).toBe(400);

    const lista = (await pedir('/api/registros?tipo=merito', { cookie: l })).json.registros;
    expect(lista[0]).toMatchObject({ total: 32, clasificacion: 'destacado', publicar: true });
    // Los demás solo ven lo publicado, sin puntajes ni evidencia.
    const emp = (await pedir('/api/registros?tipo=merito', { cookie: await entrar('empleado3') })).json.registros;
    expect(emp).toHaveLength(1);
    expect(emp[0].criterios).toBeUndefined();
    expect(emp[0].publicacion.titulo).toBe('Turno 1 sin papel');
  });

  it('méritos: un 4 o un 5 exigen evidencia; sin evidencia no pasa a valoración', async () => {
    const l = await entrar('lider');
    const d = merito([5, 3, 3, 3, 3, 3, 3, 3]);
    d.criterios.cumplimiento.evidencia = '';
    expect((await post('/api/registros', { tipo: 'merito', datos: d }, l)).estado).toBe(400);
    const sin = await post('/api/registros', { tipo: 'merito', datos: { area: 'Bodega', fecha: '2026-11-21', cambio: 'X', avance: 'Y', participantes: 'Z', comoAyuda: 'W', pasaAValoracion: false } }, l);
    expect(sin.estado).toBe(200);
  });
});

describe('Etapa A · Analizar (A1 auditorías y A2 mapa de viaje)', () => {
  it('sin sesión rechaza las rutas de Etapa A', async () => {
    expect((await pedir('/api/etapa-a/tablero')).estado).toBe(401);
    expect((await pedir('/api/etapa-a/viaje')).estado).toBe(401);
  });

  it('A1: solo el líder registra auditorías; valida datos y expone insumos de Etapa T', async () => {
    const emp = await entrar('empleado1');
    const lid = await entrar('lider');

    const payload = {
      periodo: 'Día 30',
      fecha: '2026-11-23',
      equipo: 'Planta Norte',
      observaciones: 'Se requiere acompañamiento en traspaso.',
      valores: { autonomia: 85, uso_sostenido: 92, regreso_anterior: 3, apropiacion: 4.1 },
      metas: { autonomia: 85 },
    };

    expect((await post('/api/etapa-a/auditoria', payload, emp)).estado).toBe(403);
    expect((await post('/api/etapa-a/auditoria', { periodo: 'Día 30', fecha: '2026-11-23', valores: {} }, lid)).estado).toBe(400);
    expect((await post('/api/etapa-a/auditoria', payload, lid)).estado).toBe(200);

    // Registrar un balance en T4 para comprobar que se muestra como insumo solo al líder.
    await post(
      '/api/registros',
      { tipo: 'balance', datos: { ciclo: 1, meritos: 'Turno 1 autónomo', factores: 'Parejas de práctica', dificultades: 'Rotación' } },
      lid,
    );

    const vistaLider = (await pedir('/api/etapa-a/tablero', { cookie: lid })).json;
    expect(vistaLider.auditorias).toHaveLength(1);
    expect(vistaLider.auditorias[0]).toMatchObject({ periodo: 'Día 30', equipo: 'Planta Norte' });
    expect(vistaLider.metasActuales.autonomia).toBe(85);
    expect(vistaLider.sugeridosT.apropiacion).toMatchObject({ valor: 4, ciclo: 1, respuestas: 5 });
    expect(vistaLider.balancesT).toHaveLength(1);

    const vistaEmp = (await pedir('/api/etapa-a/tablero', { cookie: emp })).json;
    expect(vistaEmp.auditorias).toHaveLength(1);
    expect(vistaEmp.balancesT).toEqual([]);
  });

  it('A2: todos responden el mapa de viaje, actualiza por periodo y calcula caritas por fase', async () => {
    const e1 = await entrar('empleado1');
    const e3 = await entrar('empleado3');
    const lid = await entrar('lider');

    // Rechaza si no vienen las 12 respuestas válidas (1 a 3)
    expect((await post('/api/etapa-a/viaje', { periodo: 'Últimos 3 meses', respuestas: [3, 3, 3] }, e1)).estado).toBe(400);

    // empleado1 responde todo 3, luego corrige fase 2 ("durante") a 1 para probar reemplazo por periodo
    await post('/api/etapa-a/viaje', { periodo: 'Últimos 3 meses', area: 'Planta', comentario: 'Buen inicio', respuestas: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3] }, e1);
    await post('/api/etapa-a/viaje', { periodo: 'Últimos 3 meses', area: 'Planta', comentario: 'Fricción en transición', respuestas: [3, 3, 3, 1, 1, 1, 3, 3, 3, 2, 2, 2] }, e1);
    // empleado3 responde en el mismo periodo
    await post('/api/etapa-a/viaje', { periodo: 'Últimos 3 meses', area: 'Bodega', comentario: 'Más práctica', respuestas: [3, 2, 3, 2, 2, 2, 2, 3, 2, 3, 2, 3] }, e3);

    const resLider = (await pedir('/api/etapa-a/viaje?periodo=%C3%9Altimos%203%20meses', { cookie: lid })).json;
    // Deben ser 2 respuestas (la segunda de empleado1 reemplazó la primera)
    expect(resLider.resumenEquipo.totalRespuestas).toBe(2);
    // Fase 1 (antes): (3+3+3 + 3+2+3)/6 = 2.83 -> feliz
    expect(resLider.resumenEquipo.fases[0]).toMatchObject({ id: 'antes', promedio: 2.83, carita: 'feliz' });
    // Fase 2 (durante): (1+1+1 + 2+2+2)/6 = 1.5 -> preocupada
    expect(resLider.resumenEquipo.fases[1]).toMatchObject({ id: 'durante', promedio: 1.5, carita: 'preocupada' });
    // Fase 4 (mejorar): (2+2+2 + 3+2+3)/6 = 2.33 -> neutra
    expect(resLider.resumenEquipo.fases[3]).toMatchObject({ id: 'mejorar', promedio: 2.33, carita: 'neutra' });
    // El líder ve ambos comentarios anónimos; el empleado solo ve el suyo.
    expect(resLider.comentarios).toHaveLength(2);
    const resEmp = (await pedir('/api/etapa-a/viaje', { cookie: e1 })).json;
    expect(resEmp.comentarios).toHaveLength(1);
    expect(resEmp.comentarios[0].comentario).toBe('Fricción en transición');
    expect(resEmp.propias).toHaveLength(1);
  });
});
