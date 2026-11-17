import { useEffect, type ComponentType } from 'react';
import { NavegacionEtapas } from '../components/navegacion/NavegacionEtapas';
import { anclaPaso, type Etapa } from '../config/etapas';
import { usePasosVistos } from '../estado/PasosVistosContexto';
import { usePrefiereMenosMovimiento } from '../hooks/usePrefiereMenosMovimiento';
import { useSeguimientoScroll } from '../hooks/useSeguimientoScroll';

interface Props {
  etapas: readonly Etapa[];
  etapa: Etapa;
  pasoId: string | null;
  Vista: ComponentType<{ etapa: Etapa }>;
}

/**
 * Página de una etapa: su vista con las subsecciones (pasos) y la barra
 * flotante. Si la ruta trae un paso, se desplaza hasta él.
 */
export function PaginaEtapa({ etapas, etapa, pasoId, Vista }: Props) {
  const { marcar } = usePasosVistos();
  const menosMovimiento = usePrefiereMenosMovimiento();
  const { vistos } = useSeguimientoScroll(etapa.pasos.map((p) => anclaPaso(p.id)));

  useEffect(() => marcar(vistos), [vistos, marcar]);

  useEffect(() => {
    const destino = document.getElementById(pasoId ? anclaPaso(pasoId) : etapa.id);
    if (pasoId && destino) {
      destino.scrollIntoView({ behavior: menosMovimiento ? 'auto' : 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
    destino?.focus({ preventScroll: true });
  }, [etapa.id, pasoId, menosMovimiento]);

  return (
    <>
      <NavegacionEtapas etapas={etapas} idEtapaActual={etapa.id} />
      <Vista etapa={etapa} />
    </>
  );
}
