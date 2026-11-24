import { useState } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoTexto } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { EXPLICACION_BUZON1 as EX } from '../../contenido/reconocer';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useSesion } from '../../estado/SesionContexto';
import { api, type EstadoBuzonForms } from '../../lib/api';
import { fusionarBuzon1 } from '../../lib/captura/buzon1Csv';
import { filasDesdeCopiloto } from '../../lib/copiloto/logica';
import estilos from './reconocer.module.css';

const ID_VALIDO = /^[A-Za-z0-9_-]{3,80}$/;

/**
 * R5 desde Google Forms en línea (Apps Script al enviar). Mientras el buzón
 * está abierto solo se ve cuántas respuestas van; al cerrarlo se traen a R5.
 */
export function BuzonEnLinea() {
  const { usuario } = useSesion();
  const { activo, datos, actualizarDatos } = useProyecto();
  const [id, setId] = useState(datos.copiloto.buzonFormsId);
  const [estado, setEstado] = useState<EstadoBuzonForms | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);
  if (!activo) return null;
  if (usuario?.rol !== 'lider') {
    return <EstadoVacio titulo="Solo para gestión del cambio">El buzón en línea lo maneja el equipo de gestión del cambio (rol líder).</EstadoVacio>;
  }

  const correr = async (accion: () => Promise<void>) => {
    if (!ID_VALIDO.test(id)) return setError('Escribe el identificador del buzón (BUZON_ID del Apps Script): letras, números, - y _.');
    setOcupado(true);
    setError('');
    setMensaje('');
    try {
      if (id !== datos.copiloto.buzonFormsId) await actualizarDatos((d) => ({ ...d, copiloto: { ...d.copiloto, buzonFormsId: id } }));
      await accion();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ocurrió un error.');
    } finally {
      setOcupado(false);
    }
  };

  const consultar = () => correr(async () => setEstado(await api.buzonForms.estado(id)));

  const cerrar = () =>
    correr(async () => {
      if (!window.confirm('¿Cerrar el buzón? Después de cerrarlo no se reciben más respuestas de Google Forms.')) return;
      setEstado(await api.buzonForms.cerrar(id));
    });

  const traer = () =>
    correr(async () => {
      const { filas } = await api.buzonForms.respuestas(id);
      const { filas: nuevas, areasFaltantes } = filasDesdeCopiloto(filas, activo.segmentacion.areas);
      if (areasFaltantes.length > 0) {
        setError(`Hay respuestas con áreas que no están en la Etapa 0: ${areasFaltantes.join(', ')}. Regístralas (o corrige la lista de áreas del formulario) y vuelve a intentarlo.`);
        return;
      }
      let agregadas = 0;
      await actualizarDatos((d) => {
        const buzon1 = fusionarBuzon1(d.buzon1, nuevas);
        agregadas = buzon1.length - d.buzon1.length;
        return { ...d, buzon1 };
      });
      setMensaje(`${filas.length} respuestas en el buzón, ${agregadas} nuevas en R5.`);
    });

  return (
    <div className={estilos.bloque}>
      <p className={estilos.nota}>
        Con el Apps Script del formulario (guía en docs/buzon-google-forms.md), cada respuesta llega sola a la app sin la hora exacta ni datos de quien responde.
        Mientras el buzón está abierto solo ves cuántas respuestas van; al cerrarlo puedes traerlas a R5.
      </p>
      <CampoTexto etiqueta="Identificador del buzón" explicacion={EX.buzonForms} value={id} onChange={(e) => setId(e.target.value.trim())} placeholder="LACTEOS_WMS_1" />
      <div className={estilos.acciones}>
        <Boton variante="secundario" onClick={() => void consultar()} disabled={ocupado}>
          Ver avance
        </Boton>
        {estado?.estado === 'abierto' && (
          <Boton variante="secundario" onClick={() => void cerrar()} disabled={ocupado}>
            Cerrar el buzón
          </Boton>
        )}
        {estado?.estado === 'cerrado' && (
          <Boton onClick={() => void traer()} disabled={ocupado}>
            Traer las respuestas a R5
          </Boton>
        )}
      </div>
      {estado && (
        <p className={estilos.mensaje}>
          {estado.existe || estado.respuestas > 0
            ? `Buzón ${estado.estado}: ${estado.respuestas} ${estado.respuestas === 1 ? 'respuesta recibida' : 'respuestas recibidas'}.`
            : 'Todavía no llega ninguna respuesta con este identificador.'}
        </p>
      )}
      <p className={estilos.mensaje} aria-live="polite">
        {mensaje}
      </p>
      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
