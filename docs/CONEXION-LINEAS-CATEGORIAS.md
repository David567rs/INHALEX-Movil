# Conexión de Líneas o categorías

Estado del 18 de octubre de 2026: API implementada en `feature/lineas-categorias`, pendiente de aceptación funcional en Expo Go y revisión. El usuario aceptó el [diseño](DISENO-LINEAS-CATEGORIAS.md) y autorizó continuar en la misma rama con MVVM y Repository. Su [confirmación textual](evidencias/lineas-categorias/expo-go-aceptacion.json) no acepta todavía los ocho criterios funcionales de Trello: siguen 0/8, En progreso. No se creó PR ni se publicó esta actividad.

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

Los datos y conteos anteriores pertenecen al fixture aislado, no a existencias o categorías comerciales comprobadas en una base real. No hay aceptación nativa de API, filtrado, vacío o paginación. TalkBack, escalado de fuente y movimiento reducido no se han probado físicamente. Las pruebas técnicas y las capturas web no sustituyen la confirmación del usuario en Expo Go.

## Recorrido funcional pendiente en Expo Go

Desde `C:\Users\David\Documents\INHALEX-Movil`, conserva la configuración existente. Si la API local está apagada, abre una terminal con `npm run dev:server`. En otra usa `npm run dev:mobile` si Metro no está activo, o recarga el proyecto existente; no inicies otro sobre 8082. No se necesita iniciar sesión para consultar líneas y productos.

1. Abre Catálogo → «Encuentra tu línea» y comprueba las categorías recibidas.
2. Selecciona una → «Ver productos de esta línea» y revisa el filtro y los productos mostrados.
3. Pulsa «Ver todos» y comprueba que vuelves al Catálogo completo.
4. Abre Líneas otra vez, selecciona otra y comprueba selección, regreso y cinco pestañas.

Cuando se pruebe una línea sin productos, verifica su mensaje y la salida del filtro. Los errores y reintentos se comprueban en su recorrido correspondiente. No se atribuyen todavía resultados de estos pasos al usuario.

## Criterios de Trello pendientes

La captura del usuario contiene exactamente estos ocho criterios; no incluye una casilla de diseño. Permanecen sin marcar hasta su confirmación funcional y la revisión real que corresponda:

- [ ] Obtener líneas o categorías desde la API.
- [ ] Mostrar las categorías disponibles.
- [ ] Permitir seleccionar una categoría.
- [ ] Filtrar los productos según la categoría.
- [ ] Manejar categoría sin productos.
- [ ] Verificar navegación.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

El usuario administra el tablero. El agente no lo modificó. Se conserva el orden Catálogo → Categorías → Detalle; Catálogo sigue 7/9, con navegación al detalle y prueba completa pendientes.
