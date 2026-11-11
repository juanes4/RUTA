import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import { CATALOGO_BUZON1 } from './buzon1';
import { COLUMNAS_RESPUESTAS, fusionarRespuestas, importarRespuestas } from './respuestasCsv';

const contexto = { catalogo: CATALOGO_BUZON1, areas: ['Bodega'], escala: REGLAS.escala };
const cabecera = COLUMNAS_RESPUESTAS.join(',');
const linea = (pregunta: string, dimension: string, valor: string, no_se = '', area = 'Bodega') =>
  `p1,buzon1,base,2026-11-09,${area},Día,1-3 años,${pregunta},${dimension},${valor},${no_se}`;

describe('importarRespuestas', () => {
  it('lee escala, "No sé", selección y abierta', () => {
    const csv = [
      cabecera,
      linea('b1_03', 'C', '4'),
      linea('b1_04', 'C', 'NS'),
      linea('b1_05', 'C', '', 'true'),
      linea('b1_preocupacion', 'otra', 'Perder el empleo'),
      linea('b1_falla', 'otra', '"El sistema, a veces, se cae"'),
    ].join('\r\n');
    const { filas, errores } = importarRespuestas(csv, contexto);
    expect(errores).toEqual([]);
    expect(filas.map((f) => [f.valor, f.no_se])).toEqual([
      [4, false],
      [null, true],
      [null, true],
      ['Perder el empleo', false],
      ['El sistema, a veces, se cae', false],
    ]);
  });

  it('acepta punto y coma y marca de orden de bytes', () => {
    const csv = `﻿${COLUMNAS_RESPUESTAS.join(';')}\n${linea('b1_03', 'C', '4').replaceAll(',', ';')}`;
    expect(importarRespuestas(csv, contexto).filas).toHaveLength(1);
  });

  it('rechaza todo el archivo si una línea está mal y dice cuál', () => {
    const csv = [cabecera, linea('b1_03', 'C', '4'), linea('b1_03', 'C', '9'), linea('b1_04', 'C', '3', '', 'Marte')].join('\n');
    const { filas, errores } = importarRespuestas(csv, contexto);
    expect(filas).toEqual([]);
    expect(errores).toHaveLength(2);
    expect(errores[0]).toContain('Línea 3');
    expect(errores[1]).toContain('Marte');
  });

  it('rechaza una dimensión que no corresponde a la pregunta y una pregunta desconocida', () => {
    const csv = [cabecera, linea('b1_03', 'D', '4'), linea('b1_99', 'C', '4')].join('\n');
    expect(importarRespuestas(csv, contexto).errores).toHaveLength(2);
  });

  it('avisa las columnas que faltan', () => {
    expect(importarRespuestas('id_respuesta,valor\na,1', contexto).errores[0]).toContain('instrumento');
  });
});

describe('importarRespuestas con el archivo de Google Forms', () => {
  const codigos = ['P1', 'P2', 'C1', 'C2', 'C3', 'D1', 'D2', 'K1', 'H1', 'R1', 'D5', 'K5', 'A1', 'A2', 'A3'];
  const titulos = (lista: readonly string[]) => lista.map((c) => `"${c}. Texto de la pregunta, con coma"`);
  const cabeceraForms = (lista = codigos) => ['Marca temporal', 'Dirección de correo electrónico', 'Área', 'Turno', ...titulos(lista)].join(',');
  const persona = (cambios: Record<string, string> = {}, area = 'bodega', marca = '9/11/2026 10:30:15') => {
    const celdas = codigos.map((c) => cambios[c] ?? (c === 'D5' ? '"Perder el empleo, Mayor carga de trabajo"' : c === 'K5' ? 'Video corto' : c.startsWith('A') ? 'Texto' : '4'));
    return [marca, 'alguien@empresa.co', area, 'Día', ...celdas].join(',');
  };

  it('convierte una persona en filas largas, empareja por código y no guarda el correo', () => {
    const { filas, errores } = importarRespuestas([cabeceraForms(), persona({ C2: 'No sé', A3: '' })].join('\n'), contexto);
    expect(errores).toEqual([]);
    expect(filas).toHaveLength(15);
    expect(new Set(filas.map((f) => f.id_respuesta)).size).toBe(1);
    expect(filas[0]).toMatchObject({ fecha: '2026-11-09', area: 'Bodega', turno: 'Día', instrumento: 'buzon1', momento: 'base' });
    expect(filas.find((f) => f.pregunta_id === 'b1_03')).toMatchObject({ valor: 4, dimension: 'C', no_se: false });
    expect(filas.find((f) => f.pregunta_id === 'b1_04')).toMatchObject({ valor: null, no_se: true });
    expect(filas.filter((f) => f.pregunta_id === 'b1_preocupacion').map((f) => f.valor)).toEqual(['Perder el empleo', 'Mayor carga de trabajo']);
    expect(JSON.stringify(filas)).not.toContain('alguien@empresa.co');
  });

  it('cargar el mismo archivo dos veces no duplica, y dos personas iguales siguen siendo dos', () => {
    const csv = [cabeceraForms(), persona(), persona()].join('\n');
    const { filas } = importarRespuestas(csv, contexto);
    expect(new Set(filas.map((f) => f.id_respuesta)).size).toBe(2);
    expect(fusionarRespuestas(filas, importarRespuestas(csv, contexto).filas)).toHaveLength(filas.length);
  });

  it('dice qué códigos faltan', () => {
    const csv = [cabeceraForms(codigos.filter((c) => c !== 'K1')), persona()].join('\n');
    expect(importarRespuestas(csv, contexto).errores[0]).toContain('K1');
  });

  it('rechaza todo el archivo si una persona tiene un error y nombra el código', () => {
    const { filas, errores } = importarRespuestas([cabeceraForms(), persona(), persona({ D1: '9' })].join('\n'), contexto);
    expect(filas).toEqual([]);
    expect(errores).toHaveLength(1);
    expect(errores[0]).toContain('Línea 3');
    expect(errores[0]).toContain('D1');
  });

  it('un área desconocida da un solo error por persona', () => {
    expect(importarRespuestas([cabeceraForms(), persona({}, 'Marte')].join('\n'), contexto).errores).toHaveLength(1);
  });

  it('separa las opciones marcadas con coma o con punto y coma', () => {
    const csv = [cabeceraForms(), persona({ D5: '"Perder el empleo;Mayor carga de trabajo"' })].join('\n');
    expect(importarRespuestas(csv, contexto).filas.filter((f) => f.pregunta_id === 'b1_preocupacion')).toHaveLength(2);
  });

  it('rechaza más opciones de las permitidas', () => {
    const csv = [cabeceraForms(), persona({ K5: '"Video corto, Taller en grupo, Guía de una página"' })].join('\n');
    expect(importarRespuestas(csv, contexto).errores[0]).toContain('K5');
  });

  it('lee la marca temporal en inglés y en formato de año primero', () => {
    const ingles = [cabeceraForms().replace('Marca temporal', 'Timestamp'), persona({}, 'Bodega', '11/9/2026 10:30:15')].join('\n');
    expect(importarRespuestas(ingles, contexto).filas[0]?.fecha).toBe('2026-11-09');
    const anio = [cabeceraForms(), persona({}, 'Bodega', '2026/11/09 10:30:15 a. m. GMT-5')].join('\n');
    expect(importarRespuestas(anio, contexto).filas[0]?.fecha).toBe('2026-11-09');
  });
});

describe('fusionarRespuestas', () => {
  it('cargar el mismo archivo dos veces no duplica', () => {
    const csv = [cabecera, linea('b1_03', 'C', '4')].join('\n');
    const { filas } = importarRespuestas(csv, contexto);
    expect(fusionarRespuestas(filas, filas)).toHaveLength(1);
  });
});
