import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApi } from './api.mjs';
import { abrirBase } from './db.mjs';

const BUZON = 'proyecto-123';
const AREAS = ['Bodega', 'Producción'];

describe('buzón 1 respondido en la app', () => {
  let servidor;
  let db;
  let base = '';
  beforeAll(async () => {
    db = await abrirBase(':memory:');
    const api = crearApi(db);
    servidor = createServer((req, res) => api(req, res).then((ok) => ok || res.writeHead(404).end()));
    await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${servidor.address().port}`;
  });
  afterAll(() => servidor.close());

  const pedir = async (ruta, { cuerpo, cookie } = {}) => {
    const r = await fetch(base + ruta, {
      method: cuerpo ? 'POST' : 'GET',
      headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    return { estado: r.status, json: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] };
  };
  const entrar = async (usuario) => (await pedir('/api/login', { cuerpo: { usuario, clave: 'ruta2026' } })).cookie;
  const respuesta = { buzon: BUZON, area: 'Bodega', grupo: 'Operativo', p1: 'Se cae el sistema', p2: 'Que no nos capaciten', p3: '' };

  it('gestión del cambio abre el buzón y convoca a los colaboradores', async () => {
    const lider = await entrar('lider');
    const { json } = await pedir('/api/buzon/colaboradores', { cookie: lider });
    expect(json.colaboradores.map((c) => c.usuario)).toEqual(expect.arrayContaining(['empleado1', 'empleado2', 'empleado3']));
    // El colaborador no maneja el buzón.
    expect((await pedir('/api/buzon/colaboradores', { cookie: await entrar('empleado1') })).estado).toBe(403);

    const convocados = json.colaboradores.filter((c) => c.usuario !== 'empleado3').map((c) => c.id);
    const abierto = await pedir('/api/buzon/abrir', { cookie: lider, cuerpo: { buzon: BUZON, empresa: 'Lácteos', areas: AREAS, convocados } });
    expect(abierto.json).toMatchObject({ estado: 'abierto', convocados: 2, respuestas: 0 });
  });

  it('cada colaborador convocado responde una sola vez', async () => {
    const e1 = await entrar('empleado1');
    expect((await pedir('/api/buzon/mio', { cookie: e1 })).json.buzon).toMatchObject({ id: BUZON, estado: 'pendiente', areas: AREAS });
    expect((await pedir('/api/buzon/responder', { cookie: e1, cuerpo: respuesta })).estado).toBe(200);
    expect((await pedir('/api/buzon/responder', { cookie: e1, cuerpo: { ...respuesta, p1: 'otra vez' } })).estado).toBe(409);
    expect((await pedir('/api/buzon/mio', { cookie: e1 })).json.buzon.estado).toBe('respondido');
  });

  it('quien no está convocado no puede responder, y se validan área y contenido', async () => {
    const e3 = await entrar('empleado3');
    expect((await pedir('/api/buzon/mio', { cookie: e3 })).json.buzon).toBeNull();
    expect((await pedir('/api/buzon/responder', { cookie: e3, cuerpo: respuesta })).estado).toBe(404);
    const e2 = await entrar('empleado2');
    expect((await pedir('/api/buzon/responder', { cookie: e2, cuerpo: { ...respuesta, area: 'Otra' } })).estado).toBe(400);
    expect((await pedir('/api/buzon/responder', { cookie: e2, cuerpo: { ...respuesta, p1: '', p2: ' ', p3: '' } })).estado).toBe(400);
    // Un líder no responde el buzón.
    expect((await pedir('/api/buzon/responder', { cookie: await entrar('lider'), cuerpo: respuesta })).estado).toBe(403);
  });

  it('la respuesta guardada no tiene ningún vínculo con quien la escribió', () => {
    const columnas = db.prepare("SELECT name FROM pragma_table_info('buzon_anonimas')").all().map((c) => c.name);
    expect(columnas).toEqual(['buzon_id', 'id', 'fecha', 'area', 'grupo', 'p1', 'p2', 'p3']);
    const participacion = db.prepare("SELECT name FROM pragma_table_info('buzon_participaciones')").all().map((c) => c.name);
    expect(participacion).toEqual(['buzon_id', 'usuario_id']);
    const fila = db.prepare('SELECT * FROM buzon_anonimas').get();
    expect(fila.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('mientras está abierto solo se ve cuántos respondieron; al cerrarlo, las respuestas', async () => {
    const lider = await entrar('lider');
    const estado = (await pedir(`/api/buzon/estado?buzon=${BUZON}`, { cookie: lider })).json;
    expect(estado).toMatchObject({ estado: 'abierto', convocados: 2, respuestas: 1 });
    expect(JSON.stringify(estado)).not.toMatch(/empleado1|Laura/);
    expect((await pedir(`/api/buzon/respuestas?buzon=${BUZON}`, { cookie: lider })).estado).toBe(409);

    await pedir('/api/buzon/cerrar', { cookie: lider, cuerpo: { buzon: BUZON } });
    const { json } = await pedir(`/api/buzon/respuestas?buzon=${BUZON}`, { cookie: lider });
    expect(json.filas).toHaveLength(1);
    expect(Object.keys(json.filas[0])).toEqual(['id', 'fecha', 'area', 'grupo', 'p1', 'p2', 'p3']);
    expect(json.filas[0]).toMatchObject({ area: 'Bodega', grupo: 'Operativo', p1: 'Se cae el sistema' });

    // Cerrado: nadie más responde y no se vuelve a abrir.
    expect((await pedir('/api/buzon/responder', { cookie: await entrar('empleado2'), cuerpo: respuesta })).estado).toBe(409);
    const reabrir = await pedir('/api/buzon/abrir', { cookie: lider, cuerpo: { buzon: BUZON, empresa: 'Lácteos', areas: AREAS, convocados: [2] } });
    expect(reabrir.estado).toBe(409);
  });
});
