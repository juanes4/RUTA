import { createServer } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearApi } from './api.mjs';
import { extraerEscalamiento, MODELO_COACH, TEMPERATURA_COACH } from './coach.mjs';
import { abrirBase } from './db.mjs';
import { construirPromptCoach } from './prompts/coachRutaAndi.js';

describe('Prompt del Coach de Comunicación para Líderes (U3)', () => {
  it('inyecta las reglas exactas, el área, el estilo U1 y los documentos oficiales', () => {
    const prompt = construirPromptCoach({
      area: 'Logística',
      estiloU1: 'B',
      fechaActual: '2026-11-24',
      documentosOficiales: {
        r1Lienzo: { vision: 'Unificar inventarios en tiempo real', que_no_cambia: 'Los turnos base' },
        u2Narrativa: { vocero: 'L1', acompanamiento: 'Tutorías semanales' },
        u3Soporte: {
          mensajes: ['Nadie queda solo durante la transición'],
          preguntas: [{ pregunta: '¿Habrá capacitación?', respuesta: 'Sí, dos semanas antes del arranque.' }],
        },
        u4Empatia: { dolores: ['Temor a cometer errores en el nuevo sistema'] },
        r5Buzon: [{ area: 'Logística', preocupa: 'Curva de aprendizaje en horas pico' }],
      },
    });

    expect(prompt).toContain('REGLA DE ORO (ESTRICTA)');
    expect(prompt).toContain('FORMATO OBLIGATORIO DE RESPUESTA (5 PARTES)');
    expect(prompt).toContain('MODO ENSAYO (JUEGO DE ROLES)');
    expect(prompt).toContain('Participativo y Colaborativo (B)');
    expect(prompt).toContain('Logística');
    expect(prompt).toContain('2026-11-24');
    expect(prompt).toContain('Unificar inventarios en tiempo real');
    expect(prompt).toContain('Tutorías semanales');
    expect(prompt).toContain('¿Habrá capacitación?');
    expect(prompt).toContain('Temor a cometer errores en el nuevo sistema');
    expect(prompt).toContain('Curva de aprendizaje en horas pico');
  });

  it('indica explícitamente cuando no hay documentos cargados', () => {
    const prompt = construirPromptCoach({ area: '', estiloU1: '', documentosOficiales: null });
    expect(prompt).toContain('[SIN DOCUMENTOS CARGADOS]');
  });

  it('extrae correctamente la ficha JSON de escalamiento', () => {
    const respuesta = `1. Validación: Entiendo tu duda.\n\`\`\`json\n{\n  "fecha": "2026-11-24",\n  "area": "Planta",\n  "pregunta": "¿Habrá bono de transición?",\n  "tipo": "sin_respuesta_oficial",\n  "estado": "pendiente",\n  "respuesta_oficial": null\n}\n\`\`\``;
    expect(extraerEscalamiento(respuesta)).toEqual({
      fecha: '2026-11-24',
      area: 'Planta',
      pregunta: '¿Habrá bono de transición?',
      tipo: 'sin_respuesta_oficial',
      estado: 'pendiente',
      respuesta_oficial: null,
    });
  });
});

describe('API del Coach (/api/coach/chat y /api/coach/escalamientos)', () => {
  let servidor;
  let base;
  let ultimaLlamada = null;

  beforeAll(async () => {
    const api = crearApi(await abrirBase(':memory:'), {
      coachResponder: async (params) => {
        ultimaLlamada = params;
        const ultimoTexto = params.contents.at(-1)?.parts?.[0]?.text ?? '';
        if (ultimoTexto.toLowerCase().includes('bono')) {
          return `1. Validación: Es normal preguntar.\n2. Información oficial: No está definido.\n\`\`\`json\n{"fecha":"2026-11-24","area":"${params.liderConfig.area || 'General'}","pregunta":"Consulta sobre bono de transición","tipo":"sin_respuesta_oficial","estado":"pendiente","respuesta_oficial":null}\n\`\`\``;
        }
        return '1. Validación: Gracias por compartirlo.\n2. Información oficial: Según U3 hay capacitación previa.';
      },
    });
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

  const entrar = async (usuario = 'lider', clave = 'ruta2026') =>
    (await pedir('/api/login', { metodo: 'POST', cuerpo: { usuario, clave } })).cookie;

  it('exige sesión activa y valida mensaje vacío', async () => {
    expect((await pedir('/api/coach/chat', { metodo: 'POST', cuerpo: { message: 'Hola' } })).estado).toBe(401);
    const cookie = await entrar();
    expect((await pedir('/api/coach/chat', { metodo: 'POST', cuerpo: { message: '   ' }, cookie })).estado).toBe(400);
  });

  it('envía historial, documentos, modelo gemini-2.5-flash y temperatura 0.4', async () => {
    const cookie = await entrar();
    const res = await pedir('/api/coach/chat', {
      metodo: 'POST',
      cookie,
      cuerpo: {
        message: 'Quiero practicar',
        history: [
          { role: 'user', text: 'Hola Coach' },
          { role: 'model', text: 'Hola, ¿en qué te ayudo?' },
        ],
        liderConfig: { area: 'Operaciones', estiloU1: 'C' },
        documentosOficiales: {
          u3Soporte: { mensajes: ['Habrá acompañamiento diario'] },
        },
      },
    });

    expect(res.estado).toBe(200);
    expect(res.json.modelo).toBe(MODELO_COACH);
    expect(res.json.documentosDetectados).toContain('FAQs y soporte (U3)');
    expect(ultimaLlamada.model).toBe(MODELO_COACH);
    expect(ultimaLlamada.temperature).toBe(TEMPERATURA_COACH);
    expect(ultimaLlamada.temperature).toBe(0.4);
    expect(ultimaLlamada.contents).toHaveLength(3);
    expect(ultimaLlamada.contents[0]).toEqual({ role: 'user', parts: [{ text: 'Hola Coach' }] });
    expect(ultimaLlamada.contents[2]).toEqual({ role: 'user', parts: [{ text: 'Quiero practicar' }] });
    expect(ultimaLlamada.systemInstruction).toContain('Transformacional e Inspirador (C)');
    expect(ultimaLlamada.systemInstruction).toContain('Habrá acompañamiento diario');
  });

  it('detecta, guarda y lista fichas de escalamiento anónimas', async () => {
    const cookie = await entrar();
    const chat = await pedir('/api/coach/chat', {
      metodo: 'POST',
      cookie,
      cuerpo: {
        message: '¿Habrá un bono por el cambio?',
        history: [],
        liderConfig: { area: 'Comercial', estiloU1: 'A' },
      },
    });

    expect(chat.estado).toBe(200);
    expect(chat.json.escalamiento).toMatchObject({
      area: 'Comercial',
      tipo: 'sin_respuesta_oficial',
      estado: 'pendiente',
      respuesta_oficial: null,
    });

    const guardado = await pedir('/api/coach/escalamientos', {
      metodo: 'POST',
      cookie,
      cuerpo: chat.json.escalamiento,
    });
    expect(guardado.estado).toBe(200);

    const listado = await pedir('/api/coach/escalamientos', { cookie });
    expect(listado.estado).toBe(200);
    expect(listado.json.escalamientos).toHaveLength(1);
    expect(listado.json.escalamientos[0].pregunta).toBe('Consulta sobre bono de transición');
  });
});
