import { useState } from 'react';
import { Aviso } from '../../../components/ui/Aviso';
import { Boton } from '../../../components/ui/Boton';
import { Semaforo } from '../../../components/ui/Semaforo';
import { ID_COPILOTO } from '../../../config/etapas';
import { CRITERIOS_TRIAJE, RUTAS_TRIAJE } from '../../../config/formularios/reconocer';
import { REGLAS } from '../../../config/reglas';
import { useProyecto } from '../../../estado/ProyectoContexto';
import { api } from '../../../lib/api';
import { evaluarTriaje } from '../../../lib/calculo/triaje';
import {
  aplicarAjustesTriaje,
  aplicarRiesgos,
  claveAjuste,
  contextoCopiloto,
  filasDesdeCopiloto,
  filasParaCopiloto,
  riesgoEnLienzo,
} from '../../../lib/copiloto/logica';
import { normalizarResultadoBuzon } from '../../../lib/copiloto/normalizar';
import type { AjusteRiesgo, AjusteTriaje, InformeBuzon, ResultadoBuzon, SegmentacionInforme } from '../../../lib/copiloto/tipos';
import { fusionarBuzon1 } from '../../../lib/captura/buzon1Csv';
import { useRuta } from '../../../navegacion/RutaContexto';
import { ErrorCopiloto, Esperando, InsigniaModo, type PropsModo } from './comun';
import estilos from './copiloto.module.css';

const PREGUNTA = { p1: 'Falla hoy', p2: 'Preocupa', p3: 'Propone' } as const;
const FECHA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Paso 3 de 4: análisis del buzón (R5). Gemini (o la referencia) clasifica; la app cuenta.
 * Va después del lienzo y el triaje: al analizarlo, el copiloto los compara y propone ajustes.
 */
export function PanelBuzon({ modo, usarSimulado, incrustado }: PropsModo) {
  const { activo, datos, actualizarDatos, actualizar } = useProyecto();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [mensaje, setMensaje] = useState('');
  const [faltantes, setFaltantes] = useState<{ area: string; afectados: number }[]>([]);
  if (!activo) return null;

  const guardado = datos.copiloto.informe;
  const desactualizado = guardado && guardado.resultado.informe.participacion.respuestas !== datos.buzon1.length;

  const cargarPrueba = async () => {
    setError(null);
    setMensaje('');
    try {
      const { empresa, filas } = await api.copiloto.buzonPrueba();
      const { filas: nuevas, areasFaltantes } = filasDesdeCopiloto(filas, activo.segmentacion.areas);
      if (areasFaltantes.length > 0) {
        setFaltantes(empresa.areas.filter((a) => areasFaltantes.includes(a.area)));
        return;
      }
      await actualizarDatos((d) => ({ ...d, buzon1: fusionarBuzon1(d.buzon1, nuevas) }));
      setFaltantes([]);
      setMensaje(`Buzón de prueba cargado en R5: ${nuevas.length} respuestas inventadas.`);
    } catch (e) {
      setError(e);
    }
  };

  const agregarAreas = async () => {
    await actualizar((p) => ({ ...p, segmentacion: { areas: [...p.segmentacion.areas, ...faltantes] } }));
    setFaltantes([]);
    setMensaje('Áreas agregadas a la Etapa 0. Ahora sí puedes cargar el buzón de prueba.');
  };

  const analizar = async () => {
    setOcupado(true);
    setError(null);
    setMensaje('');
    try {
      const contexto = contextoCopiloto(activo, datos, REGLAS.triaje);
      const resultado = normalizarResultadoBuzon(await api.copiloto.analizarBuzon(modo, filasParaCopiloto(datos.buzon1), activo.segmentacion.areas, contexto));
      if (!resultado) throw new Error('El copiloto no devolvió el informe. Inténtalo de nuevo.');
      await actualizarDatos((d) => ({ ...d, copiloto: { ...d.copiloto, informe: { resultado, fecha: new Date().toISOString(), decididos: [] } } }));
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className={estilos.panel}>
      {!incrustado && (
        <p className={estilos.nota}>
          <strong>Paso 3 de 4 · Buzón.</strong> {modo === 'gemini' ? 'Gemini' : 'La clasificación de referencia'} lee cada respuesta de R5 y le asigna temas,
          sentimiento e intensidad; la app cuenta y calcula los porcentajes. Después lo compara con tu lienzo y tu triaje y te propone ajustes.
        </p>
      )}
      {!guardado &&
        (datos.lienzo.afectados.trim() ? (
          <Aviso tono="info" titulo="Lanza el buzón a los grupos afectados del lienzo">
            {datos.lienzo.afectados}
          </Aviso>
        ) : (
          <Aviso tono="atencion" titulo="Define primero a quién afecta el cambio">
            El buzón se lanza a los grupos afectados que defines en el lienzo (R1, bloque 2). Sin lienzo ni triaje, el copiloto no tendrá con qué comparar el buzón.
          </Aviso>
        ))}
      <div className={estilos.acciones}>
        <Boton onClick={() => void analizar()} disabled={ocupado || datos.buzon1.length === 0}>
          {guardado ? 'Volver a analizar' : `Analizar las ${datos.buzon1.length} respuestas`}
        </Boton>
        <Boton variante="secundario" onClick={() => void cargarPrueba()} disabled={ocupado}>
          Cargar buzón de prueba
        </Boton>
      </div>
      {ocupado && <Esperando texto={`Leyendo ${datos.buzon1.length} respuestas y comparándolas con el lienzo y el triaje…`} />}
      {datos.buzon1.length === 0 && (
        <Aviso tono="atencion" titulo="R5 no tiene respuestas">
          Regístralas en R5 o carga el buzón de prueba. Sin buzón puedes empezar por el lienzo, pero el diagnóstico tendrá menos sustento en la voz de los
          colaboradores.
        </Aviso>
      )}
      {faltantes.length > 0 && (
        <Aviso
          tono="atencion"
          titulo="El buzón de prueba usa áreas que no están en la Etapa 0"
          accion={
            <Boton variante="secundario" onClick={() => void agregarAreas()}>
              Agregar esas áreas a la Etapa 0
            </Boton>
          }
        >
          {faltantes.map((a) => `${a.area} (${a.afectados} afectados)`).join(', ')}.
        </Aviso>
      )}
      <p aria-live="polite" className={estilos.nota}>
        {mensaje}
      </p>
      <ErrorCopiloto error={error} usarSimulado={usarSimulado} />
      {desactualizado && (
        <Aviso tono="atencion" titulo="El buzón cambió desde el último análisis">
          Vuelve a analizarlo para que el informe cuente todas las respuestas.
        </Aviso>
      )}
      {guardado && <Informe resultado={guardado.resultado} fecha={guardado.fecha} />}
      {guardado && <SiguientePaso />}
    </div>
  );
}

/** Informe del buzón: primero lo que hay que saber, después el detalle, y al final cómo se hizo. */
function Informe({ resultado, fecha }: { resultado: ResultadoBuzon; fecha: string }) {
  const { informe } = resultado;
  const p = informe.participacion;
  const principal = informe.temas[0];
  const totalAlertas = informe.alertas.intensas.length + informe.alertas.transversales.length;
  const totalRevision = informe.revision.reduce((s, r) => s + r.cantidad, 0);

  return (
    <article className={estilos.informe} aria-labelledby="titulo-informe">
      <header className={estilos.informeCabeza}>
        <h3 id="titulo-informe" className={estilos.informeTitulo}>
          Informe del buzón
        </h3>
        <span className={estilos.nota}>{FECHA.format(new Date(fecha))}</span>
      </header>

      {/* 1. En cifras */}
      <div className={estilos.cifras}>
        <Cifra etiqueta="Participación" valor={p.porcentaje === null ? '—' : `${p.porcentaje} %`} detalle={p.personas ? `${p.respuestas} de ${p.personas} personas` : `${p.respuestas} respuestas`} />
        <Cifra etiqueta="Tema que más se repite" valor={principal?.tema ?? '—'} detalle={principal ? `${principal.total} menciones` : 'Sin temas'} texto />
        <Cifra etiqueta="Alertas" valor={String(totalAlertas)} detalle={totalAlertas ? 'ver abajo' : 'ninguna'} tono={totalAlertas ? 'atencion' : undefined} />
        <Cifra etiqueta="Revisión humana" valor={String(totalRevision)} detalle={totalRevision === 1 ? 'respuesta' : 'respuestas'} tono={totalRevision ? 'peligro' : undefined} />
      </div>

      {/* 2. Lo que no puede esperar */}
      {informe.revision.length > 0 && (
        <Aviso tono="peligro" titulo={`${totalRevision} ${totalRevision === 1 ? 'respuesta necesita' : 'respuestas necesitan'} revisión humana`}>
          <ul className={estilos.listaAviso}>
            {informe.revision.map((r) => (
              <li key={r.tipo}>
                <strong className="numero">{r.cantidad}</strong> {r.cantidad === 1 ? 'menciona' : 'mencionan'} {r.nombre}
              </li>
            ))}
          </ul>
          <p>Que las revise talento humano o la persona designada. El copiloto no las resuelve.</p>
        </Aviso>
      )}
      {totalAlertas > 0 && (
        <Aviso tono="atencion" titulo="Alertas para tener en cuenta en el lienzo">
          <ul className={estilos.listaAviso}>
            {informe.alertas.intensas.map((a) => (
              <li key={a.tema}>
                <strong>{a.tema}</strong>: {a.casos} {a.casos === 1 ? 'respuesta con' : 'respuestas con'} intensidad fuerte (angustia, enojo o urgencia)
              </li>
            ))}
            {informe.alertas.transversales.map((t) => (
              <li key={`${t.dimension}-${t.tema}`}>
                <strong>{t.tema}</strong>: aparece en {t.segmentos === 2 ? 'los 2' : `los ${t.segmentos}`} {t.dimension === 'grupo' ? 'grupos' : 'áreas'}
              </li>
            ))}
          </ul>
        </Aviso>
      )}

      {/* 3. Lo que el buzón cambia en el lienzo y el triaje */}
      <Ajustes resultado={resultado} />

      {/* 4. La lectura */}
      {informe.lectura.length > 0 && (
        <section className={estilos.lectura} aria-labelledby="titulo-lectura">
          <h4 id="titulo-lectura" className={estilos.subtitulo}>
            Lo que más importa para el cambio
          </h4>
          <ul className={estilos.mdLista}>
            {informe.lectura.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <span className={estilos.nota}>Es una lectura del copiloto (inferencia): confírmala con lo que conoces de la empresa.</span>
        </section>
      )}

      {/* 5. Temas */}
      <section className={estilos.seccion} aria-labelledby="titulo-temas">
        <div>
          <h4 id="titulo-temas" className={estilos.subtitulo}>
            ¿De qué habla la gente?
          </h4>
          <p className={estilos.nota}>
            Porcentaje de quienes respondieron cada pregunta que mencionan el tema: lo que <strong>falla hoy</strong> ({informe.respondidas.p1}) y lo que les{' '}
            <strong>preocupa</strong> del cambio ({informe.respondidas.p2}).
          </p>
        </div>
        <ol className={estilos.temas}>
          {informe.temas.map((t, i) => (
            <li key={t.codigo} className={estilos.tema}>
              <div className={estilos.temaCabeza}>
                <span className={`${estilos.temaPuesto} numero`}>{i + 1}</span>
                <strong>{t.tema}</strong>
              </div>
              <Barra etiqueta="Falla hoy" pct={t.pctP1} n={t.p1} />
              <Barra etiqueta="Preocupa" pct={t.pctP2} n={t.p2} tono="p2" />
              {t.sintesis && <p className={estilos.temaSintesis}>{t.sintesis}</p>}
            </li>
          ))}
        </ol>
      </section>

      {/* 6. Diferencias */}
      <Diferencias informe={informe} />

      {/* 7. Propuestas */}
      {informe.propuestas.length > 0 && (
        <section className={estilos.seccion} aria-labelledby="titulo-propuestas">
          <h4 id="titulo-propuestas" className={estilos.subtitulo}>
            Lo que proponen los colaboradores
          </h4>
          <ul className={estilos.propuestas}>
            {informe.propuestas.map((x) => (
              <li key={x.idea}>
                <span>{x.idea}</span>
                <span className={`${estilos.contador} numero`} title={`${x.menciones} ${x.menciones === 1 ? 'respuesta' : 'respuestas'}`}>
                  {x.menciones}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 8. Cómo se hizo */}
      <ComoSeHizo resultado={resultado} />
    </article>
  );
}

function Cifra({ etiqueta, valor, detalle, tono, texto }: { etiqueta: string; valor: string; detalle: string; tono?: 'atencion' | 'peligro'; texto?: boolean }) {
  return (
    <div className={estilos.cifraTarjeta} data-tono={tono}>
      <span className={estilos.cifraEtiqueta}>{etiqueta}</span>
      <span className={texto ? estilos.cifraTexto : `${estilos.cifra} numero`}>{valor}</span>
      <span className={estilos.nota}>{detalle}</span>
    </div>
  );
}

function Barra({ etiqueta, pct, n, tono }: { etiqueta: string; pct: number | null; n: number; tono?: 'p2' }) {
  const valor = pct ?? 0;
  return (
    <div className={estilos.barraFila}>
      <span className={estilos.barraEtiqueta}>{etiqueta}</span>
      <span className={estilos.barra} aria-hidden="true">
        <span className={estilos.barraRelleno} data-tono={tono} style={{ width: `${Math.min(valor, 100)}%` }} />
      </span>
      <span className={`${estilos.barraValor} numero`}>
        {valor} % <span className={estilos.nota}>({n})</span>
      </span>
    </div>
  );
}

function Diferencias({ informe }: { informe: InformeBuzon }) {
  const dims: { id: string; titulo: string; datos: SegmentacionInforme }[] = [
    { id: 'grupo', titulo: 'Por grupo', datos: informe.diferencias.grupo },
    { id: 'area', titulo: 'Por área', datos: informe.diferencias.area },
  ];
  const hay = dims.some((d) => d.datos.diferencias.length > 0);
  const ocultos = dims.flatMap((d) => d.datos.ocultos);
  return (
    <section className={estilos.seccion} aria-labelledby="titulo-diferencias">
      <div>
        <h4 id="titulo-diferencias" className={estilos.subtitulo}>
          ¿Dónde cambia la mirada?
        </h4>
        <p className={estilos.nota}>Segmentos que mencionan un tema 20 puntos más que el resto. Solo se comparan segmentos de 5 o más respuestas.</p>
      </div>
      {hay ? (
        <ul className={estilos.diferencias}>
          {dims.flatMap((d) =>
            d.datos.diferencias.map((x) => (
              <li key={`${d.id}-${x.segmento}-${x.codigo}`}>
                <span className={estilos.etiquetaSegmento}>{x.segmento}</span>
                <span>
                  <strong>{x.tema}</strong>
                </span>
                <span className="numero">
                  <strong>{x.pctSegmento} %</strong> <span className={estilos.nota}>frente a {x.pctResto} % del resto</span>
                </span>
              </li>
            )),
          )}
        </ul>
      ) : (
        <p>Sin diferencias claras: grupos y áreas dicen cosas parecidas.</p>
      )}
      {ocultos.length > 0 && <p className={estilos.nota}>No se comparan por tener menos de 5 respuestas: {ocultos.join(', ')}.</p>}
    </section>
  );
}

function ComoSeHizo({ resultado }: { resultado: ResultadoBuzon }) {
  const { informe, clasificacion, enmascarados, modo, modelo } = resultado;
  const totalEnmascarados = enmascarados.correo + enmascarados.telefono + enmascarados.cedula + enmascarados.persona;
  return (
    <details className={estilos.auditoria}>
      <summary>Cómo se hizo este análisis</summary>
      <div className={estilos.auditoriaCuerpo}>
        <div className={estilos.acciones}>
          <InsigniaModo modo={modo} modelo={modelo} />
          <span className={estilos.nota}>
            {informe.clasificadas} respuestas clasificadas · {totalEnmascarados} datos personales enmascarados antes de enviar
          </span>
        </div>
        <ul className={estilos.mdLista}>
          {informe.limites.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <details className={estilos.auditoria}>
          <summary>Ver la clasificación de cada respuesta ({clasificacion.length})</summary>
          <p className={estilos.nota}>Textos enmascarados y sin área ni grupo.</p>
          <div className={estilos.mdTablaCaja}>
            <table className={estilos.tabla}>
              <thead>
                <tr>
                  <th scope="col">Pregunta</th>
                  <th scope="col">Texto</th>
                  <th scope="col">Temas</th>
                  <th scope="col">Sentimiento</th>
                  <th scope="col">Intensidad</th>
                </tr>
              </thead>
              <tbody>
                {clasificacion.map((c) => (
                  <tr key={`${c.id}-${c.pregunta}`}>
                    <td>{PREGUNTA[c.pregunta]}</td>
                    <td>{c.identificable ? <em>No se muestra: permite reconocer a quien escribió.</em> : c.texto}</td>
                    <td>{c.temas.map((t) => (t === 'OTRO' ? `otro: ${c.otro}` : t)).join(', ')}</td>
                    <td>{c.sentimiento}</td>
                    <td className="numero">{c.intensidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </details>
  );
}

/** Cierre del informe: revisar y seguir al dossier. */
function SiguientePaso() {
  const { enlace } = useRuta();
  return (
    <div className={estilos.siguiente}>
      <div>
        <strong>¿El informe refleja lo que conoces de tu empresa?</strong>
        <p className={estilos.nota}>Si algo no cuadra, revisa la clasificación en «Cómo se hizo este análisis». Si cuadra, decide los ajustes y arma el dossier para la etapa U.</p>
      </div>
      <a className={estilos.enlaceBoton} href={enlace({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: ID_COPILOTO })}>
        Siguiente: Dossier →
      </a>
    </div>
  );
}

const NOMBRE_CRITERIO = { impacto_personas: CRITERIOS_TRIAJE.impacto_personas.nombre, riesgo_operativo: CRITERIOS_TRIAJE.riesgo_operativo.nombre };

/**
 * Lo que el buzón cambia en el diagnóstico: riesgos que faltan en el lienzo
 * (R1) y puntajes del triaje (R2) que pueden ser optimistas. La persona marca
 * lo que acepta y lo pasa con un botón; lo que no marca queda descartado.
 */
function Ajustes({ resultado }: { resultado: ResultadoBuzon }) {
  const { datos } = useProyecto();
  const { riesgos, triaje } = resultado.ajustes;
  const hayLienzo = Boolean(datos.lienzo.afectados.trim() || datos.lienzo.vision.trim() || datos.lienzo.riesgos.some((r) => r.trim()));
  const hayTriaje = evaluarTriaje(datos.triaje, REGLAS.triaje).total !== null;

  return (
    <section className={estilos.ajustes} aria-labelledby="titulo-ajustes">
      <div>
        <h4 id="titulo-ajustes" className={estilos.ajustesTitulo}>
          Lo que el buzón cambia en tu diagnóstico
        </h4>
        <p className={estilos.nota}>
          El copiloto comparó el buzón con tu lienzo (R1) y tu triaje (R2). Marca lo que aceptas y pásalo; lo que no marques queda descartado.
        </p>
      </div>
      {riesgos.length + triaje.length === 0 ? (
        <p className={estilos.ajustesOk}>
          {hayLienzo || hayTriaje
            ? 'El buzón confirma tu lienzo y tu triaje: no hay ajustes que proponer.'
            : 'Sin lienzo ni triaje no hay con qué comparar. Complétalos (pasos 1 y 2) y vuelve a analizar el buzón.'}
        </p>
      ) : (
        <div className={estilos.ajustesRejilla}>
          <AjustesLienzo riesgos={riesgos} />
          <AjustesTriaje ajustes={triaje} hayTriaje={hayTriaje} />
        </div>
      )}
    </section>
  );
}

/** Marca de aceptar o descartar, y lo ya decidido. */
function useDecisiones<T extends AjusteRiesgo | AjusteTriaje>(items: readonly T[], aplicado: (x: T) => boolean) {
  const { datos, actualizarDatos } = useProyecto();
  const decididos = new Set(datos.copiloto.informe?.decididos ?? []);
  const pendientes = items.filter((x) => !decididos.has(claveAjuste(x)) && !aplicado(x));
  const [desmarcados, setDesmarcados] = useState<Set<string>>(new Set());
  const marcados = pendientes.filter((x) => !desmarcados.has(claveAjuste(x)));
  const alternar = (x: T) =>
    setDesmarcados((s) => {
      const n = new Set(s);
      const k = claveAjuste(x);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  const pasados = items.filter((x) => aplicado(x)).length;
  const descartados = items.filter((x) => decididos.has(claveAjuste(x)) && !aplicado(x)).length;
  /** Aplica los marcados y deja todos los pendientes como decididos. */
  const resolver = (cambio: Parameters<typeof actualizarDatos>[0]) =>
    actualizarDatos((d) => {
      const conCambio = cambio(d);
      const inf = conCambio.copiloto.informe;
      if (!inf) return conCambio;
      const nuevos = pendientes.map(claveAjuste);
      return { ...conCambio, copiloto: { ...conCambio.copiloto, informe: { ...inf, decididos: [...new Set([...inf.decididos, ...nuevos])] } } };
    });
  return { pendientes, marcados, alternar, marcado: (x: T) => !desmarcados.has(claveAjuste(x)), pasados, descartados, resolver };
}

function Resueltos({ pasados, descartados, destino }: { pasados: number; descartados: number; destino: string }) {
  if (pasados + descartados === 0) return null;
  return (
    <p className={estilos.nota}>
      {[pasados > 0 && `✓ ${pasados} en ${destino}`, descartados > 0 && `${descartados} ${descartados === 1 ? 'descartado' : 'descartados'}`].filter(Boolean).join(' · ')}
    </p>
  );
}

function AjustesLienzo({ riesgos }: { riesgos: readonly AjusteRiesgo[] }) {
  const { datos } = useProyecto();
  const d = useDecisiones(riesgos, (r) => riesgoEnLienzo(datos.lienzo, r.riesgo));
  const pasar = () => d.resolver((x) => ({ ...x, lienzo: aplicarRiesgos(x.lienzo, d.marcados) }));

  return (
    <article className={estilos.ajusteTarjeta}>
      <span className={estilos.ajusteDestino}>R1 · Lienzo, bloque 7</span>
      <h5 className={estilos.ajusteTitulo}>Riesgos que faltan</h5>
      {riesgos.length === 0 ? (
        <p className={estilos.nota}>El lienzo ya recoge los riesgos que muestra el buzón.</p>
      ) : d.pendientes.length === 0 ? (
        <p className={estilos.nota}>Ya decidiste todos los riesgos propuestos.</p>
      ) : (
        <>
          <ul className={estilos.ajusteLista}>
            {d.pendientes.map((r) => (
              <li key={claveAjuste(r)}>
                <label className={estilos.ajusteOpcion}>
                  <input type="checkbox" checked={d.marcado(r)} onChange={() => d.alternar(r)} />
                  <span>
                    {r.riesgo}
                    {r.fuente && <span className={estilos.ajusteFuente}>{r.fuente}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <Boton onClick={() => void pasar()}>{d.marcados.length ? `Pasar a R1 (${d.marcados.length})` : 'Descartar los riesgos'}</Boton>
        </>
      )}
      <Resueltos pasados={d.pasados} descartados={d.descartados} destino="R1" />
    </article>
  );
}

function AjustesTriaje({ ajustes, hayTriaje }: { ajustes: readonly AjusteTriaje[]; hayTriaje: boolean }) {
  const { datos } = useProyecto();
  const d = useDecisiones(ajustes, (a) => datos.triaje[a.criterio] === a.puntaje);
  const pasar = () => d.resolver((x) => ({ ...x, triaje: aplicarAjustesTriaje(x.triaje, d.marcados) }));
  const hoy = evaluarTriaje(datos.triaje, REGLAS.triaje);
  const conAjustes = evaluarTriaje(aplicarAjustesTriaje(datos.triaje, d.marcados), REGLAS.triaje);
  const ruta = (r: typeof hoy) => (r.nivel ? <Semaforo estado={r.nivel} texto={`${RUTAS_TRIAJE[r.nivel].clasificacion} (${r.total})`} /> : '—');

  return (
    <article className={estilos.ajusteTarjeta}>
      <span className={estilos.ajusteDestino}>R2 · Triaje</span>
      <h5 className={estilos.ajusteTitulo}>¿El semáforo es optimista?</h5>
      {!hayTriaje ? (
        <p className={estilos.nota}>Completa el triaje (paso 2) para que el copiloto revise si el semáforo es optimista.</p>
      ) : ajustes.length === 0 ? (
        <p className={estilos.nota}>El buzón no contradice los puntajes del triaje.</p>
      ) : d.pendientes.length === 0 ? (
        <p className={estilos.nota}>Ya decidiste los ajustes propuestos.</p>
      ) : (
        <>
          <ul className={estilos.ajusteLista}>
            {d.pendientes.map((a) => (
              <li key={claveAjuste(a)}>
                <label className={estilos.ajusteOpcion}>
                  <input type="checkbox" checked={d.marcado(a)} onChange={() => d.alternar(a)} />
                  <span>
                    <strong>
                      {NOMBRE_CRITERIO[a.criterio]}: <span className="numero">{datos.triaje[a.criterio] ?? '—'} → {a.puntaje}</span>
                    </strong>
                    <span className={estilos.ajusteMotivo}>{a.motivo}</span>
                    {a.fuente && <span className={estilos.ajusteFuente}>{a.fuente}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className={estilos.ajusteRuta}>
            <span>Hoy: {ruta(hoy)}</span>
            <span aria-hidden="true">→</span>
            <span>Con lo marcado: {ruta(conAjustes)}</span>
          </div>
          <Boton onClick={() => void pasar()}>{d.marcados.length ? `Pasar a R2 (${d.marcados.length})` : 'Descartar los ajustes'}</Boton>
        </>
      )}
      <Resueltos pasados={d.pasados} descartados={d.descartados} destino="R2" />
    </article>
  );
}
