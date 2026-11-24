import { CampoSeleccion } from '../../components/ui/Campo';
import { CICLOS } from '../../config/transformar';

interface Props {
  valor: number;
  alCambiar(ciclo: number): void;
  etiqueta?: string;
}

/** Ciclos de 2 semanas (hasta el día 90 caben unos 7). */
export function SelectorCiclo({ valor, alCambiar, etiqueta = 'Ciclo' }: Props) {
  return (
    <CampoSeleccion etiqueta={etiqueta} value={valor} onChange={(e) => alCambiar(Number(e.target.value))}>
      {CICLOS.map((c) => (
        <option key={c} value={c}>
          Ciclo {c}
        </option>
      ))}
    </CampoSeleccion>
  );
}
