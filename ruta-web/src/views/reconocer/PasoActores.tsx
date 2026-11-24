import { useState, type FormEvent } from 'react';
import { Boton, BotonIcono } from '../../components/ui/Boton';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Explicacion } from '../../components/ui/Explicacion';
import { Pestanas } from '../../components/ui/Pestanas';
import { ACTORES_SUGERIDOS, CUADRANTES_PODER_INTERES, NIVELES_AB, NIVELES_COMPROMISO } from '../../config/formularios/reconocer';
import { EXPLICACION_ACTORES as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useBorrador } from '../../hooks/useBorrador';
import { actoresEnCuadrante, brechaCompromiso, resumirActores } from '../../lib/calculo/actores';
import type { FilaActor, NivelAB, NivelCompromiso } from '../../lib/modelo/tipos';
import { PieFormulario } from '../etapa0/PieFormulario';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO } from './ayudas';
import estilos from './reconocer.module.css';

type Editar = (id: string, cambio: Partial<FilaActor>) => void;

const actorNuevo = (datos: Partial<FilaActor> = {}): FilaActor => ({
  id: crypto.randomUUID(),
  actor: '',
  descripcion: '',
  necesidades: '',
  poder: null,
  interes: null,
  realidad: '',
  compromiso_actual: null,
  compromiso_deseado: null,
  ...datos,
});

const limpiar = (a: FilaActor): FilaActor => ({
  ...a,
  actor: a.actor.trim(),
  descripcion: a.descripcion.trim(),
  necesidades: a.necesidades.trim(),
  realidad: a.realidad.trim(),
});

const titulo = (a: FilaActor, i: number) => a.actor.trim() || `Actor ${i + 1}`;

function Encabezado({ texto, explicacion }: { texto: string; explicacion: string }) {
  return (
    <th scope="col">
      <Explicacion titulo={texto} texto={explicacion} enfocable>
        {() => texto}
      </Explicacion>
    </th>
  );
}

/** R4: mapa de actores en los 3 pasos del documento, y sus resultados. */
export function PasoActores() {
  const { datos, actualizarDatos } = useProyecto();
  const [error, setError] = useState('');
  const { borrador, editar, confirmar, estado } = useBorrador<FilaActor[]>(datos.actores, async (actores) =>
    actualizarDatos((d) => ({ ...d, actores: actores.map(limpiar).filter((a) => a.actor) })),
  );
  const editarActor: Editar = (id, cambio) => editar((lista) => lista.map((a) => (a.id === id ? { ...a, ...cambio } : a)));

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError('');
    if (borrador.some((a) => !a.actor.trim() && (a.descripcion.trim() || a.necesidades.trim()))) {
      return setError('Cada actor necesita su nombre (cargo o grupo). Las filas sin nombre y sin datos se descartan al guardar.');
    }
    try {
      await confirmar();
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
    }
  };

  return (
    <form className={formulario.formulario} onSubmit={(e) => void enviar(e)}>
      <Pestanas
        etiqueta="Mapa de actores"
        pestanas={[
          {
            id: 'identificar',
            etiqueta: '1. Actores y necesidades',
            contenido: <PasoIdentificar actores={borrador} editarActor={editarActor} cambiarLista={editar} />,
          },
          { id: 'poder', etiqueta: '2. Poder e interés', contenido: <PasoPoder actores={borrador} editarActor={editarActor} /> },
          { id: 'compromiso', etiqueta: '3. Compromiso', contenido: <PasoCompromiso actores={borrador} editarActor={editarActor} /> },
          { id: 'resultados', etiqueta: 'Resultados', contenido: <ResultadosActores actores={borrador} /> },
        ]}
      />
      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <PieFormulario estado={estado} />
    </form>
  );
}

interface PropsPaso {
  actores: FilaActor[];
  editarActor: Editar;
}

function PasoIdentificar({ actores, editarActor, cambiarLista }: PropsPaso & { cambiarLista(cambio: (a: FilaActor[]) => FilaActor[]): void }) {
  return (
    <div className={estilos.bloque}>
      <p className={estilos.nota}>
        Con la alta dirección y los jefes, haga una lluvia de ideas: ¿quién decide?, ¿quién ejecuta?, ¿a quién le cambia el trabajo?, ¿quién controla recursos o
        información? Para cada grupo, escriba quién es y qué necesita o espera del cambio.
      </p>
      {actores.length === 0 && (
        <div>
          <Boton variante="secundario" onClick={() => cambiarLista(() => ACTORES_SUGERIDOS.map((s) => actorNuevo(s)))}>
            Empezar con los {ACTORES_SUGERIDOS.length} actores sugeridos
          </Boton>
        </div>
      )}
      {actores.length > 0 && (
        <div className={estilos.desplazable}>
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <Encabezado texto="Actor" explicacion={EX.actor} />
                <Encabezado texto="Descripción" explicacion={EX.descripcion} />
                <Encabezado texto="Necesidades y expectativas" explicacion={EX.necesidades} />
                <th scope="col">
                  <span className="solo-lectores">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {actores.map((a, i) => (
                <tr key={a.id}>
                  <td>
                    <textarea className={estilos.texto} rows={2} aria-label={`Nombre del actor ${i + 1}`} value={a.actor} onChange={(e) => editarActor(a.id, { actor: e.target.value })} />
                  </td>
                  <td>
                    <textarea
                      className={estilos.texto}
                      rows={3}
                      aria-label={`Descripción de ${titulo(a, i)}`}
                      value={a.descripcion}
                      onChange={(e) => editarActor(a.id, { descripcion: e.target.value })}
                    />
                  </td>
                  <td>
                    <textarea
                      className={estilos.texto}
                      rows={3}
                      aria-label={`Necesidades de ${titulo(a, i)}`}
                      value={a.necesidades}
                      onChange={(e) => editarActor(a.id, { necesidades: e.target.value })}
                    />
                  </td>
                  <td>
                    <BotonIcono accion="quitar" etiqueta={`Quitar ${titulo(a, i)}`} onClick={() => cambiarLista((lista) => lista.filter((x) => x.id !== a.id))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div>
        <BotonIcono accion="agregar" etiqueta="Agregar actor" etiquetaVisible onClick={() => cambiarLista((lista) => [...lista, actorNuevo()])} />
      </div>
    </div>
  );
}

function SelectorAB({ etiqueta, valor, alCambiar }: { etiqueta: string; valor: NivelAB | null; alCambiar(v: NivelAB | null): void }) {
  return (
    <select className={formulario.control} aria-label={etiqueta} value={valor ?? ''} onChange={(e) => alCambiar((e.target.value || null) as NivelAB | null)}>
      <option value="">—</option>
      {NIVELES_AB.map((n) => (
        <option key={n.valor} value={n.valor}>
          {n.nombre}
        </option>
      ))}
    </select>
  );
}

function SinActores() {
  return <EstadoVacio titulo="Sin actores">Primero registra los actores en el paso 1.</EstadoVacio>;
}

function PasoPoder({ actores, editarActor }: PropsPaso) {
  if (actores.length === 0) return <SinActores />;
  return (
    <div className={estilos.bloque}>
      <p className={estilos.nota}>Ajuste la redacción general a la realidad de su empresa y asigne Alto (A) o Bajo (B) a cada variable.</p>
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Actor</th>
              <Encabezado texto="Poder" explicacion={EX.poder} />
              <Encabezado texto="Interés" explicacion={EX.interes} />
              <Encabezado texto="¿Cuál es la realidad?" explicacion={EX.realidad} />
            </tr>
          </thead>
          <tbody>
            {actores.map((a, i) => (
              <tr key={a.id}>
                <th scope="row">{titulo(a, i)}</th>
                <td>
                  <SelectorAB etiqueta={`Poder de ${titulo(a, i)}`} valor={a.poder} alCambiar={(poder) => editarActor(a.id, { poder })} />
                </td>
                <td>
                  <SelectorAB etiqueta={`Interés de ${titulo(a, i)}`} valor={a.interes} alCambiar={(interes) => editarActor(a.id, { interes })} />
                </td>
                <td>
                  <textarea
                    className={estilos.texto}
                    rows={2}
                    aria-label={`Realidad de ${titulo(a, i)}`}
                    value={a.realidad}
                    onChange={(e) => editarActor(a.id, { realidad: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PasoCompromiso({ actores, editarActor }: PropsPaso) {
  if (actores.length === 0) return <SinActores />;
  const opciones = NIVELES_COMPROMISO.map((n) => (
    <option key={n.valor} value={n.valor}>
      {n.nombre}
    </option>
  ));
  return (
    <div className={estilos.bloque}>
      <p className={estilos.nota}>
        Marque la posición actual (C) y la deseada (D) de cada grupo. Si C y D coinciden, no hay brecha; mientras más lejos estén, mayor es el esfuerzo de comunicación
        y acompañamiento que se debe planear.
      </p>
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Actor</th>
              <Encabezado texto="Hoy (C)" explicacion={EX.actual} />
              <Encabezado texto="Deseado (D)" explicacion={EX.deseado} />
              <th scope="col">Brecha</th>
            </tr>
          </thead>
          <tbody>
            {actores.map((a, i) => {
              const brecha = brechaCompromiso(a);
              return (
                <tr key={a.id}>
                  <th scope="row">{titulo(a, i)}</th>
                  <td>
                    <select
                      className={formulario.control}
                      aria-label={`Compromiso actual de ${titulo(a, i)}`}
                      value={a.compromiso_actual ?? ''}
                      onChange={(e) => editarActor(a.id, { compromiso_actual: (e.target.value || null) as NivelCompromiso | null })}
                    >
                      <option value="">—</option>
                      {opciones}
                    </select>
                  </td>
                  <td>
                    <select
                      className={formulario.control}
                      aria-label={`Compromiso deseado de ${titulo(a, i)}`}
                      value={a.compromiso_deseado ?? ''}
                      onChange={(e) => editarActor(a.id, { compromiso_deseado: (e.target.value || null) as NivelCompromiso | null })}
                    >
                      <option value="">—</option>
                      {opciones}
                    </select>
                  </td>
                  <td className="numero">{brecha === null ? '—' : brecha === 0 ? 'Sin brecha' : `${brecha} ${Math.abs(brecha) === 1 ? 'posición' : 'posiciones'}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <MapaCompromiso actores={actores} />
    </div>
  );
}

/** Tabla del documento: una fila por actor y una columna por posición, con C y D marcadas. */
function MapaCompromiso({ actores }: { actores: FilaActor[] }) {
  return (
    <section className={estilos.bloque} aria-labelledby="titulo-mapa-compromiso">
      <h3 id="titulo-mapa-compromiso" className={estilos.tituloBloque}>
        Mapa de compromiso: dónde está hoy y dónde debe estar
      </h3>
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Actor</th>
              {NIVELES_COMPROMISO.map((n) => (
                <th key={n.valor} scope="col">
                  {n.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actores.map((a, i) => (
              <tr key={a.id}>
                <th scope="row">{titulo(a, i)}</th>
                {NIVELES_COMPROMISO.map((n) => {
                  const marca = [a.compromiso_actual === n.valor && 'C', a.compromiso_deseado === n.valor && 'D'].filter(Boolean).join(' ');
                  return (
                    <td key={n.valor} className={estilos.marcaCompromiso}>
                      {marca}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ResultadosActores({ actores }: { actores: FilaActor[] }) {
  const con = actores.filter((a) => a.actor.trim());
  if (con.length === 0) return <SinActores />;
  const resumen = resumirActores(con);

  return (
    <div className={estilos.resultados}>
      <section className={estilos.bloque} aria-labelledby="titulo-poder-interes">
        <h3 id="titulo-poder-interes" className={estilos.tituloBloque}>
          Poder e interés
        </h3>
        <p className={estilos.nota}>
          <span className="numero">{resumen.evaluados}</span> de <span className="numero">{resumen.total}</span> actores tienen poder e interés asignados.
        </p>
        <div className={estilos.matriz}>
          {CUADRANTES_PODER_INTERES.map((c) => {
            const en = actoresEnCuadrante(con, c.poder, c.interes);
            return (
              <div key={`${c.poder}${c.interes}`} className={estilos.celdaMatriz}>
                <span className={estilos.secundario}>
                  Poder {c.poder === 'A' ? 'alto' : 'bajo'} · interés {c.interes === 'A' ? 'alto' : 'bajo'}
                </span>
                <span className={estilos.tituloBloque}>{c.nombre}</span>
                <span className={estilos.secundario}>{c.estrategia}</span>
                <ul className={estilos.listaCorta}>
                  {en.length === 0 ? <li>Ninguno</li> : en.map((a) => <li key={a.id}>{a.actor}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
      <section className={estilos.bloque} aria-labelledby="titulo-brechas">
        <h3 id="titulo-brechas" className={estilos.tituloBloque}>
          Brechas de compromiso
        </h3>
        <p className={estilos.nota}>
          <span className="numero">{resumen.conBrecha}</span> de <span className="numero">{resumen.conCompromiso}</span> actores evaluados están por debajo de donde
          deben estar.
        </p>
        {resumen.prioridades.length > 0 && (
          <ol className={estilos.listaCorta}>
            {resumen.prioridades.map((p) => (
              <li key={p.actor}>
                {p.actor}: <span className="numero">{p.brecha}</span> {p.brecha === 1 ? 'posición' : 'posiciones'}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
