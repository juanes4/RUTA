import { BloquePaso, SeccionEtapa } from '../../components/etapa/SeccionEtapa';
import { BotonIcono } from '../../components/ui/Boton';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { tarjetaDePaso, type Etapa } from '../../config/etapas';
import { DESCRIPCION_PASO_ETAPA0 } from '../../contenido/etapa0';
import { DESCRIPCION_ETAPA } from '../../contenido/pasos';
import { useProyecto } from '../../estado/ProyectoContexto';
import { normalizarSegmentacion } from '../../lib/proyecto/etapa0';
import { FormEmpresa } from './FormEmpresa';
import { FormSegmentacion } from './FormSegmentacion';
import { SelectorProyecto } from './SelectorProyecto';

interface Props {
  etapa: Etapa;
}

export function VistaEtapa0({ etapa }: Props) {
  const { cargando, activo, crear, actualizar } = useProyecto();
  const [p01, p02] = etapa.pasos;
  if (!p01 || !p02) throw new Error('La Etapa 0 debe tener 2 pasos en config/etapas.ts');

  return (
    <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id] ?? ''}>
      {cargando ? null : !activo ? (
        <div className="fila-completa">
          <EstadoVacio
            titulo="Aún no hay una empresa registrada"
            accion={<BotonIcono accion="agregar" etiqueta="Registrar empresa" etiquetaVisible onClick={() => void crear()} />}
          >
            Todo empieza aquí: las etapas Reconocer y Unir guardan sus resultados en la empresa que registres, y
            la participación del buzón 1 se calcula con sus áreas y afectados.
          </EstadoVacio>
        </div>
      ) : (
        <>
          <div className="fila-completa">
            <SelectorProyecto />
          </div>
          <BloquePaso paso={p01} ancho="completo" tarjeta={tarjetaDePaso(etapa, 0)} descripcion={DESCRIPCION_PASO_ETAPA0[p01.id]}>
            <FormEmpresa empresa={activo.empresa} guardar={(empresa) => actualizar((p) => ({ ...p, empresa }))} />
          </BloquePaso>
          <BloquePaso paso={p02} ancho="completo" tarjeta={tarjetaDePaso(etapa, 1)} descripcion={DESCRIPCION_PASO_ETAPA0[p02.id]}>
            <FormSegmentacion
              segmentacion={activo.segmentacion}
              guardar={(s) => actualizar((p) => ({ ...p, segmentacion: normalizarSegmentacion(s) }))}
            />
          </BloquePaso>
        </>
      )}
    </SeccionEtapa>
  );
}
