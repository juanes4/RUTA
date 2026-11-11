import { BotonIcono } from '../../components/ui/Boton';
import { CampoSeleccion } from '../../components/ui/Campo';
import { useProyecto } from '../../estado/ProyectoContexto';
import type { Proyecto } from '../../lib/modelo/proyecto';
import estilos from './formulario.module.css';

function nombreDe(proyecto: Proyecto): string {
  return proyecto.empresa.nombre.trim() || 'Empresa sin nombre';
}

/** Un proyecto por empresa o cambio (PLAN §5). El + queda a la altura del campo, no de la etiqueta. */
export function SelectorProyecto() {
  const { proyectos, activo, crear, seleccionar } = useProyecto();

  return (
    <div className={estilos.filaControles}>
      <div className={estilos.selector}>
        <CampoSeleccion etiqueta="Empresa registrada" value={activo?.id ?? ''} onChange={(e) => seleccionar(e.target.value)}>
          {proyectos.map((p) => (
            <option key={p.id} value={p.id}>
              {nombreDe(p)}
            </option>
          ))}
        </CampoSeleccion>
      </div>
      <BotonIcono accion="agregar" etiqueta="Registrar otra empresa" etiquetaVisible onClick={() => void crear()} />
    </div>
  );
}
