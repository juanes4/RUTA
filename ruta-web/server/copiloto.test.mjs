import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApi } from './api.mjs';
import { enmascarar } from './copiloto/anonimizar.mjs';
import { BUZON_PRUEBA, buzonPruebaCsv, CLASIFICACION_PRUEBA, EMPRESA_PRUEBA } from './copiloto/buzonPrueba.mjs';
import { generar } from './copiloto/gemini.mjs';
import { enLotes } from './copiloto/rutas.mjs';
import { construirInforme } from './copiloto/informe.mjs';
import { abrirBase } from './db.mjs';

function servidorCon(env, generarImpl) {
  let servidor;
  const ctx = { base: '' };
  beforeAll(async () => {
    const api = crearApi(await abrirBase(':memory:'), { env, generarImpl });
    servidor = createServer((req, res) => api(req, res).then((ok) => ok || res.writeHead(404).end()));
    await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
    ctx.base = `http://127.0.0.1:${servidor.address().port}`;
  });
  afterAll(() => servidor.close());
  ctx.pedir = async (ruta, { metodo = 'GET', cuerpo, cookie, cabeceras = {} } = {}) => {
    const r = await fetch(ctx.base + ruta, {
      method: metodo,
      headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...cabeceras },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    return { estado: r.status, json: await r.json(), cookie: r.headers.get('set-cookie')?.split(';')[0] };
  };
  ctx.entrar = async (usuario) => (await ctx.pedir('/api/login', { metodo: 'POST', cuerpo: { usuario, clave: 'ruta2026' } })).cookie;
  return ctx;
}

const AREAS = EMPRESA_PRUEBA.areas;
const filaReal = { id: 'x1', fecha: '2026-11-20', area: 'Bodega', grupo: 'Operativo', p1: 'Una respuesta real de alguien', p2: '', p3: '' };

describe('buzón de prueba', () => {
  it('el CSV público para R5 coincide con los datos de prueba del servidor', () => {
    // Sin importar el salto de línea: en Windows git puede sacar el archivo con CRLF (core.autocrlf).
    const sinCr = (t) => t.replace(/\r\n/g, '\n');
    expect(sinCr(readFileSync(new URL('../public/buzon_prueba.csv', import.meta.url), 'utf8'))).toBe(sinCr(buzonPruebaCsv()));
  });

  it('cumple la lista de la demo', () => {
    const porGrupo = (g) => BUZON_PRUEBA.filter((f) => f.grupo === g).length;
    expect(BUZON_PRUEBA.length).toBeGreaterThanOrEqual(40);
    expect(porGrupo('Operativo')).toBeGreaterThanOrEqual(5);
    expect(porGrupo('Administrativo')).toBeGreaterThanOrEqual(5);
    expect(porGrupo('Líder de área')).toBeLessThan(5);
    expect(BUZON_PRUEBA.some((f) => f.p1 === 'todo mal')).toBe(true);
  });
});

describe('enmascarado', () => {
  it('quita correos, teléfonos, cédulas y nombres comunes', () => {
    const { texto, conteo } = enmascarar('Hernán Restrepo dijo; escriban a ana.perez@correo.com o al 310 456 7890. CC 1.023.456.789. Habló con doña Gloria Pérez.');
    expect(texto).not.toMatch(/Hernán|ana\.perez|310|1\.023|Gloria/);
    expect(conteo).toMatchObject({ correo: 1, telefono: 1, cedula: 1 });
    expect(conteo.persona).toBeGreaterThanOrEqual(2);
  });

  it('no toca edades, años ni palabras comunes', () => {
    expect(enmascarar('Tengo 52 años, desde 2026 la luz falla').texto).toBe('Tengo 52 años, desde 2026 la luz falla');
  });
});

describe('informe del buzón (conteos en código)', () => {
  const informe = construirInforme({ filas: BUZON_PRUEBA, clasificacion: CLASIFICACION_PRUEBA, areas: AREAS });

  it('participación sobre los afectados de la Etapa 0', () => {
    expect(informe.participacion).toEqual({ respuestas: 49, personas: 100, porcentaje: 49 });
  });

  it('cada mención sale de la clasificación y los porcentajes usan las respuestas de cada pregunta', () => {
    const pro = informe.temas.find((t) => t.codigo === 'PRO');
    const esperado = CLASIFICACION_PRUEBA.filter((c) => c.pregunta === 'p1' && c.temas.includes('PRO')).length;
    expect(pro.p1).toBe(esperado);
    expect(pro.pctP1).toBe(Math.round((esperado / informe.respondidas.p1) * 100));
    expect(informe.temas).toHaveLength(5);
  });

  it('no segmenta grupos con menos de 5 respuestas ni cruza área × grupo', () => {
    expect(informe.diferencias.grupo.ocultos).toContain('Líder de área');
    expect(informe.diferencias.grupo.visibles.map((v) => v.segmento)).not.toContain('Prefiero no decirlo');
    for (const d of [...informe.diferencias.grupo.diferencias, ...informe.diferencias.area.diferencias]) expect(d.respuestas).toBeGreaterThanOrEqual(5);
  });

  it('alerta el miedo al empleo aunque sea poco frecuente, y cuenta la revisión humana por tipo', () => {
    expect(informe.alertas.intensas.find((a) => a.tema === 'Miedo a perder el empleo')?.casos).toBe(5);
    expect(informe.revision).toEqual(
      expect.arrayContaining([expect.objectContaining({ tipo: 'acoso_maltrato', cantidad: 1 }), expect.objectContaining({ tipo: 'seguridad_salud', cantidad: 1 })]),
    );
    expect(informe.limites.join(' ')).toMatch(/permiten reconocer/);
  });

  it('ignora clasificaciones de respuestas vacías o con temas inventados', () => {
    const r = construirInforme({
      filas: [{ id: 'a', area: 'X', grupo: '', p1: 'algo', p2: '', p3: '' }],
      clasificacion: [
        { id: 'a', pregunta: 'p2', temas: ['SOB'] },
        { id: 'a', pregunta: 'p1', temas: ['INVENTADO'] },
      ],
      areas: [],
    });
    expect(r.clasificadas).toBe(0);
    expect(r.limites.join(' ')).toMatch(/no quedaron clasificadas/);
  });
});

describe('lotes del buzón', () => {
  it('reparte en pocos lotes parecidos sin perder filas', () => {
    const filas = (n) => Array.from({ length: n }, (_, i) => i);
    expect(enLotes(filas(5))).toEqual([filas(5)]);
    expect(enLotes(filas(49)).map((l) => l.length)).toEqual([10, 10, 10, 10, 9]);
    const grandes = enLotes(filas(500));
    expect(grandes).toHaveLength(6);
    expect(grandes.flat()).toEqual(filas(500));
    expect(enLotes([])).toEqual([]);
  });
});

describe('cliente de Gemini', () => {
  const env = { GEMINI_API_KEY: 'clave-secreta', GEMINI_MODEL: 'modelo-x' };
  const respuesta = (estado, cuerpo) => async () => new Response(JSON.stringify(cuerpo), { status: estado });

  it('pide JSON con esquema y omite las partes de razonamiento', async () => {
    let enviado;
    const fetchImpl = async (url, init) => {
      enviado = { url, init, cuerpo: JSON.parse(init.body) };
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'pensando', thought: true }, { text: '{"ok":true}' }] } }] }));
    };
    const r = await generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'hola' }], esquema: { type: 'object' }, env, fetchImpl });
    expect(r).toEqual({ ok: true });
    expect(enviado.url).toContain('/models/modelo-x:generateContent');
    expect(enviado.url).not.toContain('clave-secreta');
    expect(enviado.init.headers['x-goog-api-key']).toBe('clave-secreta');
    expect(enviado.cuerpo.generationConfig).toEqual({ responseMimeType: 'application/json', responseJsonSchema: { type: 'object' } });
  });

  it('a Gemini 3 le pide razonamiento bajo; a otros modelos no se lo envía', async () => {
    const cuerpos = [];
    const fetchImpl = async (url, init) => {
      cuerpos.push({ url, cuerpo: JSON.parse(init.body) });
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'hola' }] } }] }));
    };
    const pedir = (extra) => generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env: { ...env, ...extra }, fetchImpl });
    await pedir({ GEMINI_MODEL: 'gemini-3.8-flash' });
    expect(cuerpos.at(-1).cuerpo.generationConfig).toEqual({ thinkingConfig: { thinkingLevel: 'low' } });
    await pedir({ GEMINI_MODEL: 'gemini-3.8-flash', GEMINI_RAZONAMIENTO: 'minimal' });
    expect(cuerpos.at(-1).cuerpo.generationConfig.thinkingConfig.thinkingLevel).toBe('minimal');
    await pedir({ GEMINI_MODEL: 'gemini-3.8-flash', GEMINI_RAZONAMIENTO: 'auto' });
    expect(cuerpos.at(-1).cuerpo.generationConfig).toBeUndefined();
    await pedir({ GEMINI_MODEL: 'gemma-4-31b-it' });
    expect(cuerpos.at(-1).cuerpo.generationConfig).toBeUndefined();
  });

  it('si el modelo no acepta el nivel de razonamiento, repite la solicitud sin él', async () => {
    const cuerpos = [];
    const fetchImpl = async (_url, init) => {
      const cuerpo = JSON.parse(init.body);
      cuerpos.push(cuerpo);
      if (cuerpo.generationConfig?.thinkingConfig) return new Response(JSON.stringify({ error: { message: 'thinking_level is not supported' } }), { status: 400 });
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'hola' }] } }] }));
    };
    expect(await generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env: { ...env, GEMINI_MODEL: 'gemini-3-viejo' }, fetchImpl })).toBe('hola');
    expect(cuerpos).toHaveLength(2);
  });

  it('reintenta una saturación pasajera (503) y sigue si Gemini se recupera', async () => {
    let intentos = 0;
    const fetchImpl = async () => {
      intentos += 1;
      if (intentos < 3) return new Response(JSON.stringify({ error: { message: 'high demand' } }), { status: 503 });
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'hola' }] } }] }));
    };
    expect(await generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env, fetchImpl, esperas: [0, 0] })).toBe('hola');
    expect(intentos).toBe(3);
  });

  it('si la clave principal falla, usa la de respaldo', async () => {
    const usadas = [];
    const fetchImpl = async (_url, init) => {
      usadas.push(init.headers['x-goog-api-key']);
      if (init.headers['x-goog-api-key'] === 'principal') return new Response(JSON.stringify({ error: { message: 'You exceeded your current quota' } }), { status: 429 });
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'hola' }] } }] }));
    };
    const conRespaldo = { GEMINI_API_KEY: 'principal', GEMINI_API_KEY_RESPALDO: 'respaldo', GEMINI_MODEL: 'm' };
    expect(await generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env: conRespaldo, fetchImpl, esperas: [] })).toBe('hola');
    // El 429 no se reintenta con la misma clave: se pasa directo a la de respaldo.
    expect(usadas).toEqual(['principal', 'respaldo']);
  });

  it('con las dos claves fallando, lo dice sin mostrar ninguna; un error del modelo no cambia de clave', async () => {
    const conRespaldo = { GEMINI_API_KEY: 'clave-uno', GEMINI_API_KEY_RESPALDO: 'clave-dos', GEMINI_MODEL: 'm' };
    const llamar = (fetchImpl) => generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env: conRespaldo, fetchImpl, esperas: [] });
    const error = await llamar(async (_u, init) => new Response(JSON.stringify({ error: { message: `quota ${init.headers['x-goog-api-key']}` } }), { status: 429 })).catch((e) => e);
    expect(error.message).toMatch(/clave principal y la de respaldo/);
    expect(error.message).not.toMatch(/clave-uno|clave-dos/);
    let llamadas = 0;
    await llamar(async () => {
      llamadas += 1;
      return new Response(JSON.stringify({ error: { message: 'not found' } }), { status: 404 });
    }).catch(() => undefined);
    expect(llamadas).toBe(1);
  });

  it('si el modelo no funciona, prueba los de respaldo en orden y dice cuál respondió', async () => {
    const pedidos = [];
    const fetchImpl = async (url, init) => {
      const modelo = url.match(/models\/([^:]+):/)[1];
      pedidos.push(`${modelo}/${init.headers['x-goog-api-key']}`);
      if (modelo === 'grande') return new Response(JSON.stringify({ error: { message: 'high demand' } }), { status: 503 });
      if (modelo === 'mediano') return new Response(JSON.stringify({ error: { message: 'You exceeded your current quota' } }), { status: 429 });
      return new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'hola' }] } }] }));
    };
    const registro = {};
    const cadena = { GEMINI_API_KEY: 'k1', GEMINI_API_KEY_RESPALDO: 'k2', GEMINI_MODEL: 'grande', GEMINI_MODELOS_RESPALDO: 'mediano, models/pequeno' };
    expect(await generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env: cadena, fetchImpl, esperas: [], registro })).toBe('hola');
    // Saturado: no cambia de clave, pasa al siguiente modelo. Sin cuota: prueba la otra clave antes de bajar de modelo.
    expect(pedidos).toEqual(['grande/k1', 'mediano/k1', 'mediano/k2', 'pequeno/k1']);
    expect(registro.modelo).toBe('pequeno');
  });

  it('si ningún modelo funciona, lo dice con la lista de modelos probados', async () => {
    const cadena = { GEMINI_API_KEY: 'k1', GEMINI_MODEL: 'a', GEMINI_MODELOS_RESPALDO: 'b' };
    const error = await generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env: cadena, fetchImpl: respuesta(503, {}), esperas: [] }).catch((e) => e);
    expect(error.message).toMatch(/se probaron 2 modelos \(a, b\)/);
  });

  it('da mensajes claros y nunca repite la clave', async () => {
    const llamar = (fetchImpl) => generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env, fetchImpl });
    await expect(llamar(respuesta(404, { error: { message: 'not found' } }))).rejects.toThrow(/no encontró el modelo "modelo-x"/);
    await expect(llamar(respuesta(400, { error: { message: 'mala clave-secreta' } }))).rejects.toThrow(/\[clave\]/);
    await expect(llamar(respuesta(400, { error: { message: 'API key not valid. Please pass a valid API key.' } }))).rejects.toThrow(/revisa GEMINI_API_KEY/);
    await expect(generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env, fetchImpl: respuesta(429, {}), esperas: [] })).rejects.toThrow(/modo simulado/);
    await expect(generar({ sistema: 's', contenidos: [{ rol: 'usuario', texto: 'x' }], env, fetchImpl: respuesta(503, {}), esperas: [] })).rejects.toThrow(/saturado/);
    await expect(generar({ sistema: 's', contenidos: [], env: {} })).rejects.toThrow(/GEMINI_API_KEY y GEMINI_MODEL/);
  });
});

describe('API del copiloto sin Gemini configurado', () => {
  const s = servidorCon({});

  it('es solo para líderes', async () => {
    expect((await s.pedir('/api/copiloto/estado')).estado).toBe(401);
    expect((await s.pedir('/api/copiloto/estado', { cookie: await s.entrar('empleado1') })).estado).toBe(403);
    const { json } = await s.pedir('/api/copiloto/estado', { cookie: await s.entrar('lider') });
    expect(json.gemini).toMatchObject({ configurado: false, faltan: ['GEMINI_API_KEY', 'GEMINI_MODEL'] });
    expect(json.datosReales).toBe(false);
  });

  it('en modo Gemini avisa que no está configurado y ofrece el simulado', async () => {
    const r = await s.pedir('/api/copiloto/buzon', { metodo: 'POST', cookie: await s.entrar('lider'), cuerpo: { modo: 'gemini', buzon: BUZON_PRUEBA, areas: AREAS } });
    expect(r.estado).toBe(503);
    expect(r.json).toMatchObject({ puedeSimular: true });
  });

  it('el modo simulado analiza el buzón de prueba con la clasificación de referencia', async () => {
    const r = await s.pedir('/api/copiloto/buzon', { metodo: 'POST', cookie: await s.entrar('lider'), cuerpo: { modo: 'simulado', buzon: BUZON_PRUEBA, areas: AREAS } });
    expect(r.estado).toBe(200);
    expect(r.json.modo).toBe('simulado');
    expect(r.json.informe.participacion.respuestas).toBe(49);
    expect(r.json.clasificacion.some((c) => /lmarin/.test(c.texto))).toBe(false);
    expect(r.json.ajustes).toMatchObject({ riesgos: expect.any(Array), triaje: [] });
  });

  it('compara el buzón con el lienzo y el triaje y propone ajustes', async () => {
    const contexto = { lienzo: { riesgos: ['Que el sistema nuevo falle en la primera semana'], intentos_previos: [] }, triaje: { impacto_personas: 1, riesgo_operativo: 1, elementos: [] } };
    const r = await s.pedir('/api/copiloto/buzon', { metodo: 'POST', cookie: await s.entrar('lider'), cuerpo: { modo: 'simulado', buzon: BUZON_PRUEBA, areas: AREAS, contexto } });
    expect(r.estado).toBe(200);
    expect(r.json.ajustes.riesgos.length).toBeGreaterThan(0);
    expect(r.json.ajustes.riesgos.every((x) => x.riesgo && x.fuente)).toBe(true);
    // Solo propone puntajes distintos a los que ya tiene el triaje.
    expect(r.json.ajustes.triaje.every((a) => a.puntaje !== contexto.triaje[a.criterio])).toBe(true);
  });

  it('el modo simulado no inventa clasificaciones para un buzón real', async () => {
    const r = await s.pedir('/api/copiloto/buzon', { metodo: 'POST', cookie: await s.entrar('lider'), cuerpo: { modo: 'simulado', buzon: [filaReal], areas: AREAS } });
    expect(r.estado).toBe(422);
  });

  it('la entrevista simulada repregunta una respuesta vaga', async () => {
    const cookie = await s.entrar('lider');
    const primera = await s.pedir('/api/copiloto/lienzo', { metodo: 'POST', cookie, cuerpo: { modo: 'simulado', mensajes: [{ rol: 'usuario', texto: 'Empecemos' }] } });
    expect(primera.json.texto).toMatch(/Bloque 1 de 7/);
    const segunda = await s.pedir('/api/copiloto/lienzo', {
      metodo: 'POST',
      cookie,
      cuerpo: { modo: 'simulado', mensajes: [{ rol: 'usuario', texto: 'Empecemos' }, { rol: 'copiloto', texto: primera.json.texto }, { rol: 'usuario', texto: 'Hay que modernizarse' }] },
    });
    expect(segunda.json.texto).toMatch(/Bloque 1 de 7/);
    expect(segunda.json.texto).toMatch(/cifra/);
  });
});

describe('API del copiloto con Gemini (simulado en la prueba) y bloqueo de datos reales', () => {
  const llamadas = [];
  const generarFalso = async (p) => {
    llamadas.push(p);
    return { clasificacion: [{ id: 'R01', pregunta: 'p1', temas: ['SOB'], otro: '', sentimiento: 'molesto', intensidad: 2, revision: 'ninguna', identificable: false }], sintesis: [], propuestas: [], lectura: ['x'] };
  };
  const conBloqueo = servidorCon({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm' }, generarFalso);

  it('sin RUTA_IA_DATOS_REALES solo deja pasar el buzón de prueba', async () => {
    const cookie = await conBloqueo.entrar('lider');
    const real = await conBloqueo.pedir('/api/copiloto/buzon', { metodo: 'POST', cookie, cuerpo: { modo: 'gemini', buzon: [...BUZON_PRUEBA, filaReal], areas: AREAS } });
    expect(real.estado).toBe(403);
    expect(real.json.bloqueado).toBe(true);
    expect(llamadas).toHaveLength(0);

    const prueba = await conBloqueo.pedir('/api/copiloto/buzon', { metodo: 'POST', cookie, cuerpo: { modo: 'gemini', buzon: BUZON_PRUEBA, areas: AREAS } });
    expect(prueba.estado).toBe(200);
    expect(prueba.json.modo).toBe('gemini');
    // Se clasifica por lotes en paralelo y después se sintetiza: varias llamadas.
    expect(llamadas.length).toBeGreaterThan(2);
    // Lo que sale hacia Gemini va enmascarado y con ids cortos.
    const sistema = llamadas.map((l) => l.sistema).join('\n');
    expect(sistema).not.toMatch(/lmarin|310 456|Hernán Restrepo|prueba-01/);
    expect(sistema).toMatch(/\[dato personal\]/);
    // El id corto R01 vuelve al id del buzón.
    expect(prueba.json.clasificacion[0].id).toBe('prueba-01');
  });

  const permitido = servidorCon({ GEMINI_API_KEY: 'k', GEMINI_MODEL: 'm', RUTA_IA_DATOS_REALES: 'permitido' }, generarFalso);

  it('con RUTA_IA_DATOS_REALES=permitido acepta respuestas reales, igual enmascaradas', async () => {
    const r = await permitido.pedir('/api/copiloto/buzon', {
      metodo: 'POST',
      cookie: await permitido.entrar('lider'),
      cuerpo: { modo: 'gemini', buzon: [{ ...filaReal, p1: 'Me llamo María López, cel 3001234567' }], areas: AREAS },
    });
    expect(r.estado).toBe(200);
    expect(llamadas.at(-1).sistema).not.toMatch(/María|3001234567/);
  });
});
