# Conexión de Seguimiento del pedido

La actividad continúa en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/seguimiento-pedido`, desde `develop` en `930d2023ecb801ce985acaad8dfad03657a998ae`. David567rs es responsable y ZenaidaGR revisará el futuro PR hacia `develop`.

El usuario aceptó el diseño y autorizó conectar la API en la misma rama. El diseño está guardado en el commit de fase `34b4f83` y su aceptación en `14b8453`, separados del cierre previo de Historial. La implementación conectada terminó su verificación técnica y se guarda en el commit local propio `feat(orders): conectar seguimiento del pedido con la API`; consultar el SHA en Git. No se publica la rama ni se abre un PR por esta fase.

Seguimiento tiene **5/8** criterios aceptados: el usuario confirmó en Expo Go el pedido correcto, **Actualizar seguimiento** y el aviso de pedido no encontrado, su reintento y el regreso a un pedido real. Se aceptan 1-5; errores de conexión (6), distintos estados (7) y revisión (8) siguen pendientes. La [aceptación vigente](evidencias/seguimiento-pedido/expo-go-aceptacion.json) conserva los reportes exactos. El agente no observó el teléfono ni leyó o modificó Trello; recomienda marcar el criterio 5 y mantener En progreso, sin dar por confirmado su marcado. El [diseño](DISENO-SEGUIMIENTO-PEDIDO.md) y sus resultados se conservan como historia.

## Contrato existente del backend

La conexión realiza dos lecturas autenticadas consecutivas bajo el prefijo `/api`, ambas con `Cache-Control: private, no-store`:

| Orden | Ruta | Datos utilizados |
| --- | --- | --- |
| 1 | GET `/orders/me/:id` | Resumen del pedido propio, productos y dirección histórica disponible. |
| 2 | GET `/orders/me/:id/tracking` | Resumen más reciente, estado actual y `confirmedAt`, `cancelledAt`, `completedAt`. |

El ID es un ObjectId de 24 caracteres hexadecimales. Se normaliza a minúsculas y se valida antes del transporte. La propiedad del pedido procede de `JWT.sub` igual a `customerUserId`; la vista no envía otro usuario, correo o rol para seleccionar propietario. Un ID malformado, inexistente, ajeno, borrador o sin propietario produce el mismo 404 del servicio. El guard requiere JWT; esta consulta no concede acceso ampliado por rol ni hace una nueva consulta del estado activo de la cuenta.

El resumen contiene `id`, `reference`, `status`, `currency`, `totalItems`, `subtotal` y `createdAt`. Tracking añade tres fechas de evento explícitas, cada una ISO UTC canónica o `null`. Los únicos estados admitidos son `pending_review`, `confirmed`, `cancelled` y `completed`: **En revisión**, **Confirmado**, **Cancelado** y **Completado**. El resultado del endpoint de tracking no incluye productos, dirección o notas internas; esos datos de presentación proceden del primer GET y su proyección pública.

El backend puede devolver un pedido completado con las tres fechas de evento en `null`, o uno cancelado sin confirmación registrada. La conexión valida cada fecha presente y conserva `null`: no exige una fecha por estado, ni deduce una cronología, ni rellena eventos con la fecha de creación. El estado no se convierte en enviado, recibido o entregado. El importe se identifica como **Subtotal de productos**, sin inventar cargos de envío o pagos.

Contrato consultado en `Server/src/modules/orders/orders.controller.ts`, `customer-order-history.service.ts` y sus pruebas existentes; no se modifican esos archivos ni el servidor.

## MVVM, Repository y combinación de lecturas

`OrderTrackingScreen → useOrderTrackingViewModel / createOrderTrackingController → OrderTrackingActions → OrderTrackingRepository → ApiOrderTrackingRepository → HttpClient`

`createOrderTrackingActions` construye los casos de uso. Bootstrap crea el Repository con el cliente autenticado y el controlador con la identidad privada `authorizationSession`; `OrderTrackingProvider` inicia y detiene su ciclo de vida. La vista solo recibe el estado público y acciones. El JWT, HTTP y credenciales permanecen fuera del árbol de presentación.

`ApiOrderTrackingRepository.get` consulta primero el detalle y después el tracking del mismo ID. Antes de publicar el conjunto comprueba la igualdad de los campos base inmutables: ID, referencia, moneda, fecha de creación, subtotal y unidades. No compara el estado de ambos GET como si fueran una transacción: el segundo puede reflejar un cambio ocurrido después del primero y su estado es la autoridad. Si una parte falla, no se publica un conjunto parcial. El resultado utiliza objetos y colecciones inmutables con campos permitidos explícitamente, sin notas internas o credenciales.

La ruta `/seguimiento-pedido?id=<ObjectId>` utiliza el ID seleccionado. Un ID repetido como parámetro múltiple se considera inválido, en lugar de elegir uno silenciosamente. El guard de ruta `trackingRouteState` evita representar el pedido anterior mientras cambia el parámetro. Desde **Cuenta → Seguimiento del pedido**, sin ID, se muestra **Elige un pedido para seguir su historia** y **Ver mis pedidos** abre Historial; no se elige automáticamente un pedido real ni se cargan ejemplos.

## Presentación y actualización

Se conserva el estilo aprobado y las cinco pestañas. El recorrido normal es **Cuenta → Historial de pedidos → seleccionar un pedido → Ver seguimiento del pedido**. La pantalla presenta referencia, fecha de creación, estado, productos, cantidades, subtotal y dirección histórica cuando existe. **Actualizar seguimiento** vuelve a consultar el par de GET. Al regresar al foco puede actualizar el pedido seleccionado; no hay polling, temporizador de consultas o actualización de estados mediante escritura.

La línea de estados muestra **Pedido recibido** con la fecha real de creación y distingue estado actual, hechos registrados y pasos pendientes. Solo las fechas de eventos proporcionadas por la API se convierten en fechas de etapas. Si falta la fecha del estado actual, se indica **Fecha de esta etapa no disponible.**. Un completado sin confirmación registrada no fabrica esa etapa; un cancelado solo conserva una confirmación histórica si existe y termina su recorrido en Cancelado. Los pasos pendientes permanecen sin fechas ni promesas logísticas.

El controlador no consulta sin ID válido y sesión autenticada. Seleccionar otro pedido cancela la operación anterior y retira su contenido. Una recarga simultánea queda bloqueada mientras exista otra consulta. El ciclo `start`/`stop`, el ID seleccionado, la generación de solicitud y el objeto de autorización impiden publicar respuestas tardías después de navegar, salir o cambiar de sesión, incluso al ingresar de nuevo con el mismo ID de usuario.

## Fallos y datos personales

- **Red, timeout o 5xx:** conservan el último conjunto confirmado del mismo pedido y muestran aviso con **Reintentar**. Una primera carga fallida muestra **No pudimos cargar el seguimiento**. El reintento requiere una acción explícita y vuelve a leer el conjunto; no modifica un pedido.
- **404 o solicitud inválida:** retiran el snapshot anterior y muestran **No encontramos este pedido**, con acceso a **Ver mis pedidos**. No se revela si el ID pertenecía a otra cuenta.
- **401:** oculta el pedido, presenta sesión vencida y bloquea nuevas lecturas para el mismo objeto de autorización. El controlador no modifica directamente la sesión global; la acción para volver a ingresar utiliza el módulo de autenticación existente.
- **403:** retira los datos previos y muestra el error seguro. No conserva contenido personal después de una denegación de acceso.
- **JSON, fechas, moneda, cantidades o identidad inconsistentes:** se rechazan con mensajes seguros; no se muestra el payload, diagnóstico interno o un conjunto parcial nuevo.

Salir o cambiar la identidad de autorización oculta inmediatamente los datos personales. Este módulo no añade SecureStore, persistencia web, datos de seguimiento guardados entre cuentas o escritura de sesión. No modifica los datos de pedidos, historial, bolsa, direcciones o backend, ni añade POST/PATCH/DELETE, confirmación de recepción, cancelación o repetición de compra.

## Criterios de Trello: 5/8

- [x] Obtener estado del pedido desde la API
- [x] Mostrar información del pedido
- [x] Mostrar estado actual
- [x] Actualizar la información correctamente
- [x] Manejar pedidos no encontrados
- [ ] Manejar errores de conexión
- [ ] Probar distintos estados del pedido
- [ ] Revisar el código

Los reportes funcionales del usuario completan 1-5; la aceptación visual por sí sola no los completó. Se esperará el reporte de los casos pendientes antes de aceptarlos. La revisión final corresponde a ZenaidaGR en el futuro PR; la revisión de agentes y las pruebas automatizadas no la sustituyen. Mantener Trello **En progreso**, sin atribuir al agente su lectura o marcado.

## Primera prueba real en Expo Go: consulta y actualización aceptadas

El usuario reportó exactamente: «Amigo, Seguimiento muestra el pedido correcto y Actualizar seguimiento funciona. ¿Qué marco en Trello y qué sigue?». Esta primera aceptación, guardada en `3a4fb9e` después de API `c1ac906`, corresponde al recorrido positivo guiado; en ese momento seguían pendientes no encontrado, errores/reintento, distintos estados y reapertura/sesión. Los pasos siguientes conservan la guía del recorrido. Reutilizar el QR de Metro de David (**8082**) y el backend local habitual (**3200**), conservando el Metro de Zenaida y la configuración existente.

1. Iniciar sesión con la cuenta de prueba que ya tiene pedidos. Abrir **Cuenta → Historial de pedidos** y seleccionar uno.
2. Pulsar **Ver seguimiento del pedido**. Comprobar que aparece esa referencia real, su estado, fecha de creación, productos, unidades y subtotal; no deben verse rótulos de muestra o referencias `EJEMPLO-...`.
3. Revisar la línea de estados. Las fechas visibles deben proceder de eventos registrados y las ausentes deben permanecer sin inventar. Si el pedido está En revisión, los pasos posteriores deben identificarse como pendientes.
4. Pulsar **Actualizar seguimiento** y esperar la carga. Comprobar que conserva el pedido seleccionado y recupera los datos sin errores o cambios de estado inventados.
5. Volver con **Ver mis pedidos**, comprobar que conserva la navegación de Historial y las cinco pestañas, y reportar el resultado antes de marcar criterios adicionales.

Este recorrido solo consulta el pedido existente; no hace falta crear otro o cambiar su estado para probar la primera lectura. La entrada de Cuenta sin ID puede revisarse aparte: debe pedir elegir un pedido en Historial.

## Prueba de pedido no encontrado: aceptada por el usuario

El usuario reportó exactamente: «Amigo, apareció «No encontramos este pedido», Reintentar mantuvo el aviso y pude volver al historial y abrir un pedido real. ¿Qué marco en Trello y qué sigue?». Se acepta **Manejar pedidos no encontrados** (5), por el aviso, su conservación al reintentar y la vuelta al historial y a un pedido real. La fuente es el chat, sin observación directa del teléfono por el agente. El reporte no acredita una inspección de MongoDB ni del código HTTP recibido. La guía siguiente se conserva como registro del recorrido; no se genera otro QR por esta aceptación.

La ruta ya admite un ID por enlace. Expo Go separa la ruta interna mediante `/--/`, según la [documentación SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/linking/#linkingcreateurlpath-namedparameters) y la [guía de enlaces en Expo Go](https://docs.expo.dev/linking/into-your-app/#test-a-link-using-expo-go). No se necesita una pantalla de pruebas ni controles técnicos en el producto.

En la Wi-Fi verificada el 20 de octubre de 2026, el enlace de prueba fue `exp://192.168.1.77:8082/--/seguimiento-pedido?id=000000000000000000000000`. La IP es local y puede cambiar; conservar la dirección del mismo Metro que utiliza el teléfono. El QR se preparó como artefacto temporal, fuera del código de la aplicación.

1. Conservar backend y Metro activos y la misma cuenta iniciada; no detener el backend en esta prueba.
2. Escanear el QR del enlace con Expo Go. Si la sesión necesitara restaurarse, esperar; si pidiera ingresar, iniciar sesión y volver a escanear el QR para retomar el ID de prueba.
3. Esperar **No encontramos este pedido**, sin referencia, productos, dirección o subtotal del pedido anterior. El ID es sintácticamente válido; la prueba no inspecciona MongoDB ni modifica pedidos reales.
4. Pulsar **Reintentar**, si aparece: debe mantenerse no encontrado con el backend activo.
5. Pulsar **Ver mis pedidos** y abrir el seguimiento de un pedido real; debe volver a mostrar el pedido correcto.

El criterio 5 está aceptado por el reporte anterior. El enlace no crea o modifica pedidos, no cambia el servidor ni prueba todos los escenarios de autorización. El agente no leyó o modificó Trello; el marcado del usuario sigue sin confirmación.

## Siguiente prueba: error y reintento (pendiente)

El usuario realizará esta prueba con un pedido real ya cargado. No se modifica su estado, contenido, dirección, base de datos o configuración. El criterio 6 continúa pendiente hasta recibir su reporte.

1. Con backend activo, abrir **Cuenta → Historial de pedidos → seleccionar un pedido → Ver seguimiento del pedido**. Esperar la carga y reconocer su referencia, productos, **Subtotal de productos** y estado.
2. En la terminal que ejecuta **Server**, detener únicamente el backend local **3200** con **Ctrl+C**. Mantener Metro de David **8082**, Metro de Zenaida **8083** y el teléfono conectado a la misma Wi-Fi. El agente no detiene ni reinicia esos procesos.
3. En el teléfono, pulsar **Actualizar seguimiento**. Debe aparecer un aviso de conexión y conservarse la referencia, los productos, el subtotal y el estado que ya estaban cargados.
4. Con el backend todavía detenido, pulsar **Reintentar**. Debe volver a fallar conservando el aviso y esos mismos datos, sin publicar un conjunto parcial o cambiar el pedido.
5. Reiniciar el mismo backend en la misma terminal y directorio con el comando habitual. Desde `Server`, el script existente es `npm run start:dev`; desde la raíz, `npm run dev:server` utiliza ese mismo script. Esperar a que Nest termine de arrancar antes de continuar. Ambos comandos están comprobados en los `package.json` existentes; esta guía no cambia scripts o entorno.
6. Pulsar **Reintentar**. Debe recuperarse el mismo pedido y desaparecer el aviso. Reportar por separado si falló la actualización, si el reintento con backend detenido conservó los datos y si se recuperó al reiniciarlo; no aceptar el criterio por las pruebas automatizadas anteriores.

## Orden de las pruebas posteriores y commits

Lectura normal, actualización y pedido no encontrado están aceptados. Sigue **error y reintento**, después **distintos estados disponibles** y finalmente **reapertura, salida y reingreso**. Un montaje sintético posterior deberá identificarse expresamente; no se modificará un pedido real solo para fabricar estados o un 404. Los reportes necesarios se registrarán antes de aceptar cada criterio.

Se conserva el acuerdo de commits por fase: diseño `34b4f83`, aceptación visual `14b8453`, API `c1ac906` y aceptación de consulta/actualización `3a4fb9e`. El reporte de pedido no encontrado se guardará en otro commit documental propio después de verificar estos documentos. Las aceptaciones posteriores tendrán commits separados cuando existan sus reportes. Solo después de las pruebas y una solicitud del usuario se preparará el PR de `feature/seguimiento-pedido` hacia `develop` para revisión de ZenaidaGR; no se abre ni integra ahora.

## Verificación y límites actuales

La [verificación técnica propia](evidencias/seguimiento-pedido/verificacion-api.json) pasó: TypeScript, lint, **677/677 pruebas móviles** (59 nuevas: 6 dominio, 16 Repository, 29 controlador/ruta/timeline y 8 HTTP loopback), **50/50 pruebas existentes del contrato backend** en dos suites, Doctor **1.20.4 21/21**, exportaciones Android **1521** y web **1070** módulos. La ruta QA temporal fue retirada antes de las exportaciones. Los resultados del [diseño](evidencias/seguimiento-pedido/verificacion-diseno.json) permanecen históricos.

QA web a **397×1000 / 320×820** usó sesión y acciones de dominio sintéticas con controller, Provider, ViewModel y pantalla reales. Comprobó carga, estados, fecha histórica ausente, actualización, error/reintento, cambio de pedido sin contenido anterior, falta de selección, 401/403/404 y salida sin datos. No hubo desbordamientos horizontales ni errores de consola. Capturas: [397 px](evidencias/seguimiento-pedido/api-qa-web-397.png), [320 px](evidencias/seguimiento-pedido/api-qa-web-320.png), [error conservando datos](evidencias/seguimiento-pedido/api-error-qa-web-397.png) y [404](evidencias/seguimiento-pedido/api-no-encontrado-qa-web-320.png). El único GET al backend local real fue sin Bearer y respondió 401; no se consultaron pedidos reales autenticados ni se hicieron escrituras.

Las pruebas de integración HTTP utilizan Node HTTP y puertos efímeros de loopback, con `HttpClient`, Repository, casos de uso y controlador reales, pero API, cuentas, tokens y datos sintéticos; sus servidores se cierran al terminar. Eso permite verificar transporte, recuperación y aislamiento del cliente, sin acreditar ownership de una API Nest/MongoDB real. Una eventual QA web con sesión o pedidos simulados deberá identificarse como sintética. El bloqueo de redirecciones con Node fetch no se presenta como prueba de todos los transportes nativos.

La aceptación funcional en Expo Go es parcial (5/8) y procede de los reportes del usuario, no de una observación directa del teléfono por el agente. El JSON de verificación técnica refleja el snapshot anterior de API; la aceptación vigente se registra por separado. Esta etapa documental no consulta pedidos reales autenticados ni realiza escrituras, no repite pruebas técnicas ni altera servicios. TalkBack, texto ampliado y condiciones físicas de red tendrán su evidencia específica si se prueban. Se conservan servicios, configuración, dependencias, identidades, stash y la copia de Zenaida.
