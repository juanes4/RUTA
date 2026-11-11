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
