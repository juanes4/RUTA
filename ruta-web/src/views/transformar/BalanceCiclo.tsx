import { useState, type FormEvent } from 'react';
import { Boton } from '../../components/ui/Boton';
import { CampoArea } from '../../components/ui/Campo';
import { EstadoVacio } from '../../components/ui/EstadoVacio';
import { useEnvio, useRegistros } from '../../hooks/useRegistros';
import { api, formatearFechaVista, type BalanceCiclo as Balance } from '../../lib/api';
import formulario from '../etapa0/formulario.module.css';
import { MensajeEnvio } from './MensajeEnvio';
import { SelectorCiclo } from './SelectorCiclo';
import estilos from './etapaT.module.css';

/** Al cerrar cada ciclo, el responsable del cambio deja un balance: es el insumo de la etapa Analizar. */
export function BalanceCiclo() {
  const { estado: lectura, recargar } = useRegistros<{ registros: Balance[] }>('balance');
  const { estado, enviar, limpiar } = useEnvio();
  const [ciclo, setCiclo] = useState(1);
  const [meritos, setMeritos] = useState('');
  const [factores, setFactores] = useState('');
  const [dificultades, setDificultades] = useState('');

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await enviar(() => api.guardarRegistro('balance', { ciclo, meritos, factores, dificultades }), 'Balance guardado.');
    if (ok) {
      setMeritos('');
      setFactores('');
      setDificultades('');
      recargar();
    }
  };

  return (
    <div className={estilos.bloques}>
      <form className={formulario.formulario} onSubmit={guardar} onChange={limpiar}>
        <p className={estilos.texto}>Breve balance de cierre de ciclo. Es insumo directo para la etapa Analizar.</p>
        <div className={formulario.rejilla}>
          <SelectorCiclo valor={ciclo} alCambiar={setCiclo} />
        </div>
        <CampoArea etiqueta="Méritos obtenidos" value={meritos} maxLength={1500} onChange={(e) => setMeritos(e.target.value)} />
        <CampoArea etiqueta="Factores que los impulsaron" value={factores} maxLength={1500} onChange={(e) => setFactores(e.target.value)} />
        <CampoArea etiqueta="Dificultades encontradas" value={dificultades} maxLength={1500} onChange={(e) => setDificultades(e.target.value)} />
        <div className={formulario.pie}>
          <Boton type="submit" disabled={!meritos.trim() || !factores.trim() || !dificultades.trim() || estado.fase === 'enviando'}>
            Guardar balance
          </Boton>
          <MensajeEnvio estado={estado} />
        </div>
      </form>

      {lectura.fase === 'listo' &&
        (lectura.datos.registros.length === 0 ? (
          <EstadoVacio titulo="Aún no hay balances">El primero aparece aquí al guardarlo.</EstadoVacio>
        ) : (
          <ul className={estilos.lista}>
            {lectura.datos.registros.map((b) => (
              <li key={b.id}>
                <strong>Ciclo {b.ciclo}</strong>
                <span>
                  <b>Méritos:</b> {b.meritos}
                </span>
                <span>
                  <b>Factores:</b> {b.factores}
                </span>
                <span>
                  <b>Dificultades:</b> {b.dificultades}
                </span>
                <span className={estilos.apoyo}>
                  {b.nombre ?? 'Un líder'} · {formatearFechaVista(b.creadoEn)}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
