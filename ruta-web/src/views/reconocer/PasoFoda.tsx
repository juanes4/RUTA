import { useState, type FormEvent } from 'react';
import { BotonIcono } from '../../components/ui/Boton';
import { CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Pestanas } from '../../components/ui/Pestanas';
import { CUADRANTES, ESTRATEGIAS_FODA } from '../../config/formularios/reconocer';
import { REGLAS } from '../../config/reglas';
import { EXPLICACION_FODA as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { evaluarFoda } from '../../lib/calculo/foda';
import { conSigno } from '../../lib/formato';
import type { Cuadrante, FilaFoda } from '../../lib/modelo/tipos';
import formulario from '../etapa0/formulario.module.css';
import { EntradaNumero } from './ayudas';
import estilos from './reconocer.module.css';

const VACIO = { cuadrante: 'F' as Cuadrante, item: '', puntaje: '' };
const { minimo, maximo } = REGLAS.foda.escala;

/** R3: FODA híbrido. Se registra cada ítem con su puntaje y la herramienta suma cada cuadrante. */
export function PasoFoda() {
  return (
    <Pestanas
      etiqueta="FODA del cambio"
      pestanas={[
        { id: 'registrar', etiqueta: 'Registrar', contenido: <RegistroFoda /> },
        { id: 'resultados', etiqueta: 'Resultados', contenido: <ResultadosFoda /> },
      ]}
    />
  );
}

function RegistroFoda() {
  const { datos, actualizarDatos } = useProyecto();
  const [nuevo, setNuevo] = useState(VACIO);
  const [errores, setErrores] = useState<string[]>([]);
  const guia = CUADRANTES.find((c) => c.valor === nuevo.cuadrante);

  const agregar = async (evento: FormEvent) => {
    evento.preventDefault();
    const puntaje = Number(nuevo.puntaje);
    const problemas = [
      !nuevo.item.trim() && 'Escribe el ítem.',
      (nuevo.puntaje === '' || !Number.isInteger(puntaje) || puntaje < minimo || puntaje > maximo) && `El puntaje va de ${minimo} a ${maximo}.`,
    ].filter((e): e is string => typeof e === 'string');
    setErrores(problemas);
    if (problemas.length > 0) return;
    const fila: FilaFoda = { id: crypto.randomUUID(), cuadrante: nuevo.cuadrante, item: nuevo.item.trim(), puntaje };
    await actualizarDatos((d) => ({ ...d, foda: [...d.foda, fila] }));
    setNuevo({ ...VACIO, cuadrante: nuevo.cuadrante });
  };

  const editar = (id: string, cambio: Partial<FilaFoda>) =>
    actualizarDatos((d) => ({ ...d, foda: d.foda.map((f) => (f.id === id ? { ...f, ...cambio } : f)) }));
  const quitar = (id: string) => actualizarDatos((d) => ({ ...d, foda: d.foda.filter((f) => f.id !== id) }));

  return (
    <div className={estilos.resultados}>
      <form className={formulario.formulario} onSubmit={(e) => void agregar(e)}>
        <div className={formulario.rejilla}>
          <CampoSeleccion
            etiqueta="Cuadrante"
            explicacion={EX.cuadrante}
            value={nuevo.cuadrante}
            onChange={(e) => setNuevo((n) => ({ ...n, cuadrante: e.target.value as Cuadrante }))}
          >
            {CUADRANTES.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.nombre}
              </option>
            ))}
          </CampoSeleccion>
          <CampoTexto
            etiqueta="Puntaje"
            explicacion={EX.puntaje}
            type="number"
            min={minimo}
            max={maximo}
            step={1}
            value={nuevo.puntaje}
            onChange={(e) => setNuevo((n) => ({ ...n, puntaje: e.target.value }))}
          />
          <div className={formulario.ancho}>
            <CampoTexto etiqueta="Ítem" explicacion={EX.item} value={nuevo.item} onChange={(e) => setNuevo((n) => ({ ...n, item: e.target.value }))} />
          </div>
        </div>
        {guia && (
          <details className={estilos.guia}>
            <summary>Preguntas guía para identificar {guia.plural.toLowerCase()}</summary>
            <ul>
              {guia.preguntas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </details>
        )}
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

      {CUADRANTES.map((c) => {
        const filas = datos.foda.filter((f) => f.cuadrante === c.valor);
        if (filas.length === 0) return null;
        return (
          <section key={c.valor} className={estilos.bloque} aria-labelledby={`foda-${c.valor}`}>
            <h3 id={`foda-${c.valor}`} className={estilos.tituloBloque}>
              {c.plural}
            </h3>
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th scope="col">Ítem</th>
                  <th scope="col">Puntaje</th>
                  <th scope="col">
                    <span className="solo-lectores">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id}>
                    <th scope="row">{f.item}</th>
                    <td>
                      <EntradaNumero
                        etiqueta={`Puntaje de ${f.item}`}
                        valor={f.puntaje}
                        min={minimo}
                        max={maximo}
                        alCambiar={(v) => v !== null && void editar(f.id, { puntaje: v })}
                      />
                    </td>
                    <td>
                      <BotonIcono accion="quitar" etiqueta={`Quitar ${f.item}`} onClick={() => void quitar(f.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

function ResultadosFoda() {
  const { datos } = useProyecto();
  const { totales, interno, externo, estrategia } = evaluarFoda(datos.foda);
  if (!estrategia) return <EstadoVacio titulo="Sin ítems registrados">Los puntajes y la estrategia salen de los ítems que registres.</EstadoVacio>;

  return (
    <div className={estilos.resultados}>
      <section className={estilos.bloque} aria-labelledby="foda-totales">
        <h3 id="foda-totales" className={estilos.tituloBloque}>
          Puntaje por cuadrante
        </h3>
        <div className={estilos.matriz}>
          {CUADRANTES.map((c) => (
            <div key={c.valor} className={estilos.celdaMatriz}>
              <span className={estilos.secundario}>{c.plural}</span>
              <span className={`${estilos.cifra} numero`}>{totales[c.valor]}</span>
              <span className={estilos.secundario}>
                {datos.foda.filter((f) => f.cuadrante === c.valor).length} {datos.foda.filter((f) => f.cuadrante === c.valor).length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className={estilos.bloque} aria-labelledby="foda-balance">
        <h3 id="foda-balance" className={estilos.tituloBloque}>
          Balance y estrategia
        </h3>
        <table className={estilos.tabla}>
          <tbody>
            <tr>
              <th scope="row">Balance interno (Fortalezas − Debilidades)</th>
              <td className="numero">{conSigno(interno)}</td>
            </tr>
            <tr>
              <th scope="row">Balance externo (Oportunidades − Amenazas)</th>
              <td className="numero">{conSigno(externo)}</td>
            </tr>
          </tbody>
        </table>
        <p className={estilos.mensaje}>Estrategia: {ESTRATEGIAS_FODA[estrategia].nombre}</p>
        <p className={estilos.nota}>{ESTRATEGIAS_FODA[estrategia].descripcion}</p>
      </section>
    </div>
  );
}
