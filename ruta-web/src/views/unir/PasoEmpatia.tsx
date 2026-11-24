import { useState, type FormEvent } from 'react';
import { CUADRANTES_EMPATIA } from '../../config/formularios/unir';
import { EXPLICACION_EMPATIA as EX } from '../../contenido/unir';
import { useProyecto } from '../../estado/ProyectoContexto';
import { useBorrador } from '../../hooks/useBorrador';
import type { MapaEmpatia } from '../../lib/modelo/proyecto';
import { ListaEditable } from '../etapa0/ListaEditable';
import { PieFormulario } from '../etapa0/PieFormulario';
import formulario from '../etapa0/formulario.module.css';
import { MENSAJE_SIN_ESPACIO } from '../reconocer/ayudas';
import estilos from '../reconocer/reconocer.module.css';

/** U4: mapa de empatía posterior a la comunicación y estrategias de acompañamiento. */
export function PasoEmpatia() {
  const { datos, actualizarDatos } = useProyecto();
  const [error, setError] = useState('');
  const { borrador, editar, confirmar, estado } = useBorrador<MapaEmpatia>(datos.empatia, async (empatia) => actualizarDatos((d) => ({ ...d, empatia })));

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError('');
    try {
      await confirmar();
    } catch {
      setError(MENSAJE_SIN_ESPACIO);
    }
  };

  return (
    <form className={formulario.formulario} onSubmit={(e) => void enviar(e)}>
      <div className={estilos.mapaEmpatia}>
        {CUADRANTES_EMPATIA.map((c) => (
          <section key={c.clave} className={estilos.cuadranteEmpatia} aria-label={c.titulo}>
            <ListaEditable etiqueta={c.titulo} explicacion={EX.cuadrante} valores={borrador[c.clave]} alCambiar={(v) => editar((m) => ({ ...m, [c.clave]: v }))} />
            <details className={estilos.guia}>
              <summary>Ejemplos</summary>
              <ul>
                {c.ejemplos.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </details>
          </section>
        ))}
      </div>

      <ListaEditable
        etiqueta="Estrategias de acompañamiento"
        explicacion={EX.estrategias}
        valores={borrador.estrategias}
        alCambiar={(estrategias) => editar((m) => ({ ...m, estrategias }))}
      />

      {error && (
        <p className={estilos.aviso} role="alert">
          {error}
        </p>
      )}
      <PieFormulario estado={estado} />
    </form>
  );
}
