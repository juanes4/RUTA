/**
 * Buzón de prueba para la demo del Copiloto de Reconocimiento. Todo es
 * inventado: la empresa ("Lácteos La Pradera"), las áreas, las respuestas,
 * el nombre, el correo y el teléfono que aparecen para mostrar el enmascarado.
 *
 * Mientras no exista un contrato de datos (RUTA_IA_DATOS_REALES), este es el
 * único buzón que el servidor deja enviar a Gemini.
 *
 * Cada fila trae su clasificación de referencia (`e`), hecha a mano con la
 * taxonomía fija. El modo simulado la usa en lugar de Gemini y sirve para
 * comparar lo que devuelve el modelo. Formato de `e`:
 *   pN: [temas separados por coma, sentimiento, intensidad, idea de P3 (solo p3)]
 * `rev` es el tipo de revisión humana e `ident` marca las respuestas que,
 * aun enmascaradas, permiten reconocer a alguien.
 *
 * Lo que la demo debe mostrar (ver docs/copiloto-reconocimiento.md):
 * - 3 grupos con 5 o más respuestas y "Líder de área" con 4 (no se segmenta).
 * - Un nombre propio, un correo, un teléfono y un cargo único.
 * - 2 respuestas para revisión humana (maltrato y seguridad).
 * - Respuestas muy cortas ("todo mal") y muy largas, que pesan igual.
 * - 5 menciones de miedo a despidos (EMP), casi todas de intensidad 3.
 */

export const EMPRESA_PRUEBA = {
  nombre: 'Lácteos La Pradera (empresa ficticia)',
  sector: 'Alimentos',
  que_cambia: 'Sistema de gestión de bodega (WMS) con lectores de código de barras en bodega y despacho',
  areas: [
    { area: 'Producción', afectados: 40 },
    { area: 'Bodega', afectados: 25 },
    { area: 'Despacho', afectados: 20 },
    { area: 'Administración', afectados: 15 },
  ],
};

const FILAS = [
  // ---------- Producción ----------
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'No damos abasto con los pedidos de fin de mes, hacemos horas extra casi todos los días.',
    p2: 'Que el sistema nuevo nos quite más tiempo mientras aprendemos.',
    p3: 'Que la capacitación sea en el turno y no después de salir.',
    e: { p1: ['SOB', 'molesto', 2], p2: ['SOB,CAP', 'preocupado', 2], p3: ['CAP', 'propositivo', 1, 'capacitar_practica'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'Bodega no nos avisa cuando falta material y paramos la línea.',
    p2: 'Que sigamos sin saber qué hay en bodega.',
    p3: 'Una pantalla en la línea que muestre el inventario.',
    e: { p1: ['COA', 'molesto', 2], p2: ['COA', 'preocupado', 1], p3: ['REC,COA', 'propositivo', 1, 'equipos'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'todo mal',
    p2: 'nada',
    p3: '',
    e: { p1: ['otro:inconformidad general', 'molesto', 1], p2: ['otro:sin preocupación concreta', 'neutral', 1] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'Llenamos la misma planilla de producción en papel y después la pasan a Excel, es doble trabajo.',
    p2: 'Que nos pongan a llenar también el sistema nuevo además del papel.',
    p3: 'Quitar el papel de una vez cuando el sistema funcione.',
    e: { p1: ['PRO', 'molesto', 2], p2: ['PRO,SOB', 'preocupado', 2], p3: ['PRO', 'propositivo', 1, 'quitar_papel'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'Los turnos son muy pesados y rotan sin avisar con tiempo.',
    p2: 'Dicen que con el sistema van a necesitar menos gente. Tengo dos hijos y no puedo quedarme sin trabajo.',
    p3: 'Que nos digan la verdad sobre qué va a pasar con los puestos.',
    e: { p1: ['SOB', 'molesto', 2], p2: ['EMP', 'preocupado', 3], p3: ['COD,EMP', 'propositivo', 2, 'informar'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'Se daña la selladora y mantenimiento tarda días en venir.',
    p2: 'Que gasten en el sistema y sigan sin arreglar las máquinas.',
    p3: 'Arreglar primero los equipos que tenemos.',
    e: { p1: ['REC', 'molesto', 2], p2: ['REC,DES', 'molesto', 2], p3: ['REC', 'propositivo', 1, 'equipos'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'No sabemos de un día para otro qué vamos a producir, el plan cambia todo el tiempo.',
    p2: 'Que el sistema nuevo tampoco nos avise a tiempo.',
    p3: 'Una reunión corta al inicio del turno con el plan del día.',
    e: { p1: ['COA,PRO', 'molesto', 2], p2: ['COA', 'preocupado', 1], p3: ['COA', 'propositivo', 1, 'reunion_turno'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'Lo de siempre: mucho trabajo y poca gente.',
    p2: 'Yo ya tengo 52 años y nunca he manejado una pistola de esas. A mi edad no voy a aprender eso tan rápido.',
    p3: 'Que nos enseñen despacio y con paciencia.',
    e: { p1: ['SOB', 'resignado', 2], p2: ['OBS', 'preocupado', 3], p3: ['CAP', 'propositivo', 1, 'capacitar_practica'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'Hernán Restrepo nos dijo que este proyecto ya está decidido y que no hay nada que opinar.',
    p2: 'Que sea como el sistema de turnos de hace dos años, que lo lanzaron y a los tres meses nadie lo usaba.',
    p3: 'Que esta vez sí nos pregunten a los que hacemos el trabajo.',
    e: { p1: ['COD', 'molesto', 2], p2: ['HIS', 'resignado', 2], p3: ['COD', 'propositivo', 1, 'preguntar_operarios'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'Hay reprocesos porque las etiquetas salen con el lote equivocado.',
    p2: 'Que el sistema nuevo saque los mismos errores pero más rápido.',
    p3: 'Probar primero con una sola línea antes de ponerlo en toda la planta.',
    e: { p1: ['PRO', 'preocupado', 2], p2: ['PRO,REC', 'preocupado', 1], p3: ['PRO', 'propositivo', 1, 'piloto'] },
  },
  {
    area: 'Producción', grupo: 'Administrativo',
    p1: 'Los reportes de producción llegan tarde y con datos que no cuadran.',
    p2: 'Que no haya presupuesto para capacitar bien a la gente.',
    p3: 'Nombrar a alguien de cada turno como apoyo para los demás.',
    e: { p1: ['PRO,COA', 'preocupado', 1], p2: ['CAP,REC', 'preocupado', 2], p3: ['CAP', 'propositivo', 1, 'multiplicadores'] },
  },
  {
    area: 'Producción', grupo: 'Prefiero no decirlo',
    p1: 'Siempre nos enteramos de último de las decisiones.',
    p2: 'Que esto sea para recortar personal y no lo digan.',
    p3: 'Hablar claro desde el principio.',
    e: { p1: ['COD', 'molesto', 2], p2: ['EMP,DES', 'preocupado', 3], p3: ['COD', 'propositivo', 1, 'informar'] },
  },
  {
    area: 'Producción', grupo: 'Líder de área',
    p1: 'Mi equipo trabaja al límite y no tengo tiempo para acompañarlos en nada nuevo.',
    p2: 'Que me pidan resultados en la primera semana sin darme tiempo para enseñarle a la gente.',
    p3: 'Bajar la meta de producción las dos primeras semanas del arranque.',
    e: { p1: ['SOB', 'preocupado', 2], p2: ['SOB,COD', 'preocupado', 2], p3: ['SOB', 'propositivo', 1, 'mas_personal'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'El wifi de la planta no llega a la zona de empaque.',
    p2: 'Que las pistolas no funcionen en empaque por la señal.',
    p3: 'Revisar la señal antes de comprar los equipos.',
    e: { p1: ['REC', 'neutral', 1], p2: ['REC', 'preocupado', 1], p3: ['REC', 'propositivo', 1, 'equipos'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'El supervisor del turno de la mañana nos grita delante de todos y nos amenaza con descontarnos el día si nos quejamos.',
    p2: 'Que con el cambio tenga más excusas para presionarnos.',
    p3: 'Que alguien de recursos humanos escuche lo que pasa en el turno.',
    e: { p1: ['otro:trato del jefe', 'molesto', 3], p2: ['DES', 'preocupado', 3], p3: ['COD', 'propositivo', 2, 'preguntar_operarios'] },
    rev: 'acoso_maltrato',
  },
  {
    area: 'Producción', grupo: 'Sin grupo',
    p1: 'Mucho desorden en la entrega de turno.',
    p2: '',
    p3: 'Un formato sencillo para entregar el turno.',
    e: { p1: ['PRO', 'neutral', 1], p3: ['PRO', 'propositivo', 1, 'reunion_turno'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'No hay quien cubra cuando alguien se incapacita, nos toca doblar.',
    p2: 'Que en el arranque falte gente y todo se retrase.',
    p3: 'Traer personal de apoyo temporal durante el arranque.',
    e: { p1: ['SOB', 'molesto', 2], p2: ['SOB', 'preocupado', 2], p3: ['SOB', 'propositivo', 1, 'mas_personal'] },
  },
  {
    area: 'Producción', grupo: 'Operativo',
    p1: 'Nadie nos explica para qué sirven los cambios que hacen.',
    p2: 'Que nadie nos haya explicado cómo funciona el sistema y nos lo pongan de un día para otro.',
    p3: 'Mostrar el sistema funcionando antes de que arranque.',
    e: { p1: ['COD', 'resignado', 1], p2: ['CAP,COD', 'preocupado', 2], p3: ['CAP', 'propositivo', 1, 'capacitar_practica'] },
  },

  // ---------- Bodega ----------
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'El inventario del sistema nunca cuadra con lo que hay en las estanterías.',
    p2: 'Que nos echen la culpa a nosotros cuando no cuadre en el sistema nuevo.',
    p3: 'Hacer un conteo completo antes de arrancar para empezar con datos limpios.',
    e: { p1: ['PRO,REC', 'molesto', 2], p2: ['DES', 'preocupado', 2], p3: ['PRO', 'propositivo', 1, 'datos_limpios'] },
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'Producción pide material por WhatsApp y a veces se pierde el mensaje.',
    p2: 'Que sigan pidiendo por WhatsApp aunque exista el sistema.',
    p3: 'Que todo pedido entre por el sistema y nada por chat.',
    e: { p1: ['COA,PRO', 'molesto', 2], p2: ['COA', 'preocupado', 1], p3: ['COA,PRO', 'propositivo', 1, 'quitar_papel'] },
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'El montacargas tiene los frenos malos y la semana pasada casi atropella a un compañero en el pasillo 3.',
    p2: 'Que alguien se lastime en la carrera por cumplir con el arranque.',
    p3: 'Revisar los equipos de seguridad antes de cualquier cambio.',
    e: { p1: ['REC', 'preocupado', 3], p2: ['otro:seguridad', 'preocupado', 3], p3: ['REC', 'propositivo', 2, 'equipos'] },
    rev: 'seguridad_salud',
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'Soy el único montacarguista del turno noche y cuando no vengo se para todo el despacho de la madrugada.',
    p2: 'Que me toque aprender solo porque en la noche nunca dan capacitaciones.',
    p3: 'Capacitar también al turno de la noche.',
    e: { p1: ['SOB,REC', 'preocupado', 2], p2: ['CAP', 'preocupado', 2], p3: ['CAP', 'propositivo', 1, 'capacitar_practica'] },
    ident: true,
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'Mucho trabajo, pocos auxiliares.',
    p2: 'Que el sistema sea la excusa para no contratar a nadie más y después sacar a los que estamos.',
    p3: 'Contratar dos auxiliares más.',
    e: { p1: ['SOB', 'molesto', 2], p2: ['EMP,DES', 'molesto', 3], p3: ['SOB', 'propositivo', 1, 'mas_personal'] },
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'Los códigos de las estanterías están borrados y toca buscar a ojo.',
    p2: 'Que los lectores no lean las etiquetas viejas.',
    p3: 'Cambiar todas las etiquetas antes de arrancar.',
    e: { p1: ['REC,PRO', 'neutral', 1], p2: ['REC', 'preocupado', 1], p3: ['REC', 'propositivo', 1, 'equipos'] },
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'Hacemos el mismo conteo tres veces porque nadie confía en el anterior.',
    p2: 'Ya lo intentaron dos veces con otros programas y nada funcionó. Uno más y la gente ya ni cree.',
    p3: 'Que esta vez lo terminen, aunque sea despacio.',
    e: { p1: ['PRO,DES', 'resignado', 2], p2: ['HIS,DES', 'resignado', 2], p3: ['HIS', 'propositivo', 1, 'piloto'] },
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'Cuando llega un camión de proveedor nadie avisa y se nos junta todo.',
    p2: 'Que el sistema sea muy complicado para usarlo con guantes y con afán.',
    p3: 'Probar las pistolas en la bodega real antes de comprarlas.',
    e: { p1: ['COA,SOB', 'molesto', 2], p2: ['REC,CAP', 'preocupado', 1], p3: ['REC', 'propositivo', 1, 'piloto'] },
  },
  {
    area: 'Bodega', grupo: 'Administrativo',
    p1: 'La información de compras llega incompleta a bodega.',
    p2: 'Que el proveedor del sistema no dé soporte cuando se caiga.',
    p3: 'Firmar un soporte en sitio durante el primer mes.',
    e: { p1: ['COA', 'neutral', 1], p2: ['REC', 'preocupado', 2], p3: ['REC', 'propositivo', 1, 'soporte'] },
  },
  {
    area: 'Bodega', grupo: 'Prefiero no decirlo',
    p1: 'Se pierde mucho tiempo buscando producto.',
    p2: 'Escuché que van a cerrar el turno de la noche cuando llegue el sistema. Si eso pasa me quedo sin trabajo y no sé qué hacer.',
    p3: 'Que la gerencia venga a bodega y nos explique.',
    e: { p1: ['PRO', 'neutral', 1], p2: ['EMP', 'preocupado', 3], p3: ['COD', 'propositivo', 2, 'informar'] },
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'El programa actual se cae casi todos los días a media mañana.',
    p2: 'Que el nuevo también se caiga y no haya plan B.',
    p3: 'Tener un procedimiento en papel por si el sistema se cae.',
    e: { p1: ['REC', 'molesto', 2], p2: ['REC', 'preocupado', 2], p3: ['PRO', 'propositivo', 1, 'soporte'] },
  },
  {
    area: 'Bodega', grupo: 'Líder de área',
    p1: 'No tengo datos confiables para planear la bodega.',
    p2: 'Que el equipo no me crea porque el último cambio lo anuncié yo y se cayó.',
    p3: 'Que el gerente acompañe el lanzamiento en la bodega.',
    e: { p1: ['REC,PRO', 'preocupado', 1], p2: ['HIS,DES', 'preocupado', 2], p3: ['COD', 'propositivo', 1, 'informar'] },
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: '',
    p2: 'Que sea otro programa más que compran y a los meses lo dejan.',
    p3: 'Escuchar a los auxiliares, que somos los que sabemos dónde está todo.',
    e: { p2: ['HIS', 'resignado', 2], p3: ['COD', 'propositivo', 1, 'preguntar_operarios'] },
  },
  {
    area: 'Bodega', grupo: 'Operativo',
    p1: 'Nos piden alistar pedidos más rápido pero las rutas dentro de la bodega no tienen sentido. Hay que cruzar toda la bodega para buscar productos que se venden juntos, y cuando hay temporada esto es un caos: los pedidos se acumulan, los camiones esperan afuera, los conductores se quejan y al final del día uno termina agotado sin haber podido hacer las cosas bien. Ya lo hemos dicho varias veces en las reuniones y no pasa nada.',
    p2: 'Que el sistema nuevo nos mida la velocidad y nos sancionen sin arreglar primero cómo está organizada la bodega.',
    p3: 'Reorganizar la bodega por rotación de producto antes del sistema.',
    e: { p1: ['PRO,SOB,COD', 'molesto', 3], p2: ['DES', 'preocupado', 2], p3: ['PRO', 'propositivo', 1, 'reorganizar'] },
  },

  // ---------- Despacho ----------
  {
    area: 'Despacho', grupo: 'Operativo',
    p1: 'Los conductores esperan horas porque los pedidos no están listos.',
    p2: 'Que en la primera semana se retrasen todos los despachos.',
    p3: 'Arrancar con pocos clientes primero.',
    e: { p1: ['PRO,COA', 'molesto', 2], p2: ['PRO', 'preocupado', 2], p3: ['PRO', 'propositivo', 1, 'piloto'] },
  },
  {
    area: 'Despacho', grupo: 'Operativo',
    p1: 'Las remisiones se hacen a mano y se equivocan las cantidades.',
    p2: 'No saber manejar el sistema y quedar mal delante del cliente.',
    p3: 'Practicar con pedidos de prueba antes del arranque.',
    e: { p1: ['PRO', 'neutral', 1], p2: ['CAP,OBS', 'preocupado', 2], p3: ['CAP', 'propositivo', 1, 'capacitar_practica'] },
  },
  {
    area: 'Despacho', grupo: 'Operativo',
    p1: 'Ventas promete fechas de entrega sin preguntarnos.',
    p2: 'Que ventas siga prometiendo lo que no podemos cumplir.',
    p3: 'Que ventas vea en el sistema lo que hay listo.',
    e: { p1: ['COA', 'molesto', 2], p2: ['COA', 'preocupado', 2], p3: ['COA', 'propositivo', 1, 'reunion_turno'] },
  },
  {
    area: 'Despacho', grupo: 'Operativo',
    p1: 'Nos toca quedarnos hasta tarde casi todos los viernes.',
    p2: 'Mucha gente está diciendo que esto es para sacar gente. Yo no duermo pensando en eso.',
    p3: 'Que firmen por escrito que no va a haber despidos.',
    e: { p1: ['SOB', 'molesto', 2], p2: ['EMP', 'preocupado', 3], p3: ['EMP', 'propositivo', 2, 'informar'] },
  },
  {
    area: 'Despacho', grupo: 'Operativo',
    p1: 'Falta una impresora de etiquetas, hay que ir hasta la oficina.',
    p2: 'Que no compren los equipos suficientes.',
    p3: 'Una impresora en cada muelle.',
    e: { p1: ['REC', 'neutral', 1], p2: ['REC', 'preocupado', 1], p3: ['REC', 'propositivo', 1, 'equipos'] },
  },
  {
    area: 'Despacho', grupo: 'Operativo',
    p1: 'Si quieren saber más de lo que pasa en despacho escríbanme a lmarin.despacho@correo-ejemplo.com o al 310 456 7890.',
    p2: 'Que no nos escuchen, como siempre.',
    p3: 'Hacer reuniones con cada área antes de decidir.',
    e: { p1: ['COD', 'neutral', 1], p2: ['COD', 'resignado', 2], p3: ['COD', 'propositivo', 1, 'preguntar_operarios'] },
  },
  {
    area: 'Despacho', grupo: 'Administrativo',
    p1: 'Facturación y despacho no comparten la misma información de los pedidos.',
    p2: 'Que el sistema no se conecte con facturación y toque digitar dos veces.',
    p3: 'Verificar la conexión con facturación antes de arrancar.',
    e: { p1: ['COA,PRO', 'neutral', 1], p2: ['REC,PRO', 'preocupado', 2], p3: ['REC', 'propositivo', 1, 'soporte'] },
  },
  {
    area: 'Despacho', grupo: 'Prefiero no decirlo',
    p1: 'Dicen una cosa en las reuniones y hacen otra.',
    p2: 'Que nos prometan beneficios que después no llegan.',
    p3: '',
    e: { p1: ['DES', 'molesto', 2], p2: ['DES', 'resignado', 2] },
  },
  {
    area: 'Despacho', grupo: 'Operativo',
    p1: 'Hay mucho reproceso por devoluciones de clientes.',
    p2: 'Que no haya tiempo para aprender con tanto trabajo.',
    p3: 'Dar media hora diaria para practicar durante el primer mes.',
    e: { p1: ['PRO', 'neutral', 1], p2: ['SOB,CAP', 'preocupado', 2], p3: ['CAP', 'propositivo', 1, 'capacitar_practica'] },
  },
  {
    area: 'Despacho', grupo: 'Líder de área',
    p1: 'Despacho siempre absorbe los atrasos de las demás áreas.',
    p2: 'Que el arranque coincida con la temporada de diciembre.',
    p3: 'Arrancar en enero, después de temporada.',
    e: { p1: ['COA,SOB', 'molesto', 2], p2: ['SOB', 'preocupado', 2], p3: ['SOB', 'propositivo', 1, 'piloto'] },
  },

  // ---------- Administración ----------
  {
    area: 'Administración', grupo: 'Administrativo',
    p1: 'Los informes se arman a mano juntando hojas de cálculo de cada área.',
    p2: 'Que el proyecto se quede a medias como el de turnos.',
    p3: 'Tener un responsable del proyecto con tiempo dedicado.',
    e: { p1: ['PRO', 'neutral', 1], p2: ['HIS', 'preocupado', 2], p3: ['HIS', 'propositivo', 1, 'responsable'] },
  },
  {
    area: 'Administración', grupo: 'Administrativo',
    p1: 'Las áreas no responden los correos a tiempo.',
    p2: 'Tener que capacitar a todos sin tener experiencia en el sistema.',
    p3: 'Que el proveedor capacite primero a unos multiplicadores.',
    e: { p1: ['COA', 'neutral', 1], p2: ['CAP,SOB', 'preocupado', 2], p3: ['CAP', 'propositivo', 1, 'multiplicadores'] },
  },
  {
    area: 'Administración', grupo: 'Administrativo',
    p1: 'Se aprueban compras sin consultar a quienes usan las cosas.',
    p2: 'Que la gerencia no explique por qué se escogió este sistema.',
    p3: 'Hacer una presentación abierta del proyecto para todos.',
    e: { p1: ['COD,REC', 'molesto', 2], p2: ['COD', 'preocupado', 1], p3: ['COD', 'propositivo', 1, 'informar'] },
  },
  {
    area: 'Administración', grupo: 'Administrativo',
    p1: 'No falla nada grave.',
    p2: 'Me preocupa no adaptarme rápido a otro sistema.',
    p3: 'Videos cortos con los pasos.',
    e: { p1: ['otro:sin falla', 'neutral', 1], p2: ['OBS', 'preocupado', 1], p3: ['CAP', 'propositivo', 1, 'capacitar_practica'] },
  },
  {
    area: 'Administración', grupo: 'Administrativo',
    p1: 'Los datos de inventario que llegan a contabilidad no son confiables.',
    p2: 'Que nos toque cuadrar a mano lo que el sistema haga mal.',
    p3: 'Hacer pruebas con datos reales durante un mes en paralelo.',
    e: { p1: ['PRO,REC', 'preocupado', 1], p2: ['PRO,SOB', 'preocupado', 1], p3: ['PRO', 'propositivo', 1, 'piloto'] },
  },
  {
    area: 'Administración', grupo: 'Líder de área',
    p1: 'Cada área trabaja por su lado y nadie ve el proceso completo.',
    p2: 'Que la gente vea el sistema como un control y no como una ayuda.',
    p3: 'Mostrar resultados rápidos en una bodega piloto.',
    e: { p1: ['COA', 'preocupado', 1], p2: ['DES', 'preocupado', 2], p3: ['COA', 'propositivo', 1, 'piloto'] },
  },
  {
    area: 'Administración', grupo: 'Administrativo',
    p1: 'Hay muchos pasos de aprobación para cualquier cosa.',
    p2: 'Quedarme obsoleta si el sistema hace lo que yo hago.',
    p3: 'Que nos digan qué rol vamos a tener después del cambio.',
    e: { p1: ['PRO', 'molesto', 1], p2: ['OBS,EMP', 'preocupado', 2], p3: ['EMP,COD', 'propositivo', 1, 'informar'] },
  },
];

const FECHAS = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'];

const separar = (texto) => texto.split(',').map((t) => t.trim()).filter(Boolean);

/** Respuestas del buzón de prueba en la tabla de entrada del copiloto (id, fecha, area, grupo, p1, p2, p3). */
export const BUZON_PRUEBA = FILAS.map((f, i) => ({
  id: `prueba-${String(i + 1).padStart(2, '0')}`,
  fecha: FECHAS[i % FECHAS.length],
  area: f.area,
  grupo: f.grupo,
  p1: f.p1,
  p2: f.p2,
  p3: f.p3,
}));

/**
 * Clasificación de referencia, en el mismo formato que se le pide a Gemini:
 * una fila por respuesta no vacía a cada pregunta.
 */
export const CLASIFICACION_PRUEBA = FILAS.flatMap((f, i) =>
  ['p1', 'p2', 'p3']
    .filter((p) => f[p].trim() !== '' && f.e[p])
    .map((p) => {
      const [temas, sentimiento, intensidad, idea] = f.e[p];
      const lista = separar(temas);
      return {
        id: BUZON_PRUEBA[i].id,
        pregunta: p,
        temas: lista.map((t) => (t.startsWith('otro:') ? 'OTRO' : t)),
        otro: lista.find((t) => t.startsWith('otro:'))?.slice(5) ?? '',
        sentimiento,
        intensidad,
        revision: p === 'p1' || p === 'p2' ? (f.rev ?? 'ninguna') : 'ninguna',
        identificable: Boolean(f.ident),
        idea: idea ?? '',
      };
    }),
);

/** Ideas de P3 (paráfrasis) de la clasificación de referencia. */
export const IDEAS_PRUEBA = {
  capacitar_practica: 'Capacitación práctica, en el puesto y dentro del turno (incluido el turno de la noche)',
  piloto: 'Probar primero en pequeño (una línea, una bodega o pocos clientes) antes de ampliar',
  preguntar_operarios: 'Preguntar y escuchar a quienes hacen el trabajo antes de decidir',
  informar: 'Explicar con claridad por qué se hace el cambio y qué pasa con los puestos',
  equipos: 'Arreglar equipos, señal y etiquetas antes de arrancar',
  mas_personal: 'Reforzar el personal o bajar la meta durante el arranque',
  soporte: 'Asegurar soporte y un plan B por si el sistema falla',
  multiplicadores: 'Formar multiplicadores por turno o por área',
  quitar_papel: 'Eliminar el papel y los canales paralelos cuando el sistema funcione',
  reunion_turno: 'Compartir el plan del día entre áreas al inicio del turno',
  datos_limpios: 'Empezar con un inventario contado y limpio',
  reorganizar: 'Reorganizar la bodega antes de medir tiempos',
  responsable: 'Nombrar un responsable del proyecto con tiempo dedicado',
};

/** Lectura del copiloto para el modo simulado (es una inferencia escrita a mano sobre los datos de prueba). */
export const LECTURA_PRUEBA = [
  'La preocupación más fuerte no es el sistema sino el empleo: el miedo a despidos aparece pocas veces, pero con intensidad alta y en varias áreas.',
  'Hay fatiga por cambios anteriores (el sistema de turnos) y desconfianza en lo que se promete; la narrativa tendrá que mostrar qué será distinto esta vez.',
  'Las condiciones previas (equipos, señal, etiquetas, personal) pesan tanto como la capacitación: si no se resuelven, el sistema cargará con la culpa.',
];

/** Normaliza un texto para comparar respuestas sin depender de mayúsculas, tildes ni espacios. */
export function huellaTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const huellaFila = (f) => [f.p1, f.p2, f.p3].map(huellaTexto).join('␟');
const HUELLAS_PRUEBA = new Set(BUZON_PRUEBA.map(huellaFila));

/** true si la respuesta es, texto por texto, una del buzón de prueba. */
export function esRespuestaDePrueba(fila) {
  return HUELLAS_PRUEBA.has(huellaFila(fila));
}

/** El buzón de prueba como CSV (lo que se sube en R5 › Cargar CSV). */
export function buzonPruebaCsv() {
  const celda = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const columnas = ['id', 'fecha', 'area', 'grupo', 'p1', 'p2', 'p3'];
  return [columnas.join(','), ...BUZON_PRUEBA.map((f) => columnas.map((c) => celda(f[c])).join(','))].join('\n') + '\n';
}
