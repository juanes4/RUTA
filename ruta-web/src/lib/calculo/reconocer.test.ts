import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import { TRIAJE_VACIO, type Triaje } from '../modelo/proyecto';
import type { FilaActor, FilaFoda, FilaLiderazgo } from '../modelo/tipos';
import { actoresEnCuadrante, brechaCompromiso, resumirActores } from './actores';
import { evaluarFoda } from './foda';
import { contarLetras, estilosDominantes, lideresPorEstilo, resumirLiderazgo, vocerosSugeridos } from './liderazgo';
import { evaluarTriaje, puntajeComplejidad } from './triaje';

const T = REGLAS.triaje;

describe('Triaje (R2)', () => {
  it('la complejidad sale de cuántos elementos impacta: 1 → 1, 2 o 3 → 2, 4 o más → 3', () => {
    expect([0, 1, 2, 3, 4, 6].map((n) => puntajeComplejidad(n, T))).toEqual([null, 1, 2, 2, 3, 3]);
  });

  const triaje = (impacto: 1 | 2 | 3, elementos: Triaje['elementos'], riesgo: 1 | 2 | 3): Triaje => ({
    ...TRIAJE_VACIO,
    impacto_personas: impacto,
    elementos,
    riesgo_operativo: riesgo,
  });

  it('asigna el semáforo: 3 a 4 verde, 5 a 7 amarillo, 8 a 9 rojo', () => {
    expect(evaluarTriaje(triaje(1, ['sistemas'], 2), T)).toMatchObject({ total: 4, nivel: 'verde' });
    expect(evaluarTriaje(triaje(2, ['sistemas', 'habilidades'], 1), T)).toMatchObject({ total: 5, nivel: 'amarillo' });
    expect(evaluarTriaje(triaje(3, ['sistemas', 'habilidades'], 2), T)).toMatchObject({ total: 7, nivel: 'amarillo' });
    expect(evaluarTriaje(triaje(3, ['estrategia', 'estructura', 'sistemas', 'valores'], 2), T)).toMatchObject({ total: 8, nivel: 'rojo' });
  });

  it('no inventa un puntaje mientras falte un criterio', () => {
    expect(evaluarTriaje({ ...TRIAJE_VACIO, impacto_personas: 3, riesgo_operativo: 3 }, T)).toMatchObject({ total: null, nivel: null });
  });
});

const item = (cuadrante: FilaFoda['cuadrante'], puntaje: number): FilaFoda => ({ id: `${cuadrante}${puntaje}`, cuadrante, item: 'x', puntaje });

describe('FODA matemático (R3)', () => {
  it('suma cada cuadrante y calcula los balances', () => {
    const r = evaluarFoda([item('F', 5), item('F', 3), item('D', 4), item('O', 2), item('A', 4)]);
    expect(r.totales).toEqual({ F: 8, O: 2, D: 4, A: 4 });
    expect(r).toMatchObject({ interno: 4, externo: -2, estrategia: 'FA' });
  });

  it('ubica la estrategia según el signo de los balances', () => {
    expect(evaluarFoda([item('F', 3), item('O', 3)]).estrategia).toBe('FO');
    expect(evaluarFoda([item('D', 3), item('O', 3)]).estrategia).toBe('DO');
    expect(evaluarFoda([item('D', 3), item('A', 3)]).estrategia).toBe('DA');
    expect(evaluarFoda([]).estrategia).toBeNull();
  });
});

const actor = (actor: string, extra: Partial<FilaActor> = {}): FilaActor => ({
  id: actor,
  actor,
  descripcion: '',
  necesidades: '',
  poder: null,
  interes: null,
  realidad: '',
  compromiso_actual: null,
  compromiso_deseado: null,
  ...extra,
});

describe('Mapa de actores (R4)', () => {
  it('la brecha es la distancia entre hoy (C) y lo deseado (D)', () => {
    expect(brechaCompromiso(actor('a', { compromiso_actual: 'se_resiste', compromiso_deseado: 'apoya' }))).toBe(2);
    expect(brechaCompromiso(actor('a', { compromiso_actual: 'apoya', compromiso_deseado: 'apoya' }))).toBe(0);
    expect(brechaCompromiso(actor('a', { compromiso_actual: 'apoya' }))).toBeNull();
  });

  it('ordena las prioridades de mayor a menor brecha', () => {
    const r = resumirActores([
      actor('Operativos', { compromiso_actual: 'desconoce', compromiso_deseado: 'apoya' }),
      actor('Jefes', { compromiso_actual: 'neutral', compromiso_deseado: 'lidera' }),
      actor('Dirección', { compromiso_actual: 'lidera', compromiso_deseado: 'lidera', poder: 'A', interes: 'A' }),
    ]);
    expect(r).toMatchObject({ total: 3, evaluados: 1, conCompromiso: 3, conBrecha: 2 });
    expect(r.prioridades).toEqual([
      { actor: 'Operativos', brecha: 3 },
      { actor: 'Jefes', brecha: 2 },
    ]);
  });

  it('agrupa por cuadrante de poder e interés', () => {
    const lista = [actor('a', { poder: 'A', interes: 'B' }), actor('b', { poder: 'A', interes: 'B' }), actor('c', { poder: 'B', interes: 'B' })];
    expect(actoresEnCuadrante(lista, 'A', 'B').map((a) => a.id)).toEqual(['a', 'b']);
  });
});

const encuesta = (lider_id: string, A: number, B: number, C: number): FilaLiderazgo => ({
  id: `${lider_id}-${A}${B}${C}`,
  lider_id,
  conteo_A: A,
  conteo_B: B,
  conteo_C: C,
  conteo_D: 8 - A - B - C,
});

describe('Liderazgo (U1)', () => {
  it('cuenta letras y, si hay empate, devuelve los dos estilos', () => {
    const conteos = contarLetras(['A', 'A', 'C', 'C', 'D']);
    expect(conteos).toEqual({ A: 2, B: 0, C: 2, D: 1 });
    expect(estilosDominantes(conteos)).toEqual(['A', 'C']);
  });

  it('promedia si un líder respondió varias veces', () => {
    const [lider] = resumirLiderazgo([encuesta('L1', 6, 0, 0), encuesta('L1', 4, 0, 0)]);
    expect(lider).toMatchObject({ encuestas: 2, dominantes: ['A'] });
    expect(lider?.conteos).toEqual({ A: 5, B: 0, C: 0, D: 3 });
  });

  it('sugiere voceros: primero C, luego B, y cuenta líderes por estilo', () => {
    const lideres = resumirLiderazgo([encuesta('L1', 0, 6, 0), encuesta('L2', 0, 0, 6), encuesta('L3', 6, 0, 0)]);
    expect(vocerosSugeridos(lideres).map((l) => l.lider_id)).toEqual(['L2', 'L1']);
    expect(lideresPorEstilo(lideres)).toEqual({ A: 1, B: 1, C: 1, D: 0 });
  });
});
