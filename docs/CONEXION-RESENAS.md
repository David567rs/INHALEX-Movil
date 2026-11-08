# Reseñas: conexión a la API

**PR publicado el 8 de noviembre:** [#21](https://github.com/David567rs/INHALEX-Movil/pull/21), abierto por ZenaidaGR desde `feature/resenas` hacia `develop`, con revisión solicitada y verificada a David567rs. Sigue abierto, sin fusionar. [Registro de publicación y comprobaciones](PR-RESENAS.md). Los textos de preparación posteriores conservan el estado anterior a esta autorización; el checklist sigue 9/10 hasta la revisión real de David.

## Estado de esta etapa

La conexión está implementada en `INHALEX-Movil-Zenaida`, rama `feature/resenas`, manteniendo MVVM y Repository. Zenaida desarrolla Reseñas y David (`David567rs`) revisará su futuro PR. Se conserva el historial y se continúa con commits por etapa.

El usuario aceptó en Expo Go el formulario, las estrellas y el comentario. **Hay 9/10 criterios del checklist aceptados (1 a 9): formulario, elegibilidad, captura, validación de campos, publicación, confirmación, evitar reseñas cuando no corresponda, manejo de errores y prueba de la funcionalidad. Solo Revisar el código sigue pendiente.** El acceso y la reapertura de sesión ya se aceptaron en ambas copias durante la recuperación. Además, el 7 de noviembre confirmó las mejoras visuales integradas y la navegación Cuenta → Reseñas en la copia de Zenaida. Tras validar estrellas/comentario vacíos y `abc`, confirmó una publicación con mensaje de éxito, la reseña en Enviadas con las mismas estrellas/comentario, su permanencia al actualizar y la ausencia del producto en Por reseñar. Se aceptaron los criterios 5 y 6 por ese reporte. Después comprobó que la referencia corresponde al pedido Completado que contiene el producto y que Enviadas no permite volver a publicarlo. Se aceptó el criterio 2 por ese caso positivo. Después el usuario identificó un producto de pedido Cancelado que no se ofrece para reseñar; se acepta el criterio 7 con ese caso y el bloqueo visible de repetir la reseña enviada. El usuario también confirmó el fallo de Actualizar y Reintentar sin perder las reseñas, y la recuperación al reiniciar el backend. Se aceptó el caso de lectura. Después confirmó fallo de Publicar y Verificar sin perder estrellas ni comentario, y recuperación con el borrador conservado y Publicar habilitado, sin envío automático. Se aceptó Manejar errores (8). El 8 de noviembre el usuario confirmó reapertura, ocultación de datos y acceso al cerrar sesión, regreso con la misma cuenta y los mismos datos, actualización sin duplicados y ausencia del producto en Por reseñar. Se acepta Probar la funcionalidad (9); la revisión real de David sigue pendiente. [Reporte textual de aceptación](evidencias/resenas/expo-go-aceptacion.json).

Los PR #18, #19 y #20 están integrados en `develop`. La rama de Zenaida incorpora la base visual mediante el merge local `9bc231e`. Se mantiene un backend compartido; el usuario controla Expo y genera el QR. La IP y el puerto de Metro citados en registros anteriores son históricos: utilizar el QR actual de esta copia, sin arrancar otra instancia. [Registro de integración](INTEGRACION-VISUAL-RESENAS.md).

## Contrato real del backend

Las rutas son relativas a `/api`. Ambas requieren el Bearer de la sesión. El servidor obtiene la identidad del JWT; la pantalla no envía el correo ni un identificador de usuario para elegir la cuenta.

| Operación | Ruta | Solicitud y respuesta |
| --- | --- | --- |
| Consultar productos que admiten reseña y reseñas enviadas | `GET /reviews/me/eligible` | Devuelve `{ pending, completed }`. Cada producto incluye identificadores, referencia del pedido, nombre, imagen, presentación y fecha disponible. Las filas de `completed` contienen `review`. |
| Publicar una reseña | `POST /reviews` | Envía `{ productId, orderId, rating, comment }` y devuelve la reseña registrada, con su identificador, producto, pedido, calificación, comentario, estado y fecha disponible. |

Reglas comprobadas en el controlador, DTO, servicio y esquema de `Server/src/modules/reviews`:

- La elegibilidad exige un pedido propio con estado **COMPLETED / Completado** que contenga el producto. El backend actual no exige además la futura funcionalidad de Confirmación de recepción.
- La lista considera los últimos **30 pedidos completados** y deduplica los productos. No representa un historial ilimitado de todas las compras.
- El cliente utiliza el `orderId` de la fila seleccionada. Aunque el DTO permite omitirlo, esta pantalla siempre lo envía.
- La calificación debe ser un entero entre **1 y 5**. El comentario enviado se recorta en sus extremos y debe tener entre **4 y 700 caracteres**.
- Solo corresponde una reseña por usuario y producto. El servidor comprueba la existencia y mantiene un índice único sobre `userId` y `productId`; una reseña existente produce un conflicto `409` en la comprobación previa.
- Una reseña de `completed` puede estar `published` o `hidden`. La pestaña se llama **Enviadas** y distingue **Publicada** de **No visible públicamente**.
- Si el usuario compró otra vez el mismo producto, la fila puede corresponder a una compra más reciente que la reseña ya existente. El pedido de la reseña es el contenido en `review.orderId` y `review.orderReference`.
- El servidor guarda la reseña antes de actualizar la calificación agregada y crear el aviso. Una respuesta fallida no demuestra que la escritura no haya ocurrido.

La consulta pública `GET /reviews/products/:productId` existe en el servidor, pero no forma parte de esta pantalla de reseñas personales. Esta etapa tampoco incorpora edición, eliminación ni cambios del estado de pedidos.

## Capas y responsabilidades

| Capa | Archivos principales | Responsabilidad |
| --- | --- | --- |
| Modelo y contrato de dominio | `Mobile/src/features/reviews/domain/models/Review.ts`, `repositories/ReviewsRepository.ts` | Productos elegibles, colección, reseña y operaciones independientes de la interfaz y de HTTP. |
| Casos de uso | `Mobile/src/features/reviews/domain/useCases/reviewsActions.ts` | Validar y normalizar identificadores, estrellas y comentario; respetar cancelación y errores de dominio. |
| Repository y mapper | `Mobile/src/features/reviews/data/repositories/ApiReviewsRepository.ts`, `mappers/mapReviews.ts` | GET/POST autenticados, validación de respuestas y conversión a modelos públicos. |
| Estado de presentación | `Mobile/src/features/reviews/presentation/state/createReviewsController.ts` | Carga, selección, borrador, publicación, recuperación, exclusión de solicitudes simultáneas y aislamiento de sesión. |
| ViewModel y View | `Mobile/src/features/reviews/presentation/viewModels/useReviewsViewModel.ts`, `screens/ReviewsScreen.tsx` | Presentar estados, acciones y navegación; la View no consume HTTP. |
| Composición | `Mobile/src/bootstrap/createReviewsActions.ts` y servicios de la aplicación | Inyectar Repository, cliente HTTP compartido y sesión de autorización. |

Los DTO no llegan directamente a la View. El mapper conserva únicamente campos previstos, valida colecciones y referencias, y verifica que una confirmación corresponda al producto, pedido, calificación y comentario enviados. Los mensajes del servidor, cabeceras y credenciales no se muestran como errores de interfaz.

## Sesión, errores y publicación incierta

- Al cerrar sesión o cambiar la sesión autenticada, incluso al volver con la misma cuenta, se cancelan las operaciones, se limpia la información personal y se descartan respuestas tardías. No se persisten reseñas ni borradores personales en un almacenamiento local nuevo.
- Un `401` borra los datos de Reseñas y bloquea las operaciones de esa sesión hasta volver a ingresar. Un `403` también retira la información de la pantalla, pero se trata como acceso denegado, sin afirmar que la sesión haya vencido.
- Un fallo de lectura recuperable conserva la última colección y el borrador. La carga inicial fallida muestra un error; no se presenta como una bandeja vacía.
- Durante una operación se bloquean los envíos simultáneos y los toques repetidos. Una lectura no se solapa con una publicación.
- Ante fallo de un POST se conserva el borrador y se exige actualizar la colección antes de permitir otro envío. **Actualizar reseñas / Reintentar ejecuta un GET; nunca repite automáticamente el POST.**
- Si la lectura de recuperación encuentra la reseña, muestra **«Esta reseña ya está registrada.»**, pasa el producto a Enviadas y no lo publica otra vez. Si sigue elegible, el usuario puede revisar su borrador y realizar un nuevo envío explícito.
- Un `409` inicia esa consulta de recuperación. No se anuncia como una nueva publicación exitosa. Si también falla la consulta, permanece el bloqueo hasta recuperar la colección.
- Una publicación confirmada queda protegida frente a una lectura posterior desactualizada que vuelva a incluir el producto como pendiente, durante la misma sesión del controlador.
- Los fallos de red, tiempo de espera, respuestas inválidas, `400/422`, `404`, `429` y errores de servidor tienen mensajes controlados. No hay reintentos automáticos de escritura ni una garantía adicional de idempotencia en el cliente: la restricción definitiva de duplicados corresponde al servidor.

## Recorrido de consulta y publicación en Expo Go

Esta prueba es manual. La cuenta y sus credenciales se introducen en el teléfono; no se necesitan contraseñas en el chat.

1. Mantén la laptop y el teléfono en una red que permita comunicarse. Usa el proyecto de **Zenaida** y el QR que genera el usuario, con Expo Go compatible con SDK 58 y el backend compartido disponible.
2. Conserva tu sesión en **Cuenta**. Si aparece un error nuevo, reporta el texto exacto antes de continuar; el acceso ya aceptado no garantiza la conexión actual.
3. Abre **Cuenta → Reseñas**. Comprueba que **Por reseñar** y **Enviadas** muestran únicamente los productos y reseñas de tu cuenta. Pulsa **Actualizar reseñas**.
4. Si hay un producto pendiente, selecciónalo y comprueba nombre, presentación y referencia. Elige de 1 a 5 estrellas y escribe un comentario de al menos 4 caracteres.
5. Cuando quieras registrar esa reseña real, pulsa una vez **Publicar reseña**. Espera **«Tu reseña se publicó correctamente.»** y consulta el producto en **Enviadas** con las mismas estrellas y comentario.
6. Pulsa **Actualizar reseñas** y comprueba que la reseña permanece y que el producto ya no se ofrece en **Por reseñar**.

Si no hay productos elegibles, **Ver mis pedidos** permite consultar los pedidos disponibles. No cambies un pedido real a Completado solamente para forzar la prueba: en ese caso se prepara después un escenario controlado. La prueba de errores se realiza en una etapa posterior, después de aceptar esta primera consulta y publicación.

## Prueba aceptada: campos requeridos antes de publicar

Antes del paso de publicación válida del recorrido anterior, confirmar si hay algún producto disponible en **Por reseñar**. Si está vacío, reportarlo y preparar un escenario controlado; no borrar reseñas ni alterar pedidos reales.

1. Abrir un producto pendiente e identificar su nombre y referencia.
2. Sin seleccionar estrellas y con el comentario vacío, pulsar **Publicar reseña**. Deben aparecer **«Selecciona una calificación de 1 a 5 estrellas.»** y **«Escribe un comentario de 4 a 700 caracteres.»**.
3. Seleccionar cinco estrellas y escribir `abc`. Pulsar **Publicar reseña** de nuevo: debe permanecer el error de comentario, sin éxito de publicación ni traslado a Enviadas.
4. Corregir a una opinión real de al menos cuatro caracteres y conservar el borrador sin pulsar Publicar todavía. Los espacios de los extremos no cuentan para cumplir el mínimo.

El controlador valida antes de invocar la publicación. El campo limita la entrada a 700 caracteres. El usuario confirmó el rechazo de estrellas/comentario vacíos y de `abc`, conservando el producto en Por reseñar. Se acepta **Validar campos requeridos** por ese reporte, sin atribuir observación del dispositivo al agente ni una prueba nativa de 700/701 caracteres. La cita exacta está en el registro de aceptación.

## Prueba aceptada: publicación y actualización

Con el producto pendiente, comprobar nombre y referencia, elegir una calificación de 1 a 5 estrellas y escribir una opinión real de 4 a 700 caracteres. Pulsar una vez **Publicar reseña**; esta acción sí registra la reseña en la cuenta. Esperar **«Tu reseña se publicó correctamente.»**. Si aparece otro aviso, reportarlo antes de repetir el envío.

En **Enviadas**, verificar el mismo producto, calificación y comentario. Pulsar **Actualizar reseñas** y comprobar que la reseña permanece y el producto ya no aparece en **Por reseñar**. El usuario confirmó estos resultados. Se aceptan **Enviar la reseña a la API** y **Mostrar confirmación de publicación** (5 y 6). El agente no observó el teléfono ni publicó la reseña. La permanencia al actualizar en la misma sesión no sustituye la prueba de reapertura: el controlador conserva temporalmente las publicaciones confirmadas.

## Prueba aceptada: pedido elegible y acceso después de publicar

1. En **Enviadas**, anotar la referencia **Pedido …** de la reseña recién publicada.
2. Volver a **Cuenta → Historial de pedidos**, localizar esa referencia y abrir **Ver resumen**. Comprobar que tenga estado **Completado** y contenga el producto reseñado.
3. Regresar por **Cuenta → Reseñas → Enviadas**. Comprobar que la tarjeta sea de consulta y no ofrezca **Escribir reseña** ni **Publicar reseña** para ese producto.
4. Revisar que el producto siga ausente de **Por reseñar**.

El usuario confirmó el pedido Completado y el producto, la referencia coincidente, la ausencia de acción para volver a publicar y la ausencia del producto en Por reseñar. Se acepta **Validar que el usuario pueda publicar la reseña** (2) por el caso positivo de compra elegible. El bloqueo de repetición en la interfaz se registró inicialmente como evidencia parcial de **Evitar reseñas cuando no corresponda** (7); el reporte posterior del pedido Cancelado completa su aceptación funcional descrita abajo. No acredita rechazo HTTP de duplicados, pedidos ajenos o no completados. La fuente es el reporte del usuario, sin observación directa del teléfono por el agente.

## Prueba aceptada: producto de pedido cancelado

Se consultó si había un producto comprado únicamente en pedidos no completados. El usuario respondió primero que no tenía uno identificado y pidió una prueba controlada; después corrigió: «ah no si, tengo uno cancelado y efectivamente no se puede escribir reseña, no me sale».

Se acepta **Evitar reseñas cuando no corresponda** (7) por el reporte de ausencia del producto cancelado y el bloqueo visible de repetir la reseña enviada, ya comprobado. La solicitud de montaje controlado quedó sustituida por el caso real; no se preparó ni ejecutó una fixture y no se modificaron pedidos. No se atribuye observación del teléfono ni rechazo HTTP 403/409 al agente; no hay prueba nativa de pedido ajeno. Que un producto aparezca en un pedido Confirmado no basta para declararlo inelegible si también se compró antes en uno Completado.

## Prueba aceptada: error de lectura y reintento

1. Abrir **Cuenta → Reseñas → Enviadas** y esperar a que se carguen las reseñas.
2. Detener únicamente el backend compartido desde su terminal; mantener Expo abierto.
3. Pulsar **Actualizar reseñas**. Esperar el aviso de conexión y comprobar que se conservan las tarjetas, las estrellas y los comentarios.
4. Con el backend aún detenido, pulsar **Reintentar**: debe fallar de nuevo sin vaciar la colección.
5. Reiniciar ese mismo backend con su comando habitual y pulsar **Reintentar**: debe desaparecer el aviso, conservarse Enviadas y recuperarse la lista.

Los botones ejecutan GET y no publican. El usuario confirmó: «Amigo, Actualizar y Reintentar fallaron sin perder las reseñas. Reinicié el backend y Reintentar recuperó la lista y quitó el aviso». Se acepta el caso de lectura y recuperación por su reporte textual, sin observación directa del teléfono, inspección de tráfico ni acciones del agente sobre servicios o reseñas. En ese momento el criterio 8 quedó parcial; la aceptación posterior del fallo de publicación, descrita abajo, completa el criterio y deja el checklist en 8/10.

## Prueba aceptada: fallo de publicación y recuperación del borrador

La guía requirió otro producto disponible en **Por reseñar**, sin reutilizar una reseña enviada ni modificar pedidos. El usuario completó el recorrido siguiente y reportó sus resultados; no se preparó un escenario controlado.

1. Con el backend disponible, abrir un producto en **Por reseñar**, elegir estrellas de 1 a 5 y escribir una opinión real de 4 a 700 caracteres. Permanecer en ese formulario durante toda la prueba: volver o cambiar de pantalla descarta intencionalmente el borrador.
2. Detener únicamente el backend compartido, mantener Expo abierto y pulsar **Publicar reseña** una vez. No pulsar Actualizar antes del envío.
3. Tras el aviso de conexión o espera agotada, comprobar que se conservan las estrellas y el comentario, que **Publicar reseña** queda bloqueado y que aparece **Verificar reseñas**.
4. Pulsar **Verificar reseñas** con el backend todavía detenido. Debe fallar la consulta conservando el borrador y el bloqueo.
5. Reiniciar ese mismo backend y pulsar **Verificar reseñas**. Si el producto sigue elegible, debe desaparecer el error, conservarse el borrador y habilitarse **Publicar reseña**, sin publicar automáticamente.
6. Terminar ahí y reportar el resultado, sin pulsar Publicar nuevamente.

El usuario confirmó: «Amigo, fallaron Publicar y Verificar reseñas sin perder las estrellas ni el comentario. Reinicié el backend y Verificar reseñas habilitó Publicar, conservó el borrador y no lo envió automáticamente.». Se acepta **Manejar errores** (8) junto con el caso previo de lectura. La fuente es el reporte textual del usuario, sin observación del dispositivo, inspección HTTP ni publicación del agente. Cubre fallo de envío sin conexión y recuperación mediante GET; no acredita respuesta perdida después de guardar ni prueba nativa de 409, 401 o 403. El checklist queda **8/10**. No se confirma marcado en Trello.

## Prueba aceptada: reapertura y continuidad de sesión

Esta etapa utiliza una reseña **ya enviada**. El borrador de la prueba anterior no se publica ni se conserva al salir del formulario; el filtro también puede volver a Por reseñar al montar la pantalla.

1. Mantener el backend compartido disponible. Si sigue el formulario de prueba, tocar la flecha **Volver a mis reseñas**, que descarta ese borrador. Abrir **Enviadas** e identificar una reseña publicada previamente, con sus estrellas y comentario.
2. Cerrar completamente Expo Go y reabrir el proyecto de Zenaida. Entrar por **Cuenta → Reseñas → Enviadas** y comprobar la misma reseña, estrellas y comentario.
3. Volver a **Cuenta → Cerrar sesión**. Deben desaparecer los datos personales y el menú Reseñas; debe aparecer **Iniciar sesión**. No se puede abrir Reseñas desde ese menú sin sesión.
4. Ingresar con la misma cuenta y volver a **Cuenta → Reseñas → Enviadas**. Pulsar **Actualizar reseñas**.
5. Comprobar la misma reseña, sin duplicados y con las mismas estrellas y comentario; verificar que el producto sigue fuera de **Por reseñar**.

El 8 de noviembre de 2026 el usuario confirmó: «Amigo, la reseña volvió al reabrir. Al cerrar sesión desaparecieron mis datos y el acceso a Reseñas; al ingresar regresó con las mismas estrellas y comentario. Actualizar funciona, no hay duplicados y sigue fuera de Por reseñar.». Se acepta **Probar la funcionalidad** (9) con este reporte y los recorridos ya aceptados: **9/10**. La fuente es el reporte textual del usuario; el agente no observó el teléfono ni modificó Trello. No acredita aislamiento entre cuentas diferentes, sesión caducada, persistencia de borrador o respuesta perdida de una publicación.

## Siguiente etapa: preparación y revisión del PR

La actividad funcional está aceptada en el alcance descrito. Solo **Revisar el código** (10) queda pendiente de la revisión real de **David567rs** sobre el futuro PR de **ZenaidaGR**, desde **feature/resenas** hacia **develop**. La aceptación se conserva en un commit documental separado. Este reporte no publica la rama ni abre el PR; se realizará cuando el usuario lo solicite, conservando ramas y commits.

Antes de publicar, revisar el diff y las comprobaciones correspondientes al estado final. Los resultados técnicos históricos de abajo no sustituyen esa comprobación ni permiten anticipar la CI remota. La revisión de un agente tampoco sustituye la aprobación de David. El usuario continúa controlando Expo y el QR; se mantiene el backend compartido y no se comienza Confirmación de recepción en esta etapa.

## Checklist de Trello: 9/10 aceptados

- [x] Crear formulario de reseña.
- [x] Validar que el usuario pueda publicar la reseña.
- [x] Capturar calificación y comentario.
- [x] Validar campos requeridos.
- [x] Enviar la reseña a la API.
- [x] Mostrar confirmación de publicación.
- [x] Evitar reseñas cuando no corresponda.
- [x] Manejar errores.
- [x] Probar la funcionalidad.
- [ ] Revisar el código.

Los nueve puntos aceptados proceden de los reportes del usuario. Solo la revisión real de David queda pendiente; disponer de código, pruebas automatizadas o revisión técnica del agente no equivale a su aprobación. El agente no modificó Trello en esta etapa.

## Evidencia técnica y trabajo pendiente

Al preparar este documento, la suite móvil completa terminó con **782 pruebas aprobadas**. Incluye dominio, Repository, HTTP controlado, controlador, cancelación, cambios de sesión, validación de respuestas y recuperación tras un envío incierto. La comprobación de TypeScript terminó correctamente. Son verificaciones técnicas locales; no constituyen publicación real con la cuenta del usuario.

La verificación final pasó: TypeScript, lint, Expo Doctor **20/20** y exportaciones Android (**1454 módulos**) y web (**1104 módulos**), después de retirar la ruta temporal de QA. La revisión web comprobó el acceso real sin sesión y su navegación al login. Un escenario aislado con sesión y Repository simulados comprobó lista elegible, selección, validación local, estrellas, comentario, publicación simulada, Enviadas y actualización; no hubo publicación en la base real. La pantalla de 356 px no desbordó horizontalmente. Las capturas están rotuladas como prueba controlada. [Resultados](evidencias/resenas/verificacion-api.json).

Estas verificaciones pertenecen a la preparación de la API. La integración visual posterior pasó 813 pruebas, TypeScript y lint, y el usuario confirmó el acceso desde Cuenta. La validación de campos, publicación y elegibilidad positiva ya se aceptaron mediante los reportes nativos descritos arriba. El pedido Cancelado y el bloqueo visible de repetir la reseña ya se aceptaron en el alcance de interfaz descrito arriba. El error de lectura y su recuperación también se aceptaron por reporte del usuario. El fallo de publicación y la recuperación del borrador también se aceptaron mediante el reporte del usuario. La continuidad propia de Reseñas se aceptó con el reporte del 8 de noviembre; no se atribuye prueba de bandeja vacía. Los 9/10 aceptados no cambian por las comprobaciones técnicas.

Los PR técnicos y visuales ya integrados no completan la actividad de Reseñas. Las pruebas funcionales descritas están aceptadas; el futuro PR tendrá a David como revisor. La aceptación de diseño, conexión y pruebas se documenta por etapas; no se reescriben los commits anteriores ni se comienza Confirmación de recepción en esta etapa.
