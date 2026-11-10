import { FichaPaso } from '../../components/etapa/FichaPaso';
import { BloquePaso, SeccionEtapa } from '../../components/etapa/SeccionEtapa';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { tarjetaDePaso, type Etapa } from '../../config/etapas';
import { ACCIONES_POR_BLOQUEO, DESCRIPCION_ETAPA, FICHAS } from '../../contenido/pasos';
import { useProyecto } from '../../estado/ProyectoContexto';
import { NOMBRE_DIMENSION, ORDEN_ADKAR } from '../../lib/modelo/tipos';
import estilos from './VistaUnir.module.css';

interface Props {
  etapa: Etapa;
}

/** Etapa U. U1–U4 explican el ciclo; U5 muestra indicadores. */
export function VistaUnir({ etapa }: Props) {
  const { activo, datos } = useProyecto();
  const ciclosConUso = new Set(datos.uso.map((u) => u.ciclo)).size;

  return (
    <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id] ?? ''}>
      {etapa.pasos.map((paso, indice) => {
        const ficha = FICHAS[paso.id];
        const ancho = paso.id === 'U1' || paso.id === 'U5' ? 'completo' : 'medio';
        return (
          <BloquePaso key={paso.id} paso={paso} ancho={ancho} tarjeta={tarjetaDePaso(etapa, indice)}>
            {ficha && <FichaPaso ficha={ficha} />}
            {paso.id === 'U1' && <TablaAcciones />}
            {paso.id === 'U5' && (
              <EstadoVacio titulo={activo ? `${ciclosConUso} ciclos con datos de uso` : 'Sin empresa registrada'}>
                {activo
                  ? 'Los indicadores con semáforo, la utilización frente a la meta por ciclo y el gráfico "dicen vs. hacen" salen del registro de uso por ciclo, el buzón 2 y la verificación de capacitación.'
                  : 'Registra la empresa y el dato de uso en la Etapa 0.'}
              </EstadoVacio>
            )}
          </BloquePaso>
        );
      })}
    </SeccionEtapa>
  );
}

function TablaAcciones() {
  return (
    <table className={estilos.tabla}>
      <caption className="solo-lectores">Acciones según el punto de bloqueo</caption>
      <thead>
        <tr>
          <th scope="col">Punto de bloqueo</th>
          <th scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {ORDEN_ADKAR.map((d) => (
          <tr key={d}>
            <th scope="row">{NOMBRE_DIMENSION[d]}</th>
            <td>{ACCIONES_POR_BLOQUEO[d]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
