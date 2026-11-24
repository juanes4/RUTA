import type { ComponentType, CSSProperties } from 'react';
import type { Etapa } from '../../config/etapas';
import { DESCRIPCION_ETAPA, RECORRIDO } from '../../contenido/pasos';
import { SimboloEtapa } from '../../components/etapa/SimboloEtapa';
import {
  IconoAcompanar,
  IconoComprobar,
  IconoComunicar,
  IconoEntender,
  IconoEscuchar,
  IconoTransformar,
} from '../../components/marco/Iconos';
import { Boton } from '../../components/ui/Boton';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useSesion } from '../../estado/SesionContexto';
import { fasesDelRecorrido } from '../../lib/recorrido';
import { useRuta } from '../../navegacion/RutaContexto';
import { IconoBuzon } from '../../components/marco/Iconos';
import { useBuzonPropio } from '../buzon/VistaBuzon';
import { RecorridoCinta } from './RecorridoCinta';
import estilos from './VistaInicio.module.css';

interface Props {
  etapas: readonly Etapa[];
}

/** Las fases del recorrido (pasos seguidos con el mismo verbo), para la línea de la portada. */
const FASES = fasesDelRecorrido(RECORRIDO);

const fondo = (color: string | undefined) => ({ '--fondo': color ?? 'var(--bg-soft)' }) as CSSProperties;

/** Icono de cada fase en la línea de la portada. */
const ICONO_FASE: Readonly<Record<string, ComponentType<{ tamano?: number }>>> = {
  Entender: IconoEntender,
  Escuchar: IconoEscuchar,
  Comunicar: IconoComunicar,
  Acompañar: IconoAcompanar,
  Transformar: IconoTransformar,
  Comprobar: IconoComprobar,
};

/** Las 6 fases en una línea: punto e icono con el color de la etapa a la que pertenecen. */
function FasesPortada({ etapas }: { etapas: readonly Etapa[] }) {
  return (
    <ol className={estilos.fasesPortada} aria-label="Las fases del cambio">
      {FASES.map((fase, i) => {
        const Icono = ICONO_FASE[fase.verbo];
        const color = etapas.find((e) => e.id === fase.pasos[0]?.etapaId)?.color ?? 'var(--bg-soft)';
        return (
          <li key={fase.verbo} className={estilos.fasePortada} data-halo={i % 2 === 0} style={{ '--color-fase': color } as CSSProperties}>
            <span className={estilos.faseMarca} aria-hidden="true" />
            <span className={estilos.faseIcono} aria-hidden="true">
              {Icono && <Icono />}
            </span>
            <span className={estilos.faseNombre}>
              {fase.verbo}
              <span className="solo-lectores">
                {' '}
                ({fase.pasos.length} {fase.pasos.length === 1 ? 'paso' : 'pasos'})
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Página principal: el reto, el recorrido en 11 pasos y el acceso a todo (PLAN §4). */
export function VistaInicio({ etapas }: Props) {
  const { activo } = useProyecto();
  const { usuario } = useSesion();
  const { enlace, navegar } = useRuta();

  return (
    <div className={estilos.inicio}>
      <header className={estilos.presentacion}>
        <p className={estilos.antetitulo}>Metodología de transformación organizacional</p>
        <h1>RUTA</h1>
        <p className={estilos.reto}>
          RUTA es una aplicación que acompaña a las empresas en sus procesos de transformación organizacional mediante <strong>etapas</strong>,{' '}
          <strong>herramientas</strong> y un <strong>tablero</strong> para orientar y dar seguimiento al cambio.
        </p>
        {!usuario && (
          <div className={estilos.ingreso}>
            <Boton onClick={() => navegar({ pagina: 'ingresar' })}>
              Iniciar sesión
            </Boton>
            <span className={estilos.ingresoTexto}>Ingresa para abrir las etapas y el tablero.</span>
          </div>
        )}
        <FasesPortada etapas={etapas} />
      </header>

      {usuario?.rol === 'empleado' && <BuzonPendiente />}

      <section aria-labelledby="titulo-accesos">
        <h2 id="titulo-accesos" className={estilos.tituloSeccion}>
          Etapas y tablero
        </h2>
        <ul className={estilos.accesos}>
          {etapas.map((etapa) => (
            <li key={etapa.id}>
              {etapa.activa ? (
                <a
                  className={estilos.acceso}
                  style={fondo(etapa.color)}
                  href={enlace({ pagina: 'etapa', etapaId: etapa.id, pasoId: null })}
                >
                  <span className={estilos.letra}>
                    <SimboloEtapa etapa={etapa} />
                  </span>
                  <span className={estilos.nombreAcceso}>{etapa.nombre}</span>
                  <span className={estilos.descripcion}>{DESCRIPCION_ETAPA[etapa.id]}</span>
                  <span className={`${estilos.pasos} numero`}>{etapa.pasos.length} pasos</span>
                </a>
              ) : (
                <div className={estilos.acceso} data-vacio="true" aria-label="Etapa por definir. Próximamente.">
                  <span className={estilos.letra} aria-hidden="true" />
                  <span className={estilos.proximamente}>Próximamente</span>
                </div>
              )}
            </li>
          ))}
          <li>
            <a className={estilos.acceso} data-oscuro="true" href={enlace({ pagina: 'tablero' })}>
              <span className={estilos.nombreAcceso}>Tablero</span>
              <span className={estilos.descripcion}>
                Ruta del cambio con semáforo, participación del buzón, FODA, actores, liderazgo y avance de cada paso.
              </span>
              <span className={estilos.pasos}>
                Abrir <span aria-hidden="true">→</span>
              </span>
            </a>
          </li>
        </ul>
        {usuario && !activo && (
          <p className={estilos.idea}>Para empezar, registra la empresa en la Etapa 0.</p>
        )}
      </section>

      <section aria-labelledby="titulo-recorrido">
        <h2 id="titulo-recorrido" className={estilos.tituloSeccion}>
          El recorrido en 11 pasos
        </h2>
        <RecorridoCinta />
      </section>
    </div>
  );
}

/** Para el colaborador: si tiene un buzón por responder, se lo recuerda arriba del todo. */
function BuzonPendiente() {
  const { enlace } = useRuta();
  const { buzon } = useBuzonPropio(true);
  if (buzon?.estado !== 'pendiente') return null;
  return (
    <a className={estilos.buzonPendiente} href={enlace({ pagina: 'buzon' })}>
      <span className={estilos.buzonIcono} aria-hidden="true">
        <IconoBuzon tamano={22} />
      </span>
      <span className={estilos.buzonTexto}>
        <strong>Tienes un buzón de escucha pendiente</strong>
        <span>Tres preguntas cortas, anónimas. Solo puedes responderlo una vez.</span>
      </span>
      <span className={estilos.buzonAccion}>Responder</span>
    </a>
  );
}
