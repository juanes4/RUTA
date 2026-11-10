# Guía de estilo

## Resumen
Dashboard claro y moderno. Estructura limpia con tarjetas (refs 01 y 03),
acabado translúcido tipo vidrio en la navegación y paneles flotantes
(refs 02 y 04), y navegación al estilo de la ref 04.

## Referencias (design/references/)
- 01-pay-dashboard.png y 03-crypto-overview.png: formato de paneles,
  contenedor principal, tarjetas de datos, tabla, gráficas, tooltips.
- 02-glass-filters.png: solo el efecto de vidrio y los botones en
  píldora. No copiar sus textos (están deformados).
- 04-gray-app.png: navegación y opciones, ver sección siguiente.

## Estructura (refs 01 y 03)
- Fondo de página gris azulado muy claro, con manchas de color suaves
  y difuminadas (necesarias para que se note la transparencia).
- Contenedor principal blanco con esquinas muy redondeadas (24-32px).
- Tarjetas de datos con colores pastel suaves, una por categoría.
- Tabla limpia, sin bordes gruesos, con separadores finos.
- Tooltips y tarjetas destacadas en negro.
- Botones principales negros con texto blanco.

## Transparencia (refs 02 y 04)
- Aplicarla en: sidebar secundario, menús desplegables, modales,
  paneles flotantes y la barra superior.
- Técnica: fondo semitransparente (rgba blanco 55-70%), backdrop-filter
  blur (16-24px), borde de 1px blanco al 40% y sombra difusa.
- NO aplicarla en las tarjetas de datos ni en tablas: ahí va color sólido.
- Menús desplegables que se abren sobre texto: vidrio mate, más opaco y
  difuso (rgba blanco 85%, blur 32px), para que no se mezcle con lo de atrás.
- Paneles con texto importante: borde fino `#E5E8EF` y sombra difusa
  `0 8px 32px rgba(17,17,17,0.16)`, para guiar la vista.
- El texto debe mantener buen contraste (mínimo 4.5:1). Nada de gris
  claro sobre vidrio.

## Navegación y opciones (ref 04)
- Sidebar doble: una columna estrecha oscura solo con iconos, y al lado
  un panel translúcido con secciones.
- Secciones con título pequeño en gris (Projects, Status, History,
  Documents) y elementos con icono + etiqueta.
- Contadores en insignias redondas a la derecha de cada elemento.
- Elemento activo resaltado con una píldora más clara.
- Árbol de carpetas con sangrías y línea guía vertical.
- Buscador con borde sutil dentro del panel.
- Pestañas con subrayado bajo la activa (Workflows / Permissions).
- Números grandes en tarjetas con insignia de variación (↑ 204%).
- Botón secundario sólido con el acento de acción `#BFDDFB`, sin borde
  punteado ni flecha. Agregar y quitar: botones redondos con "+" (negro)
  y "−" (blanco con borde), a la misma altura que los campos.
- Usuario arriba del panel con avatar, nombre y correo.

## Evitar
- Mezclar sombras duras con las suaves.
- Degradados morados genéricos.
- Tarjetas idénticas repetidas sin variación.
- Texto de relleno tipo "Lorem ipsum".

## Tipografía
- Titulares y números grandes: **Plus Jakarta Sans** (600-700).
- Texto de interfaz, tablas y etiquetas: **Inter** (400-500).
- Números de datos (saldos, precios, porcentajes): Inter con
  `font-variant-numeric: tabular-nums` para que las columnas alineen.
- Cargar solo estos pesos desde Google Fonts: 400, 500, 600, 700.
- Fallback: `system-ui, -apple-system, "Segoe UI", sans-serif`.

| Uso                      | Tamaño | Peso | Fuente            |
|--------------------------|--------|------|-------------------|
| Título de página         | 28-32px| 700  | Plus Jakarta Sans |
| Título de tarjeta        | 18-20px| 600  | Plus Jakarta Sans |
| Número destacado         | 40-48px| 600  | Plus Jakarta Sans |
| Texto normal             | 14px   | 400  | Inter             |
| Etiquetas y tablas       | 13px   | 500  | Inter             |
| Texto pequeño / insignia | 12px   | 500  | Inter             |

## Colores (hex)
Base (refs 01 y 03)
- Fondo de página: `#E8ECF4`
- Contenedor principal: `#FFFFFF`
- Panel interior suave: `#F3F5FA`
- Barra lateral oscura: `#1C1C1E`
- Tarjeta/tooltip oscuro: `#1C1C1E` con texto `#FFFFFF`
- Texto principal: `#111111`
- Texto secundario: `#6B7280` (más oscuro que el gris de las refs,
  para cumplir contraste 4.5:1)
- Borde/separador: `#E5E8EF`

Tarjetas pastel (ref 03), una por categoría
- Lavanda: `#E6DDF3`
- Menta: `#D5EDDC`
- Crema: `#FBF1CC`
- Azul claro: `#DCEBFB`

Estados
- Positivo: `#2F9E6B`
- Negativo: `#D64550`
- Acento de acción (botón claro): `#BFDDFB`
- Acento de enlace: `#3445D6` (ref 02, "+98 more")

Vidrio (refs 02 y 04)
- Fondo del panel: `rgba(255,255,255,0.60)`
- Borde: `rgba(255,255,255,0.45)`
- Blur: 20px
- Sombra: `0 8px 32px rgba(17,17,17,0.10)`
- Texto sobre vidrio: `#111111`, nunca gris claro
- Manchas de luz del fondo (para que se note el efecto):
  beige `#F3E7DB`, violeta `#7C7BE8`, cian `#5CE0E0`,
  todas a baja opacidad y muy difuminadas

Insignias de variación (ref 04)
- Fondo menta `#CFEFE0`, texto `#2E9E6B`

Claude Code los use sin inventar otros, pídele que los convierta en variables CSS (o en el tema de Tailwind) una sola vez, y que después use solo esas variables:

:root {
  --bg-page: #E8ECF4;
  --bg-card: #FFFFFF;
  --bg-soft: #F3F5FA;
  --bg-dark: #1C1C1E;
  --text: #111111;
  --text-muted: #6B7280;
  --border: #E5E8EF;
  --pastel-lavender: #E6DDF3;
  --pastel-mint: #D5EDDC;
  --pastel-cream: #FBF1CC;
  --pastel-blue: #DCEBFB;
  --positive: #2F9E6B;
  --negative: #D64550;
  --glass-bg: rgba(255,255,255,0.60);
  --glass-border: rgba(255,255,255,0.45);
  --glass-blur: 20px;
}


## Regla
No uses colores ni fuentes fuera de esta guía. Si necesitas uno
nuevo, pregúntame antes.