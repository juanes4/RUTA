import { SeccionEtapa } from '../../../components/etapa/SeccionEtapa';
import { IconoCopiloto } from '../../../components/marco/Iconos';
import { EnlaceFlecha } from '../../../components/ui/EnlaceFlecha';
import { EstadoVacio } from '../../../components/ui/EstadoVacio';
import { Pestanas } from '../../../components/ui/Pestanas';
import { ID_COPILOTO, type Etapa } from '../../../config/etapas';
import { CONFIG_IA } from '../../../config/ia';
import { REGLAS } from '../../../config/reglas';
import { useProyecto } from '../../../estado/ProyectoContexto';
import { evaluarTriaje } from '../../../lib/calculo/triaje';
import type { DatosProyecto } from '../../../lib/modelo/proyecto';
import { useRuta } from '../../../navegacion/RutaContexto';
import { AvisosCopiloto, SelectorModo, useEsLider, useModoCopiloto, useReiniciarCopiloto, type PropsModo } from './comun';
import estilos from './copiloto.module.css';
import { LimiteErrores } from './LimiteErrores';
import { PanelBuzon } from './PanelBuzon';
import { PanelDossier } from './PanelDossier';
import { PanelLienzo } from './PanelLienzo';
import { PanelTriaje } from './PanelTriaje';

export type { PropsModo } from './comun';
export { ErrorCopiloto, InsigniaModo } from './comun';

/** Los 4 pasos del copiloto, con el paso de R al que alimenta cada uno. */
const PASOS_COPILOTO = [
  { n: 1, nombre: 'Lienzo', detalle: 'Entrevista para R1' },
  { n: 2, nombre: 'Triaje', detalle: 'Propuesta para R2' },
  { n: 3, nombre: 'Buzón', detalle: 'Informe de R5 y ajustes' },
  { n: 4, nombre: 'Dossier', detalle: 'Base para la etapa U' },
] as const;

/** Se abre en el primer paso que falta: lienzo, triaje, buzón y, con todo, el dossier. */
function pasoPendiente(datos: DatosProyecto): string {
  const l = datos.lienzo;
  const hayLienzo = Boolean(datos.copiloto.estadosLienzo || l.afectados.trim() || l.vision.trim() || l.urgencia.some((u) => u.motivo.trim()));
  if (!hayLienzo) return 'lienzo';
  if (evaluarTriaje(datos.triaje, REGLAS.triaje).total === null) return 'triaje';
  if (!datos.copiloto.informe) return 'buzon';
  return 'dossier';
}

/** Tarjeta en el índice de R que abre el copiloto. Solo la ven los líderes. */
export function AccesoCopiloto({ etapa }: { etapa: Etapa }) {
  const esLider = useEsLider();
  const { enlace } = useRuta();
  if (!CONFIG_IA.habilitada || !esLider) return null;
  return (
    <aside className={`${estilos.acceso} fila-completa`} aria-label="Copiloto de Reconocimiento">
      <div className={estilos.accesoCabeza}>
        <span className={estilos.chispa} aria-hidden="true">
          <IconoCopiloto tamano={22} />
        </span>
        <div className={estilos.accesoTexto}>
          <span className={estilos.accesoTitulo}>Copiloto de Reconocimiento</span>
          <span className={estilos.accesoBajada}>Te ayuda a resolver los pasos de R: lienzo, triaje y, después, el buzón que los pone a prueba. Propone; tú decides. También lo encuentras dentro de R1, R2 y R5.</span>
        </div>
        <a className={estilos.enlaceBoton} href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: ID_COPILOTO })}>
          Abrir el copiloto
        </a>
      </div>
      <ol className={estilos.accesoPasos}>
        {PASOS_COPILOTO.map((p) => (
          <li key={p.n}>
            <span className={`${estilos.accesoNumero} numero`}>{p.n}</span>
            <span>
              <strong>{p.nombre}</strong>
              <span className={estilos.nota}>{p.detalle}</span>
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

/** Página del Copiloto de Reconocimiento: 4 pestañas guiadas (buzón, lienzo, triaje y dossier). */
export function VistaCopiloto({ etapa }: { etapa: Etapa }) {
  const esLider = useEsLider();
  const { activo, datos } = useProyecto();
  const { enlace } = useRuta();
  const { estado, errorEstado, modo, setModo, usarSimulado } = useModoCopiloto(esLider);
  const reiniciarCopiloto = useReiniciarCopiloto();

  const volver = (
    <p className="fila-completa">
      <EnlaceFlecha href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: null })}>Todos los pasos de Reconocer</EnlaceFlecha>
    </p>
  );

  if (!esLider) {
    return (
      <SeccionEtapa etapa={etapa}>
        {volver}
        <EstadoVacio titulo="Solo para gestión del cambio">El copiloto lo usa el equipo de gestión del cambio (rol líder): trabaja con el buzón, que es confidencial.</EstadoVacio>
      </SeccionEtapa>
    );
  }
  if (!activo) {
    return (
      <SeccionEtapa etapa={etapa}>
        {volver}
        <EstadoVacio titulo="Sin empresa registrada" accion={<a href={enlace({ pagina: 'etapa', etapaId: 'etapa-0', pasoId: null })}>Ir a la Etapa 0</a>}>
          Registra la empresa, sus áreas y sus afectados antes de usar el copiloto.
        </EstadoVacio>
      </SeccionEtapa>
    );
  }

  const props: PropsModo = { modo, usarSimulado };

  return (
    <SeccionEtapa etapa={etapa}>
      {volver}
      <section className={`${estilos.pagina} fila-completa`} aria-labelledby="titulo-copiloto">
        <header className={estilos.cabecera}>
          <span className={estilos.chispa} aria-hidden="true">
            <IconoCopiloto tamano={22} />
          </span>
          <div className={estilos.cabeceraTexto}>
            <h2 id="titulo-copiloto" className={estilos.titulo}>
              Copiloto de Reconocimiento
            </h2>
            <p className={estilos.nota}>Lienzo y triaje primero; después el buzón, que los pone a prueba y propone ajustes; al final, el dossier para la etapa U. El copiloto propone; nada se guarda en R1 o R2 sin tu clic.</p>
          </div>
          <SelectorModo estado={estado} modo={modo} setModo={setModo} nombre="modo-copiloto" />
        </header>

        <AvisosCopiloto estado={estado} errorEstado={errorEstado} />

        <LimiteErrores alReiniciar={reiniciarCopiloto}>
          <Pestanas
            etiqueta="Pasos del copiloto"
            inicial={pasoPendiente(datos)}
            pestanas={[
              { id: 'lienzo', etiqueta: '1 · Lienzo', contenido: <PanelLienzo {...props} /> },
              { id: 'triaje', etiqueta: '2 · Triaje', contenido: <PanelTriaje {...props} /> },
              { id: 'buzon', etiqueta: '3 · Buzón', contenido: <PanelBuzon {...props} /> },
              { id: 'dossier', etiqueta: '4 · Dossier', contenido: <PanelDossier {...props} /> },
            ]}
          />
        </LimiteErrores>
      </section>
    </SeccionEtapa>
  );
}
