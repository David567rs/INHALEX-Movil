# Conexión de Búsqueda de productos

## Etapa actual

La conexión se incorpora en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, en la misma rama `feature/busqueda-productos`, creada desde `develop` en `50d2152`. El [PR #9](https://github.com/David567rs/INHALEX-Movil/pull/9), «Implementar Búsqueda de productos con MVVM y Repository», está abierto hacia `develop`, creado desde la cuenta autenticada ZenaidaGR y con revisión solicitada a David567rs. El commit funcional es `80dd7ec67808c2baa0fbb94514cf232ad6751a4e`. La aprobación y el merge siguen pendientes; consultar CI sobre el HEAD vigente.

El usuario aceptó el diseño, escritura y borrado en Expo Go y autorizó continuar con la API:

> Ya revisé el diseño de Búsqueda en Expo Go, amigo. Puedo escribir y borrar, y ya marqué esos puntos en Trello. Sigamos con la conexión a la API en la misma rama, manteniendo MVVM y Repository.

Después confirmó en Expo Go: «Ya probé la búsqueda en Expo Go, amigo: aparece Lavanda con su foto y precio. Ya marqué esos dos puntos en Trello. Sigamos con la prueba cuando no hay coincidencias.». Ese hito completó los criterios 1 a 4. A las guías de vacío, error/reintento y distintos términos respondió, respectivamente, «listo vamos con lo que sigue», «si ya quedó, vamos con lo que sigue» y «dale ya quedó, y cada que acabes sugiereme el siguiente texto porque ya no aparece». La [aceptación textual](evidencias/busqueda-productos/expo-go-aceptacion.json) registra ahora **7/8**, con esos tres casos aceptados contextualmente. Solo queda pendiente la revisión real del código. El agente no observó directamente Expo Go ni leyó o modificó Trello.

## Contrato y arquitectura

El recorrido es:

`ProductSearchScreen → useProductSearchViewModel → createProductSearchController → SearchProducts → ProductSearchRepository → ApiProductSearchRepository → HttpClient`

`bootstrap` compone las dependencias concretas. La vista presenta estado y comunica acciones; no realiza HTTP ni importa Repositories de datos. El dominio es independiente de React Native y del transporte. El antiguo `SearchPreviewRepository` de ejemplos está retirado del código; [el diseño y sus pruebas](DISENO-BUSQUEDA-PRODUCTOS.md) se conservan como historia.

El contrato `ProductSearchRepository.search` recibe término, página, límite y señal de cancelación; devuelve el mismo `CatalogPage` público de Catálogo. El caso de uso `SearchProducts` recorta únicamente espacios exteriores, exige un término de hasta 100 caracteres, páginas enteras desde 1 y límites enteros entre 1 y 100. No elimina acentos ni modifica los espacios interiores.

El adaptador utiliza GET público `/products?page=<página>&limit=<límite>&search=<término>`, sin token. El backend actual construye una expresión regular con `search`; el adaptador escapa primero sus metacaracteres y después aplica la codificación URI, para que el texto del usuario conserve su significado literal. No se modifica el backend. El mapeador público de Catálogo comprueba la respuesta y entrega únicamente el modelo de productos ya compartido.

La API busca coincidencias por nombre, descripción, descripción larga o aromas, con relación OR entre esos campos. Distingue acentos y no distingue mayúsculas. Las lecturas reales de referencia reportaron `Lavanda` y `LAVANDA`: un producto en ambos casos; `menta`: dos, Menta y Hierbabuena; `café`: uno y `cafe`: cero; un término sin coincidencias: cero. Son observaciones de los datos actuales, no resultados garantizados ante cambios del catálogo ni una aceptación en Expo Go.

## Comportamiento de pantalla

- Escribir, borrar o elegir una sugerencia actualiza el borrador exacto y limpia resultados obsoletos. No envía una petición; la búsqueda se ejecuta al pulsar **Buscar** o enviar desde el teclado.
- El controlador distingue el borrador del término enviado, cancela la operación anterior, ignora respuestas obsoletas y bloquea peticiones duplicadas. Salir de la pantalla cancela la espera.
- Las páginas contienen hasta 20 productos; **Cargar más resultados** acumula resultados sin duplicar identificadores. La navegación al detalle reutiliza la ruta existente y las tarjetas reales de Catálogo, con fotos y precios públicos.
- La pantalla presenta reposo, carga, resultados, ausencia de coincidencias y mensajes seguros de error/reintento. No hay debounce ni consulta automática mientras se escribe.
- Reintentar o actualizar el mismo término conserva los resultados cargados mientras espera y si falla; cambiar el texto los retira para no presentarlos como coincidencias del nuevo borrador. Los errores de otra página conservan los productos anteriores.
- Las sugerencias solo rellenan el campo: el usuario decide cuándo buscar. Las cinco pestañas, la sesión, Catálogo y Detalle conservan su navegación.

## Trello: 7/8 aceptados

- [x] Agregar campo de búsqueda.
- [x] Capturar texto ingresado.
- [x] Consultar o filtrar productos.
- [x] Mostrar resultados coincidentes.
- [x] Mostrar mensaje cuando no existan resultados.
- [x] Manejar errores de búsqueda.
- [x] Probar diferentes términos.
- [ ] Revisar el código.

Los cuatro primeros están marcados según el reporte explícito del usuario. Los criterios 5, 6 y 7 están aceptados mediante respuestas contextuales a sus guías y disponibles para marcar, sin atribuir lectura o cambios del tablero al agente. Solo queda pendiente la revisión real de David567rs sobre el futuro PR de Zenaida. Las comprobaciones técnicas no sustituyen esa revisión.

## Comprobación en Expo Go pendiente

Se conserva la API compartida en `3200`, Metro de David en `8082` y Metro de Zenaida en `8083`, sin cambiar `.env`, identidades ni respaldos. Reutilizar el QR de la copia de Zenaida. Si necesita arrancarse, desde su raíz en Git Bash o CMD:

```sh
npm --prefix Mobile run start -- --port 8083
```

1. La consulta `Lavanda`, foto y precio ya fueron aceptados por el usuario.
2. Para la siguiente prueba, reemplazar el texto por `zzzinhalexsincoincidencias842` y pulsar **Buscar**. La API real en 3200 devolvió `total: 0` e `items: []` para ese término el 19 de octubre de 2026; los datos podrían cambiar posteriormente.
3. Comprobar **«0 coincidencias»**, **«No encontramos coincidencias»** y **«Prueba con otra palabra o revisa cómo la escribiste.»**. Buscar después `Lavanda` y comprobar que reaparecen el producto, foto y precio. No requiere modificar ni detener el backend.
4. El usuario respondió «listo vamos con lo que sigue» a esta guía; queda aceptado el vacío en ese contexto (5/8). La prueba de distintos términos se realizará por separado.

### Prueba aceptada: error y reintento

1. Con el backend activo, buscar `Lavanda` y dejar sus resultados visibles en Expo Go.
2. En la terminal de la API local, pulsar **Ctrl+C** para detener solo el backend. Conservar Metro, Expo Go y la conexión Wi-Fi.
3. Sin editar el campo ni salir de Búsqueda, pulsar de nuevo **Buscar**. Esta acción vuelve a consultar el mismo término; no hay gesto de actualización. Esperar el aviso de conexión o timeout, hasta unos 15 segundos.
4. Comprobar que se conservan los resultados de Lavanda con foto y precio y aparece **«Conservamos los últimos resultados de esta búsqueda.»**, junto con **Reintentar**. Editar cualquier carácter limpia los resultados por diseño y no permite comprobar su conservación.
5. En la misma terminal, desde la raíz de `INHALEX-Movil-Zenaida`, ejecutar `npm run dev:server` (Git Bash o CMD). Esperar que Nest esté listo y pulsar **Reintentar** en Expo Go.
6. Comprobar que desaparece el aviso y se recupera Lavanda. A la solicitud de confirmar aviso, conservación y recuperación, el usuario respondió «si ya quedó, vamos con lo que sigue»: criterio 6 aceptado contextualmente (6/8).

### Prueba aceptada: distintos términos

Con la API activa, enviar cada búsqueda con **Buscar**:

1. `LAVANDA`: debe encontrar la misma Lavanda que `Lavanda`; la API ignora mayúsculas.
2. `Menta`: comprobar resultados correspondientes a ese término. Puede incluir Hierbabuena por coincidencia en sus aromas; no busca únicamente en el nombre.
3. Escribir `Lavanda` con espacios antes y después: el caso de uso los recorta al enviar y debe recuperar el mismo producto.

Al cambiar de término deben retirarse los resultados anteriores y, después de pulsar Buscar, aparecer los del término enviado. El usuario respondió «dale ya quedó, y cada que acabes sugiereme el siguiente texto porque ya no aparece»: se registra aceptación contextual de estos tres casos y del criterio 7 (7/8). La revisión del código se completará con la revisión real de David567rs sobre el futuro PR de Zenaida hacia `develop`.

La siguiente etapa es la revisión real de David567rs sobre el [PR #9](https://github.com/David567rs/INHALEX-Movil/pull/9), de `feature/busqueda-productos` hacia `develop`, creado por ZenaidaGR. El PR está abierto y la revisión solicitada; no hay aprobación ni merge. No se atribuyen al usuario pruebas nativas de paginación ni cancelación. Esta guía no ejecutó arranques ni paradas de servicios.

## Verificación técnica

- TypeScript global y lint sin advertencias aprobados. Las 280 pruebas móviles pasaron: 236 anteriores y 44 nuevas (12 del Repository, 10 del caso de uso y 22 del controlador), incluidas cancelación, respuestas fuera de orden, doble envío, vacío, errores seguros y paginación.
- Expo Doctor 21/21 y exportaciones finales Android (1434 módulos) y web (982 módulos) aprobados después de retirar la ruta QA. Android: `entry-15678101659c765507bc2f67f63ace98.hbc`; web: `entry-e38f7b818ceafd8322e0407c1fa36062.js`.
- [HTTP real de lectura](evidencias/busqueda-productos/api-http-real.json): caso de uso, Repository y cliente móvil contra Nest/MongoDB en 3200. Ocho términos, incluidos metacaracteres literales, sin token ni cookies, con proyección pública estricta y sin escrituras en la base.
- QA web con componentes y Repository reales, HTTP temporal en 3218, snapshots públicos y 25 productos sintéticos para paginación. Las capturas se rotulan «QA web · HTTP con datos de prueba»; no representan navegador contra MongoDB real ni dispositivo físico. Se verificaron carga, resultados/foto/precio, ausencia de coincidencias, 503 seguro inicial y de actualización, conservación de datos y recuperación mediante Reintentar, envío Enter, limpieza y sugerencias sin consulta, carga 20→25 y fin de paginación. [Solicitudes del fixture](evidencias/busqueda-productos/qa-http-requests.json).
- Se comprobó navegación al ID de Menta y regreso a Búsqueda conservando sus dos resultados. La carga de Detalle en web sigue limitada por CORS del backend para el origen 8083; no se modificó esa configuración. La comprobación HTTP real y la futura prueba Expo Go se registran por separado.
- QA visual sin desbordamiento horizontal a 321 px CSS y vista habitual alrededor de 392 px CSS (zoom del navegador 110 %). En web se evita que un desplazamiento automático cierre el foco del campo; Android conserva el cierre del teclado al arrastrar. El foco al primer toque después de desplazarse y el envío Enter se verificaron en navegador, sin atribuir prueba física de teclado o TalkBack.
- Ruta QA, servidor 3218 y helpers temporales retirados antes de los checks finales. La preparación del PR conservó API 3200, Metro de David 8082, Metro de Zenaida 8083, `.env`, identidades y stash. Se publicó el commit funcional `80dd7ec` con la identidad local de ZenaidaGR y se abrió el PR #9 desde esa cuenta, sin aprobación ni merge.
- [Verificación final de conexión](evidencias/busqueda-productos/verificacion-api.json).
- Expo Go: diseño, escritura, borrado y resultados de `Lavanda` con foto y precio aceptados explícitamente; vacío, error/reintento y distintos términos aceptados mediante respuestas contextuales a sus guías (7/8). Solo queda pendiente la revisión real del código. Los snapshots técnicos conservan el estado humano que existía al generarlos; la aceptación textual contiene el estado actual.

Las capturas y `verificacion-diseno.json` conservan el código y los resultados de la etapa visual histórica; no validan esta conexión por sí solos.

## Preparación del PR #9

Antes de publicar se repitieron 280/280 pruebas móviles, TypeScript y lint, todos aprobados. Una revisión técnica independiente no encontró problemas accionables; no sustituye la revisión humana. Doctor 21/21 y las exportaciones Android/web corresponden a la verificación de conexión anterior y no se repitieron porque el código no cambió. La [evidencia de preparación](evidencias/busqueda-productos/preparacion-pr.json) distingue esas comprobaciones del CI remoto, pendiente al capturar la publicación. Las comprobaciones vigentes se consultan en el PR sobre su HEAD actual. Trello está 7/8 según el usuario, con «Revisar el código» pendiente y la tarjeta abierta hasta la integración.
