import { describe, expect, it } from 'vitest';
import { COLUMNAS_PLANTILLA, fusionarBuzon1, importarBuzon1 } from './buzon1Csv';

const AREAS = ['Bodega', 'Producción'];
const FECHA = '2026-11-20';

const csv = (...filas: string[]) =>
  [
    '"Marca temporal","Área","P1. ¿Qué es lo que más falla hoy en este proceso?","P2. ¿Qué te preocupa del cambio?","P3. Si tú decidieras, ¿qué harías?"',
    ...filas,
  ].join('\n');

describe('carga del buzón 1 desde un CSV', () => {
  it('lee el área y las 3 preguntas por su código, sin importar tildes ni mayúsculas en el área', () => {
    const { filas, errores } = importarBuzon1(csv('"2026/11/20 8:00","produccion","Se pierden pedidos","Más trabajo","Capacitar antes"'), AREAS, FECHA);
    expect(errores).toEqual([]);
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ area: 'Producción', falla: 'Se pierden pedidos', preocupa: 'Más trabajo', harias: 'Capacitar antes', fecha: FECHA });
  });

  it('si un área no está registrada no carga nada', () => {
    const { filas, errores } = importarBuzon1(csv('"t1","Bodega","a","b","c"', '"t2","Ventas","a","b","c"'), AREAS, FECHA);
    expect(filas).toEqual([]);
    expect(errores).toEqual(['Línea 3: el área "Ventas" no está registrada en la Etapa 0.']);
  });

  it('avisa qué columna falta', () => {
    const { errores } = importarBuzon1('Área,P1. x,P2. y\nBodega,a,b', AREAS, FECHA);
    expect(errores).toEqual(['Falta la columna de la pregunta P3 (su título debe empezar con "P3").']);
  });

  it('ignora las filas sin respuestas', () => {
    expect(importarBuzon1(csv('"t1","Bodega","","",""'), AREAS, FECHA).filas).toEqual([]);
  });

  it('la plantilla se puede volver a cargar', () => {
    const { errores } = importarBuzon1(`${COLUMNAS_PLANTILLA.map((c) => `"${c}"`).join(',')}\nBodega,a,b,c`, AREAS, FECHA);
    expect(errores).toEqual([]);
  });

  it('lee el grupo opcional y avisa de las columnas personales sin cargarlas', () => {
    const texto = '"Marca temporal","Dirección de correo electrónico","Área","Grupo","P1. a","P2. b","P3. ¿Qué harías ahora?"\n"t1","x@y.com","Bodega","operativo","a","b","c"';
    const { filas, avisos } = importarBuzon1(texto, AREAS, FECHA);
    expect(filas[0]).toMatchObject({ grupo: 'Operativo' });
    expect(JSON.stringify(filas[0])).not.toContain('x@y.com');
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain('Marca temporal');
    expect(avisos[0]).toContain('correo');
    expect(avisos[0]).not.toContain('ahora');
  });

  it('acepta la tabla del copiloto (id, fecha, area, grupo, p1, p2, p3)', () => {
    const { filas, errores, avisos } = importarBuzon1('id,fecha,area,grupo,p1,p2,p3\nprueba-01,2026-11-10,Bodega,Administrativo,a,b,c', AREAS, FECHA);
    expect(errores).toEqual([]);
    expect(avisos).toEqual([]);
    expect(filas[0]).toMatchObject({ area: 'Bodega', grupo: 'Administrativo', falla: 'a', harias: 'c' });
  });

  it('volver a cargar el mismo archivo no duplica respuestas', () => {
    const texto = csv('"t1","Bodega","a","b","c"', '"t2","Bodega","a","b","c"');
    const primera = importarBuzon1(texto, AREAS, FECHA).filas;
    const segunda = importarBuzon1(texto, AREAS, FECHA).filas;
    expect(primera).toHaveLength(2);
    expect(fusionarBuzon1(primera, segunda)).toHaveLength(2);
  });
});
