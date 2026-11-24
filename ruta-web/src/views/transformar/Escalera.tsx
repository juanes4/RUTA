import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { ESCALERA, GUION_VOTACION, NOTA_ESCALERA, PASOS_VOTACION } from '../../config/transformar';
import { useEnvio, useRegistros, type EstadoCarga } from '../../hooks/useRegistros';
import { api, type Acuerdo, type ConteoVotos, type Voto } from '../../lib/api';
import { escalonMayoritario } from '../../lib/transformar/victorias';
import formulario from '../etapa0/formulario.module.css';
import { MensajeEnvio } from './MensajeEnvio';
import { SelectorCiclo } from './SelectorCiclo';
import estilos from './etapaT.module.css';

type Momento = 'inicio' | 'cierre';
const MOMENTOS = [
  { valor: 'inicio', texto: 'Al inicio del ciclo' },
  { valor: 'cierre', texto: 'Al cierre del ciclo' },
];
const OPCIONES_ESCALON = ESCALERA.map((e) => ({ valor: String(e.nivel), texto: `${e.nivel}. ${e.nombre}` }));
const nombreEscalon = (n: number | null) => (n === null ? '—' : `${n}. ${ESCALERA[n - 1]?.nombre ?? ''}`);

/** La escalera dibujada: cada escalón sube un poco más que el anterior. */
function DibujoEscalera() {
  return (
    <ol className={estilos.escalera} aria-label="Escalera de autonomía, del escalón 1 al 4">
      {ESCALERA.map((e) => (
        <li key={e.nivel} className={estilos.escalon} data-nivel={e.nivel}>
          <span className={`${estilos.numeroEscalon} numero`}>{e.nivel}</span>
          <strong>{e.nombre}</strong>
          <span>{e.descripcion}</span>
          <span className={estilos.apoyo}>Apoyo: {e.apoyo}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * T3 · Momento 1: votación de escalones. Cada persona vota sola; el líder ve
 * cuántas votaron cada escalón (no quién votó qué) y registra el escalón que
 * el equipo acuerda hablando. Al cierre se repite para ver si llegó a Referente.
 */
export function Escalera({ esLider }: { esLider: boolean }) {
  const votos = useRegistros<{ propios: Voto[]; conteos: ConteoVotos[] | null }>('voto');
  const acuerdos = useRegistros<{ registros: Acuerdo[] }>('acuerdo');

  return (
    <div className={estilos.bloques}>
      <DibujoEscalera />

      <section aria-labelledby="titulo-votacion">
        <h3 id="titulo-votacion" className={estilos.subtitulo}>
          Votación de escalones
        </h3>
        <ol className={estilos.pasos}>
          {PASOS_VOTACION.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        <p className={estilos.guion}>Guión del facilitador: «{GUION_VOTACION}»</p>
        <p className={estilos.texto}>{NOTA_ESCALERA}</p>
      </section>

      <FormVoto alGuardar={votos.recargar} propios={votos.estado.fase === 'listo' ? votos.estado.datos.propios : []} />

      {esLider && (
        <>
          <ResultadoVotacion estado={votos.estado} />
          <FormAcuerdo alGuardar={acuerdos.recargar} />
        </>
      )}

      <HistorialAcuerdos estado={acuerdos.estado} />
    </div>
  );
}

function FormVoto({ alGuardar, propios }: { alGuardar(): void; propios: Voto[] }) {
  const { estado, enviar, limpiar } = useEnvio();
  const [ciclo, setCiclo] = useState(1);
  const [momento, setMomento] = useState<Momento>('inicio');
  const [nivel, setNivel] = useState('');
  const previo = propios.find((v) => v.ciclo === ciclo && v.momento === momento);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (await enviar(() => api.guardarRegistro('voto', { ciclo, momento, nivel: Number(nivel) }), 'Tu voto quedó guardado.')) alGuardar();
  };

  return (
    <form className={formulario.formulario} onSubmit={guardar} onChange={limpiar}>
      <h3 className={estilos.subtitulo}>Mi voto</h3>
      <div className={formulario.rejilla}>
        <SelectorCiclo valor={ciclo} alCambiar={setCiclo} />
      </div>
      <OpcionesRespuesta etiqueta="Momento" opciones={MOMENTOS} valor={momento} alCambiar={(v) => setMomento(v as Momento)} />
      <OpcionesRespuesta etiqueta="¿En qué escalón ves hoy al equipo?" opciones={OPCIONES_ESCALON} valor={nivel} alCambiar={setNivel} />
      {previo && <p className={estilos.texto}>Ya votaste en este momento: escalón {nombreEscalon(previo.nivel)}. Si vuelves a votar, se reemplaza tu voto.</p>}
      <div className={formulario.pie}>
        <Boton type="submit" disabled={nivel === '' || estado.fase === 'enviando'}>
          Votar
        </Boton>
        <MensajeEnvio estado={estado} />
      </div>
    </form>
  );
}

function ResultadoVotacion({ estado }: { estado: EstadoCarga<{ propios: Voto[]; conteos: ConteoVotos[] | null }> }) {
  if (estado.fase !== 'listo') return null;
  const conteos = estado.datos.conteos ?? [];
  return (
    <section aria-labelledby="titulo-resultado-votos">
      <h3 id="titulo-resultado-votos" className={estilos.subtitulo}>
        Resultado de la votación (solo líderes)
      </h3>
      {conteos.length === 0 ? (
        <EstadoVacio titulo="Aún no hay votos">Cuando el equipo vote, aquí se ve dónde quedó la mayoría.</EstadoVacio>
      ) : (
        <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Votos por escalón">
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Ciclo</th>
                <th scope="col">Momento</th>
                {ESCALERA.map((e) => (
                  <th key={e.nivel} scope="col">
                    {e.nivel}. {e.nombre}
                  </th>
                ))}
                <th scope="col">Mayoría</th>
              </tr>
            </thead>
            <tbody>
              {conteos.map((c) => (
                <tr key={`${c.ciclo}-${c.momento}`}>
                  <th scope="row" className="numero">
                    {c.ciclo}
                  </th>
                  <td>{c.momento === 'inicio' ? 'Inicio' : 'Cierre'}</td>
                  {c.niveles.map((n, i) => (
                    <td key={i} className="numero">
                      {n}
                    </td>
                  ))}
                  <td>{escalonMayoritario(c.niveles) === null ? 'Sin mayoría clara' : nombreEscalon(escalonMayoritario(c.niveles))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FormAcuerdo({ alGuardar }: { alGuardar(): void }) {
  const { estado, enviar, limpiar } = useEnvio();
  const [ciclo, setCiclo] = useState(1);
  const [momento, setMomento] = useState<Momento>('inicio');
  const [nivel, setNivel] = useState('');
  const [meta, setMeta] = useState('');

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const datos = { ciclo, momento, nivel: Number(nivel), meta: momento === 'inicio' && meta !== '' ? Number(meta) : null };
    if (await enviar(() => api.guardarRegistro('acuerdo', datos), 'Escalón acordado guardado.')) alGuardar();
  };

  return (
    <form className={formulario.formulario} onSubmit={guardar} onChange={limpiar}>
      <h3 className={estilos.subtitulo}>Escalón que acordó el equipo (solo líderes)</h3>
      <p className={estilos.texto}>
        Después de la votación, quienes votaron distinto explican qué vieron y el equipo acuerda su escalón. Regístralo aquí; al inicio también se
        marca el escalón al que se llegará al cierre del ciclo.
      </p>
      <div className={formulario.rejilla}>
        <SelectorCiclo valor={ciclo} alCambiar={setCiclo} />
      </div>
      <OpcionesRespuesta etiqueta="Momento" opciones={MOMENTOS} valor={momento} alCambiar={(v) => setMomento(v as Momento)} />
      <OpcionesRespuesta etiqueta="Escalón acordado hoy" opciones={OPCIONES_ESCALON} valor={nivel} alCambiar={setNivel} />
      {momento === 'inicio' && <OpcionesRespuesta etiqueta="Escalón al que llegará al cierre del ciclo (opcional)" opciones={OPCIONES_ESCALON} valor={meta} alCambiar={setMeta} />}
      <div className={formulario.pie}>
        <Boton type="submit" disabled={nivel === '' || estado.fase === 'enviando'}>
          Guardar escalón acordado
        </Boton>
        <MensajeEnvio estado={estado} />
      </div>
    </form>
  );
}

function HistorialAcuerdos({ estado }: { estado: EstadoCarga<{ registros: Acuerdo[] }> }) {
  if (estado.fase === 'cargando') return <p role="status">Cargando…</p>;
  if (estado.fase === 'error') return <EstadoVacio titulo="No se pudo cargar el escalón del equipo">{estado.mensaje}</EstadoVacio>;
  const filas = [...estado.datos.registros].sort((a, b) => a.ciclo - b.ciclo || (a.momento === 'inicio' ? -1 : 1));
  const ultimoCierre = [...filas].reverse().find((f) => f.momento === 'cierre');

  return (
    <section aria-labelledby="titulo-escalon-equipo">
      <h3 id="titulo-escalon-equipo" className={estilos.subtitulo}>
        Escalón del equipo
      </h3>
      {filas.length === 0 ? (
        <EstadoVacio titulo="Aún no hay un escalón acordado">Después de la primera votación, el líder registra el escalón del equipo.</EstadoVacio>
      ) : (
        <>
          <ul className={estilos.lista}>
            {filas.map((f) => (
              <li key={f.id}>
                <strong>
                  Ciclo {f.ciclo} · {f.momento === 'inicio' ? 'inicio' : 'cierre'}: escalón {nombreEscalon(f.nivel)}
                </strong>
                {f.meta !== null && <span className={estilos.apoyo}>Meta al cierre: escalón {nombreEscalon(f.meta)}</span>}
              </li>
            ))}
          </ul>
          {ultimoCierre && (
            <p className={estilos.resultado} data-aprobado={ultimoCierre.nivel === 4} role="status">
              {ultimoCierre.nivel === 4
                ? 'En la última votación de cierre el equipo llegó al escalón Referente.'
                : `En la última votación de cierre (ciclo ${ultimoCierre.ciclo}) el equipo está en el escalón ${nombreEscalon(ultimoCierre.nivel)}: todavía no llega a Referente.`}
            </p>
          )}
        </>
      )}
    </section>
  );
}
