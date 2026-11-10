import { useRef, useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoSeleccion, CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { Pestanas } from '../../components/ui/Pestanas';
import { ESCALA_KOTTER, KOTTER_PARTE_A, NOMBRE_PASO_KOTTER, type PreguntaKotter } from '../../config/formularios/kotter';
import { REGLAS } from '../../config/reglas';
import { EXPLICACION_KOTTER as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { contarPersonas } from '../../lib/calculo/estadistica';
import { PALABRA_NIVEL, type NivelKotter } from '../../lib/calculo/kotter';
import { filasDeChequeo, type RespuestaKotter } from '../../lib/captura/kotter';
import { formatearValor } from '../../lib/formato';
import { NOMBRE_ROL_KOTTER, type PasoKotter, type RolKotter } from '../../lib/modelo/tipos';
import { resultadosKotter } from '../../lib/reconocer/resultadosKotter';
import formulario from '../etapa0/formulario.module.css';
import { TarjetaDecision } from '../tablero/TarjetaDecision';
import { BorrarRespuestas, hoy, MENSAJE_SIN_ESPACIO } from './ayudas';
import { FormDecision } from './FormDecision';
import estilos from './reconocer.module.css';

/** Un bloque por paso de Kotter, y uno final con la pregunta abierta. */
const BLOQUES: readonly (PasoKotter | null)[] = [...new Set(KOTTER_PARTE_A.map((p) => p.paso))];
const OPCIONES_ESCALA = ESCALA_KOTTER.map((o) => ({ valor: o.valor, texto: o.valor === 'NS' ? o.texto : o.valor }));
const OPCIONES_SI_NO = [
  { valor: 'si', texto: 'Sí' },
  { valor: 'no', texto: 'No' },
];
const LEYENDA_ESCALA = ESCALA_KOTTER.filter((o) => o.puntaje !== null)
  .map((o) => `${o.valor} = ${o.texto.toLowerCase()}`)
  .join(' · ');
const NOMBRE_GRUPO = { direccion: 'Dirección', lider_area: 'Líderes de área', equipo_cambio: 'Equipo de cambio', coalicion: 'Dirección y equipo de cambio' } as const;
const ESTADO_NIVEL: Readonly<Record<NivelKotter, string>> = { bajo: 'bajo', medio: 'medio', alto: 'bien' };

/** R7: chequeo Kotter parte A y recomendación de lanzamiento. */
export function PasoDecision() {
  return (
    <Pestanas
      etiqueta="Decisión de lanzamiento"
      pestanas={[
        { id: 'capturar', etiqueta: 'Registrar chequeo', contenido: <FormKotter /> },
        { id: 'resultados', etiqueta: 'Resultados', contenido: <ResultadosR7 /> },
        { id: 'decision', etiqueta: 'Registrar decisión', contenido: <FormDecision /> },
      ]}
    />
  );
}

interface PropsPregunta {
  pregunta: PreguntaKotter;
  dada: RespuestaKotter;
  alCambiar(cambio: Partial<RespuestaKotter>): void;
}

function Pregunta({ pregunta, dada, alCambiar }: PropsPregunta) {
  const { tipo, texto, opciones, pideEvidencia } = pregunta;
  if (tipo === 'abierta') return <CampoArea etiqueta={texto} value={dada.respuesta} onChange={(e) => alCambiar({ respuesta: e.target.value })} />;
  if (tipo === 'si_no' || tipo === 'si_no_alerta') {
    return (
      <div className={estilos.bloque}>
        <OpcionesRespuesta etiqueta={texto} opciones={OPCIONES_SI_NO} valor={dada.respuesta} alCambiar={(respuesta) => alCambiar({ respuesta })} />
        {dada.respuesta === 'si' && pideEvidencia && (
          <CampoTexto etiqueta={pideEvidencia} ayuda="Sin evidencia, un Sí no cuenta como Sí." value={dada.evidencia} onChange={(e) => alCambiar({ evidencia: e.target.value })} />
        )}
      </div>
    );
  }
  if (tipo === 'escala') return <OpcionesRespuesta etiqueta={texto} opciones={OPCIONES_ESCALA} valor={dada.respuesta} alCambiar={(respuesta) => alCambiar({ respuesta })} />;
  return <OpcionesRespuesta etiqueta={texto} disposicion="lista" opciones={opciones ?? []} valor={dada.respuesta} alCambiar={(respuesta) => alCambiar({ respuesta })} />;
}

function FormKotter() {
  const { actualizarDatos } = useProyecto();
  const [rol, setRol] = useState<RolKotter | ''>('');
  const [respuestas, setRespuestas] = useState<Record<string, RespuestaKotter>>({});
  const [bloque, setBloque] = useState(0);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const inicio = useRef<HTMLFormElement>(null);

  const pasoActual = BLOQUES[bloque] ?? null;
  const preguntas = KOTTER_PARTE_A.filter((p) => p.paso === pasoActual);
  const ultimo = bloque === BLOQUES.length - 1;
  const titulo = pasoActual === null ? 'Cierre' : `Paso ${pasoActual} · ${NOMBRE_PASO_KOTTER[pasoActual]}`;
  const irA = (destino: number) => {
    setBloque(destino);
    inicio.current?.scrollIntoView({ block: 'start' });
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!ultimo) return irA(bloque + 1);
    setMensaje('');
    if (!rol) return setError('Elige el rol de quien responde.');
    const filas = filasDeChequeo(respuestas, rol, crypto.randomUUID(), hoy());
    if (filas.length === 0) return setError('El chequeo está vacío: marca al menos una respuesta.');
    setError('');
    try {
      await actualizarDatos((d) => ({ ...d, kotter: [...d.kotter, ...filas] }));
    } catch {
      return setError(MENSAJE_SIN_ESPACIO);
    }
    setRespuestas({});
    setRol('');
    setMensaje('Chequeo guardado.');
    irA(0);
  };

  return (
    <form ref={inicio} className={formulario.formulario} onSubmit={(e) => void guardar(e)}>
      <p className={estilos.mensaje} aria-live="polite">
        {mensaje}
      </p>
      <div className={formulario.rejilla}>
        <CampoSeleccion etiqueta="Rol de quien responde" explicacion={EX.rol} value={rol} onChange={(e) => setRol(e.target.value as RolKotter | '')}>
          <option value="">Elegir…</option>
          {Object.entries(NOMBRE_ROL_KOTTER).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </CampoSeleccion>
      </div>
      <h3 className={estilos.tituloBloque}>
        {titulo} <span className="numero">({bloque + 1} de {BLOQUES.length})</span>
      </h3>
      <p className={estilos.nota}>Escala: {LEYENDA_ESCALA}.</p>
      <div className={estilos.preguntas}>
        {preguntas.map((p) => (
          <Pregunta
            key={p.id}
            pregunta={p}
            dada={respuestas[p.id] ?? { respuesta: '', evidencia: '' }}
            alCambiar={(cambio) =>
              setRespuestas((r) => ({ ...r, [p.id]: { respuesta: '', evidencia: '', ...r[p.id], ...cambio } }))
            }
          />
        ))}
      </div>
      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <div className={formulario.pie}>
        {bloque > 0 && (
          <Boton variante="secundario" onClick={() => irA(bloque - 1)}>
            Anterior
          </Boton>
        )}
        <Boton type="submit">{ultimo ? 'Guardar chequeo' : 'Siguiente'}</Boton>
      </div>
    </form>
  );
}

function ResultadosR7() {
  const { datos, actualizarDatos } = useProyecto();
  const r = resultadosKotter(datos, REGLAS);
  const minimo = REGLAS.anonimato.minimoKotter;
  const conAlerta = r.brechas.filter((b) => b.alerta);
  const borrable = contarPersonas(datos.kotter.filter((k) => k.parte === 'A')) > 0;

  return (
    <div className={estilos.resultados}>
      <TarjetaDecision decision={r.decision} conEnlace={false} />

      {!r.visible ? (
        <EstadoVacio titulo={`${r.personas} de ${minimo} personas como mínimo`}>
          Con menos de {minimo} personas no se muestran puntajes, para que nadie sea identificable.
        </EstadoVacio>
      ) : (
        <>
          {r.agrupacion.faltanRespuestasDireccion && (
            <p className={estilos.aviso}>La dirección tiene menos de {minimo} respuestas: invita a más personas del comité directivo.</p>
          )}
          {r.agrupacion.modo === 'aproximado' && <p className={estilos.nota}>La comparación es aproximada: un rol con pocas respuestas se unió a otro.</p>}
          {r.agrupacion.modo === 'solo_total' && <p className={estilos.nota}>No hay suficientes respuestas por rol para compararlos: se muestra solo el total.</p>}

          <section className={estilos.bloque} aria-labelledby="titulo-kotter">
            <h3 id="titulo-kotter" className={estilos.tituloBloque}>
              Puntaje por paso de Kotter
            </h3>
            <div className={estilos.desplazable}>
              <table className={estilos.tabla}>
                <thead>
                  <tr>
                    <th scope="col">Paso</th>
                    <th scope="col">Puntaje</th>
                  </tr>
                </thead>
                <tbody>
                  {r.pasos.map(({ paso, puntaje, nivel }) => (
                    <tr key={paso}>
                      <th scope="row">
                        {paso}. {NOMBRE_PASO_KOTTER[paso]}
                      </th>
                      <td>
                        <span className={`${estilos.celda} numero`} data-estado={nivel ? ESTADO_NIVEL[nivel] : 'sin_dato'}>
                          {puntaje === null ? 'Sin dato' : formatearValor(puntaje, 'escala_1_5')}
                          {nivel && <span className={estilos.marca}>{PALABRA_NIVEL[nivel]}</span>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {conAlerta.length > 0 && (
            <section className={estilos.bloque} aria-labelledby="titulo-brechas">
              <h3 id="titulo-brechas" className={estilos.tituloBloque}>
                Brechas entre roles
              </h3>
              <ul className={estilos.backlog}>
                {conAlerta.map((b) => (
                  <li key={`${b.paso}-${b.grupoB}`}>
                    Paso {b.paso}: {NOMBRE_GRUPO[b.grupoA]} y {NOMBRE_GRUPO[b.grupoB]} difieren en{' '}
                    <span className="numero">{formatearValor(Math.abs(b.diferencia), 'escala_1_5')}</span> puntos
                    {b.aproximada && ' (aproximada)'}.
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {borrable && (
        <BorrarRespuestas
          texto="Borrar todos los chequeos"
          confirmacion="¿Borrar todos los chequeos Kotter parte A? No se puede deshacer."
          alBorrar={() => void actualizarDatos((d) => ({ ...d, kotter: d.kotter.filter((k) => k.parte !== 'A') }))}
        />
      )}
    </div>
  );
}
