import { useState } from 'react';
import { Aviso } from '../../../components/ui/Aviso';
import { Boton } from '../../../components/ui/Boton';
import { Semaforo } from '../../../components/ui/Semaforo';
import { ALCANCES, ELEMENTOS_ORGANIZACION, RUTAS_TRIAJE } from '../../../config/formularios/reconocer';
import { REGLAS } from '../../../config/reglas';
import { useProyecto } from '../../../estado/ProyectoContexto';
import { api } from '../../../lib/api';
import { evaluarTriaje } from '../../../lib/calculo/triaje';
import { aplicarTriaje, contextoCopiloto, revisarSensatez } from '../../../lib/copiloto/logica';
import { normalizarPropuestaTriaje } from '../../../lib/copiloto/normalizar';
import estilos from './copiloto.module.css';
import { useRuta } from '../../../navegacion/RutaContexto';
import { ErrorCopiloto, Esperando, InsigniaModo, type PropsModo } from './comun';

/** Paso 2 de 4: triaje (R2). El copiloto propone y justifica; la suma y el semáforo salen de evaluarTriaje. */
export function PanelTriaje({ modo, usarSimulado, incrustado }: PropsModo) {
  const { activo, datos, actualizarDatos } = useProyecto();
  const { enlace } = useRuta();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [mensaje, setMensaje] = useState('');
  if (!activo) return null;

  const guardada = datos.copiloto.triaje;
  const proponer = async () => {
    setOcupado(true);
    setError(null);
    setMensaje('');
    try {
      const r = await api.copiloto.triaje(modo, contextoCopiloto(activo, datos, REGLAS.triaje));
      const propuesta = normalizarPropuestaTriaje(r.propuesta);
      if (!propuesta) throw new Error('El copiloto devolvió una propuesta vacía. Inténtalo de nuevo.');
      await actualizarDatos((d) => ({ ...d, copiloto: { ...d.copiloto, triaje: { propuesta, modo: r.modo, modelo: r.modelo, fecha: new Date().toISOString() } } }));
    } catch (e) {
      setError(e);
    } finally {
      setOcupado(false);
    }
  };

  const pasarAR2 = async () => {
    if (!guardada) return;
    await actualizarDatos((d) => ({ ...d, triaje: aplicarTriaje(d.triaje, guardada.propuesta) }));
    setMensaje('Triaje pasado a R2. Puedes ajustar cada puntaje en el formulario del triaje.');
  };

  const lienzoVacio = !datos.lienzo.afectados && !datos.lienzo.vision && datos.lienzo.urgencia.every((u) => !u.motivo);

  return (
    <div className={estilos.panel}>
      {!incrustado && (
        <p className={estilos.nota}>
          <strong>Paso 2 de 4 · Triaje.</strong> El copiloto propone un puntaje para cada criterio a partir del lienzo (R1), con su fuente y qué dato lo haría
          cambiar. La app suma y asigna la ruta. Después, el buzón puede proponer ajustes si el semáforo resulta optimista.
        </p>
      )}
      {lienzoVacio && (
        <Aviso
          tono="atencion"
          titulo="El lienzo (R1) está vacío"
          accion={<a href={enlace({ pagina: 'etapa', etapaId: 'etapa-r', pasoId: 'R1' })}>Ir a R1 Lienzo del cambio →</a>}
        >
          Sin lienzo, la propuesta tendrá poco sustento. Complétalo primero, a mano o con el copiloto (paso 1).
        </Aviso>
      )}
      <div className={estilos.acciones}>
        <Boton onClick={() => void proponer()} disabled={ocupado}>
          {guardada ? 'Volver a proponer' : 'Proponer el triaje'}
        </Boton>
        {guardada && (
          <Boton variante="secundario" onClick={() => void pasarAR2()} disabled={ocupado}>
            Pasar a R2
          </Boton>
        )}
        {guardada && <InsigniaModo modo={guardada.modo} modelo={guardada.modelo} />}
      </div>
      {ocupado && <Esperando texto="El copiloto está revisando el lienzo…" />}
      <ErrorCopiloto error={error} usarSimulado={usarSimulado} />
      <p className={estilos.nota} aria-live="polite">
        {mensaje}
      </p>
      {guardada && <Propuesta />}
    </div>
  );
}

function Propuesta() {
  const { datos } = useProyecto();
  const guardada = datos.copiloto.triaje;
  if (!guardada) return null;
  const p = guardada.propuesta;
  const triaje = aplicarTriaje(datos.triaje, p);
  const r = evaluarTriaje(triaje, REGLAS.triaje);
  const elementos = triaje.elementos.map((e) => ELEMENTOS_ORGANIZACION.find((x) => x.valor === e)?.nombre ?? e);
  const sensatez = revisarSensatez(r.nivel, datos.copiloto.informe?.resultado.informe ?? null);
  const alcance = ALCANCES.find((a) => a.valor === p.alcance)?.nombre ?? 'Sin dato';

  const tarjetas = [
    { nombre: 'Impacto en las personas', puntaje: r.impacto_personas, detalle: p.impacto_personas },
    {
      nombre: 'Complejidad organizacional',
      puntaje: r.complejidad,
      detalle: { ...p.complejidad, justificacion: `${elementos.length} ${elementos.length === 1 ? 'elemento' : 'elementos'}: ${elementos.join(', ') || 'ninguno'}. ${p.complejidad.justificacion}` },
    },
    { nombre: 'Riesgo operativo', puntaje: r.riesgo_operativo, detalle: p.riesgo_operativo },
  ];

  return (
    <div className={estilos.panel}>
      <div className={estilos.criterios}>
        {tarjetas.map((t) => (
          <article key={t.nombre} className={estilos.criterio}>
            <strong>
              {t.nombre}: {t.puntaje ?? '—'}
            </strong>
            <span>{t.detalle.justificacion}</span>
            <span className={estilos.nota}>Fuente: {t.detalle.fuente || 'sin fuente'}</span>
            <span className={estilos.nota}>Lo cambiaría: {t.detalle.cambiaria || '—'}</span>
          </article>
        ))}
      </div>
      {r.total !== null && r.nivel !== null ? (
        <p>
          <strong className="numero">
            {r.impacto_personas} + {r.complejidad} + {r.riesgo_operativo} = {r.total}
          </strong>{' '}
          <Semaforo estado={r.nivel} texto={`${RUTAS_TRIAJE[r.nivel].clasificacion} (${RUTAS_TRIAJE[r.nivel].rango})`} />
        </p>
      ) : (
        <Aviso tono="atencion" titulo="Falta algún puntaje para sumar">
          Revisa la propuesta o complétalo en R2.
        </Aviso>
      )}
      {r.nivel && <p className={estilos.nota}>{RUTAS_TRIAJE[r.nivel].descripcion}</p>}
      <p className={estilos.nota}>Alcance de despliegue (informativo, sin puntaje): {alcance}.</p>
      {sensatez && (
        <Aviso tono="atencion" role="status" titulo="Revisa si la ruta cuadra con el buzón">
          {sensatez}
        </Aviso>
      )}
    </div>
  );
}
