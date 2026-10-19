# Diseño de Líneas o categorías

Estado del 18 de octubre de 2026: diseño local implementado en `feature/lineas-categorias`, creada desde `develop` en `fc13bbf7afcd0ee81e9f0f7dadce8931852d9b78` después del PR #6. La revisión del usuario en Expo Go está pendiente. Esta etapa no acredita la conexión ni el filtrado de productos por categoría.

## Presentación y alcance

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

## MVVM y Repository

`ProductLinesScreen → useProductLinesViewModel → ListProductLines → ProductLinesRepository → PreviewProductLinesRepository`.

`bootstrap/createProductLinesPreviewAction.ts` compone e inyecta la implementación local. El dominio solo conoce `id/name`; no importa React Native, HTTP ni archivos de datos. El ViewModel administra la selección. La pantalla muestra el estado y comunica acciones. La selección se reinicia al abrir una nueva instancia y no aplica filtros a Catálogo.

El Repository de vista previa no consulta HTTP. Las funciones existentes de Catálogo y sesión mantienen sus propias operaciones; no se modifican sus contratos ni el backend. La conexión de categorías y la selección de productos se incorporarán después de aceptar el diseño, en esta misma rama.

## Comprobaciones realizadas

- TypeScript y lint global, sin advertencias.
- 179/179 pruebas móviles existentes. No se añadieron pruebas que repliquen esta presentación estática.
- Expo Doctor 21/21.
- Exportación Android: 1412 módulos; exportación web: 960 módulos.
- QA web en ancho lógico 320 px y alrededor de 393 px (lecturas del navegador de 392–394 px), sin contenido fuera del viewport por más de 1 px.
- Entrada desde Catálogo, selección de las cinco tarjetas con un único radio seleccionado dentro del grupo, cambio de nombre y retorno al Catálogo con cinco pestañas.
- Botones de regreso y tarjetas con áreas táctiles superiores a 44 px por inspección del DOM.

El Catálogo mostró su estado de error de conexión durante la entrada desde el navegador; el acceso a Líneas y el regreso funcionaron en ese estado. El health del backend local devolvió 200. Esta QA de presentación no se presenta como una nueva prueba de productos reales ni de la API de categorías.

La [evidencia técnica](evidencias/lineas-categorias/verificacion-diseno.json) separa pruebas, observaciones del DOM y capturas web. No hay observación del dispositivo, aceptación en Expo Go, TalkBack ni pruebas específicas de escalado de fuente o movimiento reducido. El código conserva el componente compartido de movimiento reducido.

Antes de editar se consultaron [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) y la [navegación de Expo Router](https://docs.expo.dev/router/basics/navigation/), conforme a las instrucciones móviles.

## Revisión en Expo Go y Trello

Metro se ejecuta desde la copia de David con `npm run dev:mobile` (puerto 8082). Si ya está activo, recarga el proyecto; no inicies otro servidor sobre el mismo puerto.

1. Abre Catálogo y pulsa «Encuentra tu línea».
2. Revisa el diseño y desplázate hasta la quinta línea.
3. Selecciona distintas líneas: solo una queda marcada y el texto inferior cambia.
4. Regresa usando la flecha o el botón inferior.

La tarjeta «Líneas o categorías» puede estar En progreso. El criterio de diseño queda pendiente de esta revisión humana; no se marcan consulta de API, filtrado, pruebas funcionales completas ni revisión por PR por las comprobaciones técnicas de esta etapa.

Catálogo conserva 7/9: quedan navegación al detalle y prueba completa. No se adelanta Detalle y se mantiene el orden Catálogo → Categorías → Detalle. El PR de esta actividad se abrirá al completar su alcance y aceptación.
