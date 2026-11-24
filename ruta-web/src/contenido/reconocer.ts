/**
 * Textos de los formularios de la etapa Reconocer (RUTA_ANDI_R_U.md).
 * Regla: la actividad se hace en taller o en papel; aquí se registra el
 * resultado para poder medirlo y usarlo en los pasos siguientes.
 */

/** Qué se registra en cada paso, bajo el título. */
export const DESCRIPCION_PASO_R: Readonly<Record<string, string>> = {
  R1: 'El lienzo se hace con post-it y aquí se registra su resultado. Es interno: lo usa el equipo de cambio y alimenta la narrativa de la etapa Unir.',
  R2: 'Responde las preguntas orientadoras y puntúa los tres criterios. La herramienta suma el puntaje y asigna la ruta con el semáforo.',
  R3: 'Registra cada fortaleza, oportunidad, debilidad y amenaza con su puntaje. La herramienta suma cada cuadrante y ubica la estrategia.',
  R4: 'Registra los actores en tres pasos: quiénes son y qué necesitan, su poder e interés, y su compromiso de hoy frente al que se necesita.',
  R5: 'Los colaboradores responden en papel o en Google Forms. El papel se digita aquí; lo de Google Forms se carga como CSV o llega en línea desde el Apps Script del formulario.',
};

export const EXPLICACION_LIENZO = {
  motivo: 'Por qué hay que cambiar ahora.',
  dato: 'El número o hecho que respalda este motivo.',
  afectados: 'Quiénes viven el cambio, por área o cargo, y cuánto les cambia el trabajo. No escribas nombres de colaboradores.',
  vision: 'Cómo será el día a día cuando el cambio funcione, en una sola frase.',
  que_cambia: 'Las tareas que serán distintas en el trabajo diario.',
  que_no_cambia: 'Lo que se mantiene igual. Decirlo reduce la incertidumbre.',
  grupo: 'Área o cargo que recibe el beneficio.',
  beneficio: 'Qué gana ese grupo con el cambio.',
  criterio: 'Lo que se va a observar para saber que el cambio funcionó.',
  meta: 'El número que lo confirma, por ejemplo "90 % de los pedidos en el sistema nuevo".',
  riesgos: 'Lo que puede hacer fallar el cambio. Agrega uno por uno.',
  intentos: 'Cambios parecidos que no funcionaron y por qué. Si no hubo, escribe "Ninguno".',
} as const;

export const EXPLICACION_TRIAJE = {
  elementos: 'Marca cada elemento de la organización que el cambio impacta. El puntaje de complejidad sale de cuántos marques.',
  alcance: 'No suma puntos: indica dónde se despliega el cambio.',
} as const;

export const EXPLICACION_FODA = {
  cuadrante: 'Fortaleza y Debilidad son internas a la organización; Oportunidad y Amenaza vienen de afuera.',
  item: 'Un hecho sobre el cambio. Usa la matriz de preguntas como guía.',
  puntaje: 'Qué tan importante es el ítem para el cambio, de 1 (poco) a 5 (mucho).',
} as const;

export const EXPLICACION_ACTORES = {
  actor: 'El actor o grupo, por su cargo o función. No escribas nombres de colaboradores.',
  descripcion: 'Qué papel cumple frente al cambio.',
  necesidades: 'Qué necesita o espera del cambio. Pregunte directamente a los grupos que pueda.',
  poder: 'Capacidad de decidir, frenar el proyecto o asignar recursos.',
  interes: 'Qué tanto le afecta o le importa el resultado del cambio.',
  realidad: 'Cómo es este actor hoy en su empresa: ajuste la redacción general a su realidad.',
  actual: 'C: dónde está hoy este grupo frente al cambio.',
  deseado: 'D: dónde necesita estar para que el cambio funcione.',
} as const;

export const EXPLICACION_BUZON1 = {
  area: 'Área de quien respondió, de las registradas en la Etapa 0. Con el grupo, es todo lo que se guarda de quien responde: el buzón es anónimo.',
  grupo: 'Tipo de rol de quien respondió. Es opcional. Los resultados se separan por área o por grupo, nunca por los dos a la vez, para que nadie quede reconocible.',
  archivo: 'El CSV que descargas de Google Forms o de Google Sheets, o uno con las columnas de la plantilla.',
  buzonForms: 'El mismo texto que pusiste en BUZON_ID dentro del Apps Script del formulario. Letras, números, - y _.',
} as const;
