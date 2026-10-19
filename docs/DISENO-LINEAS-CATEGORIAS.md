# Diseño de Líneas o categorías

Estado del 18 de octubre de 2026: el usuario aceptó el diseño en Expo Go y autorizó la conexión a la API en `feature/lineas-categorias`, creada desde `develop` en `fc13bbf7afcd0ee81e9f0f7dadce8931852d9b78`. Después confirmó siete criterios funcionales: categorías, selección, filtrado, vacío mediante datos sintéticos, navegación con «Ver todos» y prueba final de error/reintento. La [aceptación](evidencias/lineas-categorias/expo-go-aceptacion.json) procede del chat, sin observación directa del teléfono ni capturas nativas. Este documento conserva el diseño local histórico; el [contrato de conexión](CONEXION-LINEAS-CATEGORIAS.md) describe la API y la aceptación de categoría sin productos, error/reintento y el [PR #7](https://github.com/David567rs/INHALEX-Movil/pull/7) abierto hacia `develop`, con revisión solicitada a ZenaidaGR. Consulta [los checks del HEAD vigente](https://github.com/David567rs/INHALEX-Movil/pull/7/checks).

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

## Aceptación visual y Trello

El usuario confirmó: «Ya revisé el diseño de Líneas o categorías en Expo Go, amigo, y me gustó. Sigamos con la conexión a la API en la misma rama, manteniendo MVVM y Repository. ¿Qué punto marco en Trello?».

La captura inicial muestra ocho criterios y ninguno de diseño. Ese snapshot 0/8 y la aceptación visual se conservan separados de la confirmación funcional posterior. La tarjeta sigue En progreso, ahora 7/8: el usuario confirmó consulta y presentación de categorías, selección, filtrado, vacío, navegación y prueba de funcionalidad. Puede marcar esta última tras confirmar el error/reintento, sin afirmar que ya lo hizo; el agente no cambió Trello. Solo queda revisión de código, descrita en [la guía de conexión](CONEXION-LINEAS-CATEGORIAS.md). El vacío fue aceptado mediante el helper con datos sintéticos; su verificación HTTP se conserva como historia. El usuario informó que restauró el backend real; después se verificaron health correcto y cinco categorías reales sin categorías QA.

Para la etapa API pasaron 206/206 pruebas móviles (27 nuevas), TypeScript, lint global sin advertencias, Doctor 21/21 y exportaciones finales Android (1415 módulos) y web (963 módulos). La revisión independiente no encontró bloqueadores. La [evidencia de conexión](evidencias/lineas-categorias/api-verificacion.json) documenta filtros, paginación, vacíos, errores/reintento y cancelación comprobados en web, con HTTP aislado y modelos Mongo simulados. Estos resultados se distinguen de los siete criterios aceptados por el usuario en Expo Go, incluidos vacío sintético y error/reintento. No acreditan la revisión por PR del compañero. El usuario autorizó abrir el PR hacia `develop` para Zenaida. El [PR #7](https://github.com/David567rs/INHALEX-Movil/pull/7) ya está abierto, la rama está publicada y la revisión fue solicitada a ZenaidaGR. Consulta [los checks del HEAD vigente](https://github.com/David567rs/INHALEX-Movil/pull/7/checks); no hay aprobación ni merge.

Catálogo conserva 7/9: quedan navegación al detalle y prueba completa. No se adelanta Detalle y se mantiene el orden Catálogo → Categorías → Detalle. El PR de esta actividad se abrirá al completar su alcance y aceptación.
