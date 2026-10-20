# Conexión de Seguimiento del pedido

La actividad continúa en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/seguimiento-pedido`, desde `develop` en `930d2023ecb801ce985acaad8dfad03657a998ae`. David567rs es responsable y ZenaidaGR revisará el futuro PR hacia `develop`.

El usuario aceptó el diseño y autorizó conectar la API en la misma rama. El diseño está guardado en el commit de fase `34b4f83` y su aceptación en `14b8453`, separados del cierre previo de Historial. La implementación conectada terminó su verificación técnica y se guarda en el commit local propio `feat(orders): conectar seguimiento del pedido con la API`; consultar el SHA en Git. No se publica la rama ni se abre un PR por esta fase.

Seguimiento permanece **0/8**: el checklist no tiene un criterio independiente de diseño y todavía no hay aceptación funcional del usuario con pedidos reales. La [aceptación vigente](evidencias/seguimiento-pedido/expo-go-aceptacion.json) distingue las muestras históricas de la nueva conexión. El agente no observó el teléfono ni leyó o modificó Trello. El [diseño](DISENO-SEGUIMIENTO-PEDIDO.md) y sus resultados se conservan como historia.

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

## Criterios de Trello: 0/8

- [ ] Obtener estado del pedido desde la API
- [ ] Mostrar información del pedido
- [ ] Mostrar estado actual
- [ ] Actualizar la información correctamente
- [ ] Manejar pedidos no encontrados
- [ ] Manejar errores de conexión
- [ ] Probar distintos estados del pedido
- [ ] Revisar el código

La aceptación del diseño no completa ninguno de estos criterios. Se esperará el reporte real de cada recorrido antes de marcarlo como aceptado. La revisión final corresponde a ZenaidaGR en el futuro PR; la revisión de agentes y las pruebas automatizadas no la sustituyen. Mantener Trello **En progreso**, sin atribuir al agente su lectura o marcado.

## Primera prueba real en Expo Go

La prueba del usuario comienza después de concluir las comprobaciones técnicas globales y guardar el commit propio de la API. Reutilizar el QR de Metro de David (**8082**) y el backend local habitual (**3200**), conservando el Metro de Zenaida y la configuración existente.

1. Iniciar sesión con la cuenta de prueba que ya tiene pedidos. Abrir **Cuenta → Historial de pedidos** y seleccionar uno.
2. Pulsar **Ver seguimiento del pedido**. Comprobar que aparece esa referencia real, su estado, fecha de creación, productos, unidades y subtotal; no deben verse rótulos de muestra o referencias `EJEMPLO-...`.
3. Revisar la línea de estados. Las fechas visibles deben proceder de eventos registrados y las ausentes deben permanecer sin inventar. Si el pedido está En revisión, los pasos posteriores deben identificarse como pendientes.
4. Pulsar **Actualizar seguimiento** y esperar la carga. Comprobar que conserva el pedido seleccionado y recupera los datos sin errores o cambios de estado inventados.
5. Volver con **Ver mis pedidos**, comprobar que conserva la navegación de Historial y las cinco pestañas, y reportar el resultado antes de marcar criterios adicionales.

Este recorrido solo consulta el pedido existente; no hace falta crear otro o cambiar su estado para probar la primera lectura. La entrada de Cuenta sin ID puede revisarse aparte: debe pedir elegir un pedido en Historial.

## Orden de las pruebas posteriores y commits

Después de aceptar lectura normal y actualización se guiará **pedido no encontrado**, después **error y reintento**, después **distintos estados disponibles** y finalmente **reapertura, salida y reingreso**. Un montaje sintético posterior deberá identificarse expresamente; no se modificará un pedido real solo para fabricar estados o un 404. Los reportes necesarios se registrarán antes de aceptar cada criterio.

Se conserva el acuerdo de commits por fase: diseño `34b4f83`, aceptación visual `14b8453`, conexión API en un commit propio después de su verificación, y aceptaciones funcionales posteriores en commits separados cuando existan los reportes. No se escribe por anticipado el SHA de la API. Solo después de las pruebas y una solicitud del usuario se preparará el PR de `feature/seguimiento-pedido` hacia `develop` para revisión de ZenaidaGR; no se abre ni integra ahora.

## Verificación y límites actuales

La [verificación técnica propia](evidencias/seguimiento-pedido/verificacion-api.json) pasó: TypeScript, lint, **677/677 pruebas móviles** (59 nuevas: 6 dominio, 16 Repository, 29 controlador/ruta/timeline y 8 HTTP loopback), **50/50 pruebas existentes del contrato backend** en dos suites, Doctor **1.20.4 21/21**, exportaciones Android **1521** y web **1070** módulos. La ruta QA temporal fue retirada antes de las exportaciones. Los resultados del [diseño](evidencias/seguimiento-pedido/verificacion-diseno.json) permanecen históricos.

QA web a **397×1000 / 320×820** usó sesión y acciones de dominio sintéticas con controller, Provider, ViewModel y pantalla reales. Comprobó carga, estados, fecha histórica ausente, actualización, error/reintento, cambio de pedido sin contenido anterior, falta de selección, 401/403/404 y salida sin datos. No hubo desbordamientos horizontales ni errores de consola. Capturas: [397 px](evidencias/seguimiento-pedido/api-qa-web-397.png), [320 px](evidencias/seguimiento-pedido/api-qa-web-320.png), [error conservando datos](evidencias/seguimiento-pedido/api-error-qa-web-397.png) y [404](evidencias/seguimiento-pedido/api-no-encontrado-qa-web-320.png). El único GET al backend local real fue sin Bearer y respondió 401; no se consultaron pedidos reales autenticados ni se hicieron escrituras.

Las pruebas de integración HTTP utilizan Node HTTP y puertos efímeros de loopback, con `HttpClient`, Repository, casos de uso y controlador reales, pero API, cuentas, tokens y datos sintéticos; sus servidores se cierran al terminar. Eso permite verificar transporte, recuperación y aislamiento del cliente, sin acreditar ownership de una API Nest/MongoDB real. Una eventual QA web con sesión o pedidos simulados deberá identificarse como sintética. El bloqueo de redirecciones con Node fetch no se presenta como prueba de todos los transportes nativos.

La aceptación funcional en Expo Go sigue pendiente y procede de los reportes del usuario, no de una observación directa del teléfono por el agente. No se han autorizado escrituras o consultas reales autenticadas del agente para esta guía. TalkBack, texto ampliado y condiciones físicas de red tendrán su evidencia específica si se prueban. Se conservan servicios, configuración, dependencias, identidades, stash y la copia de Zenaida.
