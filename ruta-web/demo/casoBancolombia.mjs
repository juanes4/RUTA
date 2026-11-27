/**
 * CASO FICTICIO CON FINES ACADÉMICOS (reto CUEE · ANDI).
 *
 * «Bancolombia · Piloto Asesor 360». Todo lo que hay aquí es inventado: cifras, respuestas del buzón,
 * líderes, méritos y resultados. No representa información real de la entidad ni de sus colaboradores.
 * Lo usa demo/sembrar.mjs para recorrer la metodología RUTA completa dentro de la app.
 */

export const ID_PROYECTO = 'caso-bancolombia-asesor360';

/* ------------------------------------------------------------------ */
/* Etapa 0 · Registro de la empresa                                    */
/* ------------------------------------------------------------------ */

export const EMPRESA = {
  nombre: 'Bancolombia · Piloto Asesor 360 (caso ficticio académico)',
  sector: 'Servicios financieros · Banca de personas y pymes',
  total_colaboradores: 34000,
  que_cambia:
    'Piloto de «Asesor 360» en la Región Antioquia: una sola plataforma de atención con un asistente de IA generativa que resume el historial del cliente, sugiere respuestas con su fuente y radica solicitudes completas. Reemplaza 4 aplicativos de consulta y el registro manual de peticiones en las sucursales, la Sucursal Telefónica y el back office. El asesor siempre valida y firma la respuesta: la IA sugiere, la persona decide.',
  fecha_lanzamiento: '2026-08-18',
};

export const AREAS = [
  { area: 'Sucursales Región Antioquia', afectados: 420 },
  { area: 'Sucursal Telefónica Medellín', afectados: 310 },
  { area: 'Centro de Operaciones y Back Office', afectados: 140 },
  { area: 'Gerencias de oficina y zona', afectados: 60 },
  { area: 'Tecnología y Mesa de Ayuda', afectados: 35 },
];

const [SUC, TEL, OPS, GER, TEC] = AREAS.map((a) => a.area);

/* ------------------------------------------------------------------ */
/* Usuarios de la demo (la base de la demo es aparte de la de pruebas) */
/* ------------------------------------------------------------------ */

/** Se suman a los 4 de USUARIOS_DEMO (lider, empleado1..3). Todos con la clave ruta2026. */
export const USUARIOS_EXTRA = [
  { usuario: 'empleado4', nombre: 'Andrés Cárdenas' },
  { usuario: 'empleado5', nombre: 'Mariana Ospina' },
  { usuario: 'empleado6', nombre: 'Santiago Vélez' },
  { usuario: 'empleado7', nombre: 'Paula Henao' },
  { usuario: 'empleado8', nombre: 'Camilo Arango' },
];
export const CLAVE_DEMO = 'ruta2026';
export const EMPLEADOS = ['empleado1', 'empleado2', 'empleado3', 'empleado4', 'empleado5', 'empleado6', 'empleado7', 'empleado8'];
export const TODOS = ['lider', ...EMPLEADOS];

/** Área de cada colaborador (para el buzón en la app y el mapa de viaje A2). */
export const AREA_DE = {
  lider: GER,
  empleado1: SUC,
  empleado2: SUC,
  empleado3: TEL,
  empleado4: TEL,
  empleado5: OPS,
  empleado6: OPS,
  empleado7: GER,
  empleado8: TEC,
};

/* ------------------------------------------------------------------ */
/* R5 · Buzón 1: escucha inicial (45 respuestas inventadas)            */
/* p1: ¿Qué es lo que más falla hoy?  p2: ¿Qué te preocupa del cambio?  */
/* p3: Si tú decidieras, ¿qué harías para mejorar?                      */
/* ------------------------------------------------------------------ */

const r = (area, grupo, p1, p2, p3) => ({ area, grupo, p1, p2, p3 });

export const BUZON = [
  // Sucursales Región Antioquia (16)
  r(SUC, 'Operativo', 'Para atender a un cliente abro 4 aplicativos y copio los mismos datos en cada uno.', 'Que con la IA ya no necesiten tantos asesores y empiecen a cerrar puestos.', 'Que nos muestren por escrito qué va a pasar con los cargos.'),
  r(SUC, 'Operativo', 'Las filas en caja los lunes y los días de pago son eternas y el cliente se va molesto.', 'No tener tiempo para aprender porque la meta comercial del mes no se mueve.', 'Bajar la meta el primer mes del piloto o dar horas protegidas para practicar.'),
  r(SUC, 'Operativo', 'El sistema se pone lento después de las 11 de la mañana y toca decirle al cliente que vuelva.', 'Que la plataforma nueva se caiga igual en las oficinas de los municipios.', 'Probar la conexión en cada oficina antes de lanzar.'),
  r(SUC, 'Administrativo', 'Las solicitudes se radican en papel y luego alguien las vuelve a digitar.', 'Que el asistente le diga algo equivocado al cliente y la responsabilidad quede en mí.', 'Que quede claro por escrito que el asesor valida y que la IA solo sugiere.'),
  r(SUC, 'Operativo', 'Cuando cambiaron el CRM en 2023 nos dieron una charla de una hora y después nadie respondía las dudas.', 'Que pase lo mismo que con el CRM: lanzan la herramienta y nos dejan solos.', 'Tener una persona de soporte en cada oficina durante las primeras semanas.'),
  r(SUC, 'Líder de área', 'Los asesores nuevos tardan unos 3 meses en conocer todos los productos.', 'Que mi equipo sienta que esto es para vigilarlos y medirles cada minuto.', 'Explicar qué datos se van a medir y para qué se van a usar.'),
  r(SUC, 'Operativo', 'Los clientes mayores no entienden los canales digitales y vienen a la oficina por todo.', 'A mi edad me cuesta la tecnología y me da miedo quedarme atrás.', 'Capacitaciones en grupos pequeños y al ritmo de cada persona.'),
  r(SUC, 'Prefiero no decirlo', 'En mi oficina el jefe nos grita delante de los clientes cuando no llegamos a la meta.', 'Que con la presión de la meta y el sistema nuevo la situación empeore.', 'Que alguien de Gestión Humana escuche a las oficinas sin el jefe presente.'),
  r(SUC, 'Operativo', 'No hay un sitio único con las condiciones vigentes de cada producto; cada quien tiene su versión en Excel.', 'Que la IA no conozca las excepciones que manejamos con los clientes del campo.', 'Que los asesores alimentemos la base de conocimiento con casos reales.'),
  r(SUC, 'Administrativo', 'Los cierres de caja se cuadran a mano y nos quedamos hasta tarde.', 'Que el piloto se sume al trabajo de cierre y salgamos todavía más tarde.', 'Empezar en horario de menor flujo, nunca en quincena.'),
  r(SUC, 'Operativo', 'El cliente cuenta su caso tres veces: en la entrada, al asesor y al jefe.', 'Que no nos digan la verdad sobre lo que viene después del piloto.', 'Que el gerente regional venga a las oficinas a explicarlo en persona.'),
  r(SUC, 'Operativo', 'Cuando llamo a la mesa de ayuda me dejan en espera más de 20 minutos; ayer llamé al 3104567890 y nada.', 'Que el soporte del sistema nuevo sea igual de lento.', 'Una línea de soporte exclusiva para el piloto.'),
  r(SUC, 'Líder de área', 'Tenemos 6 indicadores comerciales y ninguno mide la calidad de la atención.', 'Que se mida solo la cantidad de solicitudes y no si el caso se resolvió.', 'Agregar un indicador de resolución en el primer contacto.'),
  r(SUC, 'Operativo', 'Los formatos de reclamo cambian cada mes y nadie avisa.', 'No sé si voy a ser capaz de escribirle bien las instrucciones a la IA.', 'Una guía con ejemplos de preguntas para el asistente.'),
  r(SUC, 'Operativo', 'En las oficinas del Oriente se va la luz y perdemos lo que estábamos digitando.', 'Perder la información del cliente a mitad de la atención.', 'Que la plataforma guarde borradores automáticamente.'),
  r(SUC, 'Administrativo', '', 'Que los datos de los clientes terminen en servidores de afuera sin control.', 'Que Seguridad de la Información nos explique cómo se protegen los datos.'),

  // Sucursal Telefónica Medellín (12)
  r(TEL, 'Operativo', 'Tengo que buscar la respuesta en 3 pantallas mientras el cliente espera en la línea.', 'Que con el asistente nos midan todavía más estricto el tiempo de llamada.', 'Que el primer mes no se mida el tiempo promedio de llamada.'),
  r(TEL, 'Operativo', 'El guion de llamadas no tiene respuestas para los casos raros y toca transferir.', 'Que el asistente invente respuestas y el cliente reclame.', 'Que el asistente muestre de dónde saca cada respuesta.'),
  r(TEL, 'Operativo', 'Los turnos de la noche nunca reciben las capacitaciones; todo es de día.', 'Quedarnos otra vez sin capacitación por el turno.', 'Grabar las capacitaciones y dar horas pagas para verlas.'),
  r(TEL, 'Operativo', 'Las transferencias entre áreas se pierden y el cliente vuelve a llamar.', 'Que esto sea el primer paso para tercerizar la Sucursal Telefónica.', 'Que nos digan claramente si hay planes de tercerizar.'),
  r(TEL, 'Líder de área', 'La rotación de agentes es alta y siempre estamos formando gente nueva.', 'Que el equipo se desmotive si los primeros días la herramienta falla.', 'Celebrar los avances pequeños y escuchar a los agentes cada semana.'),
  r(TEL, 'Operativo', 'Registro las peticiones en una tabla aparte porque el sistema no me deja guardarlas.', 'Que nos pongan más llamadas por hora porque «la IA ayuda».', 'Que el tiempo ganado se use para atender mejor, no para cargar más trabajo.'),
  r(TEL, 'Administrativo', 'El reporte diario de calidad se arma a mano con datos de 2 sistemas.', 'Que el bono variable baje mientras aprendemos.', 'Congelar el cálculo del bono durante la transición.'),
  r(TEL, 'Operativo', 'La información de las promociones nos llega después que a los clientes.', 'Seguir enterándonos de todo por los clientes o por los rumores.', 'Un canal oficial de novedades antes de que salgan al público.'),
  r(TEL, 'Operativo', 'Los clientes llaman molestos porque la app les dice una cosa y nosotros otra.', 'Que la IA sea otra fuente distinta que contradiga a la app.', 'Una sola base de información para la app, la oficina y la línea.'),
  r(TEL, 'Prefiero no decirlo', 'Ya van 3 herramientas nuevas en 2 años y ninguna se terminó de implementar.', 'Que esta también se quede a medias.', 'Que se comprometan públicamente con fechas y responsables.'),
  r(TEL, 'Operativo', 'Las diademas están dañadas y se escucha mal al cliente.', 'Que inviertan en IA pero no en lo básico.', 'Cambiar los equipos dañados antes del piloto.'),
  r(TEL, 'Operativo', '', 'No entender bien qué parte decide la IA y qué parte decido yo.', 'Hacer simulacros con casos reales antes de usarla con clientes.'),

  // Centro de Operaciones y Back Office (8)
  r(OPS, 'Operativo', 'Recibimos solicitudes incompletas de las oficinas y toca devolverlas.', 'Que el volumen de solicitudes radicadas se duplique y no seamos suficientes.', 'Que la plataforma no deje radicar sin los documentos obligatorios.'),
  r(OPS, 'Operativo', 'Validamos los mismos documentos 2 veces: en la oficina y aquí.', 'Que automaticen nuestras tareas y nos reubiquen sin preguntarnos.', 'Que nos formen para nuevas tareas de análisis.'),
  r(OPS, 'Administrativo', 'Los tiempos de respuesta de las PQRS se vencen porque no sabemos en qué etapa están.', 'Que nadie de back office esté en el diseño del piloto.', 'Incluir a un analista de back office en el equipo del piloto.'),
  r(OPS, 'Operativo', 'Cada área usa una plantilla distinta para la misma solicitud.', 'Que no nos expliquen el cambio porque «no damos la cara al cliente».', 'Incluirnos en las capacitaciones y en las comunicaciones.'),
  r(OPS, 'Líder de área', 'Los reprocesos nos quitan cerca de 2 horas diarias por analista.', 'Que se mida al back office con las mismas metas de las oficinas.', 'Definir indicadores propios para operaciones.'),
  r(OPS, 'Operativo', 'El sistema de radicación se cae en el cierre de mes.', 'Que la migración de datos deje casos perdidos.', 'Hacer una prueba en paralelo antes de apagar el sistema viejo.'),
  r(OPS, 'Operativo', 'Las oficinas nos escriben por chat personal porque no hay un canal oficial.', 'Seguir con chats informales y perder la trazabilidad.', 'Un canal oficial dentro de la plataforma para consultas entre áreas.'),
  r(OPS, 'Prefiero no decirlo', '', 'Que la IA vea información sensible de clientes que no debería ver.', 'Restringir qué información ve el asistente según el cargo.'),

  // Gerencias de oficina y zona (5)
  r(GER, 'Líder de área', 'Paso más tiempo haciendo reportes que acompañando a los asesores.', 'No tener tiempo para acompañar a mi equipo mientras cumplo las metas.', 'Que la meta de la oficina reconozca las horas de acompañamiento.'),
  r(GER, 'Líder de área', 'Los asesores no se atreven a decir que no entienden algo.', 'No saber responder las preguntas de mi equipo sobre el empleo y los bonos.', 'Recibir un kit con respuestas oficiales antes que los asesores.'),
  r(GER, 'Líder de área', 'Las decisiones llegan de Bogotá sin contexto de la región.', 'Que el piloto se diseñe sin escuchar a las oficinas de los municipios.', 'Visitar oficinas de Urabá y del Oriente antes de definir el despliegue.'),
  r(GER, 'Administrativo', 'El tablero comercial se actualiza con un día de retraso.', 'Que el piloto coincida con el cierre de año y la temporada de primas.', 'Mover el inicio para no chocar con diciembre.'),
  r(GER, 'Líder de área', 'Cuando falla un sistema no tenemos un plan B claro.', 'Que los clientes nos culpen a nosotros si la IA se equivoca.', 'Un protocolo de contingencia por escrito para cada oficina.'),

  // Tecnología y Mesa de Ayuda (4: menos de 5, la app oculta sus textos separados)
  r(TEC, 'Operativo', 'Recibimos unos 300 tickets diarios y la mitad son de clave bloqueada.', 'Que el lanzamiento duplique los tickets sin personal adicional.', 'Reforzar la mesa de ayuda las primeras 4 semanas.'),
  r(TEC, 'Operativo', 'Los usuarios no saben describir la falla y el ticket va y viene.', 'Que nos culpen por las fallas del proveedor de la IA.', 'Acuerdos de servicio claros con el proveedor.'),
  r(TEC, 'Líder de área', 'La documentación técnica de los 4 aplicativos está desactualizada.', 'Que se integre rápido sin las pruebas de seguridad completas.', 'No salir a producción sin la prueba de seguridad aprobada.'),
  r(TEC, 'Administrativo', 'Las solicitudes de acceso tardan 3 días en aprobarse.', 'Que los accesos al piloto no estén listos el día del lanzamiento.', 'Crear los accesos con una semana de anticipación.'),
];

/** Qué respuesta del BUZON entrega cada colaborador desde la app (las demás llegan en papel y se digitan en R5). */
export const BUZON_EN_APP = {
  empleado1: 0,
  empleado2: 4,
  empleado3: 16,
  empleado4: 19,
  empleado5: 28,
  empleado6: 29,
  empleado7: 36,
  empleado8: 41,
};

/** Fechas de la escucha inicial (julio de 2026). */
export const FECHAS_BUZON = ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-13', '2026-07-14'];
export const BUZON_ABIERTO_EN = '2026-07-06';
export const BUZON_CERRADO_EN = '2026-07-17';

/* ------------------------------------------------------------------ */
/* R1 · Entrevista del lienzo con el copiloto (respuestas por bloque)  */
/* ------------------------------------------------------------------ */

export const INICIO_LIENZO = 'Empecemos con el lienzo del cambio.';

/** Respuesta principal y complemento (si el copiloto repregunta) para cada bloque 1 a 7. */
export const RESPUESTAS_LIENZO = {
  1: {
    principal:
      'Tres motivos: 1) Tiempo de atención: hoy un asesor tarda en promedio 14 minutos por solicitud porque consulta 4 aplicativos distintos (medición interna de la región, primer semestre de 2026). 2) Quejas: las PQRS por «información inconsistente entre canales» subieron 32 % entre el primer semestre de 2025 y el primer semestre de 2026. 3) Competencia: en los últimos 12 meses salieron cerca de 9.000 clientes de nómina de la región hacia neobancos que resuelven en minutos; esta cifra es una estimación de Inteligencia Comercial, márcala por verificar.',
    complemento:
      'Para precisar: los 14 minutos salen de una muestra de 2.400 atenciones en 18 oficinas entre enero y junio de 2026; las PQRS pasaron de 1.150 a 1.518 por semestre. La cifra de clientes de nómina sigue siendo una estimación por verificar.',
  },
  2: {
    principal:
      'Son 965 personas en cinco grupos: Sucursales Región Antioquia, 420 asesores comerciales y de servicio, impacto fuerte porque cambia su herramienta principal; Sucursal Telefónica Medellín, 310 agentes, impacto fuerte; Centro de Operaciones y Back Office, 140 analistas, impacto medio porque reciben las solicitudes radicadas desde la plataforma; Gerencias de oficina y zona, 60 jefes, impacto medio porque acompañan a sus equipos y leen tableros nuevos; Tecnología y Mesa de Ayuda, 35 personas, impacto medio porque dan el soporte.',
    complemento: 'Los números salen de la nómina de la región a junio de 2026. El impacto fuerte es para quienes atienden clientes todo el día.',
  },
  3: {
    principal:
      'Cuando funcione, un asesor atiende a un cliente en una sola pantalla: el asistente le resume el historial y le sugiere la respuesta con la fuente, el asesor la revisa, la corrige si hace falta y radica la solicitud completa en menos de 6 minutos, sin volver a digitarla en ningún otro sistema.',
    complemento: 'En la línea es igual: el agente resuelve en la misma llamada sin transferir, porque tiene la respuesta y el estado del caso en la misma pantalla.',
  },
  4: {
    principal:
      'Cambia: 1) se consultan productos e historial del cliente en Asesor 360 en lugar de 4 aplicativos; 2) las solicitudes se radican en la plataforma, con validación de documentos obligatorios y sin papel; 3) el asistente propone respuestas que el asesor revisa y firma; 4) el back office recibe las solicitudes completas y con trazabilidad. Se mantiene: el asesor decide y responde por cada respuesta (la IA no decide), los productos y las tarifas, la estructura de oficinas y los cargos, y la atención presencial para quien la prefiera.',
    complemento: 'También se mantienen los horarios de atención y el modelo de jefes de oficina; no hay cambios de cargos aprobados para el piloto.',
  },
  5: {
    principal:
      'Asesores de sucursal: dejan de copiar datos en 4 sistemas y tienen la respuesta sugerida con su fuente, menos reprocesos y menos clientes molestos. Agentes de la Sucursal Telefónica: resuelven en la primera llamada sin transferir y sin buscar en 3 pantallas. Back office: reciben solicitudes completas, con menos devoluciones y con trazabilidad del caso. Jefes de oficina y zona: menos tiempo armando reportes y más tiempo para acompañar a sus equipos, con un tablero en línea. Tecnología y Mesa de Ayuda: menos tickets por consultas repetidas y documentación unificada.',
    complemento: 'Para los clientes, la ganancia es contar su caso una sola vez y recibir la misma respuesta en la app, la oficina y la línea.',
  },
  6: {
    principal:
      'Cuatro criterios: 1) Tiempo promedio por solicitud: de 14 a 6 minutos en 90 días después del lanzamiento. 2) Uso: 90 % de las solicitudes radicadas en Asesor 360 al día 90 (línea base 0 %). 3) PQRS por información inconsistente: bajar 25 % en los primeros 6 meses (línea base 1.518 por semestre). 4) Resolución en el primer contacto en la Sucursal Telefónica: de 68 % a 80 % en 90 días.',
    complemento: 'Los cuatro se miden con el tablero de la región, cada 30 días, y se reportan en las auditorías de adopción.',
  },
  7: {
    principal:
      'Riesgos: 1) fallas de conectividad en las oficinas de municipios del Oriente y de Urabá; 2) que el asistente dé respuestas erróneas y se afecte la confianza del cliente; 3) exposición de datos personales de clientes (Ley 1581 de 2012); 4) sobrecarga porque el piloto coincide con las metas comerciales del semestre. Intentos previos: la migración del CRM en 2023 tuvo una capacitación de una hora y poco soporte después del lanzamiento, y muchos asesores volvieron a sus archivos de Excel; en cambio, el piloto de firma electrónica de 2024 sí funcionó porque tuvo multiplicadores en cada oficina.',
    complemento: 'Agrego un quinto riesgo: la fatiga por herramientas nuevas, porque en 2 años llegaron 3 herramientas que no se terminaron de implementar.',
  },
};

export const CIERRE_LIENZO = 'Estoy conforme con la ficha del cambio. Gracias, la paso a R1.';
export const REPREGUNTA_AGOTADA = 'Es la mejor información que tenemos por ahora: márcalo por verificar y sigamos con el siguiente bloque.';

/* ------------------------------------------------------------------ */
/* R3 · FODA del cambio (puntaje de 1 a 5)                             */
/* ------------------------------------------------------------------ */

export const FODA = [
  { cuadrante: 'F', item: 'Alta adopción de los canales digitales por parte de los clientes (app y sucursal virtual).', puntaje: 5 },
  { cuadrante: 'F', item: 'Patrocinio visible de la Vicepresidencia de Personas y de la Gerencia Regional Antioquia.', puntaje: 4 },
  { cuadrante: 'F', item: 'Red de 40 multiplicadores formados en el piloto de firma electrónica de 2024.', puntaje: 3 },
  { cuadrante: 'F', item: 'Base de conocimiento de productos documentada en manuales y guiones.', puntaje: 3 },
  { cuadrante: 'O', item: 'Clientes que prefieren atención ágil y resolución en el primer contacto.', puntaje: 4 },
  { cuadrante: 'O', item: 'Madurez de los modelos de IA generativa y de los servicios en la nube.', puntaje: 4 },
  { cuadrante: 'O', item: 'Exigencias del supervisor sobre la atención de PQRS como impulso para el cambio.', puntaje: 3 },
  { cuadrante: 'D', item: 'Cuatro aplicativos de consulta que no se comunican entre sí.', puntaje: 4 },
  { cuadrante: 'D', item: 'Memoria de la migración del CRM de 2023: poco soporte después del lanzamiento.', puntaje: 4 },
  { cuadrante: 'D', item: 'Metas comerciales mensuales que dejan poco tiempo para capacitarse.', puntaje: 3 },
  { cuadrante: 'D', item: 'Conectividad inestable en oficinas de municipios del Oriente y de Urabá.', puntaje: 2 },
  { cuadrante: 'A', item: 'Desconfianza de los clientes frente a respuestas generadas por IA.', puntaje: 3 },
  { cuadrante: 'A', item: 'Riesgo de exposición de datos personales (Ley 1581) y posibles sanciones.', puntaje: 4 },
  { cuadrante: 'A', item: 'Competencia de neobancos con atención 100 % digital.', puntaje: 3 },
];

/* ------------------------------------------------------------------ */
/* R4 · Mapa de actores                                                */
/* ------------------------------------------------------------------ */

export const ACTORES = [
  { actor: 'Vicepresidencia de Personas (patrocinador)', descripcion: 'Aprueba el presupuesto y la ampliación del piloto a otras regiones.', necesidades: 'Resultados medibles a 90 días y cero incidentes de datos.', poder: 'A', interes: 'A', realidad: 'Impulsa el piloto y lo menciona en los comités, pero aún no ha visitado oficinas.', compromiso_actual: 'apoya', compromiso_deseado: 'lidera' },
  { actor: 'Gerentes de zona y jefes de oficina', descripcion: '60 líderes que acompañan a los asesores en el día a día.', necesidades: 'Respuestas oficiales sobre empleo y metas, tiempo para acompañar.', poder: 'A', interes: 'A', realidad: 'Esperan instrucciones; temen que el piloto afecte sus metas del semestre.', compromiso_actual: 'neutral', compromiso_deseado: 'lidera' },
  { actor: 'Asesores comerciales y de servicio de sucursal', descripcion: '420 personas que atienden clientes presencialmente.', necesidades: 'Tiempo protegido para aprender, soporte cercano y claridad sobre sus cargos.', poder: 'B', interes: 'A', realidad: 'Cansados de herramientas nuevas; recuerdan la migración del CRM de 2023.', compromiso_actual: 'se_resiste', compromiso_deseado: 'apoya' },
  { actor: 'Agentes de la Sucursal Telefónica', descripcion: '310 agentes en turnos de día y de noche.', necesidades: 'Capacitación en su turno, metas de llamada ajustadas durante la transición.', poder: 'B', interes: 'A', realidad: 'Curiosos por el asistente, pero preocupados por la tercerización y el bono.', compromiso_actual: 'neutral', compromiso_deseado: 'apoya' },
  { actor: 'Analistas de Centro de Operaciones y Back Office', descripcion: '140 analistas que validan y procesan las solicitudes.', necesidades: 'Ser incluidos en el diseño y tener indicadores propios.', poder: 'B', interes: 'B', realidad: 'Casi no conocen el piloto; se enteran por los chats de las oficinas.', compromiso_actual: 'desconoce', compromiso_deseado: 'apoya' },
  { actor: 'Tecnología y Mesa de Ayuda', descripcion: '35 personas de soporte e integración.', necesidades: 'Refuerzo de personal en el lanzamiento y acuerdos de servicio con el proveedor.', poder: 'A', interes: 'B', realidad: 'Apoyan el piloto, pero ya están al límite de tickets.', compromiso_actual: 'apoya', compromiso_deseado: 'lidera' },
  { actor: 'Cumplimiento y Seguridad de la Información', descripcion: 'Aprueban el uso de datos de clientes en el asistente.', necesidades: 'Pruebas de seguridad completas y reglas de acceso por cargo.', poder: 'A', interes: 'B', realidad: 'Tienen dudas sobre el tratamiento de datos en la nube.', compromiso_actual: 'neutral', compromiso_deseado: 'apoya' },
  { actor: 'Representantes de los colaboradores', descripcion: 'Voceros que recogen las inquietudes laborales del personal.', necesidades: 'Garantías sobre estabilidad laboral y sobre el esquema de bonos.', poder: 'A', interes: 'A', realidad: 'Escuchan rumores de reducción de personal y de tercerización.', compromiso_actual: 'se_resiste', compromiso_deseado: 'neutral' },
];

/* ------------------------------------------------------------------ */
/* U1 · Encuesta de liderazgo (9 preguntas por encuesta, A/B/C/D)       */
/* ------------------------------------------------------------------ */

/** L1 Gerente regional · L2 Jefe oficina El Poblado · L3 Jefe oficina Rionegro · L4 Coordinadora Sucursal Telefónica · L5 Líder Back Office · L6 Jefe oficina Apartadó. */
export const LIDERAZGO = [
  { lider_id: 'L1', conteo_A: 2, conteo_B: 2, conteo_C: 4, conteo_D: 1 },
  { lider_id: 'L1', conteo_A: 1, conteo_B: 3, conteo_C: 4, conteo_D: 1 },
  { lider_id: 'L2', conteo_A: 1, conteo_B: 5, conteo_C: 2, conteo_D: 1 },
  { lider_id: 'L3', conteo_A: 5, conteo_B: 2, conteo_C: 1, conteo_D: 1 },
  { lider_id: 'L4', conteo_A: 1, conteo_B: 3, conteo_C: 4, conteo_D: 1 },
  { lider_id: 'L5', conteo_A: 2, conteo_B: 2, conteo_C: 1, conteo_D: 4 },
  { lider_id: 'L6', conteo_A: 3, conteo_B: 4, conteo_C: 1, conteo_D: 1 },
];

/* ------------------------------------------------------------------ */
/* U2 · Narrativa del cambio                                           */
/* ------------------------------------------------------------------ */

export const NARRATIVA = {
  vocero: 'L1',
  urgencia:
    'Hoy atender una solicitud nos toma 14 minutos porque saltamos entre 4 aplicativos, y las quejas por información distinta entre la app, la oficina y la línea subieron 32 % en un año. No es culpa de nadie: es la herramienta. Y mientras tanto, clientes de nómina se están yendo a quien les resuelve en minutos.',
  vision:
    'Queremos que cada asesor y cada agente tenga en una sola pantalla todo lo que necesita: el historial del cliente, la respuesta sugerida con su fuente y la solicitud lista para radicar. Que el cliente cuente su caso una sola vez y lo resolvamos en menos de 6 minutos.',
  que_cambia:
    'Usaremos Asesor 360 en lugar de los 4 aplicativos de consulta; las solicitudes se radican en la plataforma, sin papel; el asistente de IA propone una respuesta y tú la revisas, la corriges si hace falta y la firmas.',
  que_se_mantiene:
    'Tu cargo, tu oficina y tu equipo. Tú decides y respondes por cada respuesta: la IA no decide. Los productos, las tarifas y la atención presencial para quien la prefiera. Durante el piloto no hay cambios de cargos aprobados.',
  acompanamiento:
    'Cada oficina tendrá un multiplicador y soporte presencial las primeras 4 semanas; 2 horas semanales de práctica protegidas en la agenda; capacitaciones grabadas para el turno de la noche; una línea de soporte exclusiva del piloto y un buzón permanente para tus dudas.',
  que_gano:
    'Menos digitación repetida, menos clientes molestos, respuestas con fuente para no quedar expuesto y más tiempo para asesorar de verdad. Lo que ganemos en tiempo se usa para atender mejor, no para cargar más trabajo.',
};

/* ------------------------------------------------------------------ */
/* U3 · Soporte para líderes                                           */
/* ------------------------------------------------------------------ */

export const SOPORTE = {
  mensajes: [
    'Asesor 360 es una herramienta para el asesor, no un reemplazo del asesor: la IA sugiere y la persona decide.',
    'Durante el piloto no hay cambios de cargos aprobados y la estructura de oficinas se mantiene.',
    'Nadie aprende solo: habrá multiplicador por oficina, soporte presencial 4 semanas y 2 horas de práctica protegidas por semana.',
    'Los datos de los clientes se protegen con reglas de acceso por cargo y pruebas de seguridad aprobadas por Cumplimiento.',
    'Lo que ganemos en tiempo es para atender mejor y resolver en el primer contacto.',
  ],
  preguntas: [
    { pregunta: '¿La IA va a reemplazar a los asesores o a los agentes?', respuesta: 'No. Asesor 360 sugiere respuestas; el asesor las revisa, decide y firma. Durante el piloto no hay cambios de cargos aprobados.' },
    { pregunta: '¿Qué pasa con la meta comercial mientras aprendo?', respuesta: 'Las 2 horas semanales de práctica están protegidas en la agenda y no cuentan como tiempo improductivo. El ajuste de metas lo confirma la Gerencia Regional en la primera semana del piloto.' },
    { pregunta: '¿Quién responde si el asistente se equivoca?', respuesta: 'La respuesta al cliente la valida siempre el asesor. Si el asistente sugiere algo erróneo, se reporta con el botón «respuesta incorrecta» y no se usa.' },
    { pregunta: '¿Cómo se protegen los datos de los clientes?', respuesta: 'El asistente solo ve la información que el cargo puede ver, la plataforma pasó la prueba de seguridad de Cumplimiento y se rige por la Ley 1581.' },
    { pregunta: '¿Qué pasa si se cae la conexión en la oficina?', respuesta: 'La plataforma guarda borradores y cada oficina tiene un protocolo de contingencia con los aplicativos actuales durante el piloto.' },
    { pregunta: '¿Habrá capacitación para el turno de la noche?', respuesta: 'Sí. Las sesiones se graban y se reconocen horas pagas para verlas, además de un multiplicador en cada turno.' },
  ],
  pautas: [
    'Escucha primero la preocupación completa antes de responder.',
    'Usa solo las respuestas oficiales; si no hay respuesta, dilo y escálalo con la ficha del Coach.',
    'Habla de tareas concretas del día a día, no de la estrategia del banco.',
    'Reconoce en público los avances pequeños de tu equipo cada semana.',
    'No prometas nada sobre bonos, metas o cargos que no esté aprobado por escrito.',
  ],
};

/** Conversación con el Coach de Comunicación para Líderes (Gemini). */
export const COACH = {
  area: SUC,
  turnos: [
    'Un asesor de mi oficina me preguntó si Asesor 360 va a reemplazar a los asesores y a los cajeros. ¿Cómo le respondo sin prometer nada que no esté aprobado?',
    'Quiero practicar: hazme de asesora molesta porque no ha tenido tiempo de capacitarse por la meta comercial del mes.',
    'Te entiendo, y tienes razón en que la meta no da espera. Por eso las 2 horas semanales de práctica quedaron protegidas en tu agenda y no cuentan contra tu meta. ¿Qué día te sirve más para la primera práctica con el multiplicador?',
    'Terminar ensayo. ¿Qué hice bien y qué debo mejorar?',
    'Una agente de la Sucursal Telefónica me preguntó si van a bajar el bono variable durante los meses de transición. ¿Qué le digo?',
    'Un analista de back office me preguntó si, cuando termine el piloto, Asesor 360 se va a ampliar a Bogotá y si habrá traslados de personal entre ciudades. ¿Qué le respondo?',
  ],
};

/* ------------------------------------------------------------------ */
/* U4 · Mapa de empatía posterior a la comunicación                    */
/* ------------------------------------------------------------------ */

export const EMPATIA = {
  oye: ['Rumores de que la IA va a reemplazar asesores', 'Que la Sucursal Telefónica se va a tercerizar', 'Que esta herramienta va a terminar como el CRM de 2023'],
  ve: ['Jefes con poco tiempo para acompañar', 'Metas comerciales que no cambian', 'Clientes molestos por información distinta entre canales'],
  piensa_siente: ['Miedo a quedarse atrás con la tecnología', 'Cansancio de herramientas nuevas', 'Curiosidad por un asistente que le ahorre digitación'],
  dice_hace: ['Pide respuestas por escrito sobre cargos y bonos', 'Sigue usando su archivo de Excel por si acaso', 'Pregunta si habrá capacitación en su turno'],
  dolores: ['Copiar los mismos datos en 4 aplicativos', 'Soporte lento cuando algo falla', 'Sentir que lo miden por cada minuto'],
  necesidades: ['Tiempo protegido para aprender', 'Soporte cercano las primeras semanas', 'Saber qué decide la IA y qué decide la persona'],
  estrategias: [
    'Multiplicador por oficina y por turno durante 4 semanas',
    'Kit de respuestas oficiales para jefes antes del lanzamiento',
    'Simulacros con casos reales antes de atender clientes con el asistente',
    'Visita del gerente regional a oficinas de Urabá y del Oriente',
  ],
};

/* ------------------------------------------------------------------ */
/* Etapa T · Transformar                                                */
/* ------------------------------------------------------------------ */

/** T1. Pulso al cierre de cada sesión: [claridad, utilidad, confianza] de 1 a 5, por persona. */
export const SESIONES_PULSO = [
  { sesion: 'Lanzamiento Asesor 360 (encuentro regional)', base: [4, 4, 3] },
  { sesion: 'Taller práctico por oficina y turno', base: [5, 5, 4] },
  { sesion: 'Café con el gerente regional', base: [4, 3, 4] },
];

/** T2. Texto de apoyo para que la IA proponga las preguntas de cada micro-curso. */
export const CONTEXTO_VIDEOS = {
  'emp-1':
    'El video explica que un cambio organizacional es una modificación en los procesos, la tecnología, la estructura o la forma de trabajar, y que las personas reaccionan con dudas, temor o resistencia, sobre todo cuando no entienden por qué se hace. En el piloto Asesor 360 (caso ficticio) el cambio es pasar de 4 aplicativos a una sola plataforma con un asistente de IA que sugiere respuestas; el asesor sigue validando y firmando cada respuesta. Ante una reacción de temor, lo recomendado es explicar el porqué, escuchar y dar espacio para opinar.',
  'emp-2':
    'El video define la gestión del cambio como el acompañamiento al lado humano de un cambio: cómo las personas lo entienden, lo aprenden y lo adoptan. Se empieza desde la planeación, antes del lanzamiento, y no cuando ya hay quejas. En Asesor 360 eso significa escuchar a los asesores en el buzón, formar multiplicadores por oficina, proteger horas de práctica y medir la adopción cada 30 días. Gestionar el cambio no es imponer una herramienta: es acompañar a las personas hasta que la usen con autonomía.',
  'emp-3':
    'El video muestra que un cambio funciona cuando hay comunicación clara, participación de las personas y seguimiento después del lanzamiento; si se impone sin explicar las razones, aumenta la resistencia. En Asesor 360 se aprendió de la migración del CRM de 2023, que tuvo una capacitación de una hora y poco soporte posterior. Por eso ahora hay soporte presencial 4 semanas, auditorías de adopción y un buzón permanente para dudas. Después del lanzamiento se mide, se escucha y se ajusta.',
  'emp-4':
    'El video presenta actividades de desarrollo organizacional como talleres de trabajo en equipo, círculos de conversación y espacios de retroalimentación, que funcionan cuando las personas participan activamente y tienen un objetivo claro. En Asesor 360 se usan parejas de práctica (un asesor que domina la plataforma con otro que la está aprendiendo), círculos de apropiación y simulacros de recaída para afianzar la nueva forma de trabajar.',
};
/** Videos cuyas preguntas generadas por IA se aprueban; el de emp-4 se deja como borrador para mostrar la revisión del líder. */
export const VIDEOS_APROBAR = ['emp-1', 'emp-2', 'emp-3'];
export const VIDEOS_BORRADOR = ['emp-4'];

/**
 * T2. Resultado del simulador de cada persona: aciertos buscados (0 a 3) y seguridad (1 a 5).
 * Se eligen para que el resumen muestre los cuatro casos: alineado, sobreconfianza, se subestima y necesita apoyo.
 */
export const SIMULADOR = {
  lider: { aciertos: [3, 3, 3, 2, 3], seguridad: [5, 4, 5, 4, 4] },
  empleado1: { aciertos: [3, 2, 3, 2, 2], seguridad: [4, 4, 4, 3, 4] },
  empleado2: { aciertos: [1, 1, 2, 1, 2], seguridad: [5, 5, 5, 4, 4] },
  empleado3: { aciertos: [3, 3, 3, 3, 3], seguridad: [2, 2, 3, 2, 2] },
  empleado4: { aciertos: [2, 3, 2, 2, 3], seguridad: [4, 4, 3, 4, 4] },
  empleado5: { aciertos: [1, 0, 1, 2, 1], seguridad: [2, 2, 2, 3, 2] },
  empleado6: { aciertos: [3, 2, 2, 3, 2], seguridad: [4, 3, 4, 4, 4] },
  empleado7: { aciertos: [3, 3, 2, 3, 3], seguridad: [5, 4, 4, 5, 4] },
  empleado8: { aciertos: [2, 1, 1, 2, 1], seguridad: [5, 5, 4, 5, 5] },
};
export const VIDEOS_EMPLEADO = ['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5'];
export const VIDEOS_LIDER = ['lid-1', 'lid-2'];

/** T3. Escalera de autonomía: votos por persona [c1 inicio, c1 cierre, c2 inicio, c2 cierre]. */
export const VOTOS = {
  lider: [2, 2, 3, 3],
  empleado1: [1, 2, 2, 3],
  empleado2: [1, 1, 2, 2],
  empleado3: [2, 2, 3, 4],
  empleado4: [1, 2, 2, 3],
  empleado5: [1, 1, 1, 2],
  empleado6: [1, 2, 2, 3],
  empleado7: [2, 3, 3, 3],
  empleado8: [1, 2, 2, 3],
};
export const ACUERDOS = [
  { ciclo: 1, momento: 'inicio', nivel: 1, meta: 2 },
  { ciclo: 1, momento: 'cierre', nivel: 2, meta: 3 },
  { ciclo: 2, momento: 'inicio', nivel: 2, meta: 3 },
  { ciclo: 2, momento: 'cierre', nivel: 3, meta: 4 },
];

/** T3. Termómetro de apropiación (anónimo): 5 afirmaciones de 1 a 5 por persona y ciclo. */
export const TERMOMETRO = {
  1: [[3, 2, 4, 3, 3], [4, 3, 4, 3, 4], [3, 3, 3, 4, 3], [2, 2, 3, 3, 3], [4, 4, 4, 3, 3], [3, 3, 4, 4, 3], [3, 2, 3, 3, 4], [4, 3, 4, 4, 3], [3, 3, 3, 3, 3]],
  2: [[4, 4, 4, 4, 4], [5, 4, 4, 4, 4], [4, 3, 4, 4, 4], [3, 3, 4, 4, 3], [5, 4, 5, 4, 4], [4, 4, 4, 5, 4], [4, 3, 4, 4, 4], [4, 4, 5, 4, 3], [4, 4, 4, 4, 4]],
};

const tareas = (...filas) => filas.map(([tarea, sinAyuda, conAyuda]) => ({ tarea, sinAyuda, conAyuda }));

/** T3. Dinámicas de equipo con su hoja de trabajo (máximo 2 por ciclo). */
export const DINAMICAS = [
  {
    dinamica: 'parejas',
    ciclo: 1,
    hoja: {
      tareas: tareas(['Consultar el historial del cliente en Asesor 360', true, false], ['Radicar una solicitud de tarjeta con documentos', false, true], ['Validar la respuesta sugerida antes de enviarla', true, false], ['Registrar una PQRS con trazabilidad', false, true]),
      acierto: 'Revisa la fuente de cada respuesta sugerida antes de dársela al cliente.',
      ajuste: 'Practicar la radicación con documentos adjuntos: todavía pide ayuda en el último paso.',
      pareja: 'Oficina Rionegro, asesora senior y asesor nuevo, 02/09/2026',
    },
  },
  {
    dinamica: 'circulo',
    ciclo: 1,
    hoja: {
      normal: 'Consultar productos e historial en una sola pantalla. Ya nadie abre los 4 aplicativos para consultar.',
      nuevo: 'Escribirle instrucciones al asistente y confiar en la respuesta sugerida; radicar sin papel.',
      trabajar: 'Cada persona prueba 5 solicitudes reales con el asistente y comparte una en el grupo del equipo.',
    },
  },
  {
    dinamica: 'simulacro',
    ciclo: 2,
    hoja: {
      escenario: 'Se cae la conexión en la oficina de Apartadó a mitad de una radicación con el cliente presente.',
      vive: 'El asesor siente presión por el cliente y quiere volver al formato en papel.',
      aplica: 'Aplica el protocolo de contingencia: recupera el borrador guardado y continúa cuando vuelve la conexión.',
      observa: 'El equipo observa que el borrador sí se guardó y que el cliente no tuvo que repetir su caso.',
      respuesta: 'Ante una caída: avisar al cliente, recuperar el borrador y, si pasan más de 10 minutos, agendar la radicación sin pedirle que vuelva.',
      ajuste: 'Agregar a la guía el número de la línea exclusiva del piloto y el tiempo máximo de espera.',
      fecha: '07/10/2026',
    },
  },
  {
    dinamica: 'circulo',
    ciclo: 2,
    hoja: {
      normal: 'Radicar en la plataforma sin papel y revisar la fuente de cada respuesta sugerida.',
      nuevo: 'Usar el resumen automático del historial en las llamadas largas de la Sucursal Telefónica.',
      trabajar: 'Compartir en el muro de logros un caso resuelto en el primer contacto gracias al asistente.',
    },
  },
];

const criterios = (puntajes, evidencias) =>
  Object.fromEntries(['cumplimiento', 'impacto', 'sostenibilidad', 'adaptacion', 'participacion', 'compromiso', 'equipo', 'iniciativa'].map((c, i) => [c, { puntaje: puntajes[i], evidencia: evidencias[i] ?? '' }]));

/** T4. Méritos (ficha FIMT + matriz MRMT). */
export const MERITOS = [
  {
    area: 'Oficina Rionegro · Sucursales Región Antioquia',
    fecha: '2026-09-25',
    cambio: 'Piloto Asesor 360',
    avance: 'Primera oficina de la región en radicar el 100 % de sus solicitudes en Asesor 360 durante dos semanas seguidas, con un tiempo promedio de 7 minutos por solicitud.',
    participantes: 'Equipo de 12 asesores y la jefe de oficina de Rionegro',
    comoAyuda: 'Demuestra que la meta de tiempo es alcanzable y deja una forma de trabajo que otras oficinas pueden copiar.',
    pasaAValoracion: true,
    criterios: criterios([5, 5, 4, 4, 5, 4, 4, 3], ['100 % de radicación en la plataforma (tablero regional, semanas 5 y 6).', 'Tiempo promedio bajó de 14 a 7 minutos.', 'Mantuvieron el resultado dos semanas sin soporte presencial.', 'Usan el asistente en todas las atenciones de servicio.', 'Los 12 asesores participaron en las parejas de práctica.', 'Asumieron la radicación completa sin volver al papel.', 'Armaron parejas de práctica entre turnos.', '']),
    reconocimiento: 'mencion',
    publicar: true,
    publicacion: {
      titulo: 'Rionegro: 100 % de solicitudes en Asesor 360',
      logramos: 'Durante dos semanas seguidas radicamos todas las solicitudes en Asesor 360 y bajamos el tiempo promedio de 14 a 7 minutos por solicitud.',
      protagonistas: 'Equipo de asesores y jefatura de la oficina Rionegro',
      importancia: 'Muestra que la nueva forma de trabajar es posible en una oficina real y con clientes reales; es la ruta para las demás oficinas.',
      mensaje: 'Gracias, Rionegro, por abrir el camino. ¡Su ejemplo nos acerca a todos a la meta!',
      autorizacion: true,
    },
  },
  {
    area: 'Turno de la noche · Sucursal Telefónica Medellín',
    fecha: '2026-10-09',
    cambio: 'Piloto Asesor 360',
    avance: 'Los agentes del turno de la noche crearon una guía rápida de 15 preguntas para el asistente, con ejemplos de casos frecuentes.',
    participantes: 'Seis agentes y la coordinadora del turno de la noche',
    comoAyuda: 'Facilita que los agentes nuevos usen el asistente desde el primer día y reduce las transferencias.',
    pasaAValoracion: true,
    criterios: criterios([4, 4, 3, 4, 3, 3, 3, 4], ['La resolución en primer contacto del turno subió de 66 % a 74 %.', 'Menos transferencias en las llamadas de tarjetas.', '', 'Toda la línea nocturna usa la guía.', '', '', '', 'Nadie les pidió la guía: la propusieron ellos.']),
    reconocimiento: 'certificado',
    publicar: true,
    publicacion: {
      titulo: 'Guía rápida del turno de la noche',
      logramos: 'Creamos una guía con 15 preguntas para el asistente y casos frecuentes; la resolución en primer contacto del turno subió de 66 % a 74 %.',
      protagonistas: 'Agentes y coordinación del turno de la noche de la Sucursal Telefónica',
      importancia: 'Convierte el aprendizaje de unos pocos en una herramienta para toda la línea.',
      mensaje: 'Gracias por compartir lo que aprendieron: así se construye el cambio entre todos.',
      autorizacion: true,
    },
  },
  {
    area: 'Centro de Operaciones y Back Office',
    fecha: '2026-10-16',
    cambio: 'Piloto Asesor 360',
    avance: 'El equipo de radicación propuso una lista de chequeo de documentos que redujo las devoluciones a oficinas en las solicitudes de crédito.',
    participantes: 'Cuatro analistas de radicación',
    comoAyuda: 'Disminuye los reprocesos entre las oficinas y el back office.',
    pasaAValoracion: true,
    criterios: criterios([3, 3, 2, 2, 2, 3, 3, 3], []),
    reconocimiento: 'agradecimiento',
    publicar: false,
  },
];

/** T4. Balance de cada ciclo. */
export const BALANCES = [
  {
    ciclo: 1,
    meritos: 'La oficina Rionegro llegó al 100 % de radicación en la plataforma; 9 de cada 10 personas vieron los micro-cursos.',
    factores: 'Multiplicadores por oficina, soporte presencial las primeras 4 semanas y horas de práctica protegidas.',
    dificultades: 'Caídas de conexión en Urabá, sobreconfianza en el simulador de algunas personas y el turno de la noche con menos acompañamiento.',
  },
  {
    ciclo: 2,
    meritos: 'Guía rápida del turno de la noche y lista de chequeo del back office; el termómetro de apropiación subió de 3,2 a 4,0.',
    factores: 'Dinámicas de círculo y simulacro de recaída; reconocimiento público de los avances.',
    dificultades: 'Algunos asesores siguen guardando un Excel «por si acaso»; el back office pide indicadores propios.',
  },
];

/* ------------------------------------------------------------------ */
/* Etapa A · Analizar                                                   */
/* ------------------------------------------------------------------ */

export const METAS_A = { autonomia: 80, uso_sostenido: 90, regreso_anterior: 5, traspaso: 100, participacion: 80, comunicacion: 90, apropiacion: 4, recaidas: 90 };

export const AUDITORIAS = [
  {
    periodo: 'Día 30',
    fecha: '2026-09-17',
    equipo: 'Piloto Asesor 360 · Región Antioquia',
    observaciones: 'Arranque con buena participación, pero todavía hay mucho uso del sistema anterior en oficinas de municipios por la conectividad.',
    valores: { autonomia: 52, uso_sostenido: 61, regreso_anterior: 18, traspaso: 40, participacion: 70, comunicacion: 74, apropiacion: 3.2, recaidas: 70 },
  },
  {
    periodo: 'Día 60',
    fecha: '2026-10-17',
    equipo: 'Piloto Asesor 360 · Región Antioquia',
    observaciones: 'Mejora clara después de las dinámicas del ciclo 2; el back office pide indicadores propios.',
    valores: { autonomia: 68, uso_sostenido: 78, regreso_anterior: 9, traspaso: 75, participacion: 82, comunicacion: 85, apropiacion: 4.0, recaidas: 84 },
  },
  {
    periodo: 'Día 90',
    fecha: '2026-11-16',
    equipo: 'Piloto Asesor 360 · Región Antioquia',
    observaciones: 'Cierre del piloto: casi todos los indicadores en meta o muy cerca; quedan pendientes la autonomía y el regreso al sistema anterior en Urabá.',
    valores: { autonomia: 77, uso_sostenido: 88, regreso_anterior: 5.5, traspaso: 95, participacion: 86, comunicacion: 91, apropiacion: 4.1, recaidas: 92 },
  },
];

/** A2. Mapa de viaje: 12 respuestas (3 = A, 2 = B, 1 = C) por persona y periodo, con comentario opcional. */
export const VIAJE = {
  'Ciclo 1': {
    lider: [[3, 3, 2, 2, 2, 2, 2, 2, 3, 3, 3, 2], 'El equipo avanza, pero necesita más tiempo protegido para practicar.'],
    empleado1: [[3, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2], 'Al principio me costó la radicación con documentos.'],
    empleado2: [[3, 1, 1, 1, 1, 2, 1, 2, 1, 2, 2, 1], 'Todavía no confío del todo en las respuestas del asistente.'],
    empleado3: [[3, 2, 2, 2, 2, 2, 2, 3, 2, 2, 3, 2], ''],
    empleado4: [[2, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2], 'El turno de la noche recibió la capacitación tarde.'],
    empleado5: [[3, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1], 'En back office nos enteramos tarde de los cambios.'],
    empleado6: [[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], ''],
    empleado7: [[3, 3, 2, 2, 2, 3, 2, 2, 3, 3, 2, 3], 'Los jefes necesitamos el kit de respuestas antes que el equipo.'],
    empleado8: [[3, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2], 'Los tickets se duplicaron la primera semana.'],
  },
  'Cierre (Día 90)': {
    lider: [[3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3], 'Cerramos el piloto con el equipo mucho más autónomo.'],
    empleado1: [[3, 2, 2, 2, 2, 3, 3, 3, 3, 3, 2, 3], 'Ya no abro los otros aplicativos para consultar.'],
    empleado2: [[3, 1, 1, 2, 2, 2, 2, 3, 2, 2, 2, 2], 'Mejoró mucho, pero en Urabá la conexión sigue fallando.'],
    empleado3: [[3, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3], 'La guía del turno de la noche nos cambió el trabajo.'],
    empleado4: [[2, 2, 1, 2, 2, 3, 3, 3, 3, 3, 3, 2], ''],
    empleado5: [[3, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2], 'Necesitamos indicadores propios para el back office.'],
    empleado6: [[2, 2, 2, 3, 2, 3, 3, 3, 3, 3, 2, 3], ''],
    empleado7: [[3, 3, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3], 'Recomiendo ampliar el piloto con el mismo acompañamiento.'],
    empleado8: [[3, 2, 2, 2, 3, 3, 3, 3, 2, 3, 3, 3], 'La mesa de ayuda ya volvió a su volumen normal.'],
  },
};

/** Consultas al Asistente de la Etapa A (solo líder). */
export const ASISTENTE_A = [
  { accion: 'diagnostico_a1', pasoActual: 'A1', visible: 'Diagnóstico A1 y plan 15 días' },
  { accion: 'cruce_a1_t', pasoActual: 'A1', visible: 'Cruzar A1 con Etapa T' },
  { accion: 'curva_a2', pasoActual: 'A2', visible: 'Curva A2 y prioridades' },
  {
    accion: 'libre',
    pasoActual: 'A1',
    visible: 'Con estos resultados del día 90, ¿qué le recomiendo al comité directivo sobre ampliar Asesor 360 a otras regiones?',
  },
];
