import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Explicacion } from '../../components/ui/Explicacion';
import { OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { Pestanas } from '../../components/ui/Pestanas';
import { ESTILOS_LIDERAZGO, LETRAS_LIDERAZGO, PREGUNTAS_LIDERAZGO } from '../../config/formularios/liderazgo';
import { REGLAS } from '../../config/reglas';
import { EXPLICACION_LIDERAZGO as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { contarLetras, resumirLiderazgo, type VistaLider } from '../../lib/calculo/liderazgo';
import type { FilaLiderazgo, LetraLiderazgo, RespondenteLiderazgo } from '../../lib/modelo/tipos';
import formulario from '../etapa0/formulario.module.css';
import { BorrarRespuestas } from './ayudas';
import estilos from './reconocer.module.css';

const TOTAL = PREGUNTAS_LIDERAZGO.length;
const UN_DECIMAL = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/** R4: encuesta de liderazgo. */
export function PasoLiderazgo() {
  return (
    <Pestanas
      etiqueta="Encuesta de liderazgo"
      pestanas={[
        { id: 'registrar', etiqueta: 'Registrar encuesta', contenido: <FormLiderazgo /> },
        { id: 'resultados', etiqueta: 'Resultados', contenido: <ResultadosLiderazgo /> },
      ]}
    />
  );
}

function FormLiderazgo() {
  const { actualizarDatos } = useProyecto();
  const [lider, setLider] = useState('');
  const [respondente, setRespondente] = useState<RespondenteLiderazgo>('auto');
  const [respuestas, setRespuestas] = useState<Record<string, LetraLiderazgo>>({});
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setMensaje('');
    const elegidas = PREGUNTAS_LIDERAZGO.flatMap((p) => respuestas[p.id] ?? []);
    if (!lider.trim()) return setError('Escribe el código del líder.');
    if (elegidas.length < TOTAL) return setError(`Faltan ${TOTAL - elegidas.length} preguntas por responder.`);
    setError('');
    const conteos = contarLetras(elegidas);
    const fila: FilaLiderazgo = {
      id: crypto.randomUUID(),
      lider_id: lider.trim(),
      respondente,
      conteo_A: conteos.A,
      conteo_B: conteos.B,
      conteo_C: conteos.C,
      conteo_D: conteos.D,
    };
    await actualizarDatos((d) => ({ ...d, liderazgo: [...d.liderazgo, fila] }));
    setRespuestas({});
    setMensaje('Encuesta guardada.');
  };

  return (
    <form className={formulario.formulario} onSubmit={(e) => void guardar(e)}>
      <div className={formulario.rejilla}>
        <CampoTexto etiqueta="Código del líder" explicacion={EX.lider_id} value={lider} onChange={(e) => setLider(e.target.value)} />
        <CampoSeleccion
          etiqueta="Quién responde"
          explicacion={EX.respondente}
          value={respondente}
          onChange={(e) => setRespondente(e.target.value as RespondenteLiderazgo)}
        >
          <option value="auto">Autoevaluación del líder</option>
          <option value="equipo">Su equipo ("Mi jefe…")</option>
        </CampoSeleccion>
      </div>
      <div className={estilos.preguntas}>
        {PREGUNTAS_LIDERAZGO.map((p, i) => (
          <OpcionesRespuesta
            key={p.id}
            etiqueta={`${i + 1}. ${p.enunciado[respondente]}`}
            disposicion="lista"
            opciones={LETRAS_LIDERAZGO.map((letra) => ({ valor: letra, texto: p.opciones[letra][respondente] }))}
            valor={respuestas[p.id] ?? ''}
            alCambiar={(v) => setRespuestas((r) => ({ ...r, [p.id]: v as LetraLiderazgo }))}
          />
        ))}
      </div>
      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <div className={formulario.pie}>
        <Boton type="submit">Guardar encuesta</Boton>
        <span className={estilos.mensaje} aria-live="polite">
          {mensaje}
        </span>
      </div>
    </form>
  );
}

function FilaVista({ lider, version, vista }: { lider: string; version: string; vista: VistaLider }) {
  const { conteos, dominantes } = vista;
  return (
    <tr>
      <th scope="row">
        {lider}
        <span className={estilos.secundario}>{version}</span>
      </th>
      {LETRAS_LIDERAZGO.map((l) => (
        <td key={l} className="numero">
          {conteos ? `${UN_DECIMAL.format(conteos[l])} de ${TOTAL}` : '—'}
        </td>
      ))}
      <td>
        {dominantes.map((l) => (
          <span key={l}>
            {ESTILOS_LIDERAZGO[l].nombre}
            <span className={estilos.secundario}>{ESTILOS_LIDERAZGO[l].implicacion}</span>
          </span>
        ))}
        {!conteos && `Faltan encuestas: ${vista.encuestas} de ${REGLAS.anonimato.minimoColaboradores}.`}
      </td>
    </tr>
  );
}

function ResultadosLiderazgo() {
  const { datos, actualizarDatos } = useProyecto();
  if (datos.liderazgo.length === 0) {
    return <EstadoVacio titulo="Sin encuestas registradas">Los estilos de cada líder salen de las encuestas que registres.</EstadoVacio>;
  }
  const lideres = resumirLiderazgo(datos.liderazgo, REGLAS.anonimato.minimoColaboradores);

  return (
    <div className={estilos.resultados}>
      <p className={estilos.nota}>
        La versión del equipo se muestra con al menos <span className="numero">{REGLAS.anonimato.minimoColaboradores}</span> encuestas, para que nadie sea
        identificable. Si hay empate, aparecen los estilos empatados.
      </p>
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Líder</th>
              {LETRAS_LIDERAZGO.map((l) => (
                <th key={l} scope="col">
                  <Explicacion titulo={ESTILOS_LIDERAZGO[l].nombre} texto={ESTILOS_LIDERAZGO[l].implicacion} enfocable>
                    {() => l}
                  </Explicacion>
                </th>
              ))}
              <th scope="col">Estilo que predomina</th>
            </tr>
          </thead>
          <tbody>
            {lideres.flatMap((l) => {
              const filas = [];
              if (l.auto.encuestas > 0) filas.push(<FilaVista key={`${l.lider_id}-auto`} lider={l.lider_id} version="Autoevaluación" vista={l.auto} />);
              if (l.equipo.encuestas > 0) filas.push(<FilaVista key={`${l.lider_id}-equipo`} lider={l.lider_id} version="Su equipo" vista={l.equipo} />);
              return filas;
            })}
          </tbody>
        </table>
      </div>
      <BorrarRespuestas
        texto="Borrar todas las encuestas"
        confirmacion="¿Borrar todas las encuestas de liderazgo? No se puede deshacer."
        alBorrar={() => void actualizarDatos((d) => ({ ...d, liderazgo: [] }))}
      />
    </div>
  );
}
