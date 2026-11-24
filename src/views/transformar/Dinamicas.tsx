import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { DINAMICAS, REGLA_DINAMICAS, RUTA_POR_NIVEL, type Dinamica } from '../../config/transformar';
import { useEnvio, useRegistros } from '../../hooks/useRegistros';
import { api, formatearFechaVista, type RegistroDinamica } from '../../lib/api';
import formulario from '../etapa0/formulario.module.css';
import { MensajeEnvio } from './MensajeEnvio';
import { SelectorCiclo } from './SelectorCiclo';
import estilos from './etapaT.module.css';

interface FilaTarea {
  tarea: string;
  sinAyuda: boolean;
  conAyuda: boolean;
}
type Hoja = Record<string, string | FilaTarea[]>;
const TAREAS_VACIAS = (): FilaTarea[] => Array.from({ length: 4 }, () => ({ tarea: '', sinAyuda: false, conAyuda: false }));

const hojaVacia = (d: Dinamica): Hoja => Object.fromEntries(d.hoja.map((c) => [c.id, c.tipo === 'tareas' ? TAREAS_VACIAS() : '']));

/**
 * T3 · Momento 2: dinámicas de equipo. Todas las personas ven el paso a paso;
 * la hoja de trabajo (la evidencia) la registra el líder. Máximo dos por ciclo.
 */
export function Dinamicas({ esLider }: { esLider: boolean }) {
  const guardadas = useRegistros<{ registros: RegistroDinamica[] }>('dinamica', esLider);

  return (
    <div className={estilos.bloques}>
      <p className={estilos.texto}>{REGLA_DINAMICAS}</p>
      <section aria-labelledby="titulo-ruta-nivel">
        <h3 id="titulo-ruta-nivel" className={estilos.subtitulo}>
          Ruta por nivel
        </h3>
        <ul className={estilos.lista}>
          {RUTA_POR_NIVEL.map((r) => (
            <li key={r.nivel}>
              <strong>{r.nivel}:</strong> <span>{r.dinamicas}</span>
            </li>
          ))}
        </ul>
      </section>

      {DINAMICAS.map((d) => (
        <DinamicaDetalle key={d.id} dinamica={d} esLider={esLider} alGuardar={guardadas.recargar} />
      ))}

      {esLider && (
        <section aria-labelledby="titulo-hojas">
          <h3 id="titulo-hojas" className={estilos.subtitulo}>
            Hojas guardadas
          </h3>
          {guardadas.estado.fase === 'cargando' && <p role="status">Cargando…</p>}
          {guardadas.estado.fase === 'error' && <EstadoVacio titulo="No se pudieron cargar las hojas">{guardadas.estado.mensaje}</EstadoVacio>}
          {guardadas.estado.fase === 'listo' &&
            (guardadas.estado.datos.registros.length === 0 ? (
              <EstadoVacio titulo="Aún no hay hojas">Cuando guardes la primera, queda aquí como evidencia.</EstadoVacio>
            ) : (
              <ul className={estilos.lista}>
                {guardadas.estado.datos.registros.map((r) => (
                  <li key={r.id}>
                    <strong>
                      {DINAMICAS.find((d) => d.id === r.dinamica)?.nombre ?? r.dinamica} · ciclo {r.ciclo}
                    </strong>
                    <span className={estilos.apoyo}>
                      Guardada por {r.nombre ?? 'un líder'} el {formatearFechaVista(r.creadoEn)}
                    </span>
                  </li>
                ))}
              </ul>
            ))}
        </section>
      )}
    </div>
  );
}

function DinamicaDetalle({ dinamica: d, esLider, alGuardar }: { dinamica: Dinamica; esLider: boolean; alGuardar(): void }) {
  return (
    <details className={estilos.dinamica}>
      <summary className={estilos.resumenDinamica}>
        <span className={estilos.nombreDinamica}>{d.nombre}</span>
        <span className={estilos.etiqueta}>{d.nivel}</span>
      </summary>
      <div className={estilos.cuerpoDinamica}>
        <dl className={estilos.datos}>
          <div>
            <dt>Tiempo</dt>
            <dd>{d.tiempo}</dd>
          </div>
          <div>
            <dt>Grupo</dt>
            <dd>{d.grupo}</dd>
          </div>
          <div>
            <dt>Materiales</dt>
            <dd>{d.materiales}</dd>
          </div>
        </dl>
        <ol className={estilos.pasos}>
          {d.pasos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ol>
        <p className={estilos.guion}>Guión del facilitador: «{d.guion}»</p>
        {esLider ? <FormHoja dinamica={d} alGuardar={alGuardar} /> : <p className={estilos.texto}>La hoja de trabajo la registra el líder del equipo.</p>}
      </div>
    </details>
  );
}

function FormHoja({ dinamica: d, alGuardar }: { dinamica: Dinamica; alGuardar(): void }) {
  const { estado, enviar, limpiar } = useEnvio();
  const [ciclo, setCiclo] = useState(1);
  const [hoja, setHoja] = useState<Hoja>(() => hojaVacia(d));

  const poner = (id: string, valor: string | FilaTarea[]) => setHoja((h) => ({ ...h, [id]: valor }));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (await enviar(() => api.guardarRegistro('dinamica', { dinamica: d.id, ciclo, hoja }), 'Hoja de trabajo guardada.')) {
      setHoja(hojaVacia(d));
      alGuardar();
    }
  };

  return (
    <form className={formulario.formulario} onSubmit={guardar} onChange={limpiar}>
      <h4 className={estilos.subtitulo}>Hoja de trabajo: {d.nombre}</h4>
      <div className={formulario.rejilla}>
        <SelectorCiclo valor={ciclo} alCambiar={setCiclo} />
      </div>
      {d.hoja.map((c) => {
        const valor = hoja[c.id];
        if (c.tipo === 'tareas' && Array.isArray(valor)) {
          return (
            <fieldset key={c.id} className={estilos.tareas}>
              <legend>{c.etiqueta}</legend>
              {valor.map((fila, i) => (
                <div key={i} className={estilos.filaTarea}>
                  <input
                    className={formulario.control}
                    aria-label={`Tarea ${i + 1}`}
                    placeholder={`Tarea ${i + 1}`}
                    value={fila.tarea}
                    maxLength={300}
                    onChange={(e) => poner(c.id, valor.map((f, k) => (k === i ? { ...f, tarea: e.target.value } : f)))}
                  />
                  <label className={estilos.casilla}>
                    <input type="checkbox" checked={fila.sinAyuda} onChange={(e) => poner(c.id, valor.map((f, k) => (k === i ? { ...f, sinAyuda: e.target.checked } : f)))} />
                    Sin ayuda
                  </label>
                  <label className={estilos.casilla}>
                    <input type="checkbox" checked={fila.conAyuda} onChange={(e) => poner(c.id, valor.map((f, k) => (k === i ? { ...f, conAyuda: e.target.checked } : f)))} />
                    Con ayuda
                  </label>
                </div>
              ))}
            </fieldset>
          );
        }
        const texto = typeof valor === 'string' ? valor : '';
        return c.tipo === 'area' ? (
          <CampoArea key={c.id} etiqueta={c.etiqueta} value={texto} maxLength={1000} onChange={(e) => poner(c.id, e.target.value)} ayuda="Un elemento por línea." />
        ) : (
          <CampoTexto key={c.id} etiqueta={c.etiqueta} value={texto} maxLength={300} onChange={(e) => poner(c.id, e.target.value)} />
        );
      })}
      <div className={formulario.pie}>
        <Boton type="submit" disabled={estado.fase === 'enviando'}>
          Guardar hoja
        </Boton>
        <MensajeEnvio estado={estado} />
      </div>
    </form>
  );
}
