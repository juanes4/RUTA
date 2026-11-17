import { Boton } from '../../components/ui/Boton';
import { TEXTO_ESTADO_GUARDADO } from '../../hooks/useBorrador';
import estilos from './formulario.module.css';

interface Props {
  estado: keyof typeof TEXTO_ESTADO_GUARDADO;
  errores?: readonly string[];
}

export function PieFormulario({ estado, errores = [] }: Props) {
  return (
    <>
      {errores.length > 0 && (
        <ul className={estilos.errores} role="alert">
          {errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className={estilos.pie}>
        <Boton type="submit" disabled={estado === 'guardando'}>
          Guardar
        </Boton>
        <span className={estilos.estado} aria-live="polite">
          {TEXTO_ESTADO_GUARDADO[estado]}
        </span>
      </div>
    </>
  );
}
