import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { CRITERIOS_PULSO, ESCALA_1_A_5, FORMATOS_COMUNICACION, type IdCriterioPulso } from '../../config/transformar';
import { useEnvio, useRegistros } from '../../hooks/useRegistros';
import { api, formatearFechaVista, type RegistroPulso } from '../../lib/api';
import { formatoPromedio, promedioDe } from '../../lib/transformar/victorias';
import formulario from '../etapa0/formulario.module.css';
import { MensajeEnvio } from './MensajeEnvio';
import estilos from './etapaT.module.css';

const OPCIONES = ESCALA_1_A_5.map((n) => ({ valor: n, texto: n }));
type Respuestas = Record<IdCriterioPulso, string>;
const VACIAS: Respuestas = { claridad: '', utilidad: '', confianza: '' };

/**
 * T1 · Reacción. Encuesta de pulso al cerrar cada sesión (3 preguntas, 1 a 5).
 * Cada persona responde; el líder ve el promedio por sesión.
 */
export function Comunicacion({ esLider }: { esLider: boolean }) {
  const { estado: lectura, recargar } = useRegistros<{ registros: RegistroPulso[] }>('pulso');
  const { estado, enviar, limpiar } = useEnvio();
  const [sesion, setSesion] = useState('');
  const [resp, setResp] = useState<Respuestas>(VACIAS);

  const completo = sesion.trim() !== '' && CRITERIOS_PULSO.every((c) => resp[c.id] !== '');

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await enviar(
      () =>
        api.guardarRegistro('pulso', {
          sesion,
          claridad: Number(resp.claridad),
          utilidad: Number(resp.utilidad),
          confianza: Number(resp.confianza),
        }),
      'Gracias, tu respuesta quedó guardada.',
    );
    if (ok) {
      setResp(VACIAS);
      recargar();
    }
  };

  return (
    <div className={estilos.bloques}>
      <p className={estilos.texto}>
        Plan de comunicación: para validar la claridad, utilidad y aceptación de la información compartida en cada espacio de comunicación,
        al cierre de cada sesión o dinámica se aplica esta breve encuesta. Formatos de las sesiones: {FORMATOS_COMUNICACION.join(', ').toLowerCase()}.
      </p>

      <form className={formulario.formulario} onSubmit={guardar} onChange={limpiar}>
        <h3 className={estilos.subtitulo}>Encuesta de pulso</h3>
        <CampoTexto
          etiqueta="Sesión o reunión que acaba de terminar"
          value={sesion}
          maxLength={80}
          onChange={(e) => setSesion(e.target.value)}
          ayuda="Por ejemplo: «Reunión de lanzamiento» o «Demostración en vivo, turno 2»."
        />
        {CRITERIOS_PULSO.map((c) => (
          <OpcionesRespuesta
            key={c.id}
            etiqueta={`${c.criterio}. ${c.pregunta} (1 = nada claro, 5 = muy claro)`}
            opciones={OPCIONES}
            valor={resp[c.id]}
            alCambiar={(v) => setResp((r) => ({ ...r, [c.id]: v }))}
          />
        ))}
        <div className={formulario.pie}>
          <Boton type="submit" disabled={!completo || estado.fase === 'enviando'}>
            Enviar respuesta
          </Boton>
          <MensajeEnvio estado={estado} />
        </div>
      </form>

      <section aria-labelledby="titulo-resultados-pulso">
        <h3 id="titulo-resultados-pulso" className={estilos.subtitulo}>
          {esLider ? 'Resultados por sesión' : 'Tus respuestas'}
        </h3>
        {lectura.fase === 'cargando' && <p role="status">Cargando…</p>}
        {lectura.fase === 'error' && <EstadoVacio titulo="No se pudieron cargar las respuestas">{lectura.mensaje}</EstadoVacio>}
        {lectura.fase === 'listo' &&
          (lectura.datos.registros.length === 0 ? (
            <EstadoVacio titulo="Aún no hay respuestas">Cuando se conteste la primera encuesta, aparece aquí.</EstadoVacio>
          ) : esLider ? (
            <ResumenPorSesion registros={lectura.datos.registros} />
          ) : (
            <ListaPropia registros={lectura.datos.registros} />
          ))}
      </section>
    </div>
  );
}

function ResumenPorSesion({ registros }: { registros: RegistroPulso[] }) {
  const grupos = new Map<string, RegistroPulso[]>();
  for (const r of registros) grupos.set(r.sesion, [...(grupos.get(r.sesion) ?? []), r]);

  return (
    <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Promedios de la encuesta de pulso por sesión">
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th scope="col">Sesión</th>
            <th scope="col">Respuestas</th>
            <th scope="col">Claridad</th>
            <th scope="col">Utilidad</th>
            <th scope="col">Formato/canal</th>
            <th scope="col">Claridad y utilidad</th>
          </tr>
        </thead>
        <tbody>
          {[...grupos.entries()].map(([sesion, filas]) => {
            const claridad = promedioDe(filas.map((f) => f.claridad));
            const utilidad = promedioDe(filas.map((f) => f.utilidad));
            return (
              <tr key={sesion}>
                <th scope="row">{sesion}</th>
                <td className="numero">{filas.length}</td>
                <td className="numero">{formatoPromedio(claridad)}</td>
                <td className="numero">{formatoPromedio(utilidad)}</td>
                <td className="numero">{formatoPromedio(promedioDe(filas.map((f) => f.confianza)))}</td>
                <td className="numero">
                  <strong>{formatoPromedio(promedioDe([claridad ?? 0, utilidad ?? 0]))}</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ListaPropia({ registros }: { registros: RegistroPulso[] }) {
  return (
    <ul className={estilos.lista}>
      {registros.map((r) => (
        <li key={r.id}>
          <strong>{r.sesion}</strong>
          <span className={estilos.apoyo}>
            Claridad {r.claridad} · Utilidad {r.utilidad} · Formato {r.confianza} · {formatearFechaVista(r.creadoEn)}
          </span>
        </li>
      ))}
    </ul>
  );
}
