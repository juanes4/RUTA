import { Pestanas } from '../../components/ui/Pestanas';
import { Dinamicas } from './Dinamicas';
import { Escalera } from './Escalera';
import { Termometro } from './Termometro';

/**
 * T3 · Plan de acompañamiento. Guía y respalda a cada área hasta que las
 * nuevas prácticas se integren a su rutina y operen de manera autónoma.
 */
export function Acompanamiento({ esLider }: { esLider: boolean }) {
  return (
    <Pestanas
      etiqueta="Matriz de acompañamiento de equipos"
      pestanas={[
        { id: 'escalera', etiqueta: '1. Votación de escalones', contenido: <Escalera esLider={esLider} /> },
        { id: 'dinamicas', etiqueta: '2. Dinámicas de equipo', contenido: <Dinamicas esLider={esLider} /> },
        { id: 'termometro', etiqueta: '3. Termómetro de apropiación', contenido: <Termometro esLider={esLider} /> },
      ]}
    />
  );
}
