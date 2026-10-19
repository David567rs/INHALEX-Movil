# Diseño de Líneas o categorías

Estado del 18 de octubre de 2026: diseño aceptado y actividad integrada mediante el [PR #7](https://github.com/David567rs/INHALEX-Movil/pull/7), aprobado y fusionado por ZenaidaGR en `b0b9856` tras pasar ambas CI sobre el HEAD final `6e787da`. Líneas completó 8/8 y el usuario confirmó Trello actualizado/cerrado, sin cambios del agente en el tablero. La [integración](evidencias/lineas-categorias/integracion-pr7.json) conserva los identificadores completos. Este documento mantiene el diseño local histórico; el [contrato de conexión](CONEXION-LINEAS-CATEGORIAS.md) conserva la API y sus pruebas. La [aceptación de Expo Go](evidencias/lineas-categorias/expo-go-aceptacion.json) procede del chat, sin observación directa del teléfono ni capturas nativas.

## Presentación local histórica

Desde Catálogo, «Encuentra tu línea» abre una pantalla de Stack con la marca, el distintivo «Vista previa», cinco tarjetas, selección visual única y un texto de la línea seleccionada. La flecha y el botón inferior permiten volver al Catálogo. Se conservan las cinco pestañas originales.

Los nombres y los slugs proceden de la taxonomía existente:

| ID | Nombre de referencia |
| --- | --- |
| `linea-insomnio` | Línea insomnio |
| `linea-ansiedad-estres` | Línea ansiedad y estrés |
| `linea-resfriado` | Línea resfriado |
| `linea-verde` | Línea verde |
| `linea-estimulante` | Línea estimulante |

Referencia de recuperación: `Proyecto-INHALEX/Mobile/inhalex-app/src/features/catalog/presentation/components/CategoryChips.tsx`, revisión `526a21e11da1cd1e3f6edea350c7731f90e205bf`. Se conserva la selección verde, el nombre sin el prefijo «Línea» en las tarjetas y los controles amplios. La pantalla independiente es nueva: no existía una pantalla de líneas en la referencia. La taxonomía también coincide con `Server/src/modules/products/enums/product-category.enum.ts`.

Se reutilizan el logotipo, la marca, los colores, los iconos y las transiciones ya instaladas. El motivo botánico es decorativo y común a todas las líneas. No se asocian fotografías de productos a categorías ni se añaden conteos, precios, disponibilidad o beneficios terapéuticos de muestra.

## MVVM y Repository de la vista previa

`ProductLinesScreen → useProductLinesViewModel → ListProductLines → ProductLinesRepository → PreviewProductLinesRepository`.

`bootstrap/createProductLinesPreviewAction.ts` compone e inyecta la implementación local. El dominio solo conoce `id/name`; no importa React Native, HTTP ni archivos de datos. El ViewModel administra la selección. La pantalla muestra el estado y comunica acciones. La selección se reinicia al abrir una nueva instancia y no aplica filtros a Catálogo.

En esta primera etapa el Repository de vista previa no consultaba HTTP ni modificaba los contratos de Catálogo o el backend. Tras la aceptación se sustituyó por el Repository de API asíncrono y se eliminó el código de preview. El modelo actual añade `count`; la selección permite abrir el Catálogo filtrado. El [documento de conexión](CONEXION-LINEAS-CATEGORIAS.md) identifica el flujo vigente, las pruebas y sus límites.

## Comprobaciones históricas del diseño local

- TypeScript y lint global, sin advertencias.
- 179/179 pruebas móviles existentes. No se añadieron pruebas que repliquen esta presentación estática.
- Expo Doctor 21/21.
- Exportación Android: 1412 módulos; exportación web: 960 módulos.
- QA web en ancho lógico 320 px y alrededor de 393 px (lecturas del navegador de 392–394 px), sin contenido fuera del viewport por más de 1 px.
- Entrada desde Catálogo, selección de las cinco tarjetas con un único radio seleccionado dentro del grupo, cambio de nombre y retorno al Catálogo con cinco pestañas.
- Botones de regreso y tarjetas con áreas táctiles superiores a 44 px por inspección del DOM.

El Catálogo mostró su estado de error de conexión durante la entrada desde el navegador; el acceso a Líneas y el regreso funcionaron en ese estado. El health del backend local devolvió 200. Esta QA de presentación no se presenta como una nueva prueba de productos reales ni de la API de categorías.

La [evidencia técnica](evidencias/lineas-categorias/verificacion-diseno.json) conserva el estado anterior a la aceptación y separa pruebas, observaciones del DOM y capturas web. La confirmación posterior del usuario acepta el diseño; no equivale a observación del dispositivo por el agente, TalkBack o pruebas específicas de escalado de fuente o movimiento reducido. El código conserva el componente compartido de movimiento reducido.

Antes de editar se consultaron [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) y la [navegación de Expo Router](https://docs.expo.dev/router/basics/navigation/), conforme a las instrucciones móviles.

## Aceptación e integración

El usuario aceptó el diseño con su mensaje: «Ya revisé el diseño de Líneas o categorías en Expo Go, amigo, y me gustó. Sigamos con la conexión a la API en la misma rama, manteniendo MVVM y Repository. ¿Qué punto marco en Trello?». El snapshot inicial 0/8 se conserva separado de las confirmaciones posteriores de API, filtrado, vacío sintético y error/reintento. No existe una casilla propia de diseño en esta actividad.

La aprobación real de ZenaidaGR sobre el HEAD final `6e787da` completa «Revisar el código»: 8/8. El [PR #7](https://github.com/David567rs/INHALEX-Movil/pull/7) fue fusionado en `b0b9856` con Backend CI y Mobile CI correctos sobre ese HEAD. El usuario confirmó Trello actualizado/cerrado; el agente no leyó ni modificó el tablero. La [evidencia de integración](evidencias/lineas-categorias/integracion-pr7.json) complementa la aceptación humana y las pruebas históricas.

Las 206 pruebas, TypeScript, lint, Doctor y exportaciones Android 1415/web 963 pertenecen a la conexión integrada. La API aislada usó componentes Nest reales con modelos Mongo simulados. La QA web y la aceptación reportada por el usuario no acreditan TalkBack, escalado de fuente o movimiento reducido físicos.

Detalle continúa en `feature/detalle-producto`; su estado vigente y aceptación están en [la conexión de Detalle](CONEXION-DETALLE-PRODUCTO.md). Catálogo tiene 9/9 aceptados en rama; la integración de la navegación mediante el PR de Detalle sigue pendiente y la tarjeta permanece abierta hasta el merge. Se mantiene Catálogo → Categorías → Detalle; Detalle conserva 5/9 y sus dependencias de Favoritos/Bolsa, prueba completa y revisión.
