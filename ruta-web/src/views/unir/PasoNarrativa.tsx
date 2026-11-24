import { useState, type FormEvent } from 'react';
import { CampoArea, CampoTexto } from '../../components/ui/Campo';
import { useBorrador } from '../../hooks/useBorrador';
import { useProyecto } from '../../estado/ProyectoContexto';
import type { NarrativaCambio } from '../../lib/modelo/tipos';
import formulario from '../etapa0/formulario.module.css';
import { PieFormulario } from '../etapa0/PieFormulario';
import { MENSAJE_SIN_ESPACIO } from '../reconocer/ayudas';
import estilos from '../reconocer/reconocer.module.css';

type BorradorNarrativa = NarrativaCambio;

function origenNarrativa(datos: ReturnType<typeof useProyecto>['datos']): BorradorNarrativa {
  if (datos.narrativaCambio) return datos.narrativaCambio;

  const motivos = datos.lienzo.urgencia
    .map(({ motivo, dato }) => [motivo, dato && `Dato: ${dato}`].filter(Boolean).join(' — '))
    .filter(Boolean);
  if (datos.triaje?.consecuencia_no_cambiar) motivos.push(`Si no se hace: ${datos.triaje.consecuencia_no_cambiar}`);
  const beneficios = datos.lienzo.beneficios.map(({ grupo, beneficio }) => `${grupo}: ${beneficio}`).filter((texto) => texto !== ': ');
  const camino = [
    datos.lienzo.que_cambia && `Qué cambia: ${datos.lienzo.que_cambia}`,
    datos.lienzo.que_no_cambia && `Qué se mantiene: ${datos.lienzo.que_no_cambia}`,
  ].filter(Boolean);

  return {
    portavoz_codigo: '',
    de_donde_venimos: motivos.join('\n'),
    hacia_donde_vamos: [datos.lienzo.vision, ...beneficios].filter(Boolean).join('\n'),
    como_sera_el_camino: camino.join('\n'),
  };
}

export function PasoNarrativa() {
  const { datos, actualizarDatos } = useProyecto();
  const [errores, setErrores] = useState<string[]>([]);
  const [errorGuardado, setErrorGuardado] = useState('');
  const { borrador, editar, confirmar, estado } = useBorrador<BorradorNarrativa>(origenNarrativa(datos), async (narrativa) => {
    await actualizarDatos((d) => ({
      ...d,
      narrativaCambio: {
        portavoz_codigo: narrativa.portavoz_codigo.trim(),
        de_donde_venimos: narrativa.de_donde_venimos.trim(),
        hacia_donde_vamos: narrativa.hacia_donde_vamos.trim(),
        como_sera_el_camino: narrativa.como_sera_el_camino.trim(),
      },
    }));
  });
  const campo = <K extends keyof BorradorNarrativa>(clave: K, valor: BorradorNarrativa[K]) =>
    editar((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setErrorGuardado('');
    const faltantes = [
      !borrador.de_donde_venimos.trim() && 'Completa de dónde venimos y por qué ya no basta.',
      !borrador.hacia_donde_vamos.trim() && 'Describe hacia dónde vamos y qué beneficios trae.',
      !borrador.como_sera_el_camino.trim() && 'Explica cómo será el camino y qué acompañamiento habrá.',
    ].filter((falta): falta is string => Boolean(falta));
    setErrores(faltantes);
    if (faltantes.length > 0) return;
    try {
      await confirmar();
    } catch {
      setErrorGuardado(MENSAJE_SIN_ESPACIO);
    }
  };

  return (
    <form className={formulario.formulario} onSubmit={(e) => void guardar(e)}>
      <p className={estilos.nota}>
        Usa el resultado de U1 para escoger quién presenta el mensaje. La narrativa se puede completar con la información registrada en R1 y R2.
      </p>
      <div className={formulario.rejilla}>
        <CampoTexto
          etiqueta="Código del vocero"
          ayuda="Usa el mismo código registrado en la encuesta de liderazgo; no hace falta escribir su nombre."
          value={borrador.portavoz_codigo}
          onChange={(e) => campo('portavoz_codigo', e.target.value)}
        />
        <div className={formulario.ancho}>
          <CampoArea
            etiqueta="De dónde venimos y por qué ya no basta"
            ayuda="Explica las razones internas o externas y el riesgo de mantener la situación actual."
            required
            value={borrador.de_donde_venimos}
            onChange={(e) => campo('de_donde_venimos', e.target.value)}
          />
        </div>
        <div className={formulario.ancho}>
          <CampoArea
            etiqueta="Hacia dónde vamos: visión y esperanza"
            ayuda="Describe el futuro deseado y sus beneficios para las personas, los clientes y la organización."
            required
            value={borrador.hacia_donde_vamos}
            onChange={(e) => campo('hacia_donde_vamos', e.target.value)}
          />
        </div>
        <div className={formulario.ancho}>
          <CampoArea
            etiqueta="Cómo será el camino: transición y transparencia"
            ayuda="Aclara las etapas, qué cambia, qué se mantiene y cómo se acompañará a las personas."
            required
            value={borrador.como_sera_el_camino}
            onChange={(e) => campo('como_sera_el_camino', e.target.value)}
          />
        </div>
      </div>
      {errorGuardado && <p className={estilos.aviso} role="alert">{errorGuardado}</p>}
      <PieFormulario estado={estado} errores={errores} />
    </form>
  );
}
