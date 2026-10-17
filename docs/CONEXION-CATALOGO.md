# Conexión del Catálogo a la API

Estado del 17 de octubre de 2026: conexión implementada en `feature/catalogo-productos`, con aceptación funcional en Expo Go y revisión por PR pendientes. El usuario solo aceptó «Diseñar pantalla de catálogo». La tarjeta continúa «En progreso» y el usuario actualiza Trello; no hay PR ni push de esta etapa. La actividad conservará un único PR completo hacia `develop`.

## Recorrido y contrato público

`CatalogScreen → useCatalogViewModel/controller → ListCatalog → CatalogRepository → ApiCatalogRepository → HttpClient` conserva MVVM y Repository. `bootstrap` compone las dependencias; la View no realiza HTTP. El endpoint público es GET `/api/products?page=1&limit=20`, sin Bearer ni cambios de autenticación. La configuración utiliza la URL pública de API ya existente.

Cada respuesta incluye `items`, `total`, `page`, `limit` y `totalPages`. El mapeador comprueba página y límite solicitados, enteros y coherencia de los totales, cantidad de elementos e identificadores únicos. Cada producto público requiere `_id`, nombre, descripción, precio finito no negativo, moneda ISO 4217, aromas y disponibilidad booleana. El dominio conserva solo los datos públicos de presentación; no recibe documentos Mongo ni credenciales.

Los precios están expresados en unidades monetarias; MXN representa pesos y no se divide entre cien. Una promoción se aplica si está activa, tiene precio mayor que cero e inferior al base y su fecha de término, cuando existe, es ISO válida y futura. Las promociones caducadas o incoherentes no sustituyen el precio base. La tarjeta muestra disponibilidad y una imagen de reserva cuando no puede resolver la foto.

Se mapean 16 rutas exactas del frontend a recursos originales incluidos: 15 frascos y la imagen de producto de Romero. Se recuperaron diez imágenes adicionales a las seis del diseño. Las rutas del frontend no se convierten en URLs del host de la API; las imágenes HTTPS válidas se presentan sin credenciales. Los cinco archivos de vista previa fueron eliminados o sustituidos por la implementación real. Sus capturas y [verificación de diseño](evidencias/catalogo-productos/verificacion-diseno.json) conservan valor histórico, incluidos sus precios de demostración.

## Estados y operaciones

La carga inicial solicita 20 productos. «Cargar más» incorpora la siguiente página; actualización y reintento consultan la API. El controlador cancela operaciones e invalida generaciones anteriores para evitar resultados tardíos. Un error de carga inicial permite reintentar. Los errores de actualización o paginación conservan los productos ya presentados y permiten repetir la operación.

No se incorporan búsqueda, categorías, filtros, detalle, favoritos o bolsa en este alcance. No hay cambios de código del backend, autenticación o dependencias.

## Comprobaciones confirmadas

- 179/179 pruebas aprobadas: 33 nuevas de Catálogo, con 25 de Repository/caso de uso y 8 del controlador de presentación.
- TypeScript y lint sin advertencias; Expo Doctor 21/21.
- Exportaciones Android (1406 módulos) y web (954 módulos) aprobadas.
- Doce grupos HTTP aprobados en API aislada en loopback 3212, con ProductsController, ProductsService y ValidationPipe reales, y modelos Mongo simulados. Se utilizaron 23 productos activos: 16 de referencia y 7 sintéticos. No se conectó una base real ni se cargaron `.env`, AppModule o cuentas reales. La evidencia es [api-verificacion-aislada.json](evidencias/catalogo-productos/api-verificacion-aislada.json).
- QA web aprobada en 393×852 y 320×568, sin desbordamiento horizontal: selector y cuadrícula/lista, carga 20→23, 16 fotos cargadas, imagen de reserva, producto sin existencias, promoción vigente 52 frente a base 60 y promoción caducada ignorada. Los importes son escenarios del fixture, no precios comerciales acreditados.
- Carga con 503 y reintento; conservación de datos al fallar actualización o paginación y recuperación hasta 23/23.
- Resultado vacío con cero productos y «Volver a consultar», que reemplaza la colección anterior; respuesta malformada con mensaje seguro y reintento; error de red al apagar el fixture y recargar. Estos resultados se comprobaron en el DOM renderizado.

La [evidencia final web](evidencias/catalogo-productos/api-verificacion.json) diferencia las comprobaciones del DOM de las capturas. Solo se conservaron estas siete imágenes, con nombres acordes con los píxeles:

| Captura | Estado mostrado |
| --- | --- |
| [Cuadrícula](evidencias/catalogo-productos/api-cuadricula-web.jpg) | Primera página, 393 px. |
| [Lista](evidencias/catalogo-productos/api-lista-web.jpg) | Primera página, 393 px. |
| [Cuadrícula a 320 px](evidencias/catalogo-productos/api-cuadricula-320-web.jpg) | Una columna con imagen original cargada. |
| [Error 503](evidencias/catalogo-productos/api-error503-web.jpg) | Aviso y reintento. |
| [Actualizando](evidencias/catalogo-productos/api-actualizando-web.jpg) | Actualización en curso conservando productos anteriores. |
| [Cargando página](evidencias/catalogo-productos/api-cargando-pagina-web.jpg) | Siguiente página en curso, 20 de 23. |
| [Vacío a 320 px](evidencias/catalogo-productos/api-vacio-320-web.jpg) | Cero productos y «Volver a consultar». |

Ninguna captura acredita el resultado final 23/23, respuesta malformada, fallo de red o errores de actualización/paginación. Esos estados fueron verificados en el DOM y registrados en el JSON. Los fotogramas que mostraban un estado anterior se descartaron o se nombraron por lo que efectivamente mostraban.

La QA web está completada. El fixture 3212 y Metro temporal 8085 quedaron detenidos; Metro 8082 del usuario se conservó activo. Estas verificaciones no sustituyen la aceptación funcional en Expo Go ni prueban MongoDB o usuarios reales. El gesto nativo de actualizar, TalkBack, escalado de fuente y movimiento reducido en dispositivo no se ejercitaron físicamente.

## Comprobación en Expo Go

Utiliza dos terminales CMD abiertas en `C:\Users\David\Documents\INHALEX-Movil`, con la configuración local existente. Si los servicios ya están activos, conserva sus terminales. En la terminal del backend:

```bat
npm run dev:server
```

En la terminal de Expo:

```bat
npm run dev:mobile
```

Abre Catálogo y verifica carga de productos, nombres, fotografías, precios y disponibilidad; alterna cuadrícula/lista y prueba «Cargar más» cuando existan más de 20. Comprueba actualización, un fallo de conexión con aviso/reintento y conservación de datos. La configuración LAN y Expo Go permanece descrita en [Mobile/README.md](../Mobile/README.md).

Solo el diseño está aceptado. Conexión, presentación funcional de productos, errores y prueba completa necesitan confirmación del usuario en Expo Go antes de marcar sus criterios; la revisión real de Zenaida corresponde al futuro PR. No se considera ejecutado este recorrido por el hecho de documentarlo.
