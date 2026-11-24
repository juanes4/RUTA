import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApi } from './api.mjs';
import { abrirBase } from './db.mjs';
import { extraerJson } from './ia.mjs';
import { PREGUNTAS, clasificarBrecha, validarPreguntas } from './simulador.mjs';

const PREGUNTAS_IA = [
  { texto: '¿Qué haces primero ante un cambio?', opciones: ['Ignorarlo', 'Entender el motivo', 'Esperar'], correcta: 1, explicacion: 'Entender el motivo reduce la incertidumbre.' },
  { texto: '¿Cómo respondes una duda del equipo?', opciones: ['Con claridad y a tiempo', 'Con silencio', 'Con rumores'], correcta: 0, explicacion: 'La claridad evita rumores.' },
  { texto: '¿Qué muestra que el cambio se sostiene?', opciones: ['Una firma', 'Uso diario del método', 'Una charla'], correcta: 1, explicacion: 'El comportamiento sostenido es la evidencia.' },
];

let servidor;
let base;
let llamadas = [];
let pedidos = [];
let estadoIA = 200;
let respuestaIA;
const respuestaGemini = (texto) => ({ candidates: [{ content: { role: 'model', parts: [{ text: texto }] }, finishReason: 'STOP' }] });
const salidaPreguntas = () => respuestaGemini('```json\n' + JSON.stringify({ preguntas: PREGUNTAS_IA }) + '\n```');

const fetchFalso = async (url, opciones) => {
  pedidos.push({ url, headers: opciones.headers });
  llamadas.push(JSON.parse(opciones.body));
  return new Response(JSON.stringify(respuestaIA), { status: estadoIA });
};
const textoEnviado = (llamada) => llamada.contents[0].parts[0].text;

beforeAll(async () => {
  process.env.RUTA_MINIMO_GRUPO_IA = '2';
  respuestaIA = salidaPreguntas();
  const api = crearApi(await abrirBase(':memory:'), { ia: { apiKey: 'clave-falsa', fetchFn: fetchFalso } });
  servidor = createServer((req, res) => void api(req, res));
  await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${servidor.address().port}`;
});
afterAll(() => {
  delete process.env.RUTA_MINIMO_GRUPO_IA;
  servidor.close();
});

async function pedir(ruta, { metodo = 'GET', cuerpo, cookie } = {}) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { estado: r.status, json: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] };
}
const entrar = async (usuario) => (await pedir('/api/login', { metodo: 'POST', cuerpo: { usuario, clave: 'ruta2026' } })).cookie;
const post = (ruta, cuerpo, cookie) => pedir(ruta, { metodo: 'POST', cuerpo, cookie });

describe('lógica de IA y simulador', () => {
  it('el banco base y la salida de la IA cumplen el formato', () => {
    expect(() => validarPreguntas(PREGUNTAS_IA)).not.toThrow();
    // El banco base no trae explicación: solo se exige a lo que genera la IA.
    for (const lista of Object.values(PREGUNTAS)) expect(lista).toHaveLength(3);
  });
  it('rechaza preguntas mal formadas', () => {
    expect(() => validarPreguntas(PREGUNTAS_IA.slice(0, 2))).toThrow();
    expect(() => validarPreguntas(PREGUNTAS_IA.map((q) => ({ ...q, correcta: 5 })))).toThrow();
    expect(() => validarPreguntas(PREGUNTAS_IA.map((q) => ({ ...q, opciones: ['a', 'a', 'b'] })))).toThrow();
  });
  it('cruza seguridad con resultado', () => {
    expect(clasificarBrecha(0, 3, 5)).toBe('sobreconfianza');
    expect(clasificarBrecha(1, 3, 4)).toBe('sobreconfianza');
    expect(clasificarBrecha(3, 3, 1)).toBe('subestima');
    expect(clasificarBrecha(1, 3, 1)).toBe('necesita_apoyo');
    expect(clasificarBrecha(2, 3, 5)).toBe('alineado');
  });
  it('extrae JSON aunque venga con texto alrededor', () => {
    expect(extraerJson('Aquí va: {"a":1} listo')).toEqual({ a: 1 });
    expect(() => extraerJson('sin json')).toThrow();
  });
});

describe('API de IA en T2', () => {
  it('solo los líderes usan los agentes', async () => {
    const e = await entrar('empleado1');
    expect((await pedir('/api/ia/preguntas', { cookie: e })).estado).toBe(403);
    expect((await post('/api/ia/preguntas/generar', { videoId: 'emp-1' }, e)).estado).toBe(403);
    expect((await post('/api/ia/resumen', {}, e)).estado).toBe(403);
    expect((await pedir('/api/ia/preguntas')).estado).toBe(401);
  });

  it('la IA deja un borrador y los empleados no lo ven hasta que se aprueba', async () => {
    const l = await entrar('lider');
    llamadas = [];
    const g = await post('/api/ia/preguntas/generar', { videoId: 'emp-3', contexto: 'Texto del video.' }, l);
    expect(g.estado).toBe(200);
    expect(llamadas).toHaveLength(1);
    expect(textoEnviado(llamadas[0])).toContain('Texto del video.');
    expect(llamadas[0].systemInstruction.parts[0].text).toContain('diseñador instruccional');

    const e = await entrar('empleado1');
    expect((await pedir('/api/preguntas?videoId=emp-3', { cookie: e })).json.preguntas[0].texto).toBe(PREGUNTAS['emp-3'][0].texto);

    expect((await post('/api/ia/preguntas/aprobar', { videoId: 'emp-3' }, l)).estado).toBe(200);
    const p = await pedir('/api/preguntas?videoId=emp-3', { cookie: e });
    expect(p.json.preguntas[0].texto).toBe(PREGUNTAS_IA[0].texto);
    expect(JSON.stringify(p.json)).not.toContain('correcta');
    expect(JSON.stringify(p.json)).not.toContain('explicacion');
    expect((await post('/api/ia/preguntas/aprobar', { videoId: 'emp-3' }, l)).estado).toBe(404);
  });

  it('califica con las preguntas aprobadas y devuelve la explicación y la lectura de seguridad', async () => {
    const e = await entrar('empleado3');
    await post('/api/vistas', { videoId: 'emp-3' }, e);
    const r = await post('/api/simulador', { videoId: 'emp-3', respuestas: [0, 1, 0], seguridad: 5 }, e);
    expect(r.estado).toBe(200);
    expect(r.json).toMatchObject({ aciertos: 0, aprobado: false, brecha: 'sobreconfianza' });
    expect(r.json.detalle[0]).toMatchObject({ acerto: false, correcta: 1, explicacion: PREGUNTAS_IA[0].explicacion });
    const mis = await pedir('/api/videos', { cookie: e });
    expect(mis.json.videos.find((v) => v.id === 'emp-3').simulador.brecha).toBe('sobreconfianza');
  });

  it('una salida inválida de la IA no se guarda', async () => {
    const l = await entrar('lider');
    respuestaIA = respuestaGemini('{"preguntas":[{"texto":"x"}]}');
    expect((await post('/api/ia/preguntas/generar', { videoId: 'emp-4' }, l)).estado).toBe(502);
    const g = await pedir('/api/ia/preguntas', { cookie: l });
    expect(g.json.videos.find((v) => v.id === 'emp-4').borrador).toBeNull();
    respuestaIA = salidaPreguntas();
  });

  it('el resumen manda al modelo solo grupos con el mínimo de personas y sin nombres', async () => {
    const l = await entrar('lider');
    // Un solo resultado en emp-3 (mínimo de la prueba: 2): no viaja al modelo.
    llamadas = [];
    const sin = await post('/api/ia/resumen', {}, l);
    expect(sin.json.origen).toBe('reglas');
    expect(llamadas).toHaveLength(0);

    const e1 = await entrar('empleado1');
    await post('/api/vistas', { videoId: 'emp-3' }, e1);
    await post('/api/simulador', { videoId: 'emp-3', respuestas: [1, 0, 1], seguridad: 4 }, e1);
    respuestaIA = respuestaGemini('Resumen de prueba.');
    const con = await post('/api/ia/resumen', {}, l);
    expect(con.json).toEqual({ texto: 'Resumen de prueba.', origen: 'ia' });
    const enviado = textoEnviado(llamadas[0]);
    expect(enviado).not.toContain('Laura');
    expect(enviado).not.toContain('Daniela');
    expect(JSON.parse(enviado)).toHaveLength(1);
  });

  it('llama a Gemini con la clave en el header, no en la URL ni en el cuerpo', async () => {
    const l = await entrar('lider');
    pedidos = [];
    llamadas = [];
    respuestaIA = salidaPreguntas();
    await post('/api/ia/preguntas/generar', { videoId: 'emp-5' }, l);
    expect(pedidos[0].url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent');
    expect(pedidos[0].headers['x-goog-api-key']).toBe('clave-falsa');
    expect(pedidos[0].url).not.toContain('clave-falsa');
    expect(JSON.stringify(llamadas[0])).not.toContain('clave-falsa');
  });

  it('ignora las partes de razonamiento y une el texto de la respuesta', async () => {
    const l = await entrar('lider');
    respuestaIA = { candidates: [{ content: { parts: [{ text: 'pensando…', thought: true }, { text: 'Resumen ' }, { text: 'final.' }] } }] };
    const e1 = await entrar('empleado1');
    await post('/api/vistas', { videoId: 'emp-3' }, e1);
    const r = await post('/api/ia/resumen', {}, l);
    expect(r.json.texto).toBe('Resumen final.');
  });

  it('explica los errores de Gemini: clave inválida, límite de uso y modelo inexistente', async () => {
    const l = await entrar('lider');
    estadoIA = 400;
    respuestaIA = { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT' } };
    const clave = await post('/api/ia/preguntas/generar', { videoId: 'lid-1' }, l);
    expect(JSON.stringify(clave.json)).toContain('clave de la IA no es válida');
    estadoIA = 429;
    respuestaIA = { error: { code: 429, message: 'Quota exceeded', status: 'RESOURCE_EXHAUSTED' } };
    expect(JSON.stringify((await post('/api/ia/preguntas/generar', { videoId: 'lid-1' }, l)).json)).toContain('límite de uso');
    estadoIA = 404;
    respuestaIA = { error: { code: 404, message: 'models/x is not found', status: 'NOT_FOUND' } };
    expect(JSON.stringify((await post('/api/ia/preguntas/generar', { videoId: 'lid-1' }, l)).json)).toContain('RUTA_MODELO_IA');
    estadoIA = 200;
    respuestaIA = salidaPreguntas();
  });
});
