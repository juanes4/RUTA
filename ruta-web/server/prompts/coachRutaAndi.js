/**
 * System prompt para el Coach de Comunicación para Líderes (RUTA ANDI - Paso U3).
 */

export const ESTILOS_U1 = {
  A: 'Directo y Estructurado (A)',
  B: 'Participativo y Colaborativo (B)',
  C: 'Transformacional e Inspirador (C)',
  D: 'Delegativo y Autónomo (D)',
};

const INSTRUCCIONES_BASE = `ROL Y CONTEXTO
Eres el Coach de Comunicación para Líderes de la metodología RUTA ANDI (paso U3: Soporte para líderes). Tu objetivo es ayudar a mandos medios y jefes de área a manejar conversaciones reales con sus equipos durante un proceso de cambio organizacional.

REGLA DE ORO (ESTRICTA)
- Responde ÚNICAMENTE con base en la información oficial de los documentos cargados (Ficha del cambio R1, Narrativa oficial U2, Banco de FAQs aprobadas, Mapa de empatía U4 y hallazgos del Buzón R5).
- Si no hay documentos cargados, pídele amablemente al usuario que los suba o pegue antes de dar respuestas sobre el proceso.
- Si una pregunta no tiene respuesta en los documentos, NUNCA inventes datos, fechas, bonos ni garantías. Di claramente que no hay información oficial y propón escalar la consulta.
- No des asesoría legal ni laboral, no prometas estabilidad laboral (salvo que esté garantizada explícitamente en los documentos) y no opines sobre decisiones de la dirección.

ADAPTACIÓN AL ESTILO DE LIDERAZGO (ENCUESTA U1)
Adapta el tono de las frases sugeridas al estilo del jefe (si no viene en el contexto, pregúntale brevemente su área y estilo U1):
- Directo y Estructurado (A): Frases concisas, claras y orientadas a la acción.
- Participativo y Colaborativo (B): Frases que abran el diálogo y validen la opinión del equipo.
- Transformacional e Inspirador (C): Frases que conecten la tarea con el propósito y la visión futura.
- Delegativo y Autónomo (D): Guiones estructurados que den claridad sin dejar vacíos de información.

CLASIFICACIÓN INTERNA DE LA CONSULTA
1. Cubierta por información oficial: Responde con el dato exacto.
2. Emocional: Prioriza la empatía y la contención.
3. Sin respuesta oficial: Da una frase de transparencia ("lo averiguo y te confirmo") y genera la ficha de escalamiento.
4. Resistencia abierta: Guía al jefe para explorar la causa raíz antes de confrontar.
5. Sensible o crítica (acoso, riesgo de seguridad, amenaza de renuncia masiva): Indica de inmediato que excede al coach y debe escalarse de forma urgente a Gestión del Cambio y RR. HH.

FORMATO OBLIGATORIO DE RESPUESTA (5 PARTES)
Tono cercano, práctico y breve:
1. Validación: Valida brevemente la preocupación del colaborador.
2. Información oficial: Qué dicen los documentos (o aclara si no está definido).
3. Frase sugerida: Propuesta adaptable al estilo del jefe (recuérdale usarla como punto de partida).
4. Qué evitar: Errores o promesas vacías que debe evitar.
5. Siguiente paso: Pregunta si quiere ensayar la conversación o escalar la duda.

PROTOCOLO DE ESCALAMIENTO Y CONFIDENCIALIDAD
Si no hay respuesta oficial, entrega este JSON listo para copiar (recordando NO incluir nombres propios):
{
  "fecha": "[Fecha actual]",
  "area": "[Área del jefe]",
  "pregunta": "[Resumen anónimo de la duda]",
  "tipo": "sin_respuesta_oficial",
  "estado": "pendiente",
  "respuesta_oficial": null
}

MODO ENSAYO (JUEGO DE ROLES)
- Si el jefe escribe "quiero practicar" (o similar), adopta el rol de un colaborador usando los temores y perfiles del Mapa de Empatía (U4) y el Buzón (R5) (asustado, escéptico o enojado).
- Mantente en personaje hasta que escriba "terminar".
- Al terminar, sal del personaje y da retroalimentación breve: qué funcionó, qué sonó a promesa vacía y qué podría decir distinto.`;

const textoLimpio = (valor) => (typeof valor === 'string' ? valor.trim() : '');

const listaLimpia = (arr) =>
  Array.isArray(arr) ? arr.map((x) => textoLimpio(x)).filter(Boolean) : [];

/**
 * Formatea los documentos oficiales de RUTA ANDI (R1, U2, FAQs U3, U4, R5 y anexos)
 * a un bloque de texto estructurado y lista las fuentes con información real.
 */
export function formatearDocumentosOficiales(documentosOficiales) {
  if (!documentosOficiales) {
    return { texto: '', detectados: [] };
  }

  if (typeof documentosOficiales === 'string') {
    const limpio = documentosOficiales.trim();
    return {
      texto: limpio,
      detectados: limpio ? ['Documentos cargados'] : [],
    };
  }

  const secciones = [];
  const detectados = [];

  // Ficha del cambio (Etapa 0 + R1 Lienzo)
  const empresa = documentosOficiales.empresa ?? {};
  const r1 = documentosOficiales.r1Lienzo ?? documentosOficiales.lienzo ?? {};
  const lineasR1 = [];

  if (textoLimpio(empresa.nombre)) lineasR1.push(`- Empresa: ${textoLimpio(empresa.nombre)}`);
  if (textoLimpio(empresa.sector)) lineasR1.push(`- Sector: ${textoLimpio(empresa.sector)}`);
  if (textoLimpio(empresa.que_cambia)) lineasR1.push(`- Qué cambia (resumen): ${textoLimpio(empresa.que_cambia)}`);
  if (textoLimpio(empresa.fecha_lanzamiento)) lineasR1.push(`- Fecha estimada de lanzamiento: ${textoLimpio(empresa.fecha_lanzamiento)}`);

  if (Array.isArray(r1.urgencia)) {
    const urg = r1.urgencia
      .map((u) => [textoLimpio(u?.motivo), textoLimpio(u?.dato)].filter(Boolean).join(' — '))
      .filter(Boolean);
    if (urg.length) lineasR1.push(`- Motivos de urgencia: ${urg.join('; ')}`);
  }
  if (textoLimpio(r1.afectados)) lineasR1.push(`- Quiénes se ven afectados: ${textoLimpio(r1.afectados)}`);
  if (textoLimpio(r1.vision)) lineasR1.push(`- Visión del cambio: ${textoLimpio(r1.vision)}`);
  if (textoLimpio(r1.que_cambia)) lineasR1.push(`- Qué cambia: ${textoLimpio(r1.que_cambia)}`);
  if (textoLimpio(r1.que_no_cambia)) lineasR1.push(`- Qué NO cambia: ${textoLimpio(r1.que_no_cambia)}`);
  if (Array.isArray(r1.beneficios)) {
    const ben = r1.beneficios
      .map((b) => [textoLimpio(b?.grupo), textoLimpio(b?.beneficio)].filter(Boolean).join(': '))
      .filter(Boolean);
    if (ben.length) lineasR1.push(`- Beneficios por grupo: ${ben.join('; ')}`);
  }
  if (Array.isArray(r1.criterios)) {
    const crit = r1.criterios
      .map((c) => [textoLimpio(c?.criterio), textoLimpio(c?.meta)].filter(Boolean).join(' (Meta: ') + (textoLimpio(c?.meta) ? ')' : ''))
      .filter((s) => s && s !== '()');
    if (crit.length) lineasR1.push(`- Criterios de éxito: ${crit.join('; ')}`);
  }
  const riesgos = listaLimpia(r1.riesgos);
  if (riesgos.length) lineasR1.push(`- Riesgos identificados: ${riesgos.join('; ')}`);
  const previos = listaLimpia(r1.intentos_previos);
  if (previos.length) lineasR1.push(`- Intentos previos: ${previos.join('; ')}`);

  if (lineasR1.length) {
    detectados.push('Ficha del cambio (R1)');
    secciones.push(`### FICHA DEL CAMBIO (R1 · LIENZO)\n${lineasR1.join('\n')}`);
  }

  // Narrativa oficial (U2)
  const u2 = documentosOficiales.u2Narrativa ?? documentosOficiales.narrativa ?? {};
  const lineasU2 = [];
  if (textoLimpio(u2.vocero)) lineasU2.push(`- Vocero oficial (código/cargo): ${textoLimpio(u2.vocero)}`);
  if (textoLimpio(u2.urgencia)) lineasU2.push(`- De dónde venimos / por qué cambia: ${textoLimpio(u2.urgencia)}`);
  if (textoLimpio(u2.vision)) lineasU2.push(`- Hacia dónde vamos: ${textoLimpio(u2.vision)}`);
  if (textoLimpio(u2.que_cambia)) lineasU2.push(`- Qué cambia en el día a día: ${textoLimpio(u2.que_cambia)}`);
  if (textoLimpio(u2.que_se_mantiene)) lineasU2.push(`- Qué se mantiene igual: ${textoLimpio(u2.que_se_mantiene)}`);
  if (textoLimpio(u2.acompanamiento)) lineasU2.push(`- Acompañamiento previsto: ${textoLimpio(u2.acompanamiento)}`);
  if (textoLimpio(u2.que_gano)) lineasU2.push(`- Qué gana el equipo: ${textoLimpio(u2.que_gano)}`);

  if (lineasU2.length) {
    detectados.push('Narrativa oficial (U2)');
    secciones.push(`### NARRATIVA OFICIAL (U2)\n${lineasU2.join('\n')}`);
  }

  // Banco de FAQs aprobadas y guía de soporte (U3)
  const u3 = documentosOficiales.u3Soporte ?? documentosOficiales.soporte ?? {};
  const lineasU3 = [];
  const mensajes = listaLimpia(u3.mensajes);
  if (mensajes.length) {
    lineasU3.push('- Mensajes clave aprobados:');
    for (const m of mensajes) lineasU3.push(`  * ${m}`);
  }
  if (Array.isArray(u3.preguntas)) {
    const faqs = u3.preguntas
      .map((p) => ({ pregunta: textoLimpio(p?.pregunta), respuesta: textoLimpio(p?.respuesta) }))
      .filter((p) => p.pregunta || p.respuesta);
    if (faqs.length) {
      lineasU3.push('- Banco de preguntas frecuentes (FAQs) aprobadas:');
      for (const f of faqs) {
        lineasU3.push(`  * P: ${f.pregunta || '(sin pregunta)'} | R: ${f.respuesta || '(sin respuesta definida)'}`);
      }
    }
  }
  const pautas = listaLimpia(u3.pautas);
  if (pautas.length) {
    lineasU3.push('- Pautas de conversación:');
    for (const p of pautas) lineasU3.push(`  * ${p}`);
  }

  if (lineasU3.length) {
    detectados.push('FAQs y soporte (U3)');
    secciones.push(`### BANCO DE FAQs Y SOPORTE PARA LÍDERES (U3)\n${lineasU3.join('\n')}`);
  }

  // Mapa de empatía (U4)
  const u4 = documentosOficiales.u4Empatia ?? documentosOficiales.empatia ?? {};
  const camposU4 = [
    ['Qué oye el equipo', listaLimpia(u4.oye)],
    ['Qué ve el equipo', listaLimpia(u4.ve)],
    ['Qué piensa y siente', listaLimpia(u4.piensa_siente)],
    ['Qué dice y hace', listaLimpia(u4.dice_hace)],
    ['Dolores y temores', listaLimpia(u4.dolores)],
    ['Necesidades', listaLimpia(u4.necesidades)],
    ['Estrategias de acompañamiento', listaLimpia(u4.estrategias)],
  ].filter(([, items]) => items.length > 0);

  if (camposU4.length) {
    detectados.push('Mapa de empatía (U4)');
    secciones.push(`### MAPA DE EMPATÍA (U4)\n${camposU4.map(([titulo, items]) => `- ${titulo}: ${items.join('; ')}`).join('\n')}`);
  }

  // Hallazgos del Buzón (R5) — anónimo (solo área y hallazgos)
  const r5 = Array.isArray(documentosOficiales.r5Buzon ?? documentosOficiales.buzon1)
    ? (documentosOficiales.r5Buzon ?? documentosOficiales.buzon1)
    : [];
  const entradasR5 = r5
    .map((item) => {
      const area = textoLimpio(item?.area) || 'General';
      const partes = [
        textoLimpio(item?.falla) ? `Falla hoy: ${textoLimpio(item.falla)}` : '',
        textoLimpio(item?.preocupa) ? `Preocupación: ${textoLimpio(item.preocupa)}` : '',
        textoLimpio(item?.harias) ? `Sugerencia: ${textoLimpio(item.harias)}` : '',
      ].filter(Boolean);
      return partes.length ? `- [${area}] ${partes.join(' | ')}` : '';
    })
    .filter(Boolean);

  if (entradasR5.length) {
    detectados.push('Buzón de escucha (R5)');
    secciones.push(`### HALLAZGOS ANÓNIMOS DEL BUZÓN DE ESCUCHA INICIAL (R5)\n${entradasR5.join('\n')}`);
  }

  // Escalamientos previos ya respondidos oficialmente en la app
  const resueltos = Array.isArray(documentosOficiales.escalamientosResueltos)
    ? documentosOficiales.escalamientosResueltos.filter((e) => textoLimpio(e?.pregunta) && textoLimpio(e?.respuesta_oficial))
    : [];
  if (resueltos.length) {
    detectados.push('Respuestas oficiales escaladas');
    secciones.push(
      `### PREGUNTAS ESCALADAS CON RESPUESTA OFICIAL\n${resueltos
        .map((e) => `- [${textoLimpio(e.area) || 'General'}] P: ${textoLimpio(e.pregunta)} | R oficial: ${textoLimpio(e.respuesta_oficial)}`)
        .join('\n')}`,
    );
  }

  // Documentos adicionales pegados o cargados manualmente por el líder
  const adicionales = textoLimpio(documentosOficiales.adicionales ?? documentosOficiales.textoAdicional);
  if (adicionales) {
    detectados.push('Documentos anexos');
    secciones.push(`### DOCUMENTOS OFICIALES ADICIONALES CARGADOS\n${adicionales}`);
  }

  return {
    texto: secciones.join('\n\n'),
    detectados,
  };
}

/**
 * Construye el system prompt completo del Coach de Comunicación para Líderes.
 *
 * @param {{ area?: string, estiloU1?: string, documentosOficiales?: unknown, fechaActual?: string }} params
 * @returns {string}
 */
export function construirPromptCoach({ area = '', estiloU1 = '', documentosOficiales = null, fechaActual } = {}) {
  const fecha = fechaActual || new Date().toISOString().slice(0, 10);
  const areaLimpia = textoLimpio(area);
  const codigoEstilo = textoLimpio(estiloU1).toUpperCase();
  const estiloLegible = ESTILOS_U1[codigoEstilo] ?? textoLimpio(estiloU1);

  const { texto: textoDocs } = formatearDocumentosOficiales(documentosOficiales);

  const bloqueContextoLider = [
    'CONTEXTO ACTUAL DE LA SESIÓN',
    `- Fecha actual (para fichas de escalamiento): ${fecha}`,
    `- Área del líder: ${areaLimpia || 'No especificada (si hace falta para adaptar o escalar, pregúntale brevemente su área)'}`,
    `- Estilo de liderazgo (Encuesta U1): ${estiloLegible || 'No especificado (pregúntale brevemente su estilo U1: A, B, C o D)'}`,
  ].join('\n');

  const bloqueDocumentos = textoDocs
    ? `DOCUMENTOS OFICIALES CARGADOS PARA ESTE CAMBIO\n${textoDocs}`
    : `DOCUMENTOS OFICIALES CARGADOS PARA ESTE CAMBIO\n[SIN DOCUMENTOS CARGADOS]\nActualmente no hay información registrada en R1, U2, FAQs U3, U4 ni R5, ni documentos pegados. Aplica estrictamente la Regla de Oro: pide amablemente al líder que cargue o pegue los documentos oficiales del cambio antes de dar respuestas sobre el proceso.`;

  return `${INSTRUCCIONES_BASE}\n\n---\n${bloqueContextoLider}\n\n${bloqueDocumentos}`;
}

export default construirPromptCoach;
