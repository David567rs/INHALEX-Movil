# Diseño de Detalle de producto

Estado del 18 de octubre de 2026: diseño aceptado por el usuario en Expo Go, con «Crear pantalla de detalle» completado (hito histórico 1/9); la confirmación posterior de datos completos y cambio de producto deja el estado actual en 4/9. David continúa en `feature/detalle-producto`, creada desde `develop` en `b0b9856f7470d8f9b76a8de2d462b29ac3f2d4eb`. La [conexión a la API](CONEXION-DETALLE-PRODUCTO.md) está implementada y verificada técnicamente en la misma rama, con datos y cambio de producto aceptados en Expo Go, pero error/reintento y prueba completa aún pendientes; [su evidencia](evidencias/detalle-producto/verificacion-api.json) se registra por separado. Este documento conserva la implementación y QA históricas del diseño inicial, sin PR o push nuevo.

El usuario confirmó: «Ya revisé el diseño de Detalle de producto en Expo Go, amigo, y me gustó.». Ese mensaje aceptó el diseño (1/9). La [confirmación textual posterior](evidencias/detalle-producto/expo-go-aceptacion.json) de datos completos y cambio al abrir otro producto completa los criterios 1 a 4: **4/9**, sin observación directa del teléfono ni capturas nativas. El snapshot anterior de [verificación visual](evidencias/detalle-producto/verificacion-diseno.json) conserva su estado previo 0/9. El agente no marcó Trello.

## Datos y límites del diseño inicial

El diseño parte del producto público que Catálogo ya cargó. Al abrirlo se recuerda un snapshot de memoria acotado a 12 IDs y se lee desde el Repository de vista previa. No añade GET de detalle ni HTTP desde su pantalla, no consulta MongoDB y no fabrica productos, descripciones, precios o fotografías.

La ruta Stack `/producto/[id]` muestra el rótulo «Vista previa»: sus datos proceden del listado recibido, sin prometer una consulta nueva ni información actualizada de detalle. Si se abre un ID que no está en memoria, la vista ofrece volver al Catálogo. Ese caso no se presenta como un error de una API de detalle conectada.

La imagen amplia, el nombre, precio, disponibilidad, descripción y aromas se muestran con los datos disponibles. El regreso conserva el Catálogo y su filtro. Las cinco pestañas existentes se mantienen al volver.

## MVVM y Repository del diseño inicial

Flujo implementado: producto de Catálogo → snapshot acotado en memoria por ID → `ProductDetailPreviewRepository` de lectura → caso de uso de lectura → `useProductDetailViewModel` → `ProductDetailScreen`. `ProductDetailImage` administra la imagen y su fallback visual.

`bootstrap/createProductDetailPreviewAction` compone las dependencias y `rememberProductDetailPreview` recibe el producto del dominio de Catálogo. La pantalla muestra estado y ejecuta acciones del ViewModel; no realiza transporte HTTP. El contrato de lectura y el caso de uso mantienen el dominio independiente de React Native y de las implementaciones concretas.

La comprobación de caché y composición pasó: capacidad de 12 snapshots, clonación/congelación y `null` para un ID desconocido. La consulta a la API de detalle corresponde a la siguiente etapa.

La referencia visual es `ProductDetails.tsx` de la móvil original, revisión `526a21e11da1cd1e3f6edea350c7731f90e205bf`. Se adaptó su presentación a una pantalla independiente con la identidad INHALEX; los controles funcionales se incorporarán por actividad.

Favoritos y Bolsa se presentan como acciones deshabilitadas con «Próximamente». Sus capacidades corresponden a actividades posteriores de Zenaida; no se implementan ni se marcan aceptadas en esta etapa. No cambia Server, autenticación, cuentas, dependencias o `.env`.

## QA web histórica del diseño y límites

La [evidencia](evidencias/detalle-producto/verificacion-diseno.json) registra QA en 393×852 y 320×568 con desbordamiento horizontal cero: imágenes de Toronjil y Mirra, apertura correcta de dos IDs, regreso conservando la línea de un listado de prueba, y fallback ante ID sin snapshot con retorno a `/catalogo`. Los dos accesos «Próximamente» están deshabilitados; regreso midió 44×44 px y las acciones 72 px de altura, apiladas en 320 px. Se simularon precio cero, agotado, ausencia de aromas, nombre largo e imagen ausente, con el rótulo «Datos de muestra».

El navegador no pudo consultar el catálogo real porque la API de 3200 no devolvió `Access-Control-Allow-Origin` para el origen web de 8082. Para la QA se usó temporalmente `detalle-diseno-qa.tsx`, que inyectó seis snapshots públicos consultados por CLI y uno sintético rotulado. Ejercitó `CatalogScreen`/ViewModel, bootstrap, ruta `/producto/[id]` y pantalla reales. Fue una prueba web con inyección de datos, sin recorrido de navegador contra la API en vivo ni prueba nativa. No acredita errores de carga de una API de detalle conectada ni completa los criterios 7 u 8 de Trello.

Se retiraron los dos archivos temporales y se cerró el proxy QA de 3215; se conservaron backend 3200 y Metro 8082. La QA utilizó el servidor existente de 8082. La pestaña QA se cerró y se restableció su viewport. La revisión independiente no encontró bloqueadores materiales.

Capturas web: [principal](evidencias/detalle-producto/diseno-principal-web.png), [información](evidencias/detalle-producto/diseno-informacion-web.png), [compacto](evidencias/detalle-producto/diseno-compacto-web.png), [sin selección](evidencias/detalle-producto/diseno-sin-seleccion-web.png) y [fallback](evidencias/detalle-producto/diseno-fallback-web.png). No son capturas de Expo Go.

Los checks finales de esta etapa pasaron después de retirar ambos temporales QA: TypeScript; lint global con cero advertencias; 206/206 pruebas existentes, sin pruebas nuevas decorativas; Expo Doctor 21/21; exportaciones Android 1422 módulos y web 970 módulos, ambas con salida 0. Los resultados se ejecutaron sobre esta implementación, sin trasladar las exportaciones anteriores de Líneas. Backend 3200 y Metro 8082 conservaron sus procesos; el proxy 3215 quedó cerrado y el segundo servidor 8085 no se inició.

El recorrido visual consistía en abrir un producto ya cargado, comprobar su presentación, volver conservando el filtro y revisar el retorno seguro ante un ID sin snapshot. El usuario aceptó el diseño después de esta QA; no se atribuyen al agente observación directa del dispositivo ni capturas nativas. Tampoco se declaran pruebas físicas de TalkBack, escalado de fuente o movimiento reducido. La aceptación del diseño no confirma la nueva API.

## Documentación consultada antes de implementar

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) y [su índice de documentación](https://docs.expo.dev/llms.txt).
- [Expo Router para SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/) y [navegación](https://docs.expo.dev/router/basics/navigation/).
- [Safe Area Context para SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/safe-area-context/).
- React Native 0.86: [Pressable](https://reactnative.dev/docs/0.86/pressable), [Image](https://reactnative.dev/docs/0.86/image), [accesibilidad](https://reactnative.dev/docs/0.86/accessibility), [ScrollView](https://reactnative.dev/docs/0.86/scrollview), [Text](https://reactnative.dev/docs/0.86/text) y [useWindowDimensions](https://reactnative.dev/docs/0.86/usewindowdimensions).

## Checklist exacto de Trello: 4/9

Fuente: captura enviada por el usuario al iniciar Detalle y confirmaciones posteriores del diseño y de los datos de API. Se aceptan los criterios 1 a 4; los otros cinco siguen pendientes:

- [x] Crear pantalla de detalle.
- [x] Obtener información del producto seleccionado.
- [x] Mostrar nombre, descripción, precio e imagen.
- [x] Mostrar información adicional disponible.
- [ ] Agregar acceso a favoritos.
- [ ] Agregar acceso a bolsa de compras.
- [ ] Manejar errores al cargar el producto.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

Catálogo conserva 7/9: navegación al detalle y prueba completa siguen pendientes. Esta vista previa no los cierra. Se mantiene el orden Catálogo → Categorías → Detalle.
