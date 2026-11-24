import { IndicePasos, PasoAnteriorSiguiente, VolverAlIndice } from '../../components/etapa/IndicePasos';
import { BloquePaso, SeccionEtapa } from '../../components/etapa/SeccionEtapa';
import { Pestanas } from '../../components/ui/Pestanas';
import { tarjetaDePaso, type Etapa } from '../../config/etapas';
import { DESCRIPCION_PASO_T } from '../../config/transformar';
import { DESCRIPCION_ETAPA } from '../../contenido/pasos';
import { useSesion } from '../../estado/SesionContexto';
import { useCapacitaciones } from '../../hooks/useCapacitaciones';
import { Acompanamiento } from './Acompanamiento';
import { Capacitaciones } from './Capacitaciones';
import { Comunicacion } from './Comunicacion';
import { FlujoEtapa } from './FlujoEtapa';
import { Historial } from './Historial';
import { Victorias } from './Victorias';

interface Props {
  etapa: Etapa;
  pasoId: string | null;
}

/**
 * Etapa T (Transformar), con los cuatro niveles de Kirkpatrick:
 * T1 comunicación, T2 capacitación (con su historial), T3 acompañamiento
 * y T4 victorias tempranas. Inicio de sesión y roles: ver SesionContexto.
 */
export function VistaTransformar({ etapa, pasoId }: Props) {
  const { usuario } = useSesion();
  const { estado, marcarVisto, guardarSimulador } = useCapacitaciones();
  const esLider = usuario?.rol === 'lider';
  const indice = etapa.pasos.findIndex((p) => p.id === pasoId);
  const paso = etapa.pasos[indice];

  if (!paso) {
    const resumenT2 = () => {
      if (estado.fase !== 'listo') return estado.fase === 'cargando' ? 'Cargando…' : 'No se pudo cargar';
      const vistos = estado.videos.filter((v) => v.visto).length;
      return `${vistos} de ${estado.videos.length} videos vistos`;
    };
    const resumen: Record<string, string> = {
      T1: 'Todas las personas responden',
      T2: resumenT2(),
      T3: esLider ? 'Votación, dinámicas y termómetro' : 'Votación y termómetro',
      T4: esLider ? 'Registro y publicación de méritos' : 'Méritos publicados',
    };
    return (
      <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id]}>
        <IndicePasos etapa={etapa} queSeHace={(p) => DESCRIPCION_PASO_T[p.id] ?? ''} estado={(p) => resumen[p.id] ?? ''} />
        <FlujoEtapa />
      </SeccionEtapa>
    );
  }

  // Cambia cuando la persona ve un video o responde un simulador, para que el historial se vuelva a leer.
  const claveHistorial = estado.fase === 'listo' ? estado.videos.map((v) => `${v.visto ? 1 : 0}${v.simulador?.aciertos ?? '-'}${v.simulador?.seguridad ?? '-'}`).join('') : '';

  return (
    <SeccionEtapa etapa={etapa}>
      <VolverAlIndice etapa={etapa} paso={paso} />
      <BloquePaso paso={paso} ancho="completo" tarjeta={tarjetaDePaso(etapa, indice)} descripcion={DESCRIPCION_PASO_T[paso.id]}>
        {paso.id === 'T1' && <Comunicacion esLider={esLider} />}
        {paso.id === 'T2' && (
          <Pestanas
            etiqueta="Capacitación"
            pestanas={[
              {
                id: 'cursos',
                etiqueta: 'Micro-cursos',
                contenido: <Capacitaciones estado={estado} alVer={marcarVisto} alResponder={guardarSimulador} esLider={esLider} />,
              },
              { id: 'historial', etiqueta: 'Historial', contenido: <Historial clave={claveHistorial} /> },
            ]}
          />
        )}
        {paso.id === 'T3' && <Acompanamiento esLider={esLider} />}
        {paso.id === 'T4' && <Victorias esLider={esLider} />}
      </BloquePaso>
      <PasoAnteriorSiguiente etapa={etapa} paso={paso} />
    </SeccionEtapa>
  );
}
