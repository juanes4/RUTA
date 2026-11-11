import { useState, type FormEvent } from 'react';
import { BotonIcono } from '../../components/ui/Boton';
import { CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { Pestanas } from '../../components/ui/Pestanas';
import { Semaforo } from '../../components/ui/Semaforo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { ESTRATEGIAS, INFLUENCIAS, POSTURAS } from '../../config/formularios/reconocer';
import { REGLAS } from '../../config/reglas';
import { EXPLICACION_ACTORES as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { coberturaActores, contarEnMatriz } from '../../lib/calculo/actores';
import { evaluarSemaforo } from '../../lib/calculo/semaforo';
import { formatearValor } from '../../lib/formato';
import type { Estrategia, FilaActor, Influencia, Postura } from '../../lib/modelo/tipos';
import { resolverMetas } from '../../lib/proyecto/etapa0';
import formulario from '../etapa0/formulario.module.css';
import estilos from './reconocer.module.css';

const VACIO = {
  actor: '',
  n_personas: '',
  influencia: 'media' as Influencia,
  postura: 'neutral' as Postura,
  motivo: '',
  estrategia: '' as Estrategia | '',
  accion: '',
  responsable: '',
  fecha: '',
};

/** R3: registra el mapa de actores. */
export function PasoActores() {
  return (
    <Pestanas
      etiqueta="Mapa de actores"
      pestanas={[
        { id: 'registrar', etiqueta: 'Registrar', contenido: <RegistroActores /> },
        { id: 'resultados', etiqueta: 'Resultados', contenido: <ResultadosActores /> },
      ]}
    />
  );
}

function RegistroActores() {
  const { datos, actualizarDatos } = useProyecto();
  const [nuevo, setNuevo] = useState(VACIO);
  const [errores, setErrores] = useState<string[]>([]);
  const campo = <K extends keyof typeof VACIO>(clave: K, valor: (typeof VACIO)[K]) => setNuevo((n) => ({ ...n, [clave]: valor }));

  const agregar = async (evento: FormEvent) => {
    evento.preventDefault();
    const personas = Number(nuevo.n_personas);
    const problemas = [
      !nuevo.actor.trim() && 'Escribe el actor o grupo.',
      (nuevo.n_personas === '' || !Number.isInteger(personas) || personas < 1) && 'El número de personas debe ser 1 o más.',
    ].filter((e): e is string => typeof e === 'string');
    setErrores(problemas);
    if (problemas.length > 0) return;
    const fila: FilaActor = {
      ...nuevo,
      id: crypto.randomUUID(),
      actor: nuevo.actor.trim(),
      n_personas: personas,
      motivo: nuevo.motivo.trim(),
      estrategia: nuevo.estrategia || null,
      accion: nuevo.accion.trim(),
      responsable: nuevo.responsable.trim(),
    };
    await actualizarDatos((d) => ({ ...d, actores: [...d.actores, fila] }));
    setNuevo(VACIO);
  };

  const quitar = (id: string) => actualizarDatos((d) => ({ ...d, actores: d.actores.filter((a) => a.id !== id) }));
  const nombre = <T,>(lista: readonly { valor: T; nombre: string }[], valor: T | null) => lista.find((o) => o.valor === valor)?.nombre ?? '—';

  return (
    <div className={estilos.resultados}>
      <form className={formulario.formulario} onSubmit={(e) => void agregar(e)}>
        <div className={formulario.rejilla}>
          <CampoTexto etiqueta="Actor o grupo" explicacion={EX.actor} value={nuevo.actor} onChange={(e) => campo('actor', e.target.value)} />
          <CampoTexto etiqueta="Número de personas" explicacion={EX.n_personas} type="number" min={1} step={1} value={nuevo.n_personas} onChange={(e) => campo('n_personas', e.target.value)} />
          <CampoSeleccion etiqueta="Influencia" explicacion={EX.influencia} value={nuevo.influencia} onChange={(e) => campo('influencia', e.target.value as Influencia)}>
            {INFLUENCIAS.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.nombre}
              </option>
            ))}
          </CampoSeleccion>
          <CampoSeleccion etiqueta="Postura" explicacion={EX.postura} value={nuevo.postura} onChange={(e) => campo('postura', e.target.value as Postura)}>
            {POSTURAS.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.nombre}
              </option>
            ))}
          </CampoSeleccion>
          <CampoTexto etiqueta="Motivo" explicacion={EX.motivo} value={nuevo.motivo} onChange={(e) => campo('motivo', e.target.value)} />
          <CampoSeleccion etiqueta="Estrategia" explicacion={EX.estrategia} value={nuevo.estrategia} onChange={(e) => campo('estrategia', e.target.value as Estrategia | '')}>
            <option value="">Elegir…</option>
            {ESTRATEGIAS.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.nombre}
              </option>
            ))}
          </CampoSeleccion>
          <div className={formulario.ancho}>
            <CampoTexto etiqueta="Acción" explicacion={EX.accion} value={nuevo.accion} onChange={(e) => campo('accion', e.target.value)} />
          </div>
          <CampoTexto etiqueta="Responsable (cargo)" explicacion={EX.responsable} value={nuevo.responsable} onChange={(e) => campo('responsable', e.target.value)} />
          <CampoTexto etiqueta="Fecha" explicacion={EX.fecha} type="date" value={nuevo.fecha} onChange={(e) => campo('fecha', e.target.value)} />
        </div>
        {errores.length > 0 && (
          <ul className={formulario.errores} role="alert">
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <div>
          <BotonIcono accion="agregar" etiqueta="Agregar actor" etiquetaVisible type="submit" />
        </div>
      </form>

      {datos.actores.length > 0 && (
        <div className={estilos.desplazable}>
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Actor</th>
                <th scope="col">Personas</th>
                <th scope="col">Influencia</th>
                <th scope="col">Postura</th>
                <th scope="col">Estrategia</th>
                <th scope="col">Acción</th>
                <th scope="col">
                  <span className="solo-lectores">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {datos.actores.map((a) => (
                <tr key={a.id}>
                  <th scope="row">
                    {a.actor}
                    {a.motivo && <span className={estilos.secundario}>{a.motivo}</span>}
                  </th>
                  <td className="numero">{a.n_personas}</td>
                  <td>{nombre(INFLUENCIAS, a.influencia)}</td>
                  <td>{nombre(POSTURAS, a.postura)}</td>
                  <td>{nombre(ESTRATEGIAS, a.estrategia)}</td>
                  <td>
                    {a.accion || 'Sin acción'}
                    {a.accion && (a.responsable || a.fecha) && (
                      <span className={estilos.secundario}>{[a.responsable, a.fecha].filter(Boolean).join(' · ')}</span>
                    )}
                  </td>
                  <td>
                    <BotonIcono accion="quitar" etiqueta={`Quitar ${a.actor}`} onClick={() => void quitar(a.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ResultadosActores() {
  const { activo, datos } = useProyecto();
  const cobertura = coberturaActores(datos.actores);
  const meta = resolverMetas(activo?.metas ?? {}).find((m) => m.id === 'cobertura_actores');

  if (cobertura === null || !meta) {
    return <EstadoVacio titulo="Sin actores registrados">La cobertura y la matriz salen de los actores que registres.</EstadoVacio>;
  }

  return (
    <div className={estilos.resultados}>
      <section className={estilos.bloque} aria-labelledby="titulo-cobertura">
        <h3 id="titulo-cobertura" className={estilos.tituloBloque}>
          Cobertura de actores
        </h3>
        <p className={estilos.nota}>
          <span className="numero">{formatearValor(cobertura, 'porcentaje')}</span> tiene una acción definida (meta{' '}
          <span className="numero">{formatearValor(meta.meta, 'porcentaje')}</span>).{' '}
          <Semaforo estado={evaluarSemaforo(cobertura, meta, REGLAS.semaforo.margen)} />
        </p>
      </section>
      <section className={estilos.bloque} aria-labelledby="titulo-matriz">
        <h3 id="titulo-matriz" className={estilos.tituloBloque}>
          Influencia y postura
        </h3>
        <div className={estilos.desplazable}>
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Influencia</th>
                {POSTURAS.map((p) => (
                  <th key={p.valor} scope="col">
                    {p.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INFLUENCIAS.map((i) => (
                <tr key={i.valor}>
                  <th scope="row">{i.nombre}</th>
                  {POSTURAS.map((p) => (
                    <td key={p.valor} className="numero">
                      {contarEnMatriz(datos.actores, i.valor, p.valor)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
