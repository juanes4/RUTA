# RUTA · app web

```
npm install
npm run dev      # app + API + base SQLite, todo con un comando (Node 22.13 o superior)
npm test
```

## Sesión y usuarios

La base de datos es `server/data/ruta.db` (SQLite, se crea sola al iniciar y no se sube al repositorio).
Con la base vacía se crean estas cuentas de demostración, todas con la clave `ruta2026` (cámbialas):

| Usuario | Rol |
| --- | --- |
| `lider` | Líder: ve los videos de líderes y los de empleados, y quién vio cada uno |
| `empleado1`, `empleado2`, `empleado3` | Empleado: solo ve videos de empleados y sus propias vistas |

Agregar un usuario: `npm run usuario -- maria "María Pérez" empleado UnaClaveLarga123`

Los videos (YouTube) están en `server/videos.mjs`. Para cambiarlos: edita ese archivo, borra
`server/data/ruta.db` y vuelve a iniciar (esto también borra usuarios e historial).

## Etapa T (Transformar)

Sigue la sección «Etapa #3: Transformar» del documento de metodología (niveles de Kirkpatrick). El texto del documento está en
`src/config/transformar.ts`; las reglas de cálculo en `server/reglasT.mjs` y `src/lib/transformar/victorias.ts`.

| Paso | Qué hay | Quién |
| --- | --- | --- |
| T1 Comunicación | Encuesta de pulso (claridad, utilidad, formato; 1 a 5). El líder ve el promedio por sesión | Todos responden |
| T2 Capacitación | Micro-cursos en video, simulador de 3 preguntas, autoevaluación de seguridad e historial con los resultados | Empleado: sus videos y resultados. Líder: todo y quién lo hizo |
| T3 Acompañamiento | Votación de escalones (escalera de autonomía), tres dinámicas con su hoja de trabajo (máximo 2 por ciclo) y termómetro de apropiación | Votan y responden todos; el líder acuerda el escalón y guarda las hojas |
| T4 Victorias tempranas | Ficha FIMT, matriz MRMT (8 criterios, 8 a 40), matriz de reconocimiento, formato de publicación y balance del ciclo | Registra el líder; todos ven los méritos publicados |

Reglas: un 4 o un 5 en la matriz MRMT exige evidencia; solo se publica con 24 puntos o más y con la autorización de los protagonistas;
el termómetro es anónimo y solo se reporta con 5 respuestas o más por ciclo.

Pendiente de revisar con el equipo: las 21 preguntas del simulador (`server/simulador.mjs`) son un borrador escrito a partir del tema de cada
video, y la aprobación (2 de 3 aciertos) no está definida en el documento.

Las tablas nuevas (`simulacros` y `registros`) se crean solas; una base existente conserva usuarios, videos e historial.

## Etapa A (Analizar)

Sigue la sección «Etapa #4: Analizar» del documento de metodología RUTA ANDI 02. El texto, los indicadores y las 12 preguntas están en
`src/config/analizar.ts`; las reglas y agregaciones en `server/reglasA.mjs` y `src/lib/analizar/calculos.ts`.

| Paso | Qué hay | Quién |
| --- | --- | --- |
| A1 Auditorías de adopción | Tablero del equipo con 8 indicadores, metas editables, calculadora por fórmula, semáforo del 15 %, historial e insumos de Etapa T (termómetro T3 y balances T4) | Registra el líder; todos consultan el tablero |
| A2 Mapa de viaje del colaborador | Encuesta de 12 preguntas en 4 momentos (Antes, Durante, Situación actual, Hacia dónde mejorar), curva interactiva con caritas (🙂 / 😐 / 🙁), filtro por periodo y guía del taller | Todos responden; consolidado anónimo por periodo |
