import { IndicePasos, PasoAnteriorSiguiente, VolverAlIndice } from '../../components/etapa/IndicePasos';
import { BloquePaso, SeccionEtapa } from '../../components/etapa/SeccionEtapa';
import { tarjetaDePaso, type Etapa } from '../../config/etapas';
import { DESCRIPCION_ETAPA } from '../../contenido/pasos';
import { useSesion } from '../../estado/SesionContexto';
import { useCapacitaciones } from '../../hooks/useCapacitaciones';
import { Capacitaciones } from './Capacitaciones';
import { Historial } from './Historial';

interface Props {
  etapa: Etapa;
  pasoId: string | null;
}

/**
 * Qué es cada subsección. La etapa T sigue definiéndose en el documento, por
 * eso aquí no hay formularios: solo capacitaciones (videos) e historial.
 */
const DESCRIPCION_PASO_T: Readonly<Record<string, string>> = {
  T1: 'Videos para capacitar a empleados y a líderes.',
  T2: 'Lista de los videos y las personas que vieron cada uno.',
};

/** Etapa T: un índice con dos subsecciones, Capacitaciones e Historial. */
export function VistaTransformar({ etapa, pasoId }: Props) {
  const { usuario } = useSesion();
  const { estado, marcarVisto } = useCapacitaciones();
  const esLider = usuario?.rol === 'lider';
  const indice = etapa.pasos.findIndex((p) => p.id === pasoId);
  const paso = etapa.pasos[indice];

  if (!paso) {
    const resumenT1 = () => {
      if (estado.fase !== 'listo') return estado.fase === 'cargando' ? 'Cargando…' : 'No se pudo cargar';
      const vistos = estado.videos.filter((v) => v.visto).length;
      return `${vistos} de ${estado.videos.length} videos vistos`;
    };
    return (
      <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id]}>
        <IndicePasos
          etapa={etapa}
          queSeHace={(p) => DESCRIPCION_PASO_T[p.id] ?? ''}
          estado={(p) => (p.id === 'T1' ? resumenT1() : esLider ? 'Todas las personas' : 'Solo tus videos')}
        />
      </SeccionEtapa>
    );
  }

  return (
    <SeccionEtapa etapa={etapa}>
      <VolverAlIndice etapa={etapa} paso={paso} />
      <BloquePaso paso={paso} ancho="completo" tarjeta={tarjetaDePaso(etapa, indice)} descripcion={DESCRIPCION_PASO_T[paso.id]}>
        {paso.id === 'T1' && <Capacitaciones estado={estado} alVer={marcarVisto} esLider={esLider} />}
        {paso.id === 'T2' && <Historial />}
      </BloquePaso>
      <PasoAnteriorSiguiente etapa={etapa} paso={paso} />
    </SeccionEtapa>
  );
}
