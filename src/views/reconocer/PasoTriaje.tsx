import { useState, type FormEvent } from 'react';
import { CampoArea, CampoSeleccion } from '../../components/ui/Campo';
import { useBorrador } from '../../hooks/useBorrador';
import { useProyecto } from '../../estado/ProyectoContexto';
import type { AlcanceTriaje, TriajeCambio } from '../../lib/modelo/tipos';
import { puntajeTriaje, resumirTriaje } from '../../lib/reconocer/triaje';
import formulario from '../etapa0/formulario.module.css';
import { PieFormulario } from '../etapa0/PieFormulario';
import { MENSAJE_SIN_ESPACIO } from './ayudas';
import estilos from './reconocer.module.css';

interface BorradorTriaje {
  motivo_ahora: string;
  consecuencia_no_cambiar: string;
  poblacion_afectada: string;
  dimension_tecnica: string;
  alcance: '' | AlcanceTriaje;
  impacto_personas: string;
  complejidad_organizacional: string;
  riesgo_operativo: string;
}

const VACIO: BorradorTriaje = {
  motivo_ahora: '',
  consecuencia_no_cambiar: '',
  poblacion_afectada: '',
  dimension_tecnica: '',
  alcance: '',
  impacto_personas: '',
  complejidad_organizacional: '',
  riesgo_operativo: '',
};

const OPCIONES_IMPACTO = [
  { valor: '1', texto: 'Bajo (1): ajuste leve, sin desaprender conductas ni afectar la estabilidad laboral.' },
  { valor: '2', texto: 'Medio (2): nuevas herramientas o flujos que requieren capacitación, sin cambiar roles o equipos.' },
  { valor: '3', texto: 'Alto (3): transformación drástica, redefinición de cargos o nuevas competencias.' },
];

const OPCIONES_COMPLEJIDAD = [
  { valor: '1', texto: 'Bajo (1): impacta un elemento (p. ej., un software o procedimiento de un área).' },
  { valor: '2', texto: 'Medio (2): impacta 2 o 3 elementos simultáneamente.' },
  { valor: '3', texto: 'Alto (3): impacta 4 o más elementos y varias áreas o toda la organización.' },
];

const OPCIONES_RIESGO = [
  { valor: '1', texto: 'Bajo (1): no interrumpe operación o facturación; el equipo está dispuesto al cambio.' },
  { valor: '2', texto: 'Medio (2): genera retrasos o sobrecostos manejables; el historial es mixto.' },
  { valor: '3', texto: 'Alto (3): amenaza continuidad, servicio o seguridad; hay proyectos fallidos o fatiga de cambio.' },
];

function aBorrador(triaje: TriajeCambio | null): BorradorTriaje {
  if (!triaje) return VACIO;
  return {
    ...triaje,
    alcance: triaje.alcance,
    impacto_personas: String(triaje.impacto_personas),
    complejidad_organizacional: String(triaje.complejidad_organizacional),
    riesgo_operativo: String(triaje.riesgo_operativo),
  };
}

function aTriaje(borrador: BorradorTriaje): TriajeCambio | null {
  const impacto_personas = puntajeTriaje(borrador.impacto_personas);
  const complejidad_organizacional = puntajeTriaje(borrador.complejidad_organizacional);
  const riesgo_operativo = puntajeTriaje(borrador.riesgo_operativo);
  if (!borrador.alcance || !impacto_personas || !complejidad_organizacional || !riesgo_operativo) return null;
  return {
    motivo_ahora: borrador.motivo_ahora.trim(),
    consecuencia_no_cambiar: borrador.consecuencia_no_cambiar.trim(),
    poblacion_afectada: borrador.poblacion_afectada.trim(),
    dimension_tecnica: borrador.dimension_tecnica.trim(),
    alcance: borrador.alcance,
    impacto_personas,
    complejidad_organizacional,
    riesgo_operativo,
  };
}

export function PasoTriaje() {
  const { datos, actualizarDatos } = useProyecto();
  const [errores, setErrores] = useState<string[]>([]);
  const [errorGuardado, setErrorGuardado] = useState('');
  const { borrador, editar, confirmar, estado } = useBorrador<BorradorTriaje>(aBorrador(datos.triaje), async (valor) => {
    const triaje = aTriaje(valor);
    if (!triaje) throw new Error('Completa los criterios de puntuación y el alcance.');
    await actualizarDatos((d) => ({ ...d, triaje }));
  });
  const campo = <K extends keyof BorradorTriaje>(clave: K, valor: BorradorTriaje[K]) =>
    editar((actual) => ({ ...actual, [clave]: valor }));

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setErrorGuardado('');
    const faltantes = [
      !borrador.motivo_ahora.trim() && 'Explica por qué hay que cambiar ahora.',
      !borrador.consecuencia_no_cambiar.trim() && 'Describe qué pasa si no se hace el cambio.',
      !borrador.poblacion_afectada.trim() && 'Indica a quiénes afecta la iniciativa.',
      !borrador.dimension_tecnica.trim() && 'Describe qué dimensión técnica se afecta.',
      !borrador.alcance && 'Elige el alcance del despliegue.',
      !puntajeTriaje(borrador.impacto_personas) && 'Puntúa el impacto en las personas.',
      !puntajeTriaje(borrador.complejidad_organizacional) && 'Puntúa la complejidad organizacional.',
      !puntajeTriaje(borrador.riesgo_operativo) && 'Puntúa el riesgo operativo.',
    ].filter((falta): falta is string => Boolean(falta));
    setErrores(faltantes);
    if (faltantes.length > 0) return;
    try {
      await confirmar();
    } catch {
      setErrorGuardado(MENSAJE_SIN_ESPACIO);
    }
  };

  const resultado = aTriaje(aBorrador(datos.triaje));
  const recomendacion = resultado ? resumirTriaje(resultado) : null;

  return (
    <div className={estilos.resultados}>
      <form className={formulario.formulario} onSubmit={(e) => void guardar(e)}>
        <section className={estilos.bloque} aria-labelledby="triaje-contexto">
          <h3 id="triaje-contexto" className={estilos.tituloBloque}>
            Contexto y alcance
          </h3>
          <div className={formulario.rejilla}>
            <div className={formulario.ancho}>
              <CampoArea
                etiqueta="¿Por qué hay que cambiar ahora?"
                required
                value={borrador.motivo_ahora}
                onChange={(e) => campo('motivo_ahora', e.target.value)}
              />
            </div>
            <div className={formulario.ancho}>
              <CampoArea
                etiqueta="¿Qué pasa si no se hace?"
                required
                value={borrador.consecuencia_no_cambiar}
                onChange={(e) => campo('consecuencia_no_cambiar', e.target.value)}
              />
            </div>
            <div className={formulario.ancho}>
              <CampoArea
                etiqueta="¿A quiénes y a cuántas personas les cambia la rutina o el trabajo?"
                required
                value={borrador.poblacion_afectada}
                onChange={(e) => campo('poblacion_afectada', e.target.value)}
              />
            </div>
            <div className={formulario.ancho}>
              <CampoArea
                etiqueta="¿Afecta procesos, herramientas tecnológicas, estructura u objetivos del negocio?"
                required
                value={borrador.dimension_tecnica}
                onChange={(e) => campo('dimension_tecnica', e.target.value)}
              />
            </div>
            <CampoSeleccion etiqueta="Alcance del despliegue" required value={borrador.alcance} onChange={(e) => campo('alcance', e.target.value as BorradorTriaje['alcance'])}>
              <option value="">Elegir…</option>
              <option value="piloto">Equipo puntual (piloto)</option>
              <option value="departamento">Departamento completo</option>
              <option value="organizacion">Toda la organización</option>
            </CampoSeleccion>
          </div>
        </section>

        <section className={estilos.bloque} aria-labelledby="triaje-puntajes">
          <h3 id="triaje-puntajes" className={estilos.tituloBloque}>Puntuación (1 = bajo, 2 = medio, 3 = alto)</h3>
          <div className={formulario.rejilla}>
            <CampoSeleccion
              etiqueta="Impacto en las personas"
              ayuda="¿En qué medida altera la rutina diaria, los roles o la zona de confort de las personas afectadas?"
              required
              value={borrador.impacto_personas}
              onChange={(e) => campo('impacto_personas', e.target.value)}
            >
              <option value="">Elegir…</option>
              {OPCIONES_IMPACTO.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>)}
            </CampoSeleccion>
            <CampoSeleccion
              etiqueta="Complejidad organizacional"
              ayuda="Cuenta los elementos simultáneos: estrategia, estructura, sistemas, habilidades, liderazgo y valores."
              required
              value={borrador.complejidad_organizacional}
              onChange={(e) => campo('complejidad_organizacional', e.target.value)}
            >
              <option value="">Elegir…</option>
              {OPCIONES_COMPLEJIDAD.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>)}
            </CampoSeleccion>
            <CampoSeleccion
              etiqueta="Riesgo operativo"
              ayuda="Considera qué pasa si falla la adopción y el historial de cambios de los equipos involucrados."
              required
              value={borrador.riesgo_operativo}
              onChange={(e) => campo('riesgo_operativo', e.target.value)}
            >
              <option value="">Elegir…</option>
              {OPCIONES_RIESGO.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>)}
            </CampoSeleccion>
          </div>
        </section>
        {errorGuardado && <p className={estilos.aviso} role="alert">{errorGuardado}</p>}
        <PieFormulario estado={estado} errores={errores} />
      </form>

      {recomendacion && (
        <section className={estilos.bloque} aria-labelledby="triaje-ruta">
          <h3 id="triaje-ruta" className={estilos.tituloBloque}>Ruta sugerida</h3>
          <p>
            Puntaje total: <strong className="numero">{recomendacion.puntaje} de 9</strong> · {recomendacion.nombre}
          </p>
          <p className={estilos.nota}>{recomendacion.descripcion}</p>
        </section>
      )}
    </div>
  );
}
