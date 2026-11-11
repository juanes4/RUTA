import { describe, expect, it } from 'vitest';
import { REGLAS } from '../../config/reglas';
import { agruparCombinado, agruparConAnonimato, GRUPO_OTROS } from './grupos';
import { filaBuzon1, personasEnArea } from './pruebas/fabricas';

const MINIMO = REGLAS.anonimato.minimoColaboradores;
const porArea = (f: { area: string }) => f.area;

describe('agrupación con anonimato', () => {
  it('un grupo con menos de 5 personas no se muestra', () => {
    const { grupos, personasOcultas } = agruparConAnonimato(
      [...personasEnArea('Bodega', 6), ...personasEnArea('Calidad', 4)],
      porArea,
      MINIMO,
    );
    expect(grupos.map((g) => g.nombre)).toEqual(['Bodega']);
    expect(personasOcultas).toBe(4);
  });

  it('cuenta personas distintas, no filas', () => {
    const filas = ['C', 'D', 'K', 'H', 'R'].flatMap((d) =>
      [1, 2, 3, 4].map((i) => filaBuzon1(`p${i}`, d as 'C', 4, { area: 'Bodega' })),
    );
    expect(agruparConAnonimato(filas, porArea, MINIMO).grupos).toHaveLength(0);
  });

  it('los grupos pequeños se suman a "Otros" si juntos llegan al mínimo', () => {
    const { grupos, personasOcultas } = agruparConAnonimato(
      [...personasEnArea('Calidad', 3), ...personasEnArea('Compras', 2)],
      porArea,
      MINIMO,
    );
    expect(grupos).toHaveLength(1);
    expect(grupos[0]).toMatchObject({ nombre: GRUPO_OTROS, personas: 5, esOtros: true });
    expect(personasOcultas).toBe(0);
  });
});

describe('agrupación combinada (área × turno)', () => {
  const porTurno = (f: { turno: string }) => f.turno;

  it('se permite si cada celda tiene al menos 5 personas', () => {
    const filas = [
      ...personasEnArea('Bodega', 5).map((f) => ({ ...f, turno: 'Día' })),
      ...personasEnArea('Bodega', 5).map((f) => ({ ...f, id_respuesta: `${f.id_respuesta}-n`, turno: 'Noche' })),
    ];
    expect(agruparCombinado(filas, [porArea, porTurno], MINIMO)).toHaveLength(2);
  });

  it('devuelve null si alguna celda tiene menos de 5', () => {
    const filas = [
      ...personasEnArea('Bodega', 5).map((f) => ({ ...f, turno: 'Día' })),
      ...personasEnArea('Bodega', 4).map((f) => ({ ...f, id_respuesta: `${f.id_respuesta}-n`, turno: 'Noche' })),
    ];
    expect(agruparCombinado(filas, [porArea, porTurno], MINIMO)).toBeNull();
  });
});
