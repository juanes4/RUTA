import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { useProyecto } from '../../estado/ProyectoContexto';
import formulario from '../etapa0/formulario.module.css';
import estilos from '../reconocer/reconocer.module.css';

const PREGUNTAS_FRECUENTES = [
  ['¿Por qué se hace este cambio ahora?', 'Expón las razones y los datos de la narrativa U2; explica con claridad el riesgo de mantener la situación actual.'],
  ['¿Qué cambia en mi trabajo y qué se mantiene?', 'Describe los cambios concretos y las continuidades; evita generalidades que no resuelvan la duda.'],
  ['¿Qué beneficios trae para mi equipo o para los clientes?', 'Conecta la visión con los beneficios identificados para cada grupo.'],
  ['¿Qué apoyo tendremos durante la transición?', 'Explica solo los apoyos y canales ya definidos. Si aún no hay respuesta, registra la pregunta y acuerda cómo darle seguimiento.'],
];

export function PasoSoporteLideres() {
  const { datos } = useProyecto();
  const narrativa = datos.narrativaCambio;

  return (
    <div className={estilos.resultados}>
      <p>
        Después del anuncio, los jefes y mandos medios son una referencia de confianza para sus equipos. Esta guía les ayuda a preparar mensajes, responder preguntas y conversar sobre inquietudes sin minimizar la experiencia de las personas.
      </p>

      <section className={estilos.bloque} aria-labelledby="preparar-conversacion">
        <h3 id="preparar-conversacion" className={estilos.tituloBloque}>Antes de hablar con el equipo</h3>
        <ol className={estilos.backlog}>
          <li>Revisa la narrativa U2 y acuerda con el vocero el mensaje principal.</li>
          <li>Ten claros el propósito, la visión, los beneficios por grupo y los cambios concretos.</li>
          <li>Separa lo que ya está confirmado de lo que todavía necesita respuesta.</li>
          <li>Prepara un espacio para preguntas y anota las que no puedas resolver con información confirmada.</li>
        </ol>
      </section>

      <section className={estilos.bloque} aria-labelledby="mensajes-clave">
        <h3 id="mensajes-clave" className={estilos.tituloBloque}>Mensajes clave de la narrativa</h3>
        {!narrativa ? (
          <EstadoVacio titulo="Completa primero la narrativa U2">Aquí se muestran los mensajes preparados para orientar las conversaciones de los líderes.</EstadoVacio>
        ) : (
          <div className={formulario.rejilla}>
            <div className={formulario.ancho}><strong>Por qué y por qué ahora</strong><p>{narrativa.de_donde_venimos}</p></div>
            <div className={formulario.ancho}><strong>Visión y beneficios</strong><p>{narrativa.hacia_donde_vamos}</p></div>
            <div className={formulario.ancho}><strong>Camino y acompañamiento</strong><p>{narrativa.como_sera_el_camino}</p></div>
          </div>
        )}
      </section>

      <section className={estilos.bloque} aria-labelledby="preguntas-frecuentes">
        <h3 id="preguntas-frecuentes" className={estilos.tituloBloque}>Preguntas frecuentes para preparar</h3>
        <p className={estilos.nota}>Redacta las respuestas con datos confirmados de la organización; no supongas ni prometas lo que aún no está definido.</p>
        <div className={estilos.desplazable}>
          <table className={estilos.tabla}>
            <thead><tr><th scope="col">Pregunta del colaborador</th><th scope="col">Qué debe incluir la respuesta</th></tr></thead>
            <tbody>
              {PREGUNTAS_FRECUENTES.map(([pregunta, guia]) => (
                <tr key={pregunta}><th scope="row">{pregunta}</th><td>{guia}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={estilos.bloque} aria-labelledby="pautas-conversacion">
        <h3 id="pautas-conversacion" className={estilos.tituloBloque}>Pautas de conversación</h3>
        <ul className={estilos.backlog}>
          <li>Explica el propósito y el futuro deseado antes de entrar en los detalles del proceso.</li>
          <li>Pregunta qué inquietudes o expectativas tiene el equipo y escucha sin interrumpir.</li>
          <li>Responde con transparencia; si no conoces una respuesta, déjala registrada para confirmarla.</li>
          <li>Conecta cada mensaje con el trabajo diario y las necesidades del equipo.</li>
        </ul>
      </section>
    </div>
  );
}
