# PLAN.md · Herramienta web de la metodología RUTA

> Plan de trabajo. No contiene código. Se lee junto con `DESIGN.md` (visual) y `docs/CONTEXTO_metodologia_ANDI.md` (contenido y reglas).
> Entrega final: **viernes 13 de noviembre de 2026**. Última revisión del plan: 7 de noviembre de 2026 (decisiones del equipo incorporadas).

**RUTA** es la metodología que inventó el equipo: **R**econocer · **U**nir · **T** · **A** (T y A están por desarrollar).

## 1. Orden de lectura y qué manda en cada tema

| Archivo | Responde a | Si hay conflicto |
| --- | --- | --- |
| `docs/CONTEXTO_metodologia_ANDI.md` | Qué se mide, fórmulas, metas, reglas de privacidad, textos de la metodología | Manda en **contenido** |
| `docs/Metodologia_transformacion_organizacional.md` | Texto completo de R1–R7 y U1–U5 (documento maestro) | Detalle del contenido |
| `docs/instrumento2_kotter.md` | Preguntas Kotter A y B, escala, conversión a puntaje, niveles, decisión, 12 indicadores | Manda en **todo lo de Kotter** |
| `DESIGN.md` | Colores, tipografía, espaciado, componentes, tono visual | Manda en **apariencia**, sin excepciones |
| `PLAN.md` | Alcance, estructura, comportamiento de la navegación, reglas de decisión | Manda en **alcance y comportamiento** |

- Colores, fuentes y estilo salen **solo** de `DESIGN.md`. No se usa la paleta de la presentación (Domine, Nunito Sans, colores de la sección 10 del contexto) ni los colores de la imagen de la navegación.
- La imagen de la navegación es un **boceto de estados** (activa, vacía, contador), no de diseño: no se copian sus colores ni su forma.
- Referencias visuales en `docs/referencias/` (DESIGN.md las nombra con otro nombre):

| DESIGN.md | Archivo real |
| --- | --- |
| 01-pay-dashboard | `2cb6cfd586fb919cf20e7aa559122d1f.jpg` |
| 02-glass-filters | `1794104762439_image.png` |
| 03-crypto-overview | `1583d71ff0f91419951e452e860acdaa.jpg` |
| 04-gray-app | `8c1d85d9dd572a6d2dded40a2df0669a.jpg` |

## 2. Qué es la herramienta

Una **herramienta que captura datos, los procesa y los muestra**, no una página informativa. Debe servir para **cualquier empresa y cualquier cambio**: no trae datos simulados ni un caso precargado. Arranca vacía; la empresa se registra en la Etapa 0 y los indicadores aparecen a medida que llegan respuestas (formularios o CSV).

El kit en papel funciona solo; la herramienta es una capa opcional que agrega análisis.

**Sí entra (13 de noviembre):**
- Etapa 0: registro de la empresa, el cambio, los grupos, los afectados y las metas.
- Captura: formularios de buzón 1, buzón 2, verificación de capacitación y **chequeo Kotter parte A**; registro de uso por ciclo; carga de CSV.
- **Kotter parte B** (formulario mensual y tablero de 12 indicadores): **prioridad 2**, entra si el cronograma lo permite. El modelo de datos y el cálculo la soportan desde el inicio.
- Diagnóstico de la etapa 1 (mapa de calor ADKAR, punto de bloqueo, decisión de lanzamiento).
- Seguimiento de la etapa 2 (indicadores con semáforo, utilización vs. meta, dicen vs. hacen).
- Tablero con 3 categorías y semáforo.
- Estructura preparada para agentes de IA (sección 8), sin implementarlos.

**No entra:** datos simulados, página institucional, integración con sistemas de la empresa, login corporativo, datos reales en IA pública, perfilamiento y modelo predictivo, agentes de IA funcionando.

## 3. Navegación flotante (requisito principal)

La navegación principal es una **barra flotante vertical fija** en el costado, con un indicador del flujo lineal de 5 nodos. Es la única forma de navegar entre etapas.

### Nodos

| Nodo | Nombre | Pasos | Contador | Estado |
| --- | --- | --- | --- | --- |
| 0 | Etapa 0 · Registro de la empresa | 0.1 a 0.4 (sección 4) | `x/4` | **Activa** |
| R | Reconocer | R1 a R7 | `x/7` | **Activa** |
| U | Unir | U1 a U5 | `x/5` | **Activa** |
| T | Por definir | — | — | **Vacía** (placeholder) |
| A | Por definir | — | — | **Vacía** (placeholder) |

Contadores confirmados: R tiene 7 pasos (desde que se agregó la encuesta de liderazgo) y U tiene 5. La imagen que muestra R 0/5 y U 0/7 está desactualizada.

### Comportamiento
- Línea vertical que une los 5 nodos; se llena según el avance por scroll.
- **Etapa activa:** letra visible, clic lleva a la sección con desplazamiento suave, contador de pasos vistos.
- **Etapa vacía:** nodo neutro, **sin letra**, deshabilitado, con la etiqueta "Próximamente". Sigue en la línea para mostrar el recorrido completo. No tiene sección en la página.
- **Expandir** (cursor encima o botón): lista de pasos de la etapa para saltar a uno.
- Activar una etapa = cambiar `activa: true` y agregar sus pasos en `src/config/etapas.ts`. Nada más cambia.
- **Celular:** pasa a barra horizontal inferior.
- **Accesibilidad:** teclado completo, `aria-current` en la etapa actual, respeta `prefers-reduced-motion`.
- **Apariencia:** tokens de `DESIGN.md` (panel flotante = vidrio, según su sección "Transparencia"). El color de cada etapa sale de los pasteles por categoría de `DESIGN.md`.
- **Sidebar doble** (ref 04 de DESIGN.md): solo para los **filtros del tablero** en la vista U (grupo, ciclo, momento). Nunca para navegar entre etapas.

## 4. Estructura de la página

1. **Inicio:** el reto en una frase y el recorrido en 10 pasos (entender → comunicar → escuchar → decidir → acompañar → comprobar). Si no hay empresa registrada, invita a empezar por la Etapa 0.
2. **0 · Registro de la empresa** *(pasos propuestos por software, por confirmar con administrativa)*:
   - 0.1 Empresa y cambio: nombre, sector, tamaño, qué cambia, fecha de lanzamiento. Sin datos personales.
   - 0.2 Grupos y afectados: áreas, turnos/sedes, rangos de antigüedad y nº de afectados por grupo (base de la participación).
   - 0.3 Metas: valor y sentido de cada indicador, precargadas con las metas iniciales del documento y editables.
   - 0.4 Dato de uso: qué se cuenta como "uso" (transacciones, casos, cargos, equipos) y duración del ciclo.
3. **R · Reconocer (R1 a R7):**
   - R1 a R5: tarjeta por paso (objetivo, con quién, tiempo, formato). Son pasos de taller o papel; la herramienta los explica y no los calcula.
   - R6: mapa de calor ADKAR por grupo (umbral 3,0), % favorable, punto de bloqueo, % "No sé" con alerta mayor a 20 %, participación (meta 70 %), preocupaciones y forma de aprender.
   - R7: decisión de lanzamiento con el chequeo Kotter parte A (sección 6).
4. **U · Unir (U1 a U5):**
   - U1 a U4: tarjetas (comunicación por punto de bloqueo, red de agentes, capacitación con embudo, buzón 2).
   - U5: los 9 indicadores del documento con semáforo, utilización vs. meta por ciclo, regla de lectura cruzada y gráfico dicen vs. hacen.
   - **Tablero** en 3 categorías: Compromiso y conciencia · Formación y comunicación · Adopción, con la sidebar doble de filtros.
5. **Captura de datos:** formularios (buzón 1, buzón 2, verificación de capacitación, Kotter parte A), registro de uso por ciclo, carga de CSV, exportar e importar el proyecto completo.
6. **Metodología y datos:** fuentes teóricas, niveles D/A/P y reglas de privacidad.

**Estados vacíos:** cada indicador sin datos dice qué formulario o CSV lo alimenta y cuántas respuestas faltan para mostrarlo (mínimo 5 por grupo). Nunca se rellena con datos inventados.

## 5. Decisiones técnicas

- **Stack:** Vite + React + TypeScript + Recharts, sitio estático. Despliegue gratis en Netlify o Vercel.
- **Datos:** sin datos simulados. Se guardan en el navegador (`localStorage`), con varios proyectos (uno por empresa o cambio) y exportación e importación en JSON y CSV para mover los datos del taller. El modelo es el de la sección 7 del contexto (formato largo, una fila por dato), con dos ajustes: `kotter` agrega `rol` (R0: dirección, líder de área, equipo de cambio), `periodo`, `respuesta_original` y `evidencia`, y existe una tabla `empresa`/`grupos` para la Etapa 0. Se guarda la respuesta tal como se dio (Sí/No, proporción, opción); la conversión a puntaje la hace el módulo de cálculo.
- **Acceso a datos detrás de una interfaz** (`src/lib/almacen`), para cambiar `localStorage` por un backend después sin tocar la interfaz ni el cálculo.
- **Cálculo:** un módulo único, con funciones puras e independientes de la interfaz, con pruebas. Las pruebas usan casos fijos del documento (por ejemplo, el turno noche de la sección 8 del contexto); esos datos viven solo en las pruebas, nunca en la app.
- **Formularios definidos por configuración** (preguntas, dimensión, escala), para poder corregir textos o cargar el Instrumento 2 completo sin tocar componentes.
- **Privacidad:** sin nombres, resultados solo en grupos de 5 o más, ningún dato real a IA pública (Ley 1581 de 2012).

## 6. Reglas de cálculo y decisión

Las marcadas **[PROPUESTA]** no están en el documento; son del equipo y se presentan así hasta confirmarlas. Todos los umbrales van en `src/config/`, no en el código.

### Cálculo
- "No sé" **no entra al promedio**; se cuenta aparte.
- Grupos con **menos de 5 respuestas** se ocultan o se fusionan.
- **Grupos:** por defecto, por área (Instrumento 1). La combinación área × turno solo se muestra si **cada celda** tiene al menos 5 respuestas.
- **Punto de bloqueo:** primera dimensión con promedio menor a 3,0, en el orden C → D → K → H → R (Conciencia, Deseo, Conocimiento, Habilidad, Refuerzo; en ADKAR la C es la A de *Awareness*).
- **% favorable:** respuestas 4 y 5 ÷ total válido.

### Kotter (Instrumento 2)
- **Grupos por rol** (R0): dirección o patrocinador, líderes de área, equipo de cambio. **Mínimo 3 personas** por grupo; con menos, se une a otro. (La regla de 5 es del Instrumento 1, para colaboradores.) Con 1 o 2 personas, mostrar el grupo equivale a mostrar respuestas individuales, y el instrumento lo prohíbe.
- **Unión de grupos [PROPUESTA, decisión del equipo]:**
  1. **Prevenir:** si la dirección tiene menos de 3 respuestas, la herramienta avisa antes de cerrar el diagnóstico y pide invitar al comité directivo (el instrumento pide 8 a 25 personas).
  2. **Si sigue en 1 o 2:** la dirección se une al **equipo de cambio** (los dos forman la coalición guía, paso 2).
  3. **Si el equipo de cambio también queda con menos de 3 después de unirse**, se une a los líderes de área y solo se muestra el total.
- **Conversión a puntaje** (sección 2.4 del instrumento):
  - Sí/No: Sí con evidencia = 5, No = 1. Un "Sí" sin evidencia se registra como "No". En las alertas (A5.3, A5.4, B5.2) se invierte: No = 5, Sí = 1.
  - Proporciones (B1.2, B3.2): < 25 % = 1 · 25–50 % = 2 · 51–75 % = 4 · > 75 % = 5.
  - B4.1: Ninguna = 1 · Menos de la mitad = 2 · La mitad o más = 4 · Todas = 5.
  - A8.3: Se sostuvieron = 5 · En parte = 3 · Se abandonaron = 2 · No se implementaron = 1 · No conozco = no suma.
  - "No sé" no suma. B5.1 y B8.1 no se convierten: son indicadores. Las abiertas se analizan por temas.
- **Puntaje del paso:** promedio de sus preguntas de escala y convertidas, por rol y en total.
- **Niveles del paso:** Bajo 1,0–2,9 · Medio 3,0–3,9 · Alto 4,0–5,0. Las barras por paso usan estos niveles (con palabra), no el semáforo de metas. Cada nivel muestra la acción sugerida del instrumento.
- **Brecha entre roles:** 1 punto o más = alerta para discutir en el taller.
  - Normal (todos los roles con 3 o más): dirección vs. líderes de área y dirección vs. equipo de cambio.
  - **Brecha aproximada [PROPUESTA]:** si la dirección se unió, se calcula entre quienes lideran el cambio (dirección + equipo de cambio) y los líderes de área. El tablero la marca como "brecha aproximada" y dice que la dirección se unió por tener pocas respuestas.
  - Si los líderes de área tienen menos de 3, no hay brecha: solo se muestra el total.

### Semáforo [PROPUESTA: margen relativo]
Margen `t` = 15 %, configurable. Siempre con palabra: "En meta", "Atención", "Intervenir".
Excepción: los 12 indicadores de Kotter parte B traen su propia meta y su propio umbral de alerta (sección 2.6 del instrumento). Ahí manda el instrumento: verde si cumple la meta, rojo si está en zona de alerta, amarillo entre las dos. `metas.ts` guarda un campo `alerta` opcional; si no está, se usa el margen del 15 %.

| Sentido | En meta (verde) | Atención (amarillo) | Intervenir (rojo) |
| --- | --- | --- | --- |
| Mayor es mejor | valor ≥ meta | meta × (1 − t) ≤ valor < meta | valor < meta × (1 − t) |
| Menor es mejor | valor ≤ meta | meta < valor ≤ meta × (1 + t) | valor > meta × (1 + t) |

Ejemplos: meta 90 % → amarillo desde 76,5 %. Meta < 10 % → amarillo hasta 11,5 %.

### Decisión R7 (buzón 1 + Kotter parte A)
- **Paso bajo:** puntaje del paso (total) entre 1,0 y 2,9.
- **Dirección no alineada:** alguno de los pasos 1 a 3 está bajo (regla de secuencia del Instrumento 2). Se usan los pasos 1 a 3 del instrumento (urgencia, coalición, visión), no "patrocinio, coalición y visión" del documento maestro.
- **Alerta de brecha:** se muestra junto a la decisión; no la cambia.

Se evalúa en este orden; gana la primera que se cumpla:

| # | Condición | Decisión |
| --- | --- | --- |
| 1 | Dirección no alineada, o 3 o más pasos bajos (Instrumento 2), o **más del 50 %** de los grupos con bloqueo en Conciencia **[PROPUESTA: umbral]** | Postergar 4 a 8 semanas |
| 2 | 1 o 2 pasos bajos (posteriores al 3), o algún grupo con bloqueo en Deseo, o algunos grupos (50 % o menos) con bloqueo en Conciencia **[PROPUESTA, aceptada por el equipo]** | Lanzar con ajustes en el primer ciclo |
| 3 | Ninguna de las anteriores | Lanzar según el plan |

La decisión se registra con fecha, responsable y los tres riesgos principales. La herramienta **recomienda**; la persona decide.

## 7. Estructura del proyecto

```
RUTA_APP/
├─ CLAUDE.md                 ← instrucciones para Claude Code
└─ ruta-web/
   ├─ DESIGN.md
   ├─ PLAN.md                ← este archivo
   ├─ docs/
   │  ├─ CONTEXTO_metodologia_ANDI.md
   │  ├─ Metodologia_transformacion_organizacional.md
   │  └─ referencias/        ← imágenes de DESIGN.md (tabla de la sección 1)
   ├─ public/
   ├─ src/
   │  ├─ config/etapas.ts    ← etapas, pasos, contadores y `activa`
   │  ├─ config/metas.ts     ← metas por defecto y sentido de cada indicador
   │  ├─ config/reglas.ts    ← umbrales: 3,0 · 5 respuestas · 15 % · 20 % "No sé" · reglas R7
   │  ├─ config/formularios/ ← preguntas de cada instrumento
   │  ├─ config/ia.ts        ← capa de IA, `habilitada: false`
   │  ├─ lib/calculo/        ← módulo de cálculo + pruebas
   │  ├─ lib/almacen/        ← acceso a datos (localStorage hoy)
   │  ├─ lib/ia/             ← solo interfaces, sin implementación
   │  ├─ components/         ← navegación flotante, semáforo, mapa de calor, tarjetas, estados vacíos
   │  ├─ views/              ← Inicio, Etapa 0, R, U, Captura, Metodología
   │  └─ styles/             ← tokens tomados de DESIGN.md
   └─ package.json
```

Cuando se desarrolle T o A: se agrega su contenido al contexto, sus pasos a `etapas.ts` y se cambia `activa: true`. El plan no se reescribe.

## 8. Agentes de IA (abierto, no entra el 13 de noviembre)

El equipo puede usar agentes de IA en el proceso de gestión del cambio. La primera versión no los implementa, pero deja el camino listo.

**Usos previstos:**
- **Leer documentos:** lienzo, ficha del cambio, documento maestro y respuestas abiertas → clasificar por tema y dimensión ADKAR, armar el mapa de empatía, proponer ítems del backlog.
- **Acompañar el proceso:** explicar un indicador en rojo, sugerir acciones de U1 según el punto de bloqueo, preparar la retrospectiva del ciclo, responder dudas sobre la metodología (ya existe un prototipo con n8n + Gemini).

**Qué deja listo esta versión:**
- El módulo de cálculo con funciones puras y tipos claros, para usarlo después como herramientas de un agente.
- `lib/ia/` con interfaces (proveedor, contexto que se envía, respuesta) y sin implementación. `config/ia.ts` con `habilitada: false`.
- Los datos exportables en JSON, para dárselos a un agente.
- Ningún botón ni texto de IA visible mientras esté apagada.

**Reglas que cualquier agente debe cumplir:**
- Solo recibe datos agregados de grupos de 5 o más. Nunca respuestas individuales ni textos abiertos reales hacia IA pública (Ley 1581).
- Si procesa textos abiertos reales, debe ser un modelo local o un proveedor con contrato de tratamiento de datos.
- Recomienda; no decide. Las decisiones (R7, escalar al patrocinador) las toma una persona.

## 9. Cronograma

| Día | Entrega |
| --- | --- |
| Sáb 7 y dom 8 | Esqueleto, tokens de `DESIGN.md`, navegación flotante, Etapa 0, modelo de datos y almacén, módulo de cálculo con pruebas |
| Lun 9 | Formularios (buzón 1, Kotter A) y vista R: mapa de calor, bloqueo, participación y decisión R7 |
| Mar 10 | Formularios (buzón 2, verificación, uso) y vista U: indicadores con semáforo, utilización vs. meta, dicen vs. hacen |
| Mié 11 | Tablero de 3 categorías con sidebar de filtros, carga CSV, exportar e importar |
| Jue 12 | Pruebas, estados vacíos, ajustes de diseño y despliegue |
| Vie 13 | Entrega |

## 10. Criterio de "terminado"
- La navegación muestra las 5 etapas; 0, R y U se abren y sus contadores avanzan con el scroll; T y A aparecen como "Próximamente".
- La app arranca vacía, sin datos inventados, y cada indicador explica qué dato le falta.
- Una empresa nueva puede registrarse, capturar respuestas y ver sus indicadores sin tocar código.
- Prueba del cálculo: con promedios Conciencia 3,6, Deseo 2,6, Conocimiento 2,1, Habilidad 2,8 y Refuerzo 3,1, el punto de bloqueo es **Deseo**.
- Un grupo con menos de 5 respuestas no se muestra.
- Cambiar una meta o el margen del 15 % cambia el semáforo sin tocar componentes.
- Cargar un CSV actualiza todos los indicadores.
- Las pruebas de R7 cubren las tres decisiones y la alerta de brecha.
- Las pruebas de Kotter cubren cada regla de conversión (incluido "Sí" sin evidencia = "No" y las preguntas de alerta invertidas) y la unión de grupos con menos de 3 personas (dirección → equipo de cambio, brecha aproximada, sin brecha si los líderes de área tienen menos de 3).

## 11. Pendientes por confirmar
1. **Fuentes y colores exactos:** `DESIGN.md` describe el estilo pero no trae fuentes ni valores hex. Hay que agregarlos ahí (o aprobar los que proponga software a partir de las referencias).
2. ~~Unión de grupos Kotter~~: resuelto (sección 6, propuesta del equipo).
3. **Kotter parte B:** confirmar si entra el 13 de noviembre (hoy es prioridad 2). Algunas alertas son temporales (baja 0,5 frente al periodo anterior, sin aumento en 2 periodos, a los 6 o 9 meses) y necesitan varios periodos de datos.
4. **Pasos de la Etapa 0** (0.1 a 0.4): propuesta de software, por validar con administrativa.
5. **[PROPUESTA] por confirmar:** margen relativo del semáforo y "mayoría" = más del 50 %.
6. **Instrumento 1 (ADKAR completo):** no está en `docs/`. No bloquea (R6 usa el buzón 1), pero hace falta para la línea base ampliada en empresas de más de 50 personas.
7. **T y A:** nombre y pasos, cuando se definan.
