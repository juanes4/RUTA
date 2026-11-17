import { useState } from 'react';
import { CampoSeleccion } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { Explicacion } from '../../components/ui/Explicacion';
import { BUZON1_SELECCION, type PreguntaSeleccion } from '../../config/formularios/buzon1';
import { REGLAS } from '../../config/reglas';
import { useProyecto } from '../../estado/ProyectoContexto';
import { porcentajeFavorable, porcentajeNoSe, type ResumenDimension } from '../../lib/calculo/adkar';
import { formatearValor } from '../../lib/formato';
import { NOMBRE_DIMENSION, ORDEN_ADKAR, type FilaRespuesta } from '../../lib/modelo/tipos';
import { conteoOpciones, resultadosBuzon1, type GrupoAdkar } from '../../lib/reconocer/resultadosBuzon1';
import { ListaParticipacion } from '../tablero/ListaParticipacion';
import { BorrarRespuestas } from './ayudas';
import estilos from './reconocer.module.css';

const { umbralBloqueo, alertaNoSe } = REGLAS.adkar;
const porcentaje = (v: number | null) => (v === null ? '—' : formatearValor(v, 'porcentaje'));

function Celda({ grupo, resumen, esBloqueo, nombre }: { grupo: string; resumen: ResumenDimension; esBloqueo: boolean; nombre: string }) {
  const { promedio } = resumen;
  const estado = promedio === null ? 'sin_dato' : promedio < umbralBloqueo ? 'bajo' : 'bien';
  return (
    <Explicacion
      titulo={`${grupo} · ${nombre}`}
      texto={`${resumen.validas} respuestas válidas, ${resumen.noSe} "No sé". Favorable: ${porcentaje(porcentajeFavorable(resumen))}. "No sé": ${porcentaje(porcentajeNoSe(resumen))}.`}
    >
      {() => (
        <span className={`${estilos.celda} numero`} data-estado={estado}>
          {promedio === null ? 'Sin dato' : formatearValor(promedio, 'escala_1_5')}
          {esBloqueo && <span className={estilos.marca}>Bloqueo</span>}
        </span>
      )}
    </Explicacion>
  );
}

function MapaCalor({ grupos }: { grupos: readonly GrupoAdkar[] }) {
  return (
    <section className={estilos.bloque} aria-labelledby="titulo-mapa">
      <h3 id="titulo-mapa" className={estilos.tituloBloque}>
        Mapa de calor ADKAR por grupo
      </h3>
      <ul className={estilos.leyenda}>
        <li>
          <span className={estilos.muestra} data-estado="bien" aria-hidden="true" />
          <span className="numero">{formatearValor(umbralBloqueo, 'escala_1_5')}</span> o más
        </li>
        <li>
          <span className={estilos.muestra} data-estado="bajo" aria-hidden="true" />
          Menos de <span className="numero">{formatearValor(umbralBloqueo, 'escala_1_5')}</span>
        </li>
        <li>"Bloqueo" marca la primera dimensión bajo el umbral: ahí se interviene primero.</li>
      </ul>
      <div className={estilos.desplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Grupo</th>
              {ORDEN_ADKAR.map((d) => (
                <th key={d} scope="col">
                  {NOMBRE_DIMENSION[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <tr key={g.nombre}>
                <th scope="row">
                  {g.nombre}
                  <span className={`${estilos.secundario} numero`}>{g.personas} personas</span>
                </th>
                {ORDEN_ADKAR.map((d) => (
                  <td key={d}>
                    <Celda grupo={g.nombre} nombre={NOMBRE_DIMENSION[d]} resumen={g.perfil[d]} esBloqueo={g.bloqueo === d} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BarrasOpciones({ filas, pregunta }: { filas: readonly FilaRespuesta[]; pregunta: PreguntaSeleccion }) {
  const conteos = conteoOpciones(filas, pregunta);
  const maximo = Math.max(1, ...conteos.map((c) => c.conteo));
  return (
    <section className={estilos.bloque}>
      <h4 className={estilos.tituloBloque}>{pregunta.texto}</h4>
      <ul className={estilos.barras}>
        {conteos.map(({ opcion, conteo }) => (
          <li key={opcion}>
            <span>{opcion}</span>
            <span className={estilos.pista} aria-hidden="true">
              <span className={estilos.relleno} style={{ width: `${(conteo / maximo) * 100}%` }} />
            </span>
            <span className={`${estilos.conteo} numero`}>{conteo}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResultadosBuzon1() {
  const { activo, datos, actualizarDatos } = useProyecto();
  const [grupoElegido, setGrupoElegido] = useState('');
  if (!activo) return null;

  const r = resultadosBuzon1(activo, datos, REGLAS);
  const minimo = REGLAS.anonimato.minimoColaboradores;

  if (r.personas === 0) {
    return <EstadoVacio titulo="Sin respuestas todavía">El mapa de calor, el punto de bloqueo y la participación salen del buzón 1. Digita el papel o carga el CSV.</EstadoVacio>;
  }

  const borrar = (
    <BorrarRespuestas
      texto="Borrar todas las respuestas"
      confirmacion="¿Borrar todas las respuestas del buzón 1? No se puede deshacer."
      alBorrar={() => void actualizarDatos((d) => ({ ...d, respuestas: d.respuestas.filter((f) => f.instrumento !== 'buzon1') }))}
    />
  );

  if (r.grupos.length === 0) {
    return (
      <div className={estilos.resultados}>
        <EstadoVacio titulo={`${r.personas} personas han respondido`}>
          Ningún grupo llega todavía a {minimo} personas, así que no se muestra ningún resultado para proteger el anonimato.
        </EstadoVacio>
        <ListaParticipacion areas={r.participacion} />
        {borrar}
      </div>
    );
  }

  const seleccion = r.grupos.find((g) => g.nombre === grupoElegido);
  const filasOpciones = seleccion ? seleccion.filas : r.grupos.flatMap((g) => g.filas);

  return (
    <div className={estilos.resultados}>
      {r.personasOcultas > 0 && (
        <p className={estilos.nota}>
          <span className="numero">{r.personasOcultas}</span> personas no aparecen: sus grupos no llegan al mínimo de {minimo}.
        </p>
      )}
      <MapaCalor grupos={r.grupos} />

      <section className={estilos.bloque} aria-labelledby="titulo-dimension">
        <h3 id="titulo-dimension" className={estilos.tituloBloque}>
          Favorable y "No sé" por dimensión
        </h3>
        <div className={estilos.desplazable}>
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Dimensión</th>
                <th scope="col">% favorable</th>
                <th scope="col">% "No sé"</th>
                <th scope="col">Alerta</th>
              </tr>
            </thead>
            <tbody>
              {r.porDimension.map((d) => (
                <tr key={d.dimension}>
                  <th scope="row">{NOMBRE_DIMENSION[d.dimension]}</th>
                  <td className="numero">{porcentaje(d.favorable)}</td>
                  <td className="numero">{porcentaje(d.noSe)}</td>
                  <td>{d.alertaNoSe ? `Supera el ${formatearValor(alertaNoSe, 'porcentaje')}: tratar como problema de Conciencia o Conocimiento.` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ListaParticipacion areas={r.participacion} />

      <section className={estilos.bloque} aria-labelledby="titulo-opciones">
        <h3 id="titulo-opciones" className={estilos.tituloBloque}>
          Preocupaciones y forma de aprender
        </h3>
        <div className={estilos.dosColumnas}>
          <CampoSeleccion etiqueta="Grupo" value={grupoElegido} onChange={(e) => setGrupoElegido(e.target.value)}>
            <option value="">Todos los grupos visibles</option>
            {r.grupos.map((g) => (
              <option key={g.nombre}>{g.nombre}</option>
            ))}
          </CampoSeleccion>
        </div>
        <div className={estilos.dosColumnas}>
          {BUZON1_SELECCION.map((p) => (
            <BarrasOpciones key={p.id} filas={filasOpciones} pregunta={p} />
          ))}
        </div>
      </section>
      {borrar}
    </div>
  );
}
