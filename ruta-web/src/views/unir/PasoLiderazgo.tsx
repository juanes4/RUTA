import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Explicacion } from '../../components/ui/Explicacion';
import { OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { Pestanas } from '../../components/ui/Pestanas';
import { ESTILOS_LIDERAZGO, LETRAS_LIDERAZGO, PREGUNTAS_LIDERAZGO } from '../../config/formularios/liderazgo';
import { EXPLICACION_LIDERAZGO as EX } from '../../contenido/unir';
import { useProyecto } from '../../estado/ProyectoContexto';
import { contarLetras, resumirLiderazgo, vocerosSugeridos } from '../../lib/calculo/liderazgo';
import { formatearNumero } from '../../lib/formato';
import type { FilaLiderazgo, LetraLiderazgo } from '../../lib/modelo/tipos';
import formulario from '../etapa0/formulario.module.css';
import { BorrarRespuestas, MENSAJE_SIN_ESPACIO } from '../reconocer/ayudas';
import estilos from '../reconocer/reconocer.module.css';

const TOTAL = PREGUNTAS_LIDERAZGO.length;

/** U1: encuesta de liderazgo y su clasificación. */
export function PasoLiderazgo() {
  return (
    <Pestanas
      etiqueta="Encuesta de liderazgo"
      pestanas={[
        { id: 'registrar', etiqueta: 'Registrar encuesta', contenido: <FormLiderazgo /> },
        { id: 'resultados', etiqueta: 'Clasificación', contenido: <ResultadosLiderazgo /> },
      ]}
    />
  );
}

function FormLiderazgo() {
  const { actualizarDatos } = useProyecto();
  const [lider, setLider] = useState('');
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
    const fila: FilaLiderazgo = { id: crypto.randomUUID(), lider_id: lider.trim(), conteo_A: conteos.A, conteo_B: conteos.B, conteo_C: conteos.C, conteo_D: conteos.D };
    try {
      await actualizarDatos((d) => ({ ...d, liderazgo: [...d.liderazgo, fila] }));
    } catch {
      return setError(MENSAJE_SIN_ESPACIO);
    }
    setRespuestas({});
    setLider('');
    setMensaje('Encuesta guardada.');
  };

  return (
    <form className={formulario.formulario} onSubmit={(e) => void guardar(e)}>
      <div className={formulario.rejilla}>
        <CampoTexto etiqueta="Código del líder" explicacion={EX.lider_id} value={lider} onChange={(e) => setLider(e.target.value)} />
      </div>
      <div className={estilos.preguntas}>
        {PREGUNTAS_LIDERAZGO.map((p, i) => (
          <OpcionesRespuesta
            key={p.id}
            etiqueta={`${i + 1}. ${p.enunciado}`}
            disposicion="lista"
            opciones={LETRAS_LIDERAZGO.map((letra) => ({ valor: letra, texto: `${letra.toLowerCase()}) ${p.opciones[letra]}` }))}
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

function ResultadosLiderazgo() {
  const { datos, actualizarDatos } = useProyecto();
  if (datos.liderazgo.length === 0) {
    return <EstadoVacio titulo="Sin encuestas registradas">El estilo de cada líder sale de las encuestas que registres.</EstadoVacio>;
  }
  const lideres = resumirLiderazgo(datos.liderazgo);
  const voceros = vocerosSugeridos(lideres);

  return (
    <div className={estilos.resultados}>
      <p className={estilos.nota}>
        Cada letra puede aparecer máximo <span className="numero">{TOTAL}</span> veces, una por pregunta. La letra con mayoría define el estilo; si hay empate, aparecen los
        estilos empatados.
      </p>
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Líder</th>
              {LETRAS_LIDERAZGO.map((l) => (
                <th key={l} scope="col">
                  <Explicacion titulo={ESTILOS_LIDERAZGO[l].nombre} texto={ESTILOS_LIDERAZGO[l].rol} enfocable>
                    {() => l}
                  </Explicacion>
                </th>
              ))}
              <th scope="col">Estilo</th>
              <th scope="col">Viabilidad para comunicar el cambio</th>
            </tr>
          </thead>
          <tbody>
            {lideres.map((l) => (
              <tr key={l.lider_id}>
                <th scope="row">
                  {l.lider_id}
                  {l.encuestas > 1 && <span className={estilos.secundario}>Promedio de {l.encuestas} encuestas</span>}
                </th>
                {LETRAS_LIDERAZGO.map((letra) => (
                  <td key={letra} className="numero">
                    {formatearNumero(l.conteos[letra])}
                  </td>
                ))}
                <td>{l.dominantes.map((d) => ESTILOS_LIDERAZGO[d].nombre).join(' / ')}</td>
                <td>{l.dominantes.map((d) => ESTILOS_LIDERAZGO[d].viabilidad).join(' / ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className={estilos.bloque} aria-labelledby="titulo-voceros">
        <h3 id="titulo-voceros" className={estilos.tituloBloque}>
          Voceros sugeridos
        </h3>
        <p className={estilos.nota}>
          {voceros.length === 0
            ? 'Ningún líder tiene estilo transformacional (C) o participativo (B). Si el vocero es de estilo A o D, acompáñalo como indica su rol.'
            : `${voceros.map((v) => v.lider_id).join(', ')}. Elige al vocero en la narrativa del cambio (U2).`}
        </p>
      </section>

      <section className={estilos.bloque} aria-labelledby="titulo-roles">
        <h3 id="titulo-roles" className={estilos.tituloBloque}>
          Rol que puede desempeñar cada estilo en la etapa
        </h3>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Mayoría</th>
              <th scope="col">Estilo</th>
              <th scope="col">Viabilidad</th>
              <th scope="col">Rol</th>
            </tr>
          </thead>
          <tbody>
            {LETRAS_LIDERAZGO.map((l) => (
              <tr key={l}>
                <th scope="row">{l}</th>
                <td>{ESTILOS_LIDERAZGO[l].nombre}</td>
                <td>{ESTILOS_LIDERAZGO[l].viabilidad}</td>
                <td>{ESTILOS_LIDERAZGO[l].rol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <BorrarRespuestas
        texto="Borrar todas las encuestas"
        confirmacion="¿Borrar todas las encuestas de liderazgo? No se puede deshacer."
        alBorrar={() => void actualizarDatos((d) => ({ ...d, liderazgo: [] }))}
      />
    </div>
  );
}
