import { Pestanas } from '../../components/ui/Pestanas';
import {
  CIERRE_VICTORIAS,
  DEFINICION_VICTORIA,
  FUNCIONES_VICTORIAS,
  MATRIZ_RECONOCIMIENTO,
  PASOS_VICTORIAS,
} from '../../config/transformar';
import { BalanceCiclo } from './BalanceCiclo';
import { FormMerito } from './FormMerito';
import { MeritosRegistrados } from './MeritosRegistrados';
import estilos from './etapaT.module.css';

/**
 * T4 · Victorias tempranas. Cuatro pasos: identificar (FIMT), valorar (MRMT),
 * reconocer y divulgar. Las registra el responsable del cambio (líder); todas
 * las personas ven los méritos publicados.
 */
export function Victorias({ esLider }: { esLider: boolean }) {
  const pestanas = [
    { id: 'pasos', etiqueta: 'Los 4 pasos', contenido: <Pasos /> },
    ...(esLider ? [{ id: 'registrar', etiqueta: 'Registrar un mérito', contenido: <FormMerito /> }] : []),
    { id: 'meritos', etiqueta: esLider ? 'Méritos registrados' : 'Méritos publicados', contenido: <MeritosRegistrados esLider={esLider} /> },
    ...(esLider ? [{ id: 'balance', etiqueta: 'Balance del ciclo', contenido: <BalanceCiclo /> }] : []),
  ];
  return <Pestanas etiqueta="Victorias tempranas" pestanas={pestanas} />;
}

function Pasos() {
  return (
    <div className={estilos.bloques}>
      <p className={estilos.texto}>
        Este nivel reconoce los primeros logros del proceso, aunque aún no se haya alcanzado el objetivo final. Cumple dos funciones clave:
      </p>
      <ul className={estilos.lista}>
        {FUNCIONES_VICTORIAS.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <p className={estilos.destacado}>{DEFINICION_VICTORIA}</p>

      <h3 className={estilos.subtitulo}>Los cuatro pasos</h3>
      <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Pasos de las victorias tempranas">
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">N.º</th>
              <th scope="col">Paso</th>
              <th scope="col">¿Qué se hace?</th>
              <th scope="col">Herramienta</th>
            </tr>
          </thead>
          <tbody>
            {PASOS_VICTORIAS.map((p) => (
              <tr key={p.n}>
                <td className="numero">{p.n}</td>
                <th scope="row">{p.paso}</th>
                <td>{p.queSeHace}</td>
                <td>{p.herramienta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className={estilos.subtitulo}>Matriz de reconocimiento</h3>
      <p className={estilos.texto}>
        Esta tabla permite interpretar el puntaje obtenido en la valoración para definir la acción de gestión más adecuada: clasifica el grado de
        avance de las personas o equipos y da una guía clara sobre cómo reconocer sus logros.
      </p>
      <div className={estilos.envolturaTabla} tabIndex={0} role="region" aria-label="Matriz de reconocimiento">
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Puntaje</th>
              <th scope="col">Clasificación</th>
              <th scope="col">¿Qué hacer?</th>
            </tr>
          </thead>
          <tbody>
            {MATRIZ_RECONOCIMIENTO.map((m) => (
              <tr key={m.id}>
                <td className="numero">{m.puntaje}</td>
                <th scope="row">{m.clasificacion}</th>
                <td>{m.queHacer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={estilos.texto}>{CIERRE_VICTORIAS}</p>
    </div>
  );
}
