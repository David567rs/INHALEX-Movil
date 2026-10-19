# Conexión de Detalle de producto

Estado del 18 de octubre de 2026: conexión implementada y verificada técnicamente en `feature/detalle-producto`, pendiente de aceptación funcional en Expo Go. El usuario aceptó únicamente el [diseño](DISENO-DETALLE-PRODUCTO.md): **1/9**, «Crear pantalla de detalle», registrado en [la confirmación textual](evidencias/detalle-producto/expo-go-aceptacion.json). No se declara PR, push o CI remota de esta actividad.

## Contrato y arquitectura

`ProductDetailScreen → useProductDetailViewModel/controller → GetProductDetail → ProductDetailRepository → ApiProductDetailRepository → HttpClient`. `createProductDetailAction` compone la consulta pública bajo demanda. La vista no ejecuta HTTP y el dominio permanece independiente de React Native y del transporte.

GET `/api/products/:idOrSlug` (ruta `/products/:idOrSlug` respecto de la base configurada) consulta el producto sin Bearer ni cookies. La identidad de ruta admite de 1 a 160 letras, números o guiones y exige al menos un carácter alfanumérico; conserva guiones extremos o repetidos válidos para el backend. Rechaza rutas, consultas y separadores codificados antes de llamar HTTP. La identidad se codifica como un solo segmento.

El mapeador valida la coincidencia del ID o slug solicitado y reutiliza el mapeo público de Catálogo para datos base, precio, moneda, imagen, stock y promoción. Devuelve una lista explícita de campos públicos, sin propiedades privadas del DTO. Añade `longDescription`, `presentation` y `origin` como textos opcionales recortados, y `benefits` como lista de textos; elimina textos vacíos y rechaza tipos incorrectos. No fabrica información adicional.

El controlador distingue carga, producto listo, no disponible y error. Al actualizar conserva el producto solo ante fallo recuperable de red, timeout o servidor; 404 elimina el anterior y presenta no disponible. Evita publicaciones de solicitudes canceladas o de generaciones anteriores y no cruza datos entre productos. La presentación permite actualización y reintento manual. Favoritos y Bolsa siguen deshabilitados y rotulados «Próximamente», para sus actividades posteriores de Zenaida.

## Comprobaciones finales

La [verificación de API](evidencias/detalle-producto/verificacion-api.json) registra:

- 236/236 pruebas: 30 nuevas, 22 de dominio/datos y 8 del controlador.
- TypeScript global y lint global sin advertencias; Expo Doctor 21/21.
- Exportaciones Android 1426 módulos y web 974 módulos, ambas con salida 0 y sin la ruta QA temporal.
- Revisión independiente final sin bloqueadores materiales.

El [HTTP real de lectura](evidencias/detalle-producto/api-http-real.json) ejercitó `HttpClient → ApiProductDetailRepository → GetProductDetail` contra 3200: Toronjil y Mirra y Azafran por ID y slug, 404 inexistente, identidad inválida sin HTTP, modelo público sin campos privados y ausencia de Bearer/cookies. Fueron solo GET; no se modificaron backend, configuración o autenticación.

## QA web y límites

En 393×852 y 320×568 se comprobaron carga, producto seleccionado e información adicional, botones futuros deshabilitados, 503 con datos conservados y recuperación manual, error inicial y reintento, 404 eliminando el producto anterior y ausencia de cruces o desbordamiento horizontal.

La API original de 3200 no habilita CORS para el origen web de 8082. Se conservó esa configuración y se utilizó temporalmente `detalle-api-qa.tsx` con `createProductDetailAction` real y HTTP aislado en 3216: snapshots de 16 productos públicos reales y CORS para localhost:8082. Esta QA prueba componentes reales contra una fuente HTTP temporal, no el recorrido de navegador contra el backend real ni un dispositivo físico. La lectura real de 3200 está acreditada por separado.

Capturas web: [producto](evidencias/detalle-producto/api-producto-web.png), [información](evidencias/detalle-producto/api-informacion-web.png), [compacto](evidencias/detalle-producto/api-compacto-web.png), [error conservando datos](evidencias/detalle-producto/api-error-conserva-web.png), [error inicial](evidencias/detalle-producto/api-error-inicial-web.png), [cargando](evidencias/detalle-producto/api-cargando-web.png), [actualizando](evidencias/detalle-producto/api-actualizando-web.png) y [no disponible](evidencias/detalle-producto/api-no-disponible-web.png).

La ruta y los archivos temporales de control se retiraron y el servidor 3216 se detuvo. No quedaron referencias QA en el código ni en los bundles finales. Backend 3200 y Metro 8082 se conservaron activos; los `.env` de ambas copias permanecieron intactos y la copia de Zenaida quedó limpia en `develop` sobre `b0b9856`.

## Historia y aceptación pendiente

El [registro del diseño inicial](evidencias/detalle-producto/verificacion-diseno.json) conserva la vista previa de snapshots en memoria, 206 pruebas y exportaciones Android 1422/web 970. Su QA web por inyección de snapshots pertenece a esa etapa, separada de esta consulta GET.

La API todavía no fue probada por el usuario en Expo Go. No hay aceptación adicional, observación directa del teléfono ni capturas nativas; TalkBack, escalado de fuente y movimiento reducido físicos tampoco se acreditan. Los checks técnicos no convierten el checklist en 2/9. Catálogo mantiene 7/9, con navegación al detalle y prueba completa pendientes de la integración funcional.

## Checklist: 1/9

- [x] Crear pantalla de detalle.
- [ ] Obtener información del producto seleccionado.
- [ ] Mostrar nombre, descripción, precio e imagen.
- [ ] Mostrar información adicional disponible.
- [ ] Agregar acceso a favoritos.
- [ ] Agregar acceso a bolsa de compras.
- [ ] Manejar errores al cargar el producto.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

El usuario administra Trello; el agente no modificó el tablero ni afirma que el usuario haya marcado la casilla aceptada. Catálogo conserva 7/9, con navegación al detalle y prueba completa pendientes hasta la integración funcional. Se mantiene Catálogo → Categorías → Detalle.
