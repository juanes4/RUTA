import type { ReactNode } from 'react';
import type { Etapa } from '../../config/etapas';
import { ETIQUETA_ROL, useSesion } from '../../estado/SesionContexto';
import { useRuta } from '../../navegacion/RutaContexto';
import type { Ruta } from '../../navegacion/rutas';
import { IconoIngresar, IconoInicio, IconoSalir, IconoTablero } from './Iconos';
import estilos from './Marco.module.css';

interface Props {
  etapas: readonly Etapa[];
  /** true en las páginas de etapa: deja espacio a la barra flotante. */
  conBarraEtapas: boolean;
  children: ReactNode;
}

interface ElementoRiel {
  clave: string;
  etiqueta: string;
  ruta: Ruta;
  icono: ReactNode;
  activo(ruta: Ruta): boolean;
}

function elementos(etapas: readonly Etapa[], conSesion: boolean): ElementoRiel[] {
  const inicio: ElementoRiel = {
    clave: 'inicio',
    etiqueta: 'Inicio',
    ruta: { pagina: 'inicio' },
    icono: <IconoInicio />,
    // Con sesión abierta, #/ingresar muestra el inicio.
    activo: (r) => r.pagina === 'inicio' || (conSesion && r.pagina === 'ingresar'),
  };
  // Sin sesión solo existe el inicio y el acceso al login; el resto aparece al entrar.
  if (!conSesion) {
    return [
      inicio,
      {
        clave: 'ingresar',
        etiqueta: 'Iniciar sesión',
        ruta: { pagina: 'ingresar' },
        icono: <IconoIngresar />,
        // Sin sesión, cualquier otra página muestra el login.
        activo: (r) => r.pagina !== 'inicio',
      },
    ];
  }
  return [
    inicio,
    ...etapas
      .filter((e) => e.activa)
      .map<ElementoRiel>((e) => ({
        clave: e.id,
        etiqueta: `Etapa ${e.letra} · ${e.nombre}`,
        ruta: { pagina: 'etapa', etapaId: e.id, pasoId: null },
        icono: <span className={estilos.letra}>{e.letra}</span>,
        activo: (r) => r.pagina === 'etapa' && r.etapaId === e.id,
      })),
    {
      clave: 'tablero',
      etiqueta: 'Tablero',
      ruta: { pagina: 'tablero' },
      icono: <IconoTablero />,
      activo: (r) => r.pagina === 'tablero',
    },
  ];
}

/**
 * Marco de todas las páginas. La columna oscura de navegación general es
 * un ancla: fija en la pantalla, en el mismo lugar en todas las páginas,
 * dentro de un panel de vidrio (como la ref 04). El contenedor blanco se
 * desplaza a su lado sin pasar por debajo.
 */
export function Marco({ etapas, conBarraEtapas, children }: Props) {
  const { ruta, enlace, navegar } = useRuta();
  const { usuario, cerrar } = useSesion();

  const salir = async () => {
    await cerrar();
    navegar({ pagina: 'inicio' });
  };

  return (
    <>
      <div className={estilos.fondo} aria-hidden="true">
        <span className={estilos.manchaBeige} />
        <span className={estilos.manchaVioleta} />
        <span className={estilos.manchaCian} />
      </div>
      <div className={estilos.ancla}>
        <nav className={estilos.riel} aria-label="Navegación general">
          <span className={estilos.marca}>RUTA</span>
          <ul className={estilos.lista}>
            {elementos(etapas, Boolean(usuario)).map((el) => {
              const activo = el.activo(ruta);
              return (
                <li key={el.clave}>
                  <a
                    href={enlace(el.ruta)}
                    className={estilos.enlace}
                    data-activo={activo}
                    aria-current={activo ? 'page' : undefined}
                    aria-label={el.etiqueta}
                  >
                    {el.icono}
                    <span className={estilos.ayuda} aria-hidden="true">
                      {el.etiqueta}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          {usuario && (
            <button type="button" className={`${estilos.enlace} ${estilos.salir}`} onClick={salir}>
              <IconoSalir />
              <span className="solo-lectores">Cerrar sesión</span>
              <span className={estilos.ayuda} aria-hidden="true">
                Cerrar sesión · {usuario.nombre} ({ETIQUETA_ROL[usuario.rol]})
              </span>
            </button>
          )}
        </nav>
      </div>
      <main className={estilos.contenido} id="contenido" tabIndex={-1} data-con-barra={conBarraEtapas}>
        {children}
      </main>
    </>
  );
}
