import { useState, type FormEvent } from 'react';
import { Boton, BotonIcono } from '../../components/ui/Boton';
import { CampoArea } from '../../components/ui/Campo';
import { useProyecto } from '../../estado/ProyectoContexto';
import type { FilaEscuchaInicial } from '../../lib/modelo/tipos';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO } from './ayudas';
import estilos from './reconocer.module.css';

const VACIA = { falla_proceso: '', preocupacion: '', mejora: '' };

export function PasoEscuchaInicial() {
  const { datos, actualizarDatos } = useProyecto();
  const [respuesta, setRespuesta] = useState(VACIA);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError('');
    setMensaje('');
    const respuestaLimpia = {
      falla_proceso: respuesta.falla_proceso.trim(),
      preocupacion: respuesta.preocupacion.trim(),
      mejora: respuesta.mejora.trim(),
    };
    if (!respuestaLimpia.falla_proceso && !respuestaLimpia.preocupacion && !respuestaLimpia.mejora) {
      setError('Responde al menos una pregunta.');
      return;
    }
    const fila: FilaEscuchaInicial = { id: crypto.randomUUID(), ...respuestaLimpia };
    try {
      await actualizarDatos((d) => ({ ...d, escuchaInicial: [...d.escuchaInicial, fila] }));
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
      return;
    }
    setRespuesta(VACIA);
    setMensaje('Respuesta guardada de forma anónima.');
  };

  const quitar = async (id: string) => {
    setError('');
    try {
      await actualizarDatos((d) => ({ ...d, escuchaInicial: d.escuchaInicial.filter((r) => r.id !== id) }));
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
    }
  };

  return (
    <div className={estilos.resultados}>
      <form className={formulario.formulario} onSubmit={(e) => void guardar(e)}>
        <p className={estilos.nota}>
          Esta es una escucha de diagnóstico, no un anuncio de un cambio específico. No escribas nombres ni datos que identifiquen a alguien.
        </p>
        <div className={estilos.preguntas}>
          <CampoArea
            etiqueta="¿Qué es lo que más falla hoy en este proceso?"
            value={respuesta.falla_proceso}
            onChange={(e) => setRespuesta((actual) => ({ ...actual, falla_proceso: e.target.value }))}
          />
          <CampoArea
            etiqueta="¿Qué te preocupa del cambio?"
            ayuda="Puedes compartir inquietudes generales frente a posibles cambios que implemente la organización."
            value={respuesta.preocupacion}
            onChange={(e) => setRespuesta((actual) => ({ ...actual, preocupacion: e.target.value }))}
          />
          <CampoArea
            etiqueta="Si tú decidieras, ¿qué mejorarías?"
            value={respuesta.mejora}
            onChange={(e) => setRespuesta((actual) => ({ ...actual, mejora: e.target.value }))}
          />
        </div>
        {error && <p className={estilos.aviso} role="alert">{error}</p>}
        <div className={formulario.pie}>
          <Boton type="submit">Enviar respuesta</Boton>
          <span className={estilos.mensaje} aria-live="polite">{mensaje}</span>
        </div>
      </form>

      <section className={estilos.bloque} aria-labelledby="respuestas-iniciales">
        <h3 id="respuestas-iniciales" className={estilos.tituloBloque}>
          Respuestas recibidas ({datos.escuchaInicial.length})
        </h3>
        {datos.escuchaInicial.length === 0 ? (
          <p className={estilos.nota}>Todavía no hay respuestas.</p>
        ) : (
          <ol className={estilos.backlog}>
            {datos.escuchaInicial.map((fila, i) => (
              <li key={fila.id}>
                <strong>Respuesta {i + 1}</strong>
                {fila.falla_proceso && <p>Lo que falla hoy: {fila.falla_proceso}</p>}
                {fila.preocupacion && <p>Preocupación: {fila.preocupacion}</p>}
                {fila.mejora && <p>Propuesta: {fila.mejora}</p>}
                <BotonIcono accion="quitar" etiqueta={`Quitar respuesta ${i + 1}`} onClick={() => void quitar(fila.id)} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
