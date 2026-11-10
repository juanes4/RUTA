import { FichaPaso } from '../../components/etapa/FichaPaso';
import { BloquePaso, SeccionEtapa } from '../../components/etapa/SeccionEtapa';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { tarjetaDePaso, type Etapa } from '../../config/etapas';
import { REGLAS } from '../../config/reglas';
import { DESCRIPCION_ETAPA, FICHAS } from '../../contenido/pasos';
import { useProyecto } from '../../estado/ProyectoContexto';
import { contarPersonas } from '../../lib/calculo/estadistica';

interface Props {
  etapa: Etapa;
}

/** Etapa R. R1–R5 son pasos de taller (fichas); R6 y R7 muestran datos. */
export function VistaReconocer({ etapa }: Props) {
  const { activo, datos } = useProyecto();
  const personasBuzon1 = contarPersonas(datos.respuestas.filter((r) => r.instrumento === 'buzon1'));
  const personasKotterA = contarPersonas(datos.kotter.filter((k) => k.parte === 'A'));

  return (
    <SeccionEtapa etapa={etapa} descripcion={DESCRIPCION_ETAPA[etapa.id] ?? ''}>
      {etapa.pasos.map((paso, indice) => {
        const ficha = FICHAS[paso.id];
        const conDatos = paso.id === 'R6' || paso.id === 'R7';
        return (
          <BloquePaso key={paso.id} paso={paso} ancho={conDatos ? 'completo' : 'medio'} tarjeta={tarjetaDePaso(etapa, indice)}>
            {ficha && <FichaPaso ficha={ficha} />}
            {paso.id === 'R6' && (
              <EstadoVacio titulo={activo ? `${personasBuzon1} personas han respondido el buzón 1` : 'Sin empresa registrada'}>
                {activo
                  ? `El mapa de calor ADKAR, el punto de bloqueo, el % favorable, el % "No sé" y la participación salen del buzón 1. Cada grupo necesita al menos ${REGLAS.anonimato.minimoColaboradores} personas para mostrarse.`
                  : 'Registra la empresa, sus áreas y sus afectados en la Etapa 0.'}
              </EstadoVacio>
            )}
            {paso.id === 'R7' && (
              <EstadoVacio
                titulo={activo ? `${personasKotterA} personas han respondido el chequeo Kotter parte A` : 'Sin empresa registrada'}
              >
                {activo
                  ? `La recomendación necesita el buzón 1 (puntos de bloqueo por grupo) y el chequeo Kotter parte A (puntaje de los 8 pasos), con al menos ${REGLAS.anonimato.minimoKotter} personas por rol.`
                  : 'Registra la empresa en la Etapa 0.'}
              </EstadoVacio>
            )}
          </BloquePaso>
        );
      })}
    </SeccionEtapa>
  );
}
