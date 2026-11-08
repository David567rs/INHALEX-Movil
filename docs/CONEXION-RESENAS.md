# Reseñas: conexión a la API

## Estado de esta etapa

La conexión está implementada en `INHALEX-Movil-Zenaida`, rama `feature/resenas`, manteniendo MVVM y Repository. Zenaida desarrolla Reseñas y David (`David567rs`) revisará su futuro PR. Se conserva el historial y se continúa con commits por etapa.

El usuario aceptó en Expo Go el formulario, las estrellas y el comentario. **Hay 3/10 criterios del checklist aceptados: crear el formulario, capturar calificación/comentario y validar campos requeridos.** El acceso y la reapertura de sesión ya se aceptaron en ambas copias durante la recuperación. Además, el 7 de noviembre confirmó las mejoras visuales integradas y la navegación Cuenta → Reseñas en la copia de Zenaida. Anteriormente informó que puede consultar sus reseñas enviadas; esto no acredita todavía una nueva publicación. Ahora confirmó el rechazo de estrellas/comentario vacíos y de `abc`, conservando el producto en Por reseñar; esa prueba acepta el criterio 4. [Reporte textual de aceptación](evidencias/resenas/expo-go-aceptacion.json).

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

## Siguiente prueba: publicación y actualización

Con el producto pendiente, comprobar nombre y referencia, elegir una calificación de 1 a 5 estrellas y escribir una opinión real de 4 a 700 caracteres. Pulsar una vez **Publicar reseña**; esta acción sí registra la reseña en la cuenta. Esperar **«Tu reseña se publicó correctamente.»**. Si aparece otro aviso, reportarlo antes de repetir el envío.

En **Enviadas**, verificar el mismo producto, calificación y comentario. Pulsar **Actualizar reseñas** y comprobar que la reseña permanece y el producto ya no aparece en **Por reseñar**. La publicación y su confirmación siguen pendientes hasta el reporte del usuario.

## Checklist de Trello: 3/10 aceptados

- [x] Crear formulario de reseña.
- [ ] Validar que el usuario pueda publicar la reseña.
- [x] Capturar calificación y comentario.
- [x] Validar campos requeridos.
- [ ] Enviar la reseña a la API.
- [ ] Mostrar confirmación de publicación.
- [ ] Evitar reseñas cuando no corresponda.
- [ ] Manejar errores.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

Los tres puntos aceptados proceden de los reportes del usuario. Los demás siguen pendientes de las pruebas guiadas y de revisión; disponer de código o pruebas automatizadas no equivale a aceptarlos en Expo Go. El agente no modificó Trello en esta etapa.

## Evidencia técnica y trabajo pendiente

Al preparar este documento, la suite móvil completa terminó con **782 pruebas aprobadas**. Incluye dominio, Repository, HTTP controlado, controlador, cancelación, cambios de sesión, validación de respuestas y recuperación tras un envío incierto. La comprobación de TypeScript terminó correctamente. Son verificaciones técnicas locales; no constituyen publicación real con la cuenta del usuario.

La verificación final pasó: TypeScript, lint, Expo Doctor **20/20** y exportaciones Android (**1454 módulos**) y web (**1104 módulos**), después de retirar la ruta temporal de QA. La revisión web comprobó el acceso real sin sesión y su navegación al login. Un escenario aislado con sesión y Repository simulados comprobó lista elegible, selección, validación local, estrellas, comentario, publicación simulada, Enviadas y actualización; no hubo publicación en la base real. La pantalla de 356 px no desbordó horizontalmente. Las capturas están rotuladas como prueba controlada. [Resultados](evidencias/resenas/verificacion-api.json).

Estas verificaciones pertenecen a la preparación de la API. La integración visual posterior pasó 813 pruebas, TypeScript y lint, y el usuario confirmó el acceso desde Cuenta. La validación de campos requeridos ya se aceptó mediante el reporte nativo descrito arriba. La publicación real, vacío, errores, recuperación, duplicados y continuidad propia de Reseñas se aceptarán paso a paso. Los 3/10 aceptados no cambian por las comprobaciones técnicas.

Los PR técnicos y visuales ya integrados no completan la actividad de Reseñas. Su futuro PR tendrá a David como revisor cuando finalicen las pruebas funcionales. La aceptación de diseño, conexión y pruebas se documenta por etapas; no se reescriben los commits anteriores ni se comienza Confirmación de recepción en esta etapa.
