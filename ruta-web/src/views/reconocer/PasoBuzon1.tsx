import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Pestanas } from '../../components/ui/Pestanas';
import { GRUPOS_BUZON1, PREGUNTAS_BUZON1, SIN_GRUPO, type CampoBuzon1 } from '../../config/formularios/buzon1';
import { BuzonEnLinea } from './BuzonEnLinea';
import { EXPLICACION_BUZON1 as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { COLUMNAS_PLANTILLA, fusionarBuzon1, importarBuzon1 } from '../../lib/captura/buzon1Csv';
import { participacionPorArea, participacionTotal } from '../../lib/calculo/participacion';
import { formatearPorcentaje } from '../../lib/formato';
import type { RespuestaBuzon1 } from '../../lib/modelo/tipos';
import formulario from '../etapa0/formulario.module.css';
import { BorrarRespuestas, hoy, MENSAJE_SIN_ESPACIO } from './ayudas';
import estilos from './reconocer.module.css';

const VACIA: Record<CampoBuzon1, string> & { area: string; grupo: string } = { area: '', grupo: '', falla: '', preocupa: '', harias: '' };
const MAX_ERRORES_VISIBLES = 8;

/** R5: buzón 1, escucha inicial. El papel se digita; Google Forms entra por CSV. */
export function PasoBuzon1() {
  const { activo } = useProyecto();
  if (!activo) return null;
  if (activo.segmentacion.areas.length === 0) {
    return <EstadoVacio titulo="Faltan las áreas">Registra las áreas y sus afectados en la Etapa 0 (paso 0.2): cada respuesta pertenece a un área.</EstadoVacio>;
  }
  return (
    <>
      <p className={estilos.aviso}>
        Este buzón no debe servir para informar el cambio: es una fase de diagnóstico y reconocimiento. Por ahora no hay un cambio, la organización se está
        preparando.
      </p>
      <Pestanas
        etiqueta="Buzón 1"
        pestanas={[
          { id: 'digitar', etiqueta: 'Digitar papel', contenido: <FormBuzon1 /> },
          { id: 'csv', etiqueta: 'Cargar CSV', contenido: <CargaCsv /> },
          { id: 'forms', etiqueta: 'Google Forms en línea', contenido: <BuzonEnLinea /> },
          { id: 'resultados', etiqueta: 'Resultados', contenido: <ResultadosBuzon1 /> },
        ]}
      />
    </>
  );
}

function FormBuzon1() {
  const { activo, datos, actualizarDatos } = useProyecto();
  const [respuesta, setRespuesta] = useState(VACIA);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const inicio = useRef<HTMLFormElement>(null);
  if (!activo) return null;

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setMensaje('');
    if (!respuesta.area) return setError('Elige el área de quien respondió.');
    if (PREGUNTAS_BUZON1.every((p) => !respuesta[p.campo].trim())) return setError('La respuesta está vacía: escribe al menos una.');
    setError('');
    const fila: RespuestaBuzon1 = {
      id: crypto.randomUUID(),
      fecha: hoy(),
      area: respuesta.area,
      grupo: respuesta.grupo || SIN_GRUPO,
      falla: respuesta.falla.trim(),
      preocupa: respuesta.preocupa.trim(),
      harias: respuesta.harias.trim(),
    };
    try {
      await actualizarDatos((d) => ({ ...d, buzon1: [...d.buzon1, fila] }));
    } catch {
      return setError(MENSAJE_SIN_ESPACIO);
    }
    setRespuesta({ ...VACIA, area: respuesta.area, grupo: respuesta.grupo });
    setMensaje(`Respuesta guardada. Van ${datos.buzon1.length + 1}.`);
    inicio.current?.scrollIntoView({ block: 'start' });
  };

  return (
    <form ref={inicio} className={formulario.formulario} onSubmit={(e) => void guardar(e)}>
      <p className={estilos.mensaje} aria-live="polite">
        {mensaje}
      </p>
      <CampoSeleccion etiqueta="Área" explicacion={EX.area} value={respuesta.area} onChange={(e) => setRespuesta((r) => ({ ...r, area: e.target.value }))}>
        <option value="">Elegir…</option>
        {activo.segmentacion.areas.map((a) => (
          <option key={a.area} value={a.area}>
            {a.area}
          </option>
        ))}
      </CampoSeleccion>
      <CampoSeleccion
        etiqueta="Grupo (opcional)"
        explicacion={EX.grupo}
        value={respuesta.grupo}
        onChange={(e) => setRespuesta((r) => ({ ...r, grupo: e.target.value }))}
      >
        <option value="">Sin grupo</option>
        {GRUPOS_BUZON1.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </CampoSeleccion>
      {PREGUNTAS_BUZON1.map((p, i) => (
        <CampoArea
          key={p.campo}
          etiqueta={`${i + 1}. ${p.texto}`}
          value={respuesta[p.campo]}
          onChange={(e) => setRespuesta((r) => ({ ...r, [p.campo]: e.target.value }))}
        />
      ))}
      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <div className={formulario.pie}>
        <Boton type="submit">Guardar respuesta</Boton>
      </div>
    </form>
  );
}

function descargarPlantilla() {
  const contenido = `${COLUMNAS_PLANTILLA.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')}\n`;
  const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'plantilla_buzon1.csv';
  enlace.click();
  URL.revokeObjectURL(url);
}

function CargaCsv() {
  const { activo, actualizarDatos } = useProyecto();
  const [errores, setErrores] = useState<string[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState('');
  if (!activo) return null;

  const cargar = async (evento: ChangeEvent<HTMLInputElement>) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = ''; // Permite volver a elegir el mismo archivo tras corregirlo.
    if (!archivo) return;
    setMensaje('');
    const { filas, errores: problemas, avisos: alertas } = importarBuzon1(await archivo.text(), activo.segmentacion.areas.map((a) => a.area), hoy());
    setErrores(problemas);
    setAvisos(alertas);
    if (problemas.length > 0) return;
    try {
      let nuevas = 0;
      await actualizarDatos((d) => {
        const buzon1 = fusionarBuzon1(d.buzon1, filas);
        nuevas = buzon1.length - d.buzon1.length;
        return { ...d, buzon1 };
      });
      setMensaje(`Archivo cargado: ${filas.length} respuestas, ${nuevas} nuevas.`);
    } catch {
      setErrores([MENSAJE_SIN_ESPACIO]);
    }
  };

  return (
    <div className={estilos.bloque}>
      <p className={estilos.nota}>
        Sube el CSV de Google Forms tal como sale. La pregunta de área debe titularse "Área", la de grupo (opcional) "Grupo" y cada pregunta debe empezar con su
        código. Las áreas se escriben igual que en la Etapa 0. Si alguna línea tiene un error, no se carga nada; volver a cargar el mismo archivo no duplica respuestas.
        Para la demo hay un <a href="/buzon_prueba.csv" download>buzón de prueba</a> con respuestas inventadas (sus áreas: Producción, Bodega, Despacho y Administración).
      </p>
      <CampoTexto etiqueta="Archivo CSV" explicacion={EX.archivo} type="file" accept=".csv,text/csv" onChange={(e) => void cargar(e)} />
      <p className={estilos.mensaje} aria-live="polite">
        {mensaje}
      </p>
      {avisos.map((a) => (
        <p key={a} className={estilos.aviso} role="status">
          {a}
        </p>
      ))}
      {errores.length > 0 && (
        <ul className={formulario.errores} role="alert">
          {errores.slice(0, MAX_ERRORES_VISIBLES).map((e) => (
            <li key={e}>{e}</li>
          ))}
          {errores.length > MAX_ERRORES_VISIBLES && <li>Y {errores.length - MAX_ERRORES_VISIBLES} errores más.</li>}
        </ul>
      )}
      <table className={estilos.tabla}>
        <caption className={estilos.tituloBloque}>Títulos para las preguntas en Google Forms</caption>
        <tbody>
          {COLUMNAS_PLANTILLA.map((c) => (
            <tr key={c}>
              <td>{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <Boton variante="secundario" onClick={descargarPlantilla}>
          Descargar plantilla
        </Boton>
      </div>
    </div>
  );
}

function ResultadosBuzon1() {
  const { activo, datos, actualizarDatos } = useProyecto();
  if (!activo) return null;
  if (datos.buzon1.length === 0) return <EstadoVacio titulo="Sin respuestas todavía">La participación y las respuestas aparecen cuando registres el buzón.</EstadoVacio>;

  const areas = participacionPorArea(datos.buzon1, activo.segmentacion.areas);
  const total = participacionTotal(datos.buzon1, activo.segmentacion.areas);

  return (
    <div className={estilos.resultados}>
      <section className={estilos.bloque} aria-labelledby="buzon-participacion">
        <h3 id="buzon-participacion" className={estilos.tituloBloque}>
          Participación: {total === null ? '—' : formatearPorcentaje(total)}
        </h3>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Área</th>
              <th scope="col">Respondieron</th>
              <th scope="col">Afectados</th>
              <th scope="col">Participación</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a.area}>
                <th scope="row">{a.area}</th>
                <td className="numero">{a.respondentes}</td>
                <td className="numero">{a.afectados}</td>
                <td className="numero">{a.participacion === null ? '—' : formatearPorcentaje(a.participacion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className={estilos.nota}>
        Las respuestas se muestran sin su área para proteger el anonimato. Úsalas como insumo del mapa de empatía (U4) y del soporte para líderes (U3).
      </p>
      {PREGUNTAS_BUZON1.map((p) => {
        const textos = datos.buzon1.map((r) => r[p.campo]).filter((t) => t.trim());
        return (
          <section key={p.campo} className={estilos.bloque} aria-labelledby={`buzon-${p.campo}`}>
            <h3 id={`buzon-${p.campo}`} className={estilos.tituloBloque}>
              {p.texto} <span className={`${estilos.secundario} numero`}>({textos.length} respuestas)</span>
            </h3>
            {textos.length > 0 && (
              <ul className={estilos.listaTextos}>
                {textos.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
      <BorrarRespuestas
        texto="Borrar todas las respuestas"
        confirmacion="¿Borrar todas las respuestas del buzón 1? No se puede deshacer."
        alBorrar={() => void actualizarDatos((d) => ({ ...d, buzon1: [] }))}
      />
    </div>
  );
}
