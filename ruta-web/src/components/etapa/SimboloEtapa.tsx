import type { Etapa } from '../../config/etapas';
import { IconoEmpresa } from '../marco/Iconos';

/**
 * Lo que va dentro del círculo de una etapa: su icono si lo tiene (la Etapa 0
 * es un edificio: registrar la empresa) o su letra de RUTA.
 */
export function SimboloEtapa({ etapa, tamano = 20 }: { etapa: Etapa; tamano?: number }) {
  if (etapa.icono === 'empresa') return <IconoEmpresa tamano={tamano} />;
  return <>{etapa.letra}</>;
}
