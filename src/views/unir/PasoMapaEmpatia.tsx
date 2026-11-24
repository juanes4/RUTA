import { useState, type FormEvent } from 'react';
import { Boton, BotonIcono } from '../../components/ui/Boton';
import { CampoArea, CampoTexto } from '../../components/ui/Campo';
import { useProyecto } from '../../estado/ProyectoContexto';
import type { FilaEmpatia } from '../../lib/modelo/tipos';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO } from '../reconocer/ayudas';
import estilos from '../reconocer/reconocer.module.css';

const VACIO = {
  grupo: '',
  que_oye: '',
  que_ve: '',
  piensa_siente: '',
  dice_hace: '',
  dolores: '',
  necesidades_ganancias: '',
};

const CAMPOS = [
  ['que_oye', '¿Qué oye?'],
  ['que_ve', '¿Qué ve?'],
  ['piensa_siente', '¿Qué piensa y siente?'],
  ['dice_hace', '¿Qué dice y hace?'],
  ['dolores', 'Dolores y frustraciones'],
  ['necesidades_ganancias', 'Necesidades y ganancias'],
] as const;

export function PasoMapaEmpatia() {
  const { datos, actualizarDatos } = useProyecto();
  const [borrador, setBorrador] = useState(VACIO);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError('');
    setMensaje('');
    const filaSinId = {
      grupo: borrador.grupo.trim(),
      que_oye: borrador.que_oye.trim(),
      que_ve: borrador.que_ve.trim(),
      piensa_siente: borrador.piensa_siente.trim(),
      dice_hace: borrador.dice_hace.trim(),
      dolores: borrador.dolores.trim(),
      necesidades_ganancias: borrador.necesidades_ganancias.trim(),
    };
    if (!filaSinId.grupo) {
      setError('Indica el grupo o área, sin nombres de personas.');
      return;
    }
    if (!CAMPOS.some(([campo]) => filaSinId[campo])) {
      setError('Completa al menos una parte del mapa de empatía.');
      return;
    }
    const fila: FilaEmpatia = { id: crypto.randomUUID(), ...filaSinId };
    try {
      await actualizarDatos((d) => ({ ...d, mapaEmpatia: [...d.mapaEmpatia, fila] }));
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
      return;
    }
    setBorrador(VACIO);
    setMensaje('Mapa guardado.');
  };

  const quitar = async (id: string) => {
    setError('');
    try {
      await actualizarDatos((d) => ({ ...d, mapaEmpatia: d.mapaEmpatia.filter((fila) => fila.id !== id) }));
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
    }
  };

  return (
    <div className={estilos.resultados}>
      <p className={estilos.nota}>Aplica este mapa después de comunicar el cambio. Registra las percepciones por grupo o área, no por nombre de persona.</p>
      <form className={formulario.formulario} onSubmit={(e) => void guardar(e)}>
        <div className={formulario.rejilla}>
          <CampoTexto
            etiqueta="Grupo o área"
            ayuda="Por ejemplo, colaboradores operativos o equipo administrativo."
            required
            value={borrador.grupo}
            onChange={(e) => setBorrador((actual) => ({ ...actual, grupo: e.target.value }))}
          />
          {CAMPOS.map(([campo, etiqueta]) => (
            <div key={campo} className={formulario.ancho}>
              <CampoArea
                etiqueta={etiqueta}
                value={borrador[campo]}
                onChange={(e) => setBorrador((actual) => ({ ...actual, [campo]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {error && <p className={estilos.aviso} role="alert">{error}</p>}
        <div className={formulario.pie}>
          <Boton type="submit">Guardar mapa</Boton>
          <span className={estilos.mensaje} aria-live="polite">{mensaje}</span>
        </div>
      </form>

      <section className={estilos.bloque} aria-labelledby="mapas-registrados">
        <h3 id="mapas-registrados" className={estilos.tituloBloque}>Mapas registrados ({datos.mapaEmpatia.length})</h3>
        {datos.mapaEmpatia.length === 0 ? (
          <p className={estilos.nota}>Todavía no hay mapas registrados.</p>
        ) : (
          <div className={estilos.resultados}>
            {datos.mapaEmpatia.map((fila, i) => (
              <article key={fila.id} className={estilos.bloque}>
                <h4>{fila.grupo}</h4>
                <dl>
                  {CAMPOS.map(([campo, etiqueta]) => fila[campo] && (
                    <div key={campo}>
                      <dt><strong>{etiqueta}</strong></dt>
                      <dd>{fila[campo]}</dd>
                    </div>
                  ))}
                </dl>
                <BotonIcono accion="quitar" etiqueta={`Quitar mapa de ${fila.grupo}`} onClick={() => void quitar(fila.id)} />
                <span className="solo-lectores">Mapa {i + 1}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
