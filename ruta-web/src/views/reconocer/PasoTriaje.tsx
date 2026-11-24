import { useState, type FormEvent } from 'react';
import { CampoArea } from '../../components/ui/Campo';
import { OpcionesMultiples, OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { Semaforo } from '../../components/ui/Semaforo';
import {
  ALCANCES,
  CRITERIOS_TRIAJE,
  ELEMENTOS_ORGANIZACION,
  NIVELES_COMPLEJIDAD,
  NIVELES_IMPACTO_PERSONAS,
  NIVELES_RIESGO_OPERATIVO,
  PREGUNTAS_TRIAJE,
  RUTAS_TRIAJE,
  type NivelSemaforoTriaje,
  type NivelTriaje,
} from '../../config/formularios/reconocer';
import { REGLAS } from '../../config/reglas';
import { EXPLICACION_TRIAJE as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useBorrador } from '../../hooks/useBorrador';
import { evaluarTriaje } from '../../lib/calculo/triaje';
import type { Triaje } from '../../lib/modelo/proyecto';
import type { AlcanceDespliegue, ElementoOrganizacion, PuntajeTriaje } from '../../lib/modelo/tipos';
import { PieFormulario } from '../etapa0/PieFormulario';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO } from './ayudas';
import estilos from './reconocer.module.css';

const opcionesNivel = (niveles: readonly NivelTriaje[]) =>
  niveles.map((n) => ({ valor: String(n.puntaje), texto: `${n.nombre} (${n.puntaje} ${n.puntaje === 1 ? 'punto' : 'puntos'}): ${n.descripcion}` }));

const NIVELES_SEMAFORO: readonly NivelSemaforoTriaje[] = ['verde', 'amarillo', 'rojo'];

/** R2: triaje del cambio. Puntúa 3 criterios de 1 a 3 y asigna la ruta con el semáforo. */
export function PasoTriaje() {
  const { datos, actualizarDatos } = useProyecto();
  const [error, setError] = useState('');
  const { borrador, editar, confirmar, estado } = useBorrador<Triaje>(datos.triaje, async (triaje) =>
    actualizarDatos((d) => ({
      ...d,
      triaje: {
        ...triaje,
        por_que_ahora: triaje.por_que_ahora.trim(),
        poblacion_afectada: triaje.poblacion_afectada.trim(),
        dimension_tecnica: triaje.dimension_tecnica.trim(),
      },
    })),
  );
  const campo = <K extends keyof Triaje>(clave: K, valor: Triaje[K]) => editar((t) => ({ ...t, [clave]: valor }));

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError('');
    try {
      await confirmar();
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
    }
  };

  const resultado = evaluarTriaje(borrador, REGLAS.triaje);
  const nivelComplejidad = NIVELES_COMPLEJIDAD.find((n) => n.puntaje === resultado.complejidad);

  return (
    <form className={formulario.formulario} onSubmit={(e) => void enviar(e)}>
      <section className={estilos.bloque} aria-labelledby="triaje-preguntas">
        <h3 id="triaje-preguntas" className={estilos.tituloBloque}>
          1. Preguntas orientadoras
        </h3>
        {(Object.keys(PREGUNTAS_TRIAJE) as (keyof typeof PREGUNTAS_TRIAJE)[]).map((clave) => (
          <CampoArea
            key={clave}
            etiqueta={`${PREGUNTAS_TRIAJE[clave].nombre}: ${PREGUNTAS_TRIAJE[clave].pregunta}`}
            value={borrador[clave]}
            onChange={(e) => campo(clave, e.target.value)}
          />
        ))}
      </section>

      <section className={estilos.bloque} aria-labelledby="triaje-evaluacion">
        <h3 id="triaje-evaluacion" className={estilos.tituloBloque}>
          2. Evaluación (de 1 a 3 puntos)
        </h3>
        <p className={estilos.nota}>El equipo de gestión del cambio aplica la matriz rápida de puntuación.</p>
        <div className={estilos.preguntas}>
          <OpcionesRespuesta
            etiqueta={`${CRITERIOS_TRIAJE.impacto_personas.nombre}. ${CRITERIOS_TRIAJE.impacto_personas.pregunta}`}
            disposicion="lista"
            opciones={opcionesNivel(NIVELES_IMPACTO_PERSONAS)}
            valor={borrador.impacto_personas === null ? '' : String(borrador.impacto_personas)}
            alCambiar={(v) => campo('impacto_personas', Number(v) as PuntajeTriaje)}
          />
          <div className={estilos.bloque}>
            <OpcionesMultiples
              etiqueta={`${CRITERIOS_TRIAJE.complejidad.nombre}. ${CRITERIOS_TRIAJE.complejidad.pregunta}`}
              maximo={ELEMENTOS_ORGANIZACION.length}
              opciones={ELEMENTOS_ORGANIZACION.map((e) => ({ valor: e.valor, texto: e.nombre }))}
              valores={borrador.elementos}
              alCambiar={(v) => campo('elementos', v as ElementoOrganizacion[])}
            />
            <p className={estilos.nota} aria-live="polite">
              {nivelComplejidad
                ? `${nivelComplejidad.nombre} (${nivelComplejidad.puntaje} ${nivelComplejidad.puntaje === 1 ? 'punto' : 'puntos'}): ${nivelComplejidad.descripcion}`
                : EX.elementos}
            </p>
          </div>
          <OpcionesRespuesta
            etiqueta={`${CRITERIOS_TRIAJE.riesgo_operativo.nombre}. ${CRITERIOS_TRIAJE.riesgo_operativo.pregunta}`}
            disposicion="lista"
            opciones={opcionesNivel(NIVELES_RIESGO_OPERATIVO)}
            valor={borrador.riesgo_operativo === null ? '' : String(borrador.riesgo_operativo)}
            alCambiar={(v) => campo('riesgo_operativo', Number(v) as PuntajeTriaje)}
          />
          <div className={estilos.bloque}>
            <OpcionesRespuesta
              etiqueta={`${CRITERIOS_TRIAJE.alcance.nombre}. ${CRITERIOS_TRIAJE.alcance.pregunta}`}
              opciones={ALCANCES.map((a) => ({ valor: a.valor, texto: a.nombre }))}
              valor={borrador.alcance ?? ''}
              alCambiar={(v) => campo('alcance', v as AlcanceDespliegue)}
            />
            <p className={estilos.nota}>{EX.alcance}</p>
          </div>
        </div>
      </section>

      <section className={estilos.bloque} aria-labelledby="triaje-ruta">
        <h3 id="triaje-ruta" className={estilos.tituloBloque}>
          3. Caracterización y asignación de ruta
        </h3>
        <p className={estilos.mensaje} aria-live="polite">
          {resultado.total === null || !resultado.nivel ? (
            'Puntúa los tres criterios para ver la ruta.'
          ) : (
            <>
              Puntaje total: <span className="numero">{resultado.total}</span> de 9.{' '}
              <Semaforo estado={resultado.nivel} texto={RUTAS_TRIAJE[resultado.nivel].clasificacion} />
            </>
          )}
        </p>
        <div className={estilos.desplazable}>
          <table className={estilos.tabla}>
            <thead>
              <tr>
                <th scope="col">Semáforo</th>
                <th scope="col">Puntaje</th>
                <th scope="col">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {NIVELES_SEMAFORO.map((n) => (
                <tr key={n} aria-current={resultado.nivel === n ? 'true' : undefined} data-actual={resultado.nivel === n}>
                  <th scope="row">
                    <Semaforo estado={n} texto={RUTAS_TRIAJE[n].clasificacion} />
                  </th>
                  <td className="numero">{RUTAS_TRIAJE[n].rango}</td>
                  <td>{RUTAS_TRIAJE[n].descripcion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <PieFormulario estado={estado} />
    </form>
  );
}
