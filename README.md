# RUTA · app web

Metodología de gestión del cambio (reto CUEE con la ANDI). La aplicación está en `ruta-web/`.

```
cd ruta-web
npm install
npm run dev      # app + API + base SQLite, todo con un comando (Node 22.13 o superior)
npm test
```

## Sesión y usuarios

La base de datos es `ruta-web/server/data/ruta.db` (SQLite, se crea sola al iniciar y no se sube al repositorio).
Con la base vacía se crean estas cuentas de demostración, todas con la clave `ruta2026` (cámbialas):

| Usuario | Rol |
| --- | --- |
| `lider` | Líder: ve los videos de líderes y los de empleados, y quién vio cada uno |
| `empleado1`, `empleado2`, `empleado3` | Empleado: solo ve videos de empleados y sus propias vistas |

Agregar un usuario (desde `ruta-web/`): `npm run usuario -- maria "María Pérez" empleado UnaClaveLarga123`

Los videos (YouTube) están en `ruta-web/server/videos.mjs`. Para cambiarlos: edita ese archivo, borra
`ruta-web/server/data/ruta.db` y vuelve a iniciar (esto también borra usuarios e historial).

## Etapa R (Reconocer): copiloto y buzón en línea

El **Copiloto de Reconocimiento** (solo rol líder) se abre desde el índice de la etapa R. Tiene 4 pestañas: buzón (R5), lienzo (R1),
triaje (R2) y dossier para la etapa U. Usa la API de **Gemini** desde el servidor. El modelo clasifica y propone; los conteos, los porcentajes,
la suma del triaje y el semáforo se calculan en código. Nada pasa a R1 o R2 sin el clic de la persona (botones "Pasar a R1" y "Pasar a R2").

Variables del servidor, en el entorno o en `ruta-web/.env`. Copia `ruta-web/.env.example` como `.env` y llena los valores. El `.env` no se sube, ninguna
clave va en el código ni llega al navegador (nunca uses el prefijo `VITE_`), y al iniciar la consola avisa qué variables faltan sin mostrar valores:

| Variable | Para qué |
| --- | --- |
| `GEMINI_API_KEY` | Clave de la API de Gemini |
| `GEMINI_API_KEY_RESPALDO` | Opcional. Segunda clave: se usa solo si la principal se queda sin cuota o es rechazada |
| `GEMINI_MODEL` | El modelo que se quiere usar; se cambia sin tocar el código |
| `GEMINI_MODELOS_RESPALDO` | Opcional. Modelos separados por comas, del más al menos potente: si `GEMINI_MODEL` está saturado, sin cuota o no responde, se prueban en orden. La app muestra cuál respondió |
| `RUTA_IA_DATOS_REALES` | Solo con `permitido` se envían a Gemini respuestas que no son del buzón de prueba |
| `RUTA_BUZON_API_KEY` | Clave del endpoint que recibe las respuestas de Google Forms (`POST /api/buzon/recibir`, cabecera `X-Api-Key`) |
| `RUTA_HOSTS` | Hosts extra para Vite (por ejemplo, el de un túnel para que Apps Script llegue a la app) |

Sin `GEMINI_API_KEY` o `GEMINI_MODEL`, o si la API falla, la app lo explica y ofrece el **modo simulado** (sin IA, con la clasificación
de referencia del buzón de prueba). **Sin respuestas reales hasta tener un contrato de datos:** sin `RUTA_IA_DATOS_REALES=permitido`, el
servidor solo envía a Gemini el buzón de prueba (49 respuestas inventadas, en `ruta-web/server/copiloto/buzonPrueba.mjs` y
`ruta-web/public/buzon_prueba.csv`). El enmascarado (correos, teléfonos, cédulas y nombres) se aplica siempre.

R5 acepta un grupo opcional (operativo, administrativo, líder de área) además del área. Los resultados se separan por área **o** por grupo,
nunca por los dos a la vez. R5 tiene una pestaña "Google Forms en línea": mientras el buzón está abierto solo se ve el conteo, y al cerrarlo
las respuestas se traen a R5. El prompt está en `ruta-web/server/copiloto/prompt.mjs`. Las guías del copiloto y de Google Forms
(con el Apps Script) están en `ruta-web/docs/`.

## Etapa T (Transformar)

Sigue la sección «Etapa #3: Transformar» del documento de metodología (niveles de Kirkpatrick). El texto del documento está en
`ruta-web/src/config/transformar.ts`; las reglas de cálculo en `ruta-web/server/reglasT.mjs` y `ruta-web/src/lib/transformar/victorias.ts`.

| Paso | Qué hay | Quién |
| --- | --- | --- |
| T1 Comunicación | Encuesta de pulso (claridad, utilidad, formato; 1 a 5). El líder ve el promedio por sesión | Todos responden |
| T2 Capacitación | Micro-cursos en video, simulador de 3 preguntas, autoevaluación de seguridad e historial con los resultados | Empleado: sus videos y resultados. Líder: todo y quién lo hizo |
| T3 Acompañamiento | Votación de escalones (escalera de autonomía), tres dinámicas con su hoja de trabajo (máximo 2 por ciclo) y termómetro de apropiación | Votan y responden todos; el líder acuerda el escalón y guarda las hojas |
| T4 Victorias tempranas | Ficha FIMT, matriz MRMT (8 criterios, 8 a 40), matriz de reconocimiento, formato de publicación y balance del ciclo | Registra el líder; todos ven los méritos publicados |

Reglas: un 4 o un 5 en la matriz MRMT exige evidencia; solo se publica con 24 puntos o más y con la autorización de los protagonistas;
el termómetro es anónimo y solo se reporta con 5 respuestas o más por ciclo.

Pendiente de revisar con el equipo: las 21 preguntas del simulador (`ruta-web/server/simulador.mjs`) son un borrador escrito a partir del tema de cada
video, y la aprobación (2 de 3 aciertos) no está definida en el documento.

Las tablas nuevas (`simulacros` y `registros`) se crean solas; una base existente conserva usuarios, videos e historial.

## Etapa A (Analizar)

Sigue la sección «Etapa #4: Analizar» del documento de metodología RUTA ANDI 02. El texto, los indicadores y las 12 preguntas están en
`ruta-web/src/config/analizar.ts`; las reglas y agregaciones en `ruta-web/server/reglasA.mjs` y `ruta-web/src/lib/analizar/calculos.ts`.

| Paso | Qué hay | Quién |
| --- | --- | --- |
| A1 Auditorías de adopción | Tablero del equipo con 8 indicadores, metas editables, calculadora por fórmula, semáforo del 15 %, historial e insumos de Etapa T (termómetro T3 y balances T4) | Registra el líder; todos consultan el tablero |
| A2 Mapa de viaje del colaborador | Encuesta de 12 preguntas en 4 momentos (Antes, Durante, Situación actual, Hacia dónde mejorar), curva interactiva con caritas (🙂 / 😐 / 🙁), filtro por periodo y guía del taller | Todos responden; consolidado anónimo por periodo |
