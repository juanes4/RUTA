import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { OpcionesMultiples, OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { Pestanas } from '../../components/ui/Pestanas';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { BUZON1_ABIERTAS, BUZON1_ESCALA, BUZON1_SELECCION } from '../../config/formularios/buzon1';
import { REGLAS } from '../../config/reglas';
import { EXPLICACION_BUZON1 as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { CATALOGO_BUZON1, filasDeEncuesta, VALOR_NO_SE, type EncuestaBuzon1 } from '../../lib/captura/buzon1';
import { COLUMNAS_RESPUESTAS, fusionarRespuestas, importarRespuestas } from '../../lib/captura/respuestasCsv';
import { contarPersonas } from '../../lib/calculo/estadistica';
import formulario from '../etapa0/formulario.module.css';
import { hoy, MENSAJE_SIN_ESPACIO } from './ayudas';
import estilos from './reconocer.module.css';
import { ResultadosBuzon1 } from './ResultadosBuzon1';

const VACIA: EncuestaBuzon1 = { area: '', turno: '', antiguedad_rango: '', escala: {}, seleccion: {}, abiertas: {} };
const { minimo, maximo } = REGLAS.escala;
const OPCIONES_ESCALA = [
  ...Array.from({ length: maximo - minimo + 1 }, (_, i) => String(minimo + i)).map((v) => ({ valor: v, texto: v })),
  { valor: VALOR_NO_SE, texto: 'No sé' },
];
const MAX_ERRORES_VISIBLES = 8;

/** R6: buzón 1. El papel se digita; Google Forms entra por CSV (CONTEXTO §12.5). */
export function PasoBuzon1() {
  const { activo } = useProyecto();
  if (!activo) return null;
  if (activo.segmentacion.areas.length === 0) {
    return <EstadoVacio titulo="Faltan las áreas">Registra las áreas y sus afectados en la Etapa 0 (paso 0.2): cada respuesta pertenece a un área.</EstadoVacio>;
  }
  return (
    <Pestanas
      etiqueta="Buzón 1"
      pestanas={[
        { id: 'digitar', etiqueta: 'Digitar papel', contenido: <FormBuzon1 /> },
        { id: 'csv', etiqueta: 'Cargar CSV', contenido: <CargaCsv /> },
        { id: 'resultados', etiqueta: 'Resultados', contenido: <ResultadosBuzon1 /> },
      ]}
    />
  );
}

function FormBuzon1() {
  const { activo, datos, actualizarDatos } = useProyecto();
  const [encuesta, setEncuesta] = useState(VACIA);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const inicio = useRef<HTMLFormElement>(null);
  if (!activo) return null;
  const { areas, turnos, rangos_antiguedad } = activo.segmentacion;

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setMensaje('');
    if (!encuesta.area) return setError('Elige el área de quien respondió.');
    const filas = filasDeEncuesta(encuesta, crypto.randomUUID(), hoy());
    if (filas.length === 0) return setError('La encuesta está vacía: marca al menos una respuesta.');
    setError('');
    try {
      await actualizarDatos((d) => ({ ...d, respuestas: [...d.respuestas, ...filas] }));
    } catch {
      return setError(MENSAJE_SIN_ESPACIO);
    }
    const personas = contarPersonas(datos.respuestas.filter((r) => r.instrumento === 'buzon1')) + 1;
    const enBlanco = BUZON1_ESCALA.filter((p) => !encuesta.escala[p.id]).length;
    setEncuesta(VACIA);
    setMensaje(`Encuesta guardada. Van ${personas}.${enBlanco > 0 ? ` Quedaron ${enBlanco} preguntas de escala en blanco.` : ''}`);
    inicio.current?.scrollIntoView({ block: 'start' });
  };

  return (
    <form ref={inicio} className={formulario.formulario} onSubmit={(e) => void guardar(e)}>
      <p className={estilos.mensaje} aria-live="polite">
        {mensaje}
      </p>
      <div className={formulario.rejilla}>
        <CampoSeleccion etiqueta="Área" explicacion={EX.area} value={encuesta.area} onChange={(e) => setEncuesta((v) => ({ ...v, area: e.target.value }))}>
          <option value="">Elegir…</option>
          {areas.map((a) => (
            <option key={a.area} value={a.area}>
              {a.area}
            </option>
          ))}
        </CampoSeleccion>
        {turnos.length > 0 && (
          <CampoSeleccion etiqueta="Turno o sede" explicacion={EX.turno} value={encuesta.turno} onChange={(e) => setEncuesta((v) => ({ ...v, turno: e.target.value }))}>
            <option value="">Sin dato</option>
            {turnos.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </CampoSeleccion>
        )}
        {rangos_antiguedad.length > 0 && (
          <CampoSeleccion
            etiqueta="Antigüedad"
            explicacion={EX.antiguedad}
            value={encuesta.antiguedad_rango}
            onChange={(e) => setEncuesta((v) => ({ ...v, antiguedad_rango: e.target.value }))}
          >
            <option value="">Sin dato</option>
            {rangos_antiguedad.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </CampoSeleccion>
        )}
      </div>

      <p className={estilos.nota}>
        Escala: {minimo} = totalmente en desacuerdo, {maximo} = totalmente de acuerdo. "No sé" no suma al promedio. Lo que quedó en blanco en el papel se deja sin marcar.
      </p>
      <div className={estilos.preguntas}>
        {BUZON1_ESCALA.map((p, i) => (
          <OpcionesRespuesta
            key={p.id}
            etiqueta={`${i + 1}. ${p.texto}`}
            opciones={OPCIONES_ESCALA}
            valor={encuesta.escala[p.id] ?? ''}
            alCambiar={(valor) => setEncuesta((v) => ({ ...v, escala: { ...v.escala, [p.id]: valor } }))}
          />
        ))}
        {BUZON1_SELECCION.map((p) => (
          <OpcionesMultiples
            key={p.id}
            etiqueta={p.texto}
            maximo={p.maximo}
            opciones={p.opciones.map((o) => ({ valor: o, texto: o }))}
            valores={encuesta.seleccion[p.id] ?? []}
            alCambiar={(valores) => setEncuesta((v) => ({ ...v, seleccion: { ...v.seleccion, [p.id]: valores } }))}
          />
        ))}
        {BUZON1_ABIERTAS.map((p) => (
          <CampoArea
            key={p.id}
            etiqueta={p.texto}
            value={encuesta.abiertas[p.id] ?? ''}
            onChange={(e) => setEncuesta((v) => ({ ...v, abiertas: { ...v.abiertas, [p.id]: e.target.value } }))}
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
      </div>
    </form>
  );
}

function descargarPlantilla() {
  const url = URL.createObjectURL(new Blob([`${COLUMNAS_RESPUESTAS.join(',')}\n`], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'plantilla_respuestas.csv';
  enlace.click();
  URL.revokeObjectURL(url);
}

function CargaCsv() {
  const { activo, actualizarDatos } = useProyecto();
  const [errores, setErrores] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState('');
  if (!activo) return null;

  const cargar = async (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = ''; // Permite volver a elegir el mismo archivo tras corregirlo.
    if (!archivo) return;
    setMensaje('');
    const { filas, errores: problemas } = importarRespuestas(await archivo.text(), {
      catalogo: CATALOGO_BUZON1,
      areas: activo.segmentacion.areas.map((a) => a.area),
      escala: REGLAS.escala,
    });
    setErrores(problemas);
    if (problemas.length > 0) return;
    try {
      await actualizarDatos((d) => ({ ...d, respuestas: fusionarRespuestas(d.respuestas, filas) }));
      setMensaje(`Archivo cargado: ${contarPersonas(filas)} personas, ${filas.length} filas.`);
    } catch {
      setErrores([MENSAJE_SIN_ESPACIO]);
    }
  };

  return (
    <div className={estilos.bloque}>
      <p className={estilos.nota}>
        Sube el CSV de Google Forms tal como sale. Cada título debe empezar con su código y las columnas de grupo con "Área", "Turno" y "Antigüedad". Las opciones se escriben igual
        que aquí. Si alguna línea tiene un error, no se carga nada; volver a cargar el mismo archivo no duplica respuestas.
      </p>
      <CampoTexto etiqueta="Archivo CSV" explicacion={EX.archivo} type="file" accept=".csv,text/csv" onChange={(e) => void cargar(e)} />
      <p className={estilos.mensaje} aria-live="polite">
        {mensaje}
      </p>
      {errores.length > 0 && (
        <ul className={formulario.errores} role="alert">
          {errores.slice(0, MAX_ERRORES_VISIBLES).map((e) => (
            <li key={e}>{e}</li>
          ))}
          {errores.length > MAX_ERRORES_VISIBLES && <li>Y {errores.length - MAX_ERRORES_VISIBLES} errores más.</li>}
        </ul>
      )}
      <section className={estilos.bloque} aria-labelledby="titulo-codigos">
        <h3 id="titulo-codigos" className={estilos.tituloBloque}>
          Códigos para los títulos en Google Forms
        </h3>
        <div className={estilos.desplazable}>
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Pregunta</th>
              </tr>
            </thead>
            <tbody>
              {[...BUZON1_ESCALA, ...BUZON1_SELECCION, ...BUZON1_ABIERTAS].map((p) => (
                <tr key={p.id}>
                  <th scope="row" className="numero">
                    {p.codigo}.
                  </th>
                  <td>{p.texto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className={estilos.nota}>
        ¿Sin Google Forms? También se acepta un CSV con las columnas <span className="numero">{COLUMNAS_RESPUESTAS.join(', ')}</span>.
      </p>
      <div>
        <Boton variante="secundario" onClick={descargarPlantilla}>
          Descargar plantilla
        </Boton>
      </div>
    </div>
  );
}
