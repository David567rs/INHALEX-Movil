# Conexión de Detalle de producto

Estado del 18 de octubre de 2026: datos completos, cambio de producto y error/recuperación confirmados por el usuario en Expo Go. La [aceptación textual](evidencias/detalle-producto/expo-go-aceptacion.json) completa los criterios 1, 2, 3, 4 y 7: **5/9**. Favoritos, Bolsa, prueba completa y revisión siguen pendientes. No hay observación directa del teléfono, nuevas capturas nativas ni cambios del agente en Trello. No se declara PR, push o CI remota de esta actividad.

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

## Historia y aceptación humana

El [registro del diseño inicial](evidencias/detalle-producto/verificacion-diseno.json) conserva la vista previa de snapshots en memoria, 206 pruebas y exportaciones Android 1422/web 970. Su QA web por inyección de snapshots pertenece a esa etapa, separada de esta consulta GET.

El usuario confirmó: «Ya probé el Detalle en Expo Go, amigo: aparecen los datos completos y cambian al abrir otro producto.». Esto acepta consulta y presentación de datos base y adicionales, junto con el diseño ya aceptado: hito previo 4/9. Los registros técnicos conservan la aceptación de su momento; el estado humano vigente está en expo-go-aceptacion.json. No hay observación directa del teléfono ni nuevas capturas nativas; TalkBack, escalado de fuente y movimiento reducido físicos tampoco se acreditan. Catálogo mantiene 7/9: la navegación y conservación del filtro en su recorrido completo todavía esperan aceptación explícita, al igual que su prueba completa.

## Error y reintento aceptados

El 18 de octubre de 2026 el usuario confirmó: «Sí, amigo, apareció el aviso, se conservaron los datos y al reiniciar el backend y pulsar Reintentar se recuperó el producto.». El recorrido aceptado utilizó la API local 3200, conservando Expo Go y Metro 8082, con timeout de 15 segundos. Se conserva como referencia:

1. Con el backend activo, abre un producto y pulsa «Actualizar producto» para partir del mismo detalle con datos cargados.
2. Pulsa Ctrl+C únicamente en la terminal del backend local; conserva Expo Go y Metro.
3. En ese detalle pulsa «Actualizar producto» y espera el aviso conservando los datos.
4. Desde `C:\Users\David\Documents\INHALEX-Movil` ejecuta `npm run dev:server` y espera a que Nest esté listo.
5. Pulsa «Reintentar» para recuperar el producto. El criterio de errores queda aceptado por la confirmación textual, sin observación física del agente.

## Próxima prueba de navegación

Propuesta pendiente de resultado: Catálogo → «Encuentra tu línea» → seleccionar línea → «Ver productos de esta línea» → «Ver detalle» → flecha para volver conservando el filtro. Después «Ver todos los productos» → otro producto → flecha para volver a «Nuestra colección». Todavía no se acepta este recorrido ni se marca prueba funcional completa. Catálogo conserva 7/9.

## Checklist: 5/9

- [x] Crear pantalla de detalle.
- [x] Obtener información del producto seleccionado.
- [x] Mostrar nombre, descripción, precio e imagen.
- [x] Mostrar información adicional disponible.
- [ ] Agregar acceso a favoritos.
- [ ] Agregar acceso a bolsa de compras.
- [x] Manejar errores al cargar el producto.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

El usuario administra Trello; el agente no modificó el tablero ni afirma que el usuario haya marcado los puntos aceptados. Catálogo conserva 7/9, con navegación al detalle y prueba completa pendientes de aceptación explícita de su recorrido completo y filtro. Se mantiene Catálogo → Categorías → Detalle.
