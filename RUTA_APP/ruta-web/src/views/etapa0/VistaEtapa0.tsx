import { BloquePaso, SeccionEtapa } from '../../components/etapa/SeccionEtapa';
import { BotonIcono } from '../../components/ui/Boton';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { tarjetaDePaso, type Etapa } from '../../config/etapas';
import { DESCRIPCION_PASO_ETAPA0 } from '../../contenido/etapa0';
import { DESCRIPCION_ETAPA } from '../../contenido/pasos';
import { useProyecto } from '../../estado/ProyectoContexto';
import { normalizarSegmentacion, resolverMetas } from '../../lib/proyecto/etapa0';
import { FormEmpresa } from './FormEmpresa';
import { FormMetas } from './FormMetas';
import { FormSegmentacion } from './FormSegmentacion';
import { FormUso } from './FormUso';
import { SelectorProyecto } from './SelectorProyecto';

interface Props {
  etapa: Etapa;
}

export function VistaEtapa0({ etapa }: Props) {
  const { cargando, activo, crear, actualizar } = useProyecto();
  const [p01, p02, p03, p04] = etapa.pasos;
  if (!p01 || !p02 || !p03 || !p04) throw new Error('La Etapa 0 debe tener 4 pasos en config/etapas.ts');

  return (
    <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id] ?? ''}>
      {cargando ? null : !activo ? (
        <div className="fila-completa">
          <EstadoVacio
            titulo="Aún no hay una empresa registrada"
            accion={<BotonIcono accion="agregar" etiqueta="Registrar empresa" etiquetaVisible onClick={() => void crear()} />}
          >
            Todo empieza aquí: sin la empresa, sus áreas y sus afectados no se puede calcular la participación ni
            ningún indicador.
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
          <BloquePaso paso={p03} ancho="completo" tarjeta={tarjetaDePaso(etapa, 2)} descripcion={DESCRIPCION_PASO_ETAPA0[p03.id]}>
            <FormMetas metas={resolverMetas(activo.metas)} guardar={(metas) => actualizar((p) => ({ ...p, metas }))} />
          </BloquePaso>
          <BloquePaso paso={p04} ancho="completo" tarjeta={tarjetaDePaso(etapa, 3)} descripcion={DESCRIPCION_PASO_ETAPA0[p04.id]}>
            <FormUso uso={activo.uso} guardar={(uso) => actualizar((p) => ({ ...p, uso }))} />
          </BloquePaso>
        </>
      )}
    </SeccionEtapa>
  );
}
