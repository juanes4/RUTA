import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea, CampoTexto } from '../../components/ui/Campo';
import { OpcionesRespuesta } from '../../components/ui/OpcionesRespuesta';
import { CRITERIOS_MRMT, ESCALA_1_A_5, MATRIZ_RECONOCIMIENTO, NOTA_MRMT, RECONOCIMIENTOS } from '../../config/transformar';
import { useEnvio } from '../../hooks/useRegistros';
import { api } from '../../lib/api';
import {
  clasificarMerito,
  criteriosSinEvidencia,
  PUNTAJE_MAXIMO,
  PUNTAJE_MINIMO,
  PUNTAJE_PARA_PUBLICAR,
  totalMrmt,
  type PuntajeCriterio,
} from '../../lib/transformar/victorias';
import formulario from '../etapa0/formulario.module.css';
import { MensajeEnvio } from './MensajeEnvio';
import estilos from './etapaT.module.css';

const OPCIONES = ESCALA_1_A_5.map((n) => ({ valor: n, texto: n }));
const hoy = () => new Date().toISOString().slice(0, 10);

interface Ficha {
  area: string;
  fecha: string;
  cambio: string;
  avance: string;
  participantes: string;
  comoAyuda: string;
}
const FICHA_VACIA = (): Ficha => ({ area: '', fecha: hoy(), cambio: '', avance: '', participantes: '', comoAyuda: '' });
const CRITERIOS_VACIOS = (): Record<string, PuntajeCriterio> => Object.fromEntries(CRITERIOS_MRMT.map((c) => [c.id, { puntaje: null, evidencia: '' }]));
const PUBLICACION_VACIA = () => ({ titulo: '', logramos: '', protagonistas: '', importancia: '', mensaje: '', autorizacion: false });

/**
 * T4 · pasos 1 a 4 en un solo formulario: ficha FIMT (identificar), matriz
 * MRMT (valorar), reconocimiento y formato de publicación (divulgar).
 */
export function FormMerito() {
  const { estado, enviar, limpiar } = useEnvio();
  const [ficha, setFicha] = useState<Ficha>(FICHA_VACIA);
  const [pasa, setPasa] = useState<'si' | 'no' | ''>('');
  const [criterios, setCriterios] = useState(CRITERIOS_VACIOS);
  const [reconocimiento, setReconocimiento] = useState('');
  const [publicar, setPublicar] = useState(false);
  const [pub, setPub] = useState(PUBLICACION_VACIA);

  const total = totalMrmt(criterios);
  const clase = total === null ? null : clasificarMerito(total);
  const accion = MATRIZ_RECONOCIMIENTO.find((m) => m.id === clase);
  const puedePublicar = total !== null && total >= PUNTAJE_PARA_PUBLICAR;
  const faltaEvidencia = criteriosSinEvidencia(criterios);

  const campoFicha = (k: keyof Ficha, valor: string) => setFicha((f) => ({ ...f, [k]: valor }));
  const campoCriterio = (id: string, cambio: Partial<PuntajeCriterio>) =>
    setCriterios((c) => ({ ...c, [id]: { puntaje: c[id]?.puntaje ?? null, evidencia: c[id]?.evidencia ?? '', ...cambio } }));

  const listo =
    pasa !== '' && Object.values(ficha).every((v) => v.trim() !== '') && (pasa === 'no' || (total !== null && faltaEvidencia.length === 0));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const base = { ...ficha, pasaAValoracion: pasa === 'si' };
    const datos =
      pasa === 'si'
        ? { ...base, criterios, reconocimiento, publicar: publicar && puedePublicar, publicacion: publicar && puedePublicar ? pub : undefined }
        : base;
    const ok = await enviar(() => api.guardarRegistro('merito', datos), pasa === 'si' ? 'Mérito registrado.' : 'Ficha registrada. Queda pendiente reunir la evidencia para valorarla.');
    if (ok) {
      setFicha(FICHA_VACIA());
      setPasa('');
      setCriterios(CRITERIOS_VACIOS());
      setReconocimiento('');
      setPublicar(false);
      setPub(PUBLICACION_VACIA());
    }
  };

  return (
    <form className={formulario.formulario} onSubmit={guardar} onChange={limpiar}>
      <section className={estilos.seccionForm} aria-labelledby="titulo-fimt">
        <h3 id="titulo-fimt" className={estilos.subtitulo}>
          1. Identificar · Ficha de Identificación (FIMT)
        </h3>
        <p className={estilos.texto}>Registra el avance en pocas líneas.</p>
        <div className={formulario.rejilla}>
          <CampoTexto etiqueta="Empresa / área" value={ficha.area} maxLength={120} onChange={(e) => campoFicha('area', e.target.value)} />
          <CampoTexto etiqueta="Fecha" type="date" value={ficha.fecha} onChange={(e) => campoFicha('fecha', e.target.value)} />
          <CampoTexto etiqueta="Cambio en implementación" value={ficha.cambio} maxLength={200} onChange={(e) => campoFicha('cambio', e.target.value)} />
        </div>
        <CampoArea etiqueta="¿Qué avance se logró?" value={ficha.avance} maxLength={1000} onChange={(e) => campoFicha('avance', e.target.value)} />
        <CampoArea etiqueta="¿Quiénes participaron?" value={ficha.participantes} maxLength={500} onChange={(e) => campoFicha('participantes', e.target.value)} />
        <CampoArea etiqueta="¿Cómo ayuda al cambio?" value={ficha.comoAyuda} maxLength={1000} onChange={(e) => campoFicha('comoAyuda', e.target.value)} />
        <OpcionesRespuesta
          etiqueta="¿Pasa a valoración?"
          opciones={[
            { valor: 'si', texto: 'Sí' },
            { valor: 'no', texto: 'No, falta evidencia' },
          ]}
          valor={pasa}
          alCambiar={(v) => setPasa(v as 'si' | 'no')}
        />
      </section>

      {pasa === 'si' && (
        <>
          <section className={estilos.seccionForm} aria-labelledby="titulo-mrmt">
            <h3 id="titulo-mrmt" className={estilos.subtitulo}>
              2. Valorar · Matriz de Valoración (MRMT)
            </h3>
            <p className={estilos.texto}>{NOTA_MRMT}</p>
            {CRITERIOS_MRMT.map((c) => {
              const f = criterios[c.id];
              const pide = (f?.puntaje ?? 0) >= 4;
              return (
                <div key={c.id} className={estilos.criterio}>
                  <p className={estilos.dimension}>{c.dimension}</p>
                  <OpcionesRespuesta
                    etiqueta={`${c.criterio}. ${c.valora} ${c.pregunta}`}
                    opciones={OPCIONES}
                    valor={f?.puntaje === null || f?.puntaje === undefined ? '' : String(f.puntaje)}
                    alCambiar={(v) => campoCriterio(c.id, { puntaje: Number(v) })}
                  />
                  {pide && (
                    <CampoTexto
                      etiqueta={`Evidencia de «${c.criterio}» (obligatoria con 4 o 5)`}
                      value={f?.evidencia ?? ''}
                      maxLength={500}
                      onChange={(e) => campoCriterio(c.id, { evidencia: e.target.value })}
                    />
                  )}
                </div>
              );
            })}
            <p className={estilos.total} role="status">
              <span>
                TOTAL ({PUNTAJE_MINIMO}–{PUNTAJE_MAXIMO}):
              </span>{' '}
              <strong className="numero">{total ?? '—'}</strong>
              {accion && (
                <span>
                  {' '}
                  · {accion.clasificacion}. {accion.queHacer}
                </span>
              )}
            </p>
            {faltaEvidencia.length > 0 && <p className={estilos.mensajeError}>Falta la evidencia de: {faltaEvidencia.join(', ')}.</p>}
          </section>

          <section className={estilos.seccionForm} aria-labelledby="titulo-reconocer">
            <h3 id="titulo-reconocer" className={estilos.subtitulo}>
              3. Reconocer
            </h3>
            <OpcionesRespuesta
              etiqueta="¿Cómo se reconoció a las personas o equipos?"
              opciones={[{ valor: '', texto: 'Aún no' }, ...RECONOCIMIENTOS.map((r) => ({ valor: r.id, texto: r.texto }))]}
              valor={reconocimiento}
              alCambiar={setReconocimiento}
            />
          </section>

          <section className={estilos.seccionForm} aria-labelledby="titulo-divulgar">
            <h3 id="titulo-divulgar" className={estilos.subtitulo}>
              4. Divulgar · Formato de publicación
            </h3>
            {!puedePublicar ? (
              <p className={estilos.texto}>
                {total === null
                  ? `Califica los ocho criterios para saber si el mérito se puede publicar (desde ${PUNTAJE_PARA_PUBLICAR} puntos).`
                  : `Con ${total} puntos el mérito está en desarrollo: se agradece el esfuerzo, se da apoyo y se revisa de nuevo más adelante. No se publica.`}
              </p>
            ) : (
              <>
                <label className={estilos.casilla}>
                  <input type="checkbox" checked={publicar} onChange={(e) => setPublicar(e.target.checked)} />
                  Publicar este mérito ({clase === 'destacado' ? 'se recomienda publicar' : 'publicar si se desea'})
                </label>
                {publicar && (
                  <>
                    <p className={estilos.texto}>
                      Esta plantilla mantiene una misma identidad visual y narrativa en todas las piezas. Destaca el resultado, sus protagonistas y el impacto
                      positivo que aporta a la consolidación del cambio.
                    </p>
                    <CampoTexto etiqueta="Título: nombre breve y llamativo del mérito" value={pub.titulo} maxLength={80} onChange={(e) => setPub((p) => ({ ...p, titulo: e.target.value }))} />
                    <CampoArea etiqueta="¿Qué logramos? Descripción del avance (2 a 3 líneas)" value={pub.logramos} maxLength={400} onChange={(e) => setPub((p) => ({ ...p, logramos: e.target.value }))} />
                    <CampoTexto etiqueta="Protagonistas: personas o equipos" value={pub.protagonistas} maxLength={300} onChange={(e) => setPub((p) => ({ ...p, protagonistas: e.target.value }))} />
                    <CampoArea etiqueta="¿Por qué es importante? Cómo ayuda al cambio" value={pub.importancia} maxLength={400} onChange={(e) => setPub((p) => ({ ...p, importancia: e.target.value }))} />
                    <CampoTexto etiqueta="Mensaje de reconocimiento: una frase de agradecimiento" value={pub.mensaje} maxLength={200} onChange={(e) => setPub((p) => ({ ...p, mensaje: e.target.value }))} />
                    <label className={estilos.casilla}>
                      <input type="checkbox" checked={pub.autorizacion} onChange={(e) => setPub((p) => ({ ...p, autorizacion: e.target.checked }))} />
                      Las personas o equipos protagonistas autorizaron la publicación
                    </label>
                  </>
                )}
              </>
            )}
          </section>
        </>
      )}

      <div className={formulario.pie}>
        <Boton type="submit" disabled={!listo || estado.fase === 'enviando'}>
          Guardar
        </Boton>
        <MensajeEnvio estado={estado} />
      </div>
    </form>
  );
}
