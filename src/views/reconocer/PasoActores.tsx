import { useState, type FormEvent } from 'react';
import { BotonIcono } from '../../components/ui/Boton';
import { CampoArea, CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { Pestanas } from '../../components/ui/Pestanas';
import { Semaforo } from '../../components/ui/Semaforo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { ESTRATEGIAS } from '../../config/formularios/reconocer';
import { REGLAS } from '../../config/reglas';
import { EXPLICACION_ACTORES as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { coberturaActores } from '../../lib/calculo/actores';
import { evaluarSemaforo } from '../../lib/calculo/semaforo';
import { formatearValor } from '../../lib/formato';
import type { Estrategia, FilaActor, NivelCompromiso, Postura } from '../../lib/modelo/tipos';
import { resolverMetas } from '../../lib/proyecto/etapa0';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO } from './ayudas';
import estilos from './reconocer.module.css';

const COMPROMISOS: readonly { valor: NivelCompromiso; nombre: string }[] = [
  { valor: 'desconoce', nombre: 'Desconoce el cambio' },
  { valor: 'se_resiste', nombre: 'Se resiste' },
  { valor: 'neutral', nombre: 'Neutral' },
  { valor: 'apoya', nombre: 'Apoya' },
  { valor: 'lidera', nombre: 'Lidera' },
];

interface BorradorActor {
  actor: string;
  descripcion: string;
  necesidades: string;
  n_personas: string;
  poder: '' | 'alto' | 'bajo';
  interes: '' | 'alto' | 'bajo';
  compromiso_actual: '' | NivelCompromiso;
  compromiso_deseado: '' | NivelCompromiso;
  estrategia: '' | Estrategia;
  accion: string;
  responsable: string;
  fecha: string;
}

const VACIO: BorradorActor = {
  actor: '',
  descripcion: '',
  necesidades: '',
  n_personas: '',
  poder: '',
  interes: '',
  compromiso_actual: '',
  compromiso_deseado: '',
  estrategia: '',
  accion: '',
  responsable: '',
  fecha: '',
};

function posturaAnterior(nivel: NivelCompromiso): Postura {
  if (nivel === 'se_resiste') return 'se_opone';
  if (nivel === 'apoya' || nivel === 'lidera') return 'apoya';
  return 'neutral';
}

function nivelActual(actor: FilaActor): NivelCompromiso {
  if (actor.compromiso_actual) return actor.compromiso_actual;
  if (actor.postura === 'se_opone') return 'se_resiste';
  return actor.postura;
}

function nivelDeseado(actor: FilaActor): NivelCompromiso | null {
  return actor.compromiso_deseado ?? null;
}

function poderActor(actor: FilaActor): 'alto' | 'bajo' | null {
  if (actor.poder) return actor.poder;
  return actor.influencia === 'media' ? null : actor.influencia === 'alta' ? 'alto' : 'bajo';
}

function interesActor(actor: FilaActor): 'alto' | 'bajo' | null {
  return actor.interes ?? null;
}

/** R4: registra necesidades, poder, interés y brechas de compromiso de cada grupo. */
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
  const [nuevo, setNuevo] = useState<BorradorActor>(VACIO);
  const [errores, setErrores] = useState<string[]>([]);
  const campo = <K extends keyof BorradorActor>(clave: K, valor: BorradorActor[K]) => setNuevo((n) => ({ ...n, [clave]: valor }));

  const agregar = async (evento: FormEvent) => {
    evento.preventDefault();
    const personas = Number(nuevo.n_personas);
    const problemas = [
      !nuevo.actor.trim() && 'Escribe el actor o grupo.',
      !nuevo.descripcion.trim() && 'Describe quién es o qué rol cumple el actor.',
      !nuevo.necesidades.trim() && 'Registra sus necesidades o expectativas.',
      (nuevo.n_personas === '' || !Number.isInteger(personas) || personas < 1) && 'El número de personas debe ser 1 o más.',
      !nuevo.poder && 'Indica si el poder de decisión o influencia es alto o bajo.',
      !nuevo.interes && 'Indica si el interés del actor es alto o bajo.',
      !nuevo.compromiso_actual && 'Registra el compromiso actual.',
      !nuevo.compromiso_deseado && 'Registra el compromiso deseado.',
    ].filter((e): e is string => typeof e === 'string');
    setErrores(problemas);
    if (problemas.length > 0) return;
    if (!nuevo.poder || !nuevo.interes || !nuevo.compromiso_actual || !nuevo.compromiso_deseado) return;
    const fila: FilaActor = {
      id: crypto.randomUUID(),
      actor: nuevo.actor.trim(),
      descripcion: nuevo.descripcion.trim(),
      necesidades: nuevo.necesidades.trim(),
      poder: nuevo.poder,
      interes: nuevo.interes,
      compromiso_actual: nuevo.compromiso_actual,
      compromiso_deseado: nuevo.compromiso_deseado,
      n_personas: personas,
      influencia: nuevo.poder === 'alto' ? 'alta' : 'baja',
      postura: posturaAnterior(nuevo.compromiso_actual),
      motivo: nuevo.necesidades.trim(),
      estrategia: nuevo.estrategia || null,
      accion: nuevo.accion.trim(),
      responsable: nuevo.responsable.trim(),
      fecha: nuevo.fecha,
    };
    try {
      await actualizarDatos((d) => ({ ...d, actores: [...d.actores, fila] }));
    } catch {
      setErrores([MENSAJE_SIN_ESPACIO]);
      return;
    }
    setNuevo(VACIO);
  };

  const quitar = async (id: string) => {
    try {
      await actualizarDatos((d) => ({ ...d, actores: d.actores.filter((a) => a.id !== id) }));
    } catch {
      setErrores([MENSAJE_SIN_ESPACIO]);
    }
  };
  const nombreEstrategia = (valor: Estrategia | null) => ESTRATEGIAS.find((o) => o.valor === valor)?.nombre ?? '—';

  return (
    <div className={estilos.resultados}>
      <form className={formulario.formulario} onSubmit={(e) => void agregar(e)}>
        <div className={formulario.rejilla}>
          <CampoTexto
            etiqueta="Actor o grupo"
            explicacion={EX.actor}
            ayuda="Ejemplos: propietarios y alta dirección, mandos medios, colaboradores operativos o administrativos, y representantes de trabajadores."
            value={nuevo.actor}
            onChange={(e) => campo('actor', e.target.value)}
          />
          <CampoTexto etiqueta="Número de personas (estimado)" type="number" min={1} step={1} value={nuevo.n_personas} onChange={(e) => campo('n_personas', e.target.value)} />
          <div className={formulario.ancho}>
            <CampoArea etiqueta="Descripción del actor" explicacion={EX.descripcion} value={nuevo.descripcion} onChange={(e) => campo('descripcion', e.target.value)} />
          </div>
          <div className={formulario.ancho}>
            <CampoArea etiqueta="Necesidades y expectativas" explicacion={EX.necesidades} value={nuevo.necesidades} onChange={(e) => campo('necesidades', e.target.value)} />
          </div>
          <CampoSeleccion etiqueta="Poder" explicacion={EX.poder} required value={nuevo.poder} onChange={(e) => campo('poder', e.target.value as BorradorActor['poder'])}>
            <option value="">Elegir…</option>
            <option value="alto">Alto (A)</option>
            <option value="bajo">Bajo (B)</option>
          </CampoSeleccion>
          <CampoSeleccion etiqueta="Interés" explicacion={EX.interes} required value={nuevo.interes} onChange={(e) => campo('interes', e.target.value as BorradorActor['interes'])}>
            <option value="">Elegir…</option>
            <option value="alto">Alto (A)</option>
            <option value="bajo">Bajo (B)</option>
          </CampoSeleccion>
          <CampoSeleccion etiqueta="Compromiso actual" explicacion={EX.compromiso} required value={nuevo.compromiso_actual} onChange={(e) => campo('compromiso_actual', e.target.value as BorradorActor['compromiso_actual'])}>
            <option value="">Elegir…</option>
            {COMPROMISOS.map((nivel) => <option key={nivel.valor} value={nivel.valor}>{nivel.nombre}</option>)}
          </CampoSeleccion>
          <CampoSeleccion etiqueta="Compromiso deseado" explicacion={EX.compromiso} required value={nuevo.compromiso_deseado} onChange={(e) => campo('compromiso_deseado', e.target.value as BorradorActor['compromiso_deseado'])}>
            <option value="">Elegir…</option>
            {COMPROMISOS.map((nivel) => <option key={nivel.valor} value={nivel.valor}>{nivel.nombre}</option>)}
          </CampoSeleccion>
        </div>

        <details>
          <summary>Plan de acompañamiento opcional</summary>
          <p className={estilos.nota}>Puedes conservar la acción, estrategia y responsable para dar seguimiento a los actores.</p>
          <div className={formulario.rejilla}>
            <CampoSeleccion etiqueta="Estrategia" value={nuevo.estrategia} onChange={(e) => campo('estrategia', e.target.value as Estrategia | '')}>
              <option value="">Elegir…</option>
              {ESTRATEGIAS.map((o) => <option key={o.valor} value={o.valor}>{o.nombre}</option>)}
            </CampoSeleccion>
            <CampoTexto etiqueta="Acción" value={nuevo.accion} onChange={(e) => campo('accion', e.target.value)} />
            <CampoTexto etiqueta="Responsable (cargo)" value={nuevo.responsable} onChange={(e) => campo('responsable', e.target.value)} />
            <CampoTexto etiqueta="Fecha" type="date" value={nuevo.fecha} onChange={(e) => campo('fecha', e.target.value)} />
          </div>
        </details>

        {errores.length > 0 && (
          <ul className={formulario.errores} role="alert">
            {errores.map((e) => <li key={e}>{e}</li>)}
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
                <th scope="col">Actor y descripción</th>
                <th scope="col">Necesidades / expectativas</th>
                <th scope="col">Poder</th>
                <th scope="col">Interés</th>
                <th scope="col">Actual</th>
                <th scope="col">Deseado</th>
                <th scope="col">Acción</th>
                <th scope="col"><span className="solo-lectores">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {datos.actores.map((a) => (
                <tr key={a.id}>
                  <th scope="row">
                    {a.actor}
                    <span className={estilos.secundario}>{a.descripcion ?? `${a.n_personas} personas`}</span>
                  </th>
                  <td>{a.necesidades ?? a.motivo ?? '—'}</td>
                  <td>{poderActor(a) === 'alto' ? 'Alto (A)' : poderActor(a) === 'bajo' ? 'Bajo (B)' : 'Sin clasificar'}</td>
                  <td>{interesActor(a) === 'alto' ? 'Alto (A)' : interesActor(a) === 'bajo' ? 'Bajo (B)' : 'Sin clasificar'}</td>
                  <td>{COMPROMISOS.find((n) => n.valor === nivelActual(a))?.nombre ?? 'Sin clasificar'}</td>
                  <td>{COMPROMISOS.find((n) => n.valor === nivelDeseado(a))?.nombre ?? 'Sin definir'}</td>
                  <td>
                    {a.accion || 'Sin acción'}
                    {(a.responsable || a.fecha) && <span className={estilos.secundario}>{[a.responsable, a.fecha].filter(Boolean).join(' · ')}</span>}
                    {a.estrategia && <span className={estilos.secundario}>{nombreEstrategia(a.estrategia)}</span>}
                  </td>
                  <td><BotonIcono accion="quitar" etiqueta={`Quitar ${a.actor}`} onClick={() => void quitar(a.id)} /></td>
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
    return <EstadoVacio titulo="Sin actores registrados">El mapa de poder e interés y la brecha de compromiso salen de los actores que registres.</EstadoVacio>;
  }

  const estados = COMPROMISOS.map((nivel) => ({
    ...nivel,
    actuales: datos.actores.filter((a) => nivelActual(a) === nivel.valor).length,
    deseados: datos.actores.filter((a) => nivelDeseado(a) === nivel.valor).length,
  }));

  return (
    <div className={estilos.resultados}>
      <section className={estilos.bloque} aria-labelledby="titulo-cobertura">
        <h3 id="titulo-cobertura" className={estilos.tituloBloque}>Cobertura del plan de acompañamiento</h3>
        <p className={estilos.nota}>
          <span className="numero">{formatearValor(cobertura, 'porcentaje')}</span> tiene una acción definida (meta{' '}
          <span className="numero">{formatearValor(meta.meta, 'porcentaje')}</span>).{' '}
          <Semaforo estado={evaluarSemaforo(cobertura, meta, REGLAS.semaforo.margen)} />
        </p>
      </section>
      <section className={estilos.bloque} aria-labelledby="titulo-poder-interes">
        <h3 id="titulo-poder-interes" className={estilos.tituloBloque}>Matriz de poder e interés</h3>
        <p className={estilos.nota}>Los registros anteriores sin clasificación A/B se muestran como “Sin clasificar” y no se asignan a una celda.</p>
        <div className={estilos.desplazable}>
          <table className={estilos.tabla}>
            <thead><tr><th scope="col">Poder</th><th scope="col">Interés alto (A)</th><th scope="col">Interés bajo (B)</th></tr></thead>
            <tbody>
              {(['alto', 'bajo'] as const).map((poder) => (
                <tr key={poder}>
                  <th scope="row">Poder {poder === 'alto' ? 'alto (A)' : 'bajo (B)'}</th>
                  {(['alto', 'bajo'] as const).map((interes) => (
                    <td key={interes} className="numero">
                      {datos.actores.filter((a) => poderActor(a) === poder && interesActor(a) === interes).length}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={estilos.bloque} aria-labelledby="titulo-compromiso">
        <h3 id="titulo-compromiso" className={estilos.tituloBloque}>Mapa de compromiso: posición actual (C) y deseada (D)</h3>
        <p className={estilos.nota}>Cuanto mayor sea la distancia entre C y D, mayor será el esfuerzo de comunicación y acompañamiento que conviene planear.</p>
        <div className={estilos.desplazable}>
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Actor</th>
                {estados.map((nivel) => <th key={nivel.valor} scope="col">{nivel.nombre}</th>)}
              </tr>
            </thead>
            <tbody>
              {datos.actores.map((actor) => (
                <tr key={actor.id}>
                  <th scope="row">{actor.actor}</th>
                  {estados.map((nivel) => (
                    <td key={nivel.valor}>
                      {nivelActual(actor) === nivel.valor && <strong>C</strong>}
                      {nivelActual(actor) === nivel.valor && nivelDeseado(actor) === nivel.valor && ' / '}
                      {nivelDeseado(actor) === nivel.valor && <strong>D</strong>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total de grupos</th>
                {estados.map((nivel) => <td key={nivel.valor} className="numero">C: {nivel.actuales} · D: {nivel.deseados}</td>)}
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
