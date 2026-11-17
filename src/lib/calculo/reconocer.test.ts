import { describe, expect, it } from 'vitest';
import type { FilaActor, FilaFoda, FilaLiderazgo } from '../modelo/tipos';
import { coberturaActores, contarEnMatriz } from './actores';
import { masVotados, variacionFoda } from './foda';
import { contarLetras, estilosDominantes, resumirLiderazgo } from './liderazgo';

const item = (id: string, votos: number, dia90: number | null = null): FilaFoda => ({
  id,
  item: id,
  cuadrante: 'F',
  evidencia: 'e',
  puntaje_inicial: 3,
  puntaje_dia90: dia90,
  votos,
});

const actor = (accion: string): FilaActor => ({
  id: accion,
  actor: 'a',
  n_personas: 1,
  influencia: 'alta',
  postura: 'apoya',
  motivo: '',
  estrategia: null,
  accion,
  responsable: '',
  fecha: '',
});

const encuesta = (lider_id: string, respondente: FilaLiderazgo['respondente'], A: number, C: number): FilaLiderazgo => ({
  id: `${lider_id}-${respondente}-${A}`,
  lider_id,
  respondente,
  conteo_A: A,
  conteo_B: 0,
  conteo_C: C,
  conteo_D: 8 - A - C,
});

describe('FODA', () => {
  it('toma los más votados e ignora los que no tienen votos', () => {
    expect(masVotados([item('a', 1), item('b', 5), item('c', 0), item('d', 3)], 2).map((i) => i.id)).toEqual(['b', 'd']);
  });

  it('la variación es día 90 − inicial, y no existe antes del día 90', () => {
    expect(variacionFoda(item('a', 1, 5))).toBe(2);
    expect(variacionFoda(item('a', 1))).toBeNull();
  });
});

describe('Actores', () => {
  it('la cobertura cuenta los que tienen acción y no inventa valor sin actores', () => {
    expect(coberturaActores([actor('Hablar'), actor('  ')])).toBe(0.5);
    expect(coberturaActores([])).toBeNull();
  });

  it('cuenta por celda de la matriz', () => {
    expect(contarEnMatriz([actor('x'), actor('y')], 'alta', 'apoya')).toBe(2);
    expect(contarEnMatriz([actor('x')], 'baja', 'apoya')).toBe(0);
  });
});

describe('Liderazgo', () => {
  it('cuenta letras y, si hay empate, devuelve los dos estilos', () => {
    const conteos = contarLetras(['A', 'A', 'C', 'C', 'D']);
    expect(conteos).toEqual({ A: 2, B: 0, C: 2, D: 1 });
    expect(estilosDominantes(conteos)).toEqual(['A', 'C']);
  });

  it('oculta la versión del equipo con menos del mínimo y muestra la autoevaluación', () => {
    const [lider] = resumirLiderazgo([encuesta('L1', 'auto', 5, 1), encuesta('L1', 'equipo', 1, 6)], 5);
    expect(lider?.auto.dominantes).toEqual(['A']);
    expect(lider?.equipo.conteos).toBeNull();
    expect(lider?.equipo.encuestas).toBe(1);
  });

  it('promedia la versión del equipo cuando llega al mínimo', () => {
    const equipo = Array.from({ length: 5 }, (_, i) => encuesta('L1', 'equipo', i, 2));
    const [lider] = resumirLiderazgo(equipo, 5);
    expect(lider?.equipo.conteos?.A).toBe(2);
  });
});
