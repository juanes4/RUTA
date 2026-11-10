import { describe, expect, it } from 'vitest';
import { crearProyecto } from '../proyecto/crearProyecto';
import { AlmacenLocal, type AlmacenamientoClaveValor } from './almacenLocal';

function almacenamientoFalso(): AlmacenamientoClaveValor & { contenido: Map<string, string> } {
  const contenido = new Map<string, string>();
  return {
    contenido,
    getItem: (k) => contenido.get(k) ?? null,
    setItem: (k, v) => void contenido.set(k, v),
  };
}

describe('almacén en localStorage', () => {
  it('lo guardado sobrevive a una recarga', async () => {
    const almacenamiento = almacenamientoFalso();
    const proyecto = crearProyecto('2026-11-08T10:00:00Z', 'p1');
    await new AlmacenLocal(almacenamiento).guardar(proyecto);

    const recargado = new AlmacenLocal(almacenamiento);
    expect(await recargado.obtener('p1')).toEqual(proyecto);
  });

  it('eliminar un proyecto borra también sus datos', async () => {
    const almacen = new AlmacenLocal(almacenamientoFalso());
    await almacen.guardar(crearProyecto('2026-11-08T10:00:00Z', 'p1'));
    await almacen.guardarDatos('p1', { respuestas: [], kotter: [], uso: [] });
    await almacen.eliminar('p1');
    expect(await almacen.listar()).toEqual([]);
  });

  it('con datos dañados arranca vacío', async () => {
    const almacenamiento = almacenamientoFalso();
    almacenamiento.contenido.set('ruta:v1', '{no es json');
    expect(await new AlmacenLocal(almacenamiento).listar()).toEqual([]);
  });
});
