# Conexión de Líneas o categorías

Estado del 18 de octubre de 2026: API implementada en `feature/lineas-categorias`, con cinco criterios aceptados por el usuario en Expo Go. Confirmó: «Ya probé en Expo Go, amigo: aparecen las categorías, cambian los productos al elegir otra y funciona «Ver todos». Ya marqué esos puntos en Trello. Sigamos con la prueba de categoría sin productos.». La [evidencia textual](evidencias/lineas-categorias/expo-go-aceptacion.json) separa esta confirmación del [diseño](DISENO-LINEAS-CATEGORIAS.md) y su snapshot inicial 0/8. El estado actual es 5/8, En progreso; el agente no modificó Trello. Quedan categoría sin productos, prueba completa y revisión. No se creó PR ni se publicó esta actividad.

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

Los datos y conteos anteriores pertenecen al fixture aislado, no a existencias o categorías comerciales comprobadas en una base real. Por separado, el usuario confirmó en Expo Go categorías, selección, filtrado y «Ver todos»; no confirmó vacío, paginación nativa, errores o prueba completa. No hay observación del teléfono por el agente ni capturas nativas. TalkBack, escalado de fuente y movimiento reducido no se han probado físicamente.

## Recorrido confirmado en Expo Go

Desde `C:\Users\David\Documents\INHALEX-Movil`, conserva la configuración existente. Si la API local está apagada, abre una terminal con `npm run dev:server`. En otra usa `npm run dev:mobile` si Metro no está activo, o recarga el proyecto existente; no inicies otro sobre 8082. No se necesita iniciar sesión para consultar líneas y productos.

1. Abre Catálogo → «Encuentra tu línea» y comprueba las categorías recibidas.
2. Selecciona una → «Ver productos de esta línea» y revisa el filtro y los productos mostrados.
3. Pulsa «Ver todos» y comprueba que vuelves al Catálogo completo.
4. Abre Líneas otra vez, selecciona otra y comprueba selección, regreso y cinco pestañas.

El usuario confirmó el recorrido anterior y afirma que marcó sus cinco criterios en Trello. La prueba de vacío que sigue no está aceptada todavía.

## Próxima prueba: categoría sin productos

`npm run qa:lines:empty` ya está listo y verificado. Es un helper HTTP temporal en el puerto 3200 para mantener la configuración de Expo Go: devuelve la categoría «Prueba sin productos» vacía y un «Producto de prueba» sintético rotulado en el Catálogo general; otras rutas responden 503. No usa base de datos ni modifica `.env`. El backend real sigue activo y el helper todavía no se inició en 3200.

La [verificación del helper](evidencias/lineas-categorias/empty-category-fixture-verificacion.json) pasó diez grupos HTTP mediante `HttpClient`, ambos Repositories y casos de uso móviles reales: categorías 0/1, vacío → todos, página posterior, parámetros inválidos/repetidos, CORS/no-store, 405/503, puerto ocupado sin detener el servidor y CLI inválida. La revisión no encontró fallos materiales. El fixture aislado de 3214 se detuvo; se conservaron el backend 3200 y Metro 8082. Estos resultados HTTP no aceptan todavía el vacío en Expo Go.

1. Pulsar Ctrl+C únicamente en la terminal del backend real, conservando Metro y Expo Go.
2. Desde la raíz ejecutar `npm run qa:lines:empty`; en Expo Go actualizar Líneas y seleccionar «Prueba sin productos».
3. Pulsar «Ver productos de esta línea» y comprobar «Esta línea aún no tiene productos»; «Ver todos» debe mostrar «Producto de prueba».
4. Al terminar, pulsar Ctrl+C en el helper, ejecutar `npm run dev:server` y actualizar para recuperar los datos reales.

La verificación HTTP del helper está aprobada; la aceptación nativa de este recorrido sigue pendiente. Líneas permanece 5/8 y no se marca categoría sin productos antes de la confirmación del usuario.

## Criterios de Trello: 5/8

La captura del usuario contiene exactamente estos ocho criterios; no incluye una casilla de diseño. La confirmación posterior acepta los puntos 1, 2, 3, 4 y 6, que el usuario afirma haber marcado:

- [x] Obtener líneas o categorías desde la API.
- [x] Mostrar las categorías disponibles.
- [x] Permitir seleccionar una categoría.
- [x] Filtrar los productos según la categoría.
- [ ] Manejar categoría sin productos.
- [x] Verificar navegación.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

El usuario administra el tablero. El agente no lo modificó. Se conserva el orden Catálogo → Categorías → Detalle; Catálogo sigue 7/9, con navegación al detalle y prueba completa pendientes.
