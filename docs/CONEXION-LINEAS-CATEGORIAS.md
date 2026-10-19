# Conexión de Líneas o categorías

Estado del 18 de octubre de 2026: Líneas o categorías integrada y completada 8/8. ZenaidaGR aprobó el HEAD final `6e787da42ba9273032a21374b92f0f56b9bc1437` y fusionó el [PR #7](https://github.com/David567rs/INHALEX-Movil/pull/7) hacia `develop` en `b0b9856f7470d8f9b76a8de2d462b29ac3f2d4eb`, con Backend CI y Mobile CI correctos sobre ese HEAD. La [evidencia de integración](evidencias/lineas-categorias/integracion-pr7.json) conserva revisión, checks y padres del merge. El usuario confirmó Trello actualizado/cerrado; el agente no leyó ni modificó el tablero. Las [confirmaciones de Expo Go](evidencias/lineas-categorias/expo-go-aceptacion.json) conservan el recorrido y sus límites.

## Consulta y arquitectura

`ProductLinesScreen → useProductLinesViewModel/controller → ListProductLines → ProductLinesRepository → ApiProductLinesRepository → HttpClient`.

`bootstrap/createProductLinesAction.ts` compone las dependencias bajo demanda. El dominio define `ProductLine { id, name, count }`, el contrato asíncrono de listado y los errores, incluida cancelación; no importa React Native ni transporte HTTP. El código local de vista previa se eliminó y la [evidencia del diseño](evidencias/lineas-categorias/verificacion-diseno.json) se conserva como historial.

La consulta pública es GET `/api/products/categories`, sin Bearer. El mapeador exige un arreglo de categorías válidas, IDs únicos, slugs en minúsculas, nombres válidos y conteos enteros seguros no negativos, incluido cero. Admite líneas personalizadas; no limita la lista a las cinco de la referencia visual. La presentación utiliza datos del contrato, sin convertir respuestas HTTP en entidades de backend.

El controlador del ViewModel distingue carga inicial, actualización, éxito y error/reintento. Conserva datos y selección si falla una actualización; una respuesta válida que ya no incluye la línea seleccionada elimina esa selección. Cancela operaciones y descarta respuestas de generaciones anteriores al cambiar la consulta o abandonar la pantalla.

## Selección y Catálogo filtrado

«Ver productos de esta línea» usa `dismissTo` hacia Catálogo con `category` y `lineName`. La ruta diferencia el listado completo del de cada línea para crear el alcance de consulta adecuado: cambiar o quitar filtro reinicia la página y cancela la petición anterior. Se conservan las cinco pestañas.

GET público `/api/products?page=1&limit=20&category=<slug>` conserva la paginación de Catálogo. La categoría se normaliza con `trim` y minúsculas y debe cumplir `^[a-z0-9-]+$`; la expresión también admite guiones en los extremos. Al consultar todos los productos se omite `category`. El mapeador comprueba que cada producto de una respuesta filtrada pertenezca a la categoría solicitada, sin exponer ese campo adicional en el modelo público de presentación.

Catálogo muestra la línea activa, permite «Ver todos», cargar más, actualizar y reintentar. Una respuesta válida sin productos presenta el mensaje específico de esa línea. Los fallos de actualización o paginación conservan la colección previa; no se mezclan productos de filtros anteriores. No se implementó navegación al Detalle, búsqueda, Favoritos o Bolsa. No cambia Server, autenticación, dependencias ni `.env`.

## Verificación técnica y límites

- 206/206 pruebas móviles aprobadas, incluidas 27 nuevas; TypeScript y lint global sin advertencias; Expo Doctor 21/21. La revisión independiente no encontró bloqueadores.
- Exportaciones finales aprobadas: Android 1415 módulos y web 963 módulos, ambas con salida 0. Las 179 pruebas y los 1412/960 módulos del diseño pertenecen a la etapa histórica anterior.
- 15 grupos HTTP aislados con Controller, Service y validación DTO de Nest reales, pero modelos Mongo simulados. No se conectó una base real ni se leyó `.env`; los upserts de categorías por defecto se simulan.
- Nueve grupos adicionales con Repository y casos de uso móviles reales contra ese HTTP: conteos, siete categorías de prueba incluidas personalizadas y vacías, 31 productos sin filtro, verde con 23 paginados 20+3, y respuestas 503, malformadas y vacías.
- La QA web confirmó siete categorías de prueba, incluidas personalizadas y con conteo cero; verde 20→23; quitar filtro a 31; línea personalizada con dos productos y línea vacía con mensaje específico. Una lista vacía de categorías elimina la selección y deshabilita la acción de continuar.
- Los recorridos 503 comprobaron reintento inicial con carga visible, conservación de categorías y selección ante fallo de actualización, y conservación de dos productos y del filtro activo ante fallo de actualización filtrada; al reintentar se recuperaron los datos. El cambio rápido Verde (retraso de 1200 ms) → Resfriado terminó con un solo producto de Resfriado, sin publicar los 23 de Verde. En 393×852 y 320×568 no hubo desbordamiento. El entorno QA se cerró al terminar; el backend 3200 y Metro 8082 se conservaron.

La [evidencia de conexión](evidencias/lineas-categorias/api-verificacion.json) separa resultados HTTP, observaciones web y límites; no atribuye esos casos a un dispositivo físico.

Los datos y conteos anteriores pertenecen al fixture aislado, no a existencias o categorías comerciales comprobadas en una base real. Por separado, el usuario confirmó en Expo Go categorías, selección, filtrado, «Ver todos», vacío mediante el helper sintético y error/recuperación conservando categorías y selección. Con este recorrido final se acepta «Probar la funcionalidad»; la paginación nativa no tiene confirmación específica. No hay observación del teléfono por el agente ni capturas nativas. TalkBack, escalado de fuente y movimiento reducido no se han probado físicamente.

## Recorrido confirmado en Expo Go

Desde `C:\Users\David\Documents\INHALEX-Movil`, conserva la configuración existente. Si la API local está apagada, abre una terminal con `npm run dev:server`. En otra usa `npm run dev:mobile` si Metro no está activo, o recarga el proyecto existente; no inicies otro sobre 8082. No se necesita iniciar sesión para consultar líneas y productos.

1. Abre Catálogo → «Encuentra tu línea» y comprueba las categorías recibidas.
2. Selecciona una → «Ver productos de esta línea» y revisa el filtro y los productos mostrados.
3. Pulsa «Ver todos» y comprueba que vuelves al Catálogo completo.
4. Abre Líneas otra vez, selecciona otra y comprueba selección, regreso y cinco pestañas.

Ese recorrido sustentó cinco criterios que el usuario afirma haber marcado en Trello. La confirmación posterior de vacío completa el sexto criterio aceptado.

## Categoría sin productos aceptada

El usuario probó `npm run qa:lines:empty`, un helper HTTP temporal en 3200 que conserva la configuración de Expo Go. Devuelve la categoría «Prueba sin productos» vacía y un «Producto de prueba» sintético rotulado en el Catálogo general; otras rutas responden 503. No usa base de datos ni modifica `.env`. El recorrido queda conservado como historia:

La [verificación del helper](evidencias/lineas-categorias/empty-category-fixture-verificacion.json) pasó diez grupos HTTP mediante `HttpClient`, ambos Repositories y casos de uso móviles reales: categorías 0/1, vacío → todos, página posterior, parámetros inválidos/repetidos, CORS/no-store, 405/503, puerto ocupado sin detener el servidor y CLI inválida. La revisión no encontró fallos materiales. El fixture aislado de 3214 se detuvo; se conservaron el backend 3200 y Metro 8082. Estos resultados HTTP se distinguen de la aceptación posterior del usuario en Expo Go.

1. Pulsar Ctrl+C únicamente en la terminal del backend real, conservando Metro y Expo Go.
2. Desde la raíz ejecutar `npm run qa:lines:empty`; en Expo Go actualizar Líneas y seleccionar «Prueba sin productos».
3. Pulsar «Ver productos de esta línea» y comprobar «Esta línea aún no tiene productos»; «Ver todos» debe mostrar «Producto de prueba».
4. Al terminar, pulsar Ctrl+C en el helper, ejecutar `npm run dev:server` y actualizar para recuperar los datos reales.

El 18 de octubre de 2026 el usuario confirmó: «Sí, amigo, apareció «Esta línea aún no tiene productos» y «Ver todos» mostró el producto de prueba. Ya restauré el backend real. ¿Qué marco en Trello y qué sigue?».

Esta respuesta acepta el vacío y la salida al Catálogo general con datos sintéticos; no se presenta como una categoría comercial realmente vacía. La restauración del backend fue reportada por el usuario. Después se comprobó `/api/health` correcto y cinco categorías reales, sin categorías QA; Metro 8082 permaneció activo. No se atribuye al agente observación del teléfono. Esta etapa dejó Líneas en 6/8; el recorrido final siguiente la llevó a 7/8, sin afirmar cambios posteriores en Trello.

## Error y reintento de Líneas aceptados

El 18 de octubre de 2026 el usuario confirmó: «Sí, amigo, apareció el aviso y se conservaron las categorías y mi selección. Al reiniciar el backend y actualizar, desapareció el aviso. Ahora abramos el PR hacia develop para que Zenaida lo revise.». El recorrido aceptado queda como referencia, manteniendo Expo Go y Metro abiertos:

1. Abre «Encuentra tu línea», pulsa «Actualizar líneas» con el backend activo y selecciona una línea real sin abrir sus productos.
2. Pulsa Ctrl+C únicamente en la terminal del backend. En Líneas pulsa «Actualizar líneas» y espera el aviso.
3. Comprueba que aparecen «Se conservan las últimas líneas cargadas.» y que permanecen las líneas y la selección.
4. Ejecuta `npm run dev:server`; cuando esté listo, pulsa «Actualizar líneas» y comprueba que recupera los datos y desaparece el aviso.

Con datos ya cargados el botón del recorrido es «Actualizar líneas»; «Reintentar» corresponde al error inicial sin datos. La confirmación aceptó aviso, conservación de categorías y selección y recuperación al reiniciar el backend y actualizar: completó «Probar la funcionalidad», hito 7/8. La aprobación posterior de ZenaidaGR sobre el HEAD final completó el octavo criterio y el PR quedó fusionado. La evidencia nativa sigue siendo textual, sin observación directa del teléfono ni capturas nativas.

## Criterios de Trello: 8/8

Los ocho criterios de la captura están satisfechos mediante aceptación humana y revisión real:

- [x] Obtener líneas o categorías desde la API.
- [x] Mostrar las categorías disponibles.
- [x] Permitir seleccionar una categoría.
- [x] Filtrar los productos según la categoría.
- [x] Manejar categoría sin productos.
- [x] Verificar navegación.
- [x] Probar la funcionalidad.
- [x] Revisar el código.

El usuario confirmó Trello actualizado/cerrado, sin cambios del agente en el tablero. El desarrollo continúa con Detalle; su estado vigente y aceptación están en [la conexión de Detalle](CONEXION-DETALLE-PRODUCTO.md). Se conserva Catálogo → Categorías → Detalle; Catálogo tiene 9/9 aceptados en rama tras la confirmación de navegación y las pruebas acumuladas; queda pendiente integrar la navegación mediante el PR de Detalle y la tarjeta sigue abierta hasta el merge.
