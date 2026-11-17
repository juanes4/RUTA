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
  Vista: ComponentType<{ etapa: Etapa; pasoId: string | null }>;
}

/**
 * Página de una etapa: su vista y la barra flotante. Si la etapa tiene una
 * página por paso, la ruta elige cuál; si no, se desplaza hasta el paso.
 */
export function PaginaEtapa({ etapas, etapa, pasoId, Vista }: Props) {
  const { marcar } = usePasosVistos();
  const menosMovimiento = usePrefiereMenosMovimiento();
  const porPagina = Boolean(etapa.paginasPorPaso);
  const { vistos } = useSeguimientoScroll(porPagina ? [] : etapa.pasos.map((p) => anclaPaso(p.id)));

  useEffect(() => marcar(vistos), [vistos, marcar]);

  // Con una página por paso, abrir la página es haber visto el paso.
  useEffect(() => {
    if (porPagina && pasoId) marcar([anclaPaso(pasoId)]);
  }, [porPagina, pasoId, marcar]);

  useEffect(() => {
    const destino = document.getElementById(pasoId ? anclaPaso(pasoId) : etapa.id);
    if (!porPagina && pasoId && destino) {
      destino.scrollIntoView({ behavior: menosMovimiento ? 'auto' : 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
    destino?.focus({ preventScroll: true });
  }, [etapa.id, pasoId, menosMovimiento, porPagina]);

  return (
    <>
      <NavegacionEtapas etapas={etapas} idEtapaActual={etapa.id} />
      <Vista etapa={etapa} pasoId={pasoId} />
    </>
  );
}
