import { describe, expect, it } from 'vitest';
import { ETAPAS } from '../config/etapas';
import { hashDe, parsearRuta } from './rutas';

const parsear = (hash: string) => parsearRuta(hash, ETAPAS);

describe('rutas', () => {
  it('inicio y tablero', () => {
    expect(parsear('')).toEqual({ pagina: 'inicio' });
    expect(parsear('#/')).toEqual({ pagina: 'inicio' });
    expect(parsear('#/tablero')).toEqual({ pagina: 'tablero' });
  });

  it('una etapa activa y uno de sus pasos', () => {
    expect(parsear('#/etapa/r')).toEqual({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: null });
    expect(parsear('#/etapa/R/r6')).toEqual({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: 'R6' });
    expect(parsear('#/etapa/0/0.2')).toEqual({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: '0.2' });
  });

  it('las etapas vacías y los pasos que no existen no tienen página', () => {
    expect(parsear('#/etapa/a')).toEqual({ pagina: 'no_encontrada' });
    expect(parsear('#/etapa/r/U1')).toEqual({ pagina: 'no_encontrada' });
    expect(parsear('#/otra')).toEqual({ pagina: 'no_encontrada' });
  });

  it('la etapa T y sus dos subsecciones; el inicio de sesión', () => {
    expect(parsear('#/etapa/t')).toEqual({ pagina: 'etapa', etapaId: 'etapa-t', pasoId: null });
    expect(parsear('#/etapa/t/t2')).toEqual({ pagina: 'etapa', etapaId: 'etapa-t', pasoId: 'T2' });
    expect(parsear('#/ingresar')).toEqual({ pagina: 'ingresar' });
    expect(hashDe({ pagina: 'ingresar' }, ETAPAS)).toBe('#/ingresar');
  });

  it('ida y vuelta: el hash generado se vuelve a leer igual', () => {
    const ruta = { pagina: 'etapa' as const, etapaId: 'etapa-u', pasoId: 'U5' };
    expect(parsear(hashDe(ruta, ETAPAS))).toEqual(ruta);
    expect(hashDe({ pagina: 'tablero' }, ETAPAS)).toBe('#/tablero');
  });
});
