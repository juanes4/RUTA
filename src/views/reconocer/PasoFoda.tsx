import { useState, type FormEvent } from 'react';
import { BotonIcono } from '../../components/ui/Boton';
import { CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { CUADRANTES } from '../../config/formularios/reconocer';
import { REGLAS } from '../../config/reglas';
import { EXPLICACION_FODA as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { masVotados, variacionFoda } from '../../lib/calculo/foda';
import type { Cuadrante, FilaFoda } from '../../lib/modelo/tipos';
import formulario from '../etapa0/formulario.module.css';
import { EntradaNumero } from './ayudas';
import estilos from './reconocer.module.css';

const VACIO = { cuadrante: 'F' as Cuadrante, item: '', evidencia: '', puntaje: '', votos: '' };
const { minimo, maximo } = REGLAS.escala;
const nombreCuadrante = (c: Cuadrante) => CUADRANTES.find((q) => q.valor === c)?.nombre ?? c;
const ordenCuadrante = (c: Cuadrante) => CUADRANTES.findIndex((q) => q.valor === c);

/** Errores del formulario; vacío si se puede agregar. */
function validar({ item, evidencia, puntaje, votos }: typeof VACIO): string[] {
  const nPuntaje = Number(puntaje);
  const nVotos = votos === '' ? 0 : Number(votos);
  return [
    !item.trim() && 'Escribe el ítem.',
    !evidencia.trim() && 'Cada ítem necesita su evidencia.',
    (puntaje === '' || !Number.isInteger(nPuntaje) || nPuntaje < minimo || nPuntaje > maximo) && `El puntaje va de ${minimo} a ${maximo}.`,
    (!Number.isInteger(nVotos) || nVotos < 0) && 'Los votos son un número entero, 0 o más.',
  ].filter((e): e is string => typeof e === 'string');
}

/** R2: registra el resultado de la sesión FODA. */
export function PasoFoda() {
  const { datos, actualizarDatos } = useProyecto();
  const [nuevo, setNuevo] = useState(VACIO);
  const [errores, setErrores] = useState<string[]>([]);
  const campo = <K extends keyof typeof VACIO>(clave: K, valor: (typeof VACIO)[K]) => setNuevo((n) => ({ ...n, [clave]: valor }));

  const agregar = async (evento: FormEvent) => {
    evento.preventDefault();
    const problemas = validar(nuevo);
    setErrores(problemas);
    if (problemas.length > 0) return;
    const fila: FilaFoda = {
      id: crypto.randomUUID(),
      item: nuevo.item.trim(),
      cuadrante: nuevo.cuadrante,
      evidencia: nuevo.evidencia.trim(),
      puntaje_inicial: Number(nuevo.puntaje),
      puntaje_dia90: null,
      votos: nuevo.votos === '' ? 0 : Number(nuevo.votos),
    };
    await actualizarDatos((d) => ({ ...d, foda: [...d.foda, fila] }));
    setNuevo({ ...VACIO, cuadrante: nuevo.cuadrante });
  };

  const editar = (id: string, cambio: Partial<FilaFoda>) =>
    actualizarDatos((d) => ({ ...d, foda: d.foda.map((f) => (f.id === id ? { ...f, ...cambio } : f)) }));
  const quitar = (id: string) => actualizarDatos((d) => ({ ...d, foda: d.foda.filter((f) => f.id !== id) }));

  const filas = [...datos.foda].sort((a, b) => ordenCuadrante(a.cuadrante) - ordenCuadrante(b.cuadrante));
  const backlog = masVotados(datos.foda, REGLAS.foda.itemsAlBacklog);

  return (
    <div className={estilos.resultados}>
      <form className={formulario.formulario} onSubmit={(e) => void agregar(e)}>
        <div className={formulario.rejilla}>
          <CampoSeleccion
            etiqueta="Cuadrante"
            explicacion={EX.cuadrante}
            value={nuevo.cuadrante}
            onChange={(e) => campo('cuadrante', e.target.value as Cuadrante)}
          >
            {CUADRANTES.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.nombre} ({c.escala})
              </option>
            ))}
          </CampoSeleccion>
          <CampoTexto etiqueta="Ítem" explicacion={EX.item} value={nuevo.item} onChange={(e) => campo('item', e.target.value)} />
          <div className={formulario.ancho}>
            <CampoTexto etiqueta="Evidencia" explicacion={EX.evidencia} value={nuevo.evidencia} onChange={(e) => campo('evidencia', e.target.value)} />
          </div>
          <CampoTexto
            etiqueta="Puntaje inicial"
            explicacion={EX.puntaje}
            type="number"
            min={minimo}
            max={maximo}
            step={1}
            value={nuevo.puntaje}
            onChange={(e) => campo('puntaje', e.target.value)}
          />
          <CampoTexto etiqueta="Votos" explicacion={EX.votos} type="number" min={0} step={1} value={nuevo.votos} onChange={(e) => campo('votos', e.target.value)} />
        </div>
        {errores.length > 0 && (
          <ul className={formulario.errores} role="alert">
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <div>
          <BotonIcono accion="agregar" etiqueta="Agregar ítem" etiquetaVisible type="submit" />
        </div>
      </form>

      {filas.length > 0 && (
        <section className={estilos.bloque} aria-labelledby="titulo-foda">
          <h3 id="titulo-foda" className={estilos.tituloBloque}>
            Ítems registrados
          </h3>
          <div className={estilos.desplazable}>
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th scope="col">Cuadrante</th>
                  <th scope="col">Ítem y evidencia</th>
                  <th scope="col">Inicial</th>
                  <th scope="col">Votos</th>
                  <th scope="col">Día 90</th>
                  <th scope="col">Variación</th>
                  <th scope="col">
                    <span className="solo-lectores">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const variacion = variacionFoda(f);
                  return (
                    <tr key={f.id}>
                      <td>{nombreCuadrante(f.cuadrante)}</td>
                      <th scope="row">
                        {f.item}
                        <span className={estilos.secundario}>{f.evidencia}</span>
                      </th>
                      <td className="numero">{f.puntaje_inicial}</td>
                      <td>
                        <EntradaNumero etiqueta={`Votos de ${f.item}`} valor={f.votos} min={0} alCambiar={(v) => void editar(f.id, { votos: v ?? 0 })} />
                      </td>
                      <td>
                        <EntradaNumero
                          etiqueta={`Puntaje del día 90 de ${f.item}`}
                          valor={f.puntaje_dia90}
                          min={minimo}
                          max={maximo}
                          alCambiar={(v) => void editar(f.id, { puntaje_dia90: v })}
                        />
                      </td>
                      <td className="numero">{variacion === null ? '—' : variacion > 0 ? `+${variacion}` : variacion}</td>
                      <td>
                        <BotonIcono accion="quitar" etiqueta={`Quitar ${f.item}`} onClick={() => void quitar(f.id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {backlog.length > 0 && (
        <section className={estilos.bloque} aria-labelledby="titulo-backlog">
          <h3 id="titulo-backlog" className={estilos.tituloBloque}>
            Los {REGLAS.foda.itemsAlBacklog} más votados pasan al backlog de la etapa Unir
          </h3>
          <ol className={estilos.backlog}>
            {backlog.map((f) => (
              <li key={f.id}>
                {f.item} ({nombreCuadrante(f.cuadrante)}, <span className="numero">{f.votos}</span> votos)
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
