# Conexión del Catálogo a la API

Estado del 17 de octubre de 2026: conexión implementada en `feature/catalogo-productos`, con aceptación humana parcial en Expo Go: 6/9 criterios: diseño, obtención desde la API, nombre/imagen/precio/datos principales, errores de conexión, carga y mensaje vacío. El usuario confirmó también actualización correcta; error/reintento está aceptado y los tres criterios restantes siguen pendientes. La tarjeta capturada está en «Por hacer» y el usuario puede moverla a «En progreso»; no hay PR ni push de esta etapa. La actividad conservará un único PR completo hacia `develop`.

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

La QA web está completada. El fixture 3212 y Metro temporal 8085 quedaron detenidos; Metro 8082 del usuario se conservó activo. Estas verificaciones no completan los criterios humanos pendientes en Expo Go ni prueban MongoDB o usuarios reales. El gesto nativo de actualizar, TalkBack, escalado de fuente y movimiento reducido en dispositivo no se ejercitaron físicamente.

## Comprobación en Expo Go

El usuario confirmó: «Ya probé el Catálogo en Expo Go, amigo: aparecen los productos, fotos y precios, y funciona Actualizar catálogo. ¿Qué puntos marco en Trello? Sigamos con la prueba de error y reintento.». Es confirmación del chat, sin capturas nativas ni observación directa del agente. Esa respuesta aceptó los tres primeros criterios; las confirmaciones posteriores de error/reintento y carga/vacío elevan el total a 6/9; el checklist completo se conserva en el [plan](PLAN-DE-TRABAJO.md).

Utiliza dos terminales CMD abiertas en `C:\Users\David\Documents\INHALEX-Movil`, con la configuración local existente. Si los servicios ya están activos, conserva sus terminales. En la terminal del backend:

```bat
npm run dev:server
```

En la terminal de Expo:

```bat
npm run dev:mobile
```

Abre Catálogo y verifica carga de productos, nombres, fotografías, precios y disponibilidad; alterna cuadrícula/lista y prueba «Cargar más» cuando existan más de 20. Comprueba actualización, un fallo de conexión con aviso/reintento y conservación de datos. La configuración LAN y Expo Go permanece descrita en [Mobile/README.md](../Mobile/README.md).

La aceptación actual es 6/9: diseño, obtención de productos desde la API, nombre/imagen/precio/datos principales, errores de conexión, carga y mensaje vacío. El usuario confirmó también «Actualizar catálogo» en el recorrido correcto. El usuario confirmó aviso, conservación de productos y recuperación mediante Actualizar; ahora también confirmó carga y vacío; siguen sin confirmación paginación y navegación al detalle. La prueba completa y revisión real de Zenaida permanecen pendientes; detalle depende de `feature/detalle-producto`. No se cierra la actividad ni se abre su PR por esta aceptación parcial.

## Prueba local de error y reintento aceptada

A la pregunta sobre aviso, conservación de productos y recuperación al reiniciar el backend y pulsar Actualizar, el usuario respondió exactamente «Sí, funcionaron los tres casos». Se acepta «Manejar errores de conexión» a partir del chat; no hubo observación directa del dispositivo por el agente. Estos pasos conservan el recorrido aceptado:

1. Con productos visibles en Expo Go, pulsa `Ctrl+C` únicamente en la terminal del backend. Conserva Metro y Expo Go abiertos.
2. Pulsa «Actualizar catálogo». Puede mostrar «Actualizando…» hasta el límite de 15 segundos; después debe aparecer el aviso y mantenerse la última colección.
3. En la terminal del backend ejecuta `npm run dev:server` y espera a que Nest confirme que está listo.
4. Pulsa de nuevo «Actualizar catálogo»: este es el reintento cuando ya hay productos. Debe recuperar la actualización y quitar el aviso.

El botón «Reintentar» corresponde al error de carga inicial sin productos. En este recorrido con colección conservada se utiliza «Actualizar catálogo». El manejo de errores está aceptado; aquella respuesta no acreditaba carga; la nueva aceptación de carga/vacío se registra abajo.

## Carga y catálogo vacío aceptados

El helper `scripts/qa/catalog-empty.cjs`, mediante `npm run qa:catalog:empty`, pasó su [validación HTTP](evidencias/catalogo-productos/empty-fixture-verificacion.json) en loopback 3214 contra `mapCatalogPage` real: vacío 200, demora de 1535 ms para 1500 ms nominales, `no-store`, página inválida 400, otra ruta 503 y POST 405. Se detuvo 3214 y el helper temporal quedó activo en `0.0.0.0:3200`, que estaba libre, para la prueba por LAN; Metro/Expo sigue en 8082. No utiliza MongoDB ni lee `.env`. El usuario aceptó «Actualizando…» → vacío con la respuesta registrada abajo. El backend real quedó restaurado: Nest listo en 3200, health 200 y 16 productos verificados mediante GET y el caso de uso/Repository/cliente/mapeador reales ([evidencia](evidencias/catalogo-productos/backend-restaurado.json)). Metro 8082 se conservó. El refresco posterior en Expo Go sigue pendiente de confirmación del usuario.

1. Deja parado el backend habitual y conserva Expo Go y Metro abiertos.
2. Desde la raíz `C:\Users\David\Documents\INHALEX-Movil`, ejecuta `npm run qa:catalog:empty`.
3. En Expo Go pulsa «Actualizar catálogo» y comprueba «Actualizando…», después cero productos, el mensaje vacío y «Volver a consultar».
4. Detén solo el fixture con `Ctrl+C`, ejecuta `npm run dev:server`, espera a Nest y pulsa «Actualizar catálogo» para recuperar productos reales.

El usuario confirmó exactamente: «Sí, amigo, vi «Actualizando…» y luego «Nuevos aromas están por llegar». Ya marqué esos dos puntos en Trello. Ahora ayúdame a restaurar el backend real.». Quedan aceptados «Manejar estado de carga» y «Mostrar mensaje cuando no existan productos», con 6/9 en total. La fuente es el chat, sin observación directa del teléfono por el agente. El usuario afirmó que marcó ambos puntos; el agente no actualiza Trello. No se modificó la base para simular el caso. El backend real quedó restaurado: Nest listo en 3200, health 200 y 16 productos verificados mediante GET y el caso de uso/Repository/cliente/mapeador reales ([evidencia](evidencias/catalogo-productos/backend-restaurado.json)). Metro 8082 se conservó. El refresco posterior en Expo Go sigue pendiente de confirmación del usuario. Los resultados técnicos de 179 pruebas son históricos y no se repitieron para registrar esta aceptación.
