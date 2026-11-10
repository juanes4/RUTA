# RUTA APP metodología de cambio, usando agentes de IA como apoyo

Es una metodología degestion del cambio, del reto CUEE con la ANDI, en medellín, colombia con la universidad Pascual Bravo
El proyecto está en `ruta-web/`.

## Antes de escribir código
Lee en este orden: `ruta-web/PLAN.md`, `ruta-web/DESIGN.md`,
`ruta-web/docs/CONTEXTO_metodologia_ANDI.md`.
- Contenido y reglas de cálculo: el contexto manda.
- Apariencia: DESIGN.md manda (colores, fuentes y estilo salen solo de ahí).
- Alcance, navegación y reglas de decisión: PLAN.md manda.
- Nunca pongas colores, fuentes, metas ni umbrales fijos en los
  componentes: usa los tokens de DESIGN.md y `src/config/`.
- Sin datos simulados en la app: debe funcionar para cualquier empresa.
- No se suben datos reales a IA pública (Ley 1581 de 2012).

## Stack
- Vite + React + TypeScript + Recharts, sitio estático.
- Datos: `localStorage` detrás de `src/lib/almacen` (backend después).
- Estilos: tokens de DESIGN.md en `src/styles/`.

## Comandos
- Desarrollo: `[npm run dev]` (confirmar al crear el proyecto)
- Pruebas: `[npm test]`
- Build: `[npm run build]`

## Diseño
Antes de tocar UI, lee `ruta-web/DESIGN.md`. No vuelvas a analizar las
imágenes de `ruta-web/docs/referencias/` salvo que te lo pida (la
equivalencia de nombres está en PLAN.md, sección 1).

## Cómo trabajar (ahorro de tokens)
- Lee solo los archivos necesarios para la tarea. No explores el
  repositorio entero ni leas el mismo archivo dos veces.
- Si no sabes dónde está algo, pregúntame o busca con Grep antes de
  abrir archivos completos.
- Respuestas breves: sin saludos, sin resumir lo que acabas de hacer.
  Di qué cambiaste y en qué archivo.
- Cambios pequeños y enfocados. No refactorices código que no te pedí.
- Para logs largos o salidas de pruebas, muestra solo errores y las
  líneas relevantes.
- Si la tarea es grande, propón un plan corto y espera mi aprobación
  antes de escribir código.

## Verificación
- Después de cada cambio de UI, ábrela en el navegador y revisa que
  funcione y que respete `DESIGN.md`.
- Ejecuta las pruebas relacionadas, no toda la suite, salvo que te
  lo pida.

## Al compactar el contexto, conserva
- Archivos modificados en esta sesión.
- Decisiones de diseño ya aprobadas.
- Errores pendientes y comandos de prueba.

## Evitar
- Textos de relleno tipo "Lorem ipsum".
- Degradados morados genéricos y tarjetas idénticas repetidas.
- Instalar dependencias nuevas sin avisarme.

## Archivos ya leídos
- Si ya leíste un archivo en esta sesión y no ha cambiado, no lo
  vuelvas a abrir. Usa lo que recuerdas.
- Mantén un archivo `NOTES.md` con una línea por archivo importante:
  qué hace y dónde están sus funciones clave. Consúltalo antes de abrir
  archivos completos.
- Para buscar algo concreto, usa Grep y lee solo el rango necesario.



## Commits
Nunca menciones claude code como co-author ni nada de eso en un commit, deben ser claros y resumidos.