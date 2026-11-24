import { useEffect, useState } from 'react';
import { Aviso } from '../../../components/ui/Aviso';
import { useProyecto } from '../../../estado/ProyectoContexto';
import { useSesion } from '../../../estado/SesionContexto';
import { api, ErrorApi } from '../../../lib/api';
import { COPILOTO_VACIO, type EstadoCopiloto, type ModoCopiloto } from '../../../lib/copiloto/tipos';
import estilos from './copiloto.module.css';

/** Lo que cada panel del copiloto necesita saber del modo. */
export interface PropsModo {
  modo: ModoCopiloto;
  /** Cambia al modo simulado (lo ofrece el mensaje de error cuando Gemini falla). */
  usarSimulado(): void;
  /** true dentro de la página de un paso (R1, R2, R5): ahí la tarjeta del copiloto ya explica qué hace. */
  incrustado?: boolean;
}

/**
 * Estado del servidor (¿hay Gemini?, ¿datos reales?) y modo elegido.
 * Solo consulta el servidor cuando `consultar` es true: los líderes, y en un
 * paso, solo al abrir el copiloto.
 */
export function useModoCopiloto(consultar: boolean) {
  const [estado, setEstado] = useState<EstadoCopiloto | null>(null);
  const [errorEstado, setErrorEstado] = useState('');
  const [modo, setModo] = useState<ModoCopiloto>('simulado');

  useEffect(() => {
    if (!consultar || estado) return;
    let vigente = true;
    api.copiloto
      .estado()
      .then((e) => {
        if (!vigente) return;
        setEstado(e);
        setModo(e.gemini.configurado ? 'gemini' : 'simulado');
      })
      .catch((e: unknown) => vigente && setErrorEstado(e instanceof Error ? e.message : 'No se pudo consultar el servidor.'));
    return () => {
      vigente = false;
    };
  }, [consultar, estado]);

  return { estado, errorEstado, modo, setModo, usarSimulado: () => setModo('simulado') };
}

/** El copiloto solo lo usa el equipo de gestión del cambio: trabaja con el buzón, que es confidencial. */
export function useEsLider() {
  const { usuario } = useSesion();
  return usuario?.rol === 'lider';
}

/** Conserva el identificador del buzón de Google Forms; borra informe, conversación, triaje y dossier. */
export function useReiniciarCopiloto() {
  const { actualizarDatos } = useProyecto();
  return () => actualizarDatos((d) => ({ ...d, copiloto: { ...COPILOTO_VACIO, buzonFormsId: d.copiloto.buzonFormsId } }));
}

/** Elegir entre Gemini y el modo simulado. */
export function SelectorModo({ estado, modo, setModo, nombre }: { estado: EstadoCopiloto | null; modo: ModoCopiloto; setModo(m: ModoCopiloto): void; nombre: string }) {
  const gemini = estado?.gemini;
  return (
    <fieldset className={estilos.modo}>
      <legend className={estilos.modoLeyenda}>Modo</legend>
      <label>
        <input type="radio" name={nombre} checked={modo === 'gemini'} disabled={!gemini?.configurado} onChange={() => setModo('gemini')} />
        Gemini{gemini?.modelo ? ` (${gemini.modelo})` : ''}
      </label>
      <label>
        <input type="radio" name={nombre} checked={modo === 'simulado'} onChange={() => setModo('simulado')} />
        Simulado (demo, sin IA)
      </label>
    </fieldset>
  );
}

/** Avisos del servidor: sin conexión, sin Gemini o sin contrato de datos. */
export function AvisosCopiloto({ estado, errorEstado }: { estado: EstadoCopiloto | null; errorEstado: string }) {
  const gemini = estado?.gemini;
  return (
    <>
      {errorEstado && (
        <Aviso tono="peligro" role="alert" titulo="No se pudo consultar el servidor">
          {errorEstado}
        </Aviso>
      )}
      {gemini && !gemini.configurado && (
        <Aviso tono="atencion" titulo={`Gemini no está configurado (falta ${gemini.faltan.join(' y ')})`}>
          Usa el modo simulado para la demo: trabaja con el buzón de prueba y respuestas preparadas por reglas.
        </Aviso>
      )}
      {estado && !estado.datosReales && (
        <Aviso tono="info" titulo="Solo el buzón de prueba sale hacia Gemini" etiquetas={['[Nombres]', '[Correos]', '[Teléfonos]', '[Cédulas]']}>
          Hasta tener un contrato de datos (Ley 1581 y transmisión internacional), el servidor no envía respuestas reales. Los textos salen siempre enmascarados,
          pero el enmascarado automático no detecta todo. Se ocultan:
        </Aviso>
      )}
    </>
  );
}

/** Mensaje de error del copiloto, con el modo simulado a mano cuando Gemini no está o falla. */
export function ErrorCopiloto({ error, usarSimulado }: { error: unknown; usarSimulado(): void }) {
  if (!error) return null;
  const mensaje = error instanceof Error ? error.message : 'Ocurrió un error.';
  const puedeSimular = error instanceof ErrorApi && Boolean(error.detalle.puedeSimular || error.detalle.bloqueado);
  return (
    <Aviso
      tono="peligro"
      role="alert"
      titulo="El copiloto no pudo responder"
      accion={
        puedeSimular && (
          <button type="button" className={estilos.enlaceBoton} onClick={usarSimulado}>
            Usar el modo simulado
          </button>
        )
      }
    >
      {mensaje}
    </Aviso>
  );
}

export function InsigniaModo({ modo, modelo }: { modo: ModoCopiloto; modelo?: string }) {
  return (
    <span className={estilos.insignia} data-modo={modo}>
      {modo === 'gemini' ? `Hecho con Gemini${modelo ? ` · ${modelo}` : ''}` : 'Modo simulado'}
    </span>
  );
}

/** Indicador de espera con el tiempo que lleva, para que se note que sigue trabajando. */
export function Esperando({ texto }: { texto: string }) {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <p className={estilos.esperando} role="status">
      <span className={estilos.puntos} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {texto}
      {segundos >= 3 && <span className={`${estilos.nota} numero`}> · {segundos} s</span>}
    </p>
  );
}
