import { useCallback, useEffect, useState } from 'react';
import { Aviso } from '../../components/ui/Aviso';
import { Boton } from '../../components/ui/Boton';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useSesion } from '../../estado/SesionContexto';
import { api, type Colaborador, type EstadoBuzonApp } from '../../lib/api';
import { fusionarBuzon1 } from '../../lib/captura/buzon1Csv';
import { filasDesdeCopiloto } from '../../lib/copiloto/logica';
import estilos from './GestionBuzon.module.css';

const FECHA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });
const fecha = (f: string | null) => (f ? FECHA.format(new Date(`${f}T12:00:00`)) : '');

/**
 * R5 en la app: gestión del cambio abre el buzón y convoca a los colaboradores
 * que hacen parte del cambio. Cada uno responde desde su cuenta, una sola vez y
 * de forma anónima. Mientras está abierto solo se ve cuántos respondieron; al
 * cerrarlo, las respuestas se traen a R5.
 */
export function GestionBuzon() {
  const { usuario } = useSesion();
  const { activo, datos, actualizarDatos } = useProyecto();
  const [estado, setEstado] = useState<EstadoBuzonApp | null>(null);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [elegidos, setElegidos] = useState<Set<number>>(new Set());
  const [sumando, setSumando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const esLider = usuario?.rol === 'lider';
  const idBuzon = activo?.id ?? '';

  const cargar = useCallback(async () => {
    if (!esLider || !idBuzon) return;
    setError('');
    try {
      const [e, c] = await Promise.all([api.buzon.estado(idBuzon), api.buzon.colaboradores()]);
      setEstado(e);
      setColaboradores(c.colaboradores);
      // Para abrir: todos marcados. Para sumar: ninguno (se marcan a mano los que faltan).
      setElegidos(new Set(e.estado ? [] : c.colaboradores.map((x) => x.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el buzón.');
    }
  }, [esLider, idBuzon]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (!activo) return null;
  if (!esLider) {
    return <EstadoVacio titulo="Solo para gestión del cambio">El buzón en la app lo abre y lo cierra el equipo de gestión del cambio (rol líder).</EstadoVacio>;
  }

  const correr = async (accion: () => Promise<void>) => {
    setOcupado(true);
    setError('');
    setMensaje('');
    try {
      await accion();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error.');
    } finally {
      setOcupado(false);
    }
  };

  const areas = activo.segmentacion.areas.map((a) => a.area);
  const convocados = new Set(estado?.idsConvocados ?? []);

  const abrir = () =>
    correr(async () => {
      const e = await api.buzon.abrir({ buzon: idBuzon, empresa: activo.empresa.nombre, areas, convocados: [...elegidos] });
      setEstado({ ...e, idsConvocados: [...new Set([...convocados, ...elegidos])] });
      setElegidos(new Set());
      setSumando(false);
      setMensaje(sumando ? 'Se sumaron los colaboradores elegidos.' : 'Buzón abierto: los colaboradores convocados ya lo ven en su cuenta.');
    });

  const cerrar = () =>
    correr(async () => {
      if (!window.confirm('¿Cerrar el buzón? Nadie más podrá responder y no se puede volver a abrir.')) return;
      setEstado(await api.buzon.cerrar(idBuzon));
    });

  const traer = () =>
    correr(async () => {
      const { filas } = await api.buzon.respuestas(idBuzon);
      const { filas: nuevas, areasFaltantes } = filasDesdeCopiloto(filas, activo.segmentacion.areas);
      if (areasFaltantes.length > 0) {
        setError(`Hay respuestas con áreas que ya no están en la Etapa 0: ${areasFaltantes.join(', ')}. Vuelve a registrarlas para traer las respuestas.`);
        return;
      }
      let agregadas = 0;
      await actualizarDatos((d) => {
        const buzon1 = fusionarBuzon1(d.buzon1, nuevas);
        agregadas = buzon1.length - d.buzon1.length;
        return { ...d, buzon1 };
      });
      setMensaje(`${filas.length} ${filas.length === 1 ? 'respuesta' : 'respuestas'} en el buzón, ${agregadas} ${agregadas === 1 ? 'nueva' : 'nuevas'} en R5.`);
    });

  const alternar = (id: number) =>
    setElegidos((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const elegibles = estado?.estado ? colaboradores.filter((c) => !convocados.has(c.id)) : colaboradores;
  const pct = estado && estado.convocados > 0 ? Math.round((estado.respuestas / estado.convocados) * 100) : 0;

  const lista = (
    <div className={estilos.eleccion}>
      <div className={estilos.eleccionCabeza}>
        <strong>{estado?.estado ? 'Colaboradores que faltan por convocar' : '¿Quiénes hacen parte del cambio?'}</strong>
        {elegibles.length > 1 && (
          <button
            type="button"
            className={estilos.todos}
            onClick={() => setElegidos(elegidos.size === elegibles.length ? new Set() : new Set(elegibles.map((c) => c.id)))}
          >
            {elegidos.size === elegibles.length ? 'Quitar todos' : 'Elegir todos'}
          </button>
        )}
      </div>
      {datos.lienzo.afectados.trim() && <p className={estilos.nota}>Grupos afectados según el lienzo: {datos.lienzo.afectados}</p>}
      {elegibles.length === 0 ? (
        <p className={estilos.nota}>
          {colaboradores.length === 0 ? 'No hay cuentas de colaboradores (rol empleado). Créalas con npm run usuario.' : 'Todos los colaboradores ya están convocados.'}
        </p>
      ) : (
        <ul className={estilos.colaboradores}>
          {elegibles.map((c) => (
            <li key={c.id}>
              <label className={estilos.colaborador}>
                <input type="checkbox" checked={elegidos.has(c.id)} onChange={() => alternar(c.id)} />
                <span>
                  {c.nombre}
                  <span className={estilos.usuario}>{c.usuario}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className={estilos.gestion}>
      <Aviso tono="info" titulo="Los colaboradores responden desde su cuenta" etiquetas={['Anónimo', 'Una vez por persona', 'Sin hora ni nombre']}>
        Abre el buzón y elige a las personas que hacen parte del cambio. Cada una lo verá al entrar a la app. Se guarda solo la respuesta, el área y el grupo
        que elija; nunca su nombre. Mientras esté abierto solo verás cuántos respondieron, no quiénes.
      </Aviso>

      {areas.length === 0 && (
        <Aviso tono="atencion" titulo="Faltan las áreas">
          Registra las áreas en la Etapa 0 (paso 0.2): cada colaborador elige la suya al responder.
        </Aviso>
      )}

      {estado === null && !error && <p className={estilos.nota}>Consultando el buzón…</p>}

      {estado && estado.estado === null && areas.length > 0 && (
        <>
          {lista}
          <div className={estilos.areas}>
            <span className={estilos.nota}>Áreas que podrán elegir:</span>
            {areas.map((a) => (
              <span key={a} className={estilos.area}>
                {a}
              </span>
            ))}
          </div>
          <div className={estilos.acciones}>
            <Boton onClick={() => void abrir()} disabled={ocupado || elegidos.size === 0}>
              {elegidos.size ? `Abrir el buzón para ${elegidos.size} ${elegidos.size === 1 ? 'colaborador' : 'colaboradores'}` : 'Elige a quién convocar'}
            </Boton>
          </div>
        </>
      )}

      {estado?.estado && (
        <section className={estilos.avance} data-estado={estado.estado} aria-label="Avance del buzón">
          <div className={estilos.avanceCabeza}>
            <span className={estilos.etiquetaEstado} data-estado={estado.estado}>
              {estado.estado === 'abierto' ? 'Abierto' : 'Cerrado'}
            </span>
            <span className={estilos.nota}>
              {estado.estado === 'abierto' ? `Desde el ${fecha(estado.abiertoEn)}` : `Cerrado el ${fecha(estado.cerradoEn)}`}
            </span>
          </div>
          <p className={estilos.cifra}>
            <span className="numero">{estado.respuestas}</span> de <span className="numero">{estado.convocados}</span> respondieron
          </p>
          <div className={estilos.barra} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Participación">
            <span className={estilos.relleno} style={{ width: `${pct}%` }} />
          </div>
          <span className={estilos.nota}>{pct} % de participación de los convocados.</span>
        </section>
      )}

      {estado?.estado === 'abierto' && (
        <>
          <div className={estilos.acciones}>
            <Boton variante="secundario" onClick={() => void cargar()} disabled={ocupado}>
              Actualizar
            </Boton>
            <Boton variante="secundario" onClick={() => setSumando((s) => !s)} disabled={ocupado}>
              {sumando ? 'Cancelar' : 'Convocar a más personas'}
            </Boton>
            <Boton onClick={() => void cerrar()} disabled={ocupado}>
              Cerrar el buzón
            </Boton>
          </div>
          {sumando && (
            <>
              {lista}
              <div className={estilos.acciones}>
                <Boton onClick={() => void abrir()} disabled={ocupado || elegidos.size === 0}>
                  {`Convocar a ${elegidos.size} más`}
                </Boton>
              </div>
            </>
          )}
        </>
      )}

      {estado?.estado === 'cerrado' && (
        <div className={estilos.acciones}>
          <Boton onClick={() => void traer()} disabled={ocupado || estado.respuestas === 0}>
            Traer las respuestas a R5
          </Boton>
        </div>
      )}

      <p className={estilos.mensaje} aria-live="polite">
        {mensaje}
      </p>
      {error && (
        <Aviso tono="peligro" role="alert" titulo="No se pudo completar">
          {error}
        </Aviso>
      )}
    </div>
  );
}
