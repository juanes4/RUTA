import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { AFIRMACIONES_TERMOMETRO, ESCALA_1_A_5, ESCALERA, META_TERMOMETRO, MIN_GRUPO_TERMOMETRO } from '../../config/transformar';
import { useEnvio, useRegistros } from '../../hooks/useRegistros';
import { api, type Acuerdo, type CicloTermometro } from '../../lib/api';
import { formatoPromedio } from '../../lib/transformar/victorias';
import formulario from '../etapa0/formulario.module.css';
import { MensajeEnvio } from './MensajeEnvio';
import { SelectorCiclo } from './SelectorCiclo';
import estilos from './etapaT.module.css';

const OPCIONES = ESCALA_1_A_5.map((n) => ({ valor: n, texto: n }));

/**
 * T3 · Momento 3: termómetro de apropiación. Se aplica al cierre de cada ciclo.
 * Es anónimo (no se guarda quién respondió) y el líder solo ve el resultado
 * de un ciclo cuando hay al menos 5 respuestas.
 */
export function Termometro({ esLider }: { esLider: boolean }) {
  const resultados = useRegistros<{ minimo: number; ciclos: CicloTermometro[] }>('termometro', esLider);
  const acuerdos = useRegistros<{ registros: Acuerdo[] }>('acuerdo', esLider);
  const { estado, enviar, limpiar } = useEnvio();
  const [ciclo, setCiclo] = useState(1);
  const [resp, setResp] = useState<string[]>(AFIRMACIONES_TERMOMETRO.map(() => ''));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await enviar(() => api.guardarRegistro('termometro', { ciclo, respuestas: resp.map(Number) }), 'Gracias, tu respuesta anónima quedó guardada.');
    if (ok) {
      setResp(AFIRMACIONES_TERMOMETRO.map(() => ''));
      resultados.recargar();
    }
  };

  const escalonActual =
    acuerdos.estado.fase === 'listo'
      ? [...acuerdos.estado.datos.registros].sort((a, b) => b.ciclo - a.ciclo || (a.momento === 'cierre' ? -1 : 1))[0]
      : undefined;

  return (
    <div className={estilos.bloques}>
      <p className={estilos.texto}>
        Se aplica al cierre de cada ciclo y sirve para identificar qué tanto aplica el cambio el equipo y en qué escalón está. Las respuestas son
        anónimas y se reportan por grupos de al menos {MIN_GRUPO_TERMOMETRO} personas. Escala: 1 es totalmente en desacuerdo y 5 es totalmente de acuerdo.
      </p>

      <form className={formulario.formulario} onSubmit={guardar} onChange={limpiar}>
        <h3 className={estilos.subtitulo}>Termómetro de apropiación</h3>
        <div className={formulario.rejilla}>
          <SelectorCiclo valor={ciclo} alCambiar={setCiclo} />
        </div>
        {AFIRMACIONES_TERMOMETRO.map((a, i) => (
          <OpcionesRespuesta
            key={a}
            etiqueta={a}
            opciones={OPCIONES}
            valor={resp[i] ?? ''}
            alCambiar={(v) => setResp((r) => r.map((x, k) => (k === i ? v : x)))}
          />
        ))}
        <div className={formulario.pie}>
          <Boton type="submit" disabled={resp.some((r) => r === '') || estado.fase === 'enviando'}>
            Enviar respuesta anónima
          </Boton>
          <MensajeEnvio estado={estado} />
        </div>
      </form>

      {esLider && (
        <section aria-labelledby="titulo-resultado-termometro">
          <h3 id="titulo-resultado-termometro" className={estilos.subtitulo}>
            Resultado por ciclo (solo líderes)
          </h3>
          {escalonActual && (
            <p className={estilos.texto}>
              Escalón actual del equipo (ciclo {escalonActual.ciclo}, {escalonActual.momento === 'inicio' ? 'inicio' : 'cierre'}):{' '}
              <strong>
                {escalonActual.nivel}. {ESCALERA[escalonActual.nivel - 1]?.nombre}
              </strong>
              .
            </p>
          )}
          {resultados.estado.fase === 'cargando' && <p role="status">Cargando…</p>}
          {resultados.estado.fase === 'error' && <EstadoVacio titulo="No se pudo cargar el resultado">{resultados.estado.mensaje}</EstadoVacio>}
          {resultados.estado.fase === 'listo' &&
            (resultados.estado.datos.ciclos.length === 0 ? (
              <EstadoVacio titulo="Aún no hay respuestas">Cuando el equipo conteste, aquí aparece el promedio de cada ciclo.</EstadoVacio>
            ) : (
              <ul className={estilos.tarjetasCiclo}>
                {resultados.estado.datos.ciclos.map((c) => (
                  <li key={c.ciclo} className={estilos.tarjetaCiclo}>
                    <h4>Ciclo {c.ciclo}</h4>
                    {c.promedio === null || c.porAfirmacion === null ? (
                      <p className={estilos.texto}>
                        {c.respuestas} {c.respuestas === 1 ? 'respuesta' : 'respuestas'}. Faltan {MIN_GRUPO_TERMOMETRO - c.respuestas} para poder reportar el
                        resultado (mínimo {MIN_GRUPO_TERMOMETRO} personas).
                      </p>
                    ) : (
                      <>
                        <p className={estilos.resultado} data-aprobado={c.promedio >= META_TERMOMETRO}>
                          Promedio del equipo: {formatoPromedio(c.promedio)} de 5 (meta inicial: {formatoPromedio(META_TERMOMETRO)}). {c.promedio >= META_TERMOMETRO ? 'Alcanzó la meta.' : 'Está por debajo de la meta.'}
                        </p>
                        <ul className={estilos.lista}>
                          {AFIRMACIONES_TERMOMETRO.map((a, i) => (
                            <li key={a}>
                              <span>{a}</span>
                              <strong className="numero">{formatoPromedio(c.porAfirmacion?.[i] ?? null)}</strong>
                            </li>
                          ))}
                        </ul>
                        <p className={estilos.apoyo}>{c.respuestas} respuestas</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ))}
        </section>
      )}
    </div>
  );
}
