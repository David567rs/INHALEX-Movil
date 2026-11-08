# Confirmación de recepción: conexión a la API

8 de noviembre de 2026. Implementación de David en `INHALEX-Movil`, rama `feature/confirmacion-recepcion`, desde `develop` `0f619021b4de5d5436b0f43c122d9cba6b306da3`. El usuario aceptó el diseño en Expo Go y autorizó esta etapa. Se mantiene el diseño aprobado y el historial de commits. El primer caso correcto de la API, la elegibilidad visible, el doble toque y el error de lectura con recuperación ya fueron aceptados por reporte del usuario. El usuario aceptó después el fallo al confirmar y su verificación mediante un caso ficticio aislado. El checklist vigente es **7/9**; siguen pendientes Probar la funcionalidad y Revisar el código.

## Comportamiento y arquitectura

Cuenta → Confirmación de recepción consulta los pedidos completados de la cuenta, permite seleccionar uno y muestra referencia, productos, cantidades y subtotal. Confirmar abre el diálogo de segunda acción. La respuesta confirmada muestra la fecha y retira la opción de repetir la operación. Los pedidos con incidencia no admiten confirmación. El contenido conserva un único desplazamiento; el diálogo también puede desplazarse.

La ruta es delgada. La pantalla usa `useOrderReceiptViewModel`, el controlador y los casos de uso; estos dependen del contrato `OrderReceiptRepository`, implementado por `ApiOrderReceiptRepository` y el `HttpClient` compartido. Bootstrap compone las dependencias y `OrderReceiptProvider` vincula la sesión. El token se resuelve en la capa HTTP, sin entregarlo a la vista. Los ejemplos de diseño se retiraron del flujo de producción y permanecen en el historial Git.

## Contrato y reglas

Todas las rutas requieren Bearer y el servidor identifica al propietario con la sesión.

| Operación | Ruta | Resultado |
| --- | --- | --- |
| Consultar | `GET /api/orders/me/receipt-confirmations` | Hasta 12 pedidos propios completados, ordenados por fecha reciente. |
| Confirmar | `PATCH /api/orders/:id/receipt/confirm` | Sin cuerpo. Devuelve la recepción confirmada del pedido solicitado. |

El estado general permanece `completed` (Completado). La recepción tiene su propio estado: `pending`, `confirmed` o `issue_reported`. No se inventa un estado general Entregado ni una dirección que el contrato no proporciona. Los registros antiguos completados sin recepción o con `not_required` se tratan como pendientes.

El mapper comprueba identificadores, estructura, fechas, límites de cantidades e importes y coherencia del subtotal. El resultado de confirmar debe corresponder al ID solicitado, estar confirmado y contener su fecha. Se mantienen los límites actuales del contrato: 12 pedidos, 20 líneas por pedido y cantidades de 1 a 25 por línea.

El servidor valida pertenencia y estado. La escritura usa una condición atómica sobre propietario, pedido completado y recepción todavía pendiente; solo la petición que efectúa la transición añade la nota y notifica. Una repetición de una recepción confirmada devuelve el resultado existente. Un pedido con incidencia devuelve conflicto; un pedido ajeno o no completado no se confirma.

## Errores, sesión y repeticiones

- El controlador bloquea sincrónicamente envíos y actualizaciones simultáneas, incluido el doble toque.
- Si falla una lectura de red, se conserva la última colección y se ofrece reintento explícito.
- Si falla la confirmación, se conserva el pedido y se ofrece **Verificar recepción**. Esta acción solo consulta: nunca repite el PATCH automáticamente. Si el servidor ya confirmó, recupera el resultado; si sigue pendiente, permite una nueva confirmación explícita.
- Una respuesta de consulta antigua no hace retroceder una recepción ya reconocida como confirmada en la sesión. Este registro es acotado, reside en memoria y se limpia al cambiar la autenticación.
- Cerrar sesión o cambiar de cuenta oculta los datos y descarta respuestas tardías. Solo un 401 se interpreta como sesión expirada; un 403 retira la información privada y requiere nueva consulta. El diálogo se cierra al salir de la vista o perder validez la selección.

No se implementa reporte de incidencias en esta actividad. La exclusión de solicitudes concurrentes no equivale a garantizar notificaciones exactamente una vez ante una caída del proceso del servidor.

## Commits de esta etapa

1. `3a16618`: aceptación del diseño y autorización de la API.
2. `858a316`: protección de confirmaciones simultáneas en el backend y sus pruebas.
3. `af106e0`: integración móvil, MVVM, Repository, protección de sesión y pruebas.
4. Registro documental posterior de comprobaciones y guía de aceptación.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| Suite móvil `npm test` | 861 aprobadas, 0 fallos; incluye 48 nuevas de recepción. |
| TypeScript móvil `npm run typecheck` | Correcto. |
| Lint móvil `npm run lint` | Correcto. |
| Backend: `customer-receipt.service.spec.ts` y `orders.service.spec.ts` | 21 aprobadas: 16 de recepción y 5 existentes. |
| Compilación del backend | Correcta. |
| Lint del nuevo spec del backend | Correcto. |
| `git diff --check` | Correcto. |
| Revisión de arquitectura y de concurrencia/sesión | Sin problemas bloqueantes detectados. |

Los tests móviles ejercitan también el `HttpClient` real con `fetch` sustituido por respuestas controladas. Cubren fallo antes de guardar y respuesta perdida después de guardar, sin peticiones externas. Los tests del servidor usan modelos simulados. No representan confirmaciones reales ni sustituyen la aceptación en Expo Go.

Se revisó la pantalla real en web de 360 × 800 usando exclusivamente el Metro que el usuario ya tenía abierto. La ruta de producción mostró la protección sin sesión. Una ruta temporal aislada utilizó autenticación y pedidos ficticios en memoria, sin HTTP, tokens ni almacenamiento: selección, resumen, cancelación, confirmación, conservación al actualizar y bloqueo por incidencia. La consola no registró errores. La ruta temporal fue eliminada antes de guardar el commit móvil.

Evidencia visual ficticia: [diálogo](evidencias/confirmacion-recepcion/api-dialogo-demo-web.jpg) y [recepción confirmada](evidencias/confirmacion-recepcion/api-confirmada-demo-web.jpg). Registro estructurado: [verificacion-api.json](evidencias/confirmacion-recepcion/verificacion-api.json).

El agente no arrancó Expo, no generó QR, no reinició ni detuvo servicios, no confirmó pedidos reales, no cambió dependencias ni la copia de Zenaida y no publicó la rama, abrió PR ni modificó Trello.

## Trello: aceptación vigente

El usuario reportó el 8 de noviembre de 2026: «Amigo, apareció Recepción confirmada, desapareció el botón y se conservó al actualizar. La referencia, cantidades e importes coinciden con Historial. ¿Qué marco en Trello y qué sigue?»

Ese primer reporte permitió aceptar los criterios 3, 5 y 6, además del diseño previamente aceptado (1): en ese momento **4/9**. Actualizar el estado del pedido se entiende como actualizar su recepción; el estado general sigue siendo Completado. La fuente es el reporte del usuario, sin observación directa del teléfono, inspección de HTTP o conteo de escrituras en la base. Ese primer reporte no acreditaba cancelación del diálogo, fecha mostrada, doble toque, un pedido no elegible o errores. Evidencia: [aceptacion-api-expo-go.json](evidencias/confirmacion-recepcion/aceptacion-api-expo-go.json). El registro de verificación técnica anterior conserva su estado histórico.

Después, el usuario informó: «Amigo, el pedido no completado no aparece en Recepción. El ya confirmado conserva su estado y no permite confirmar otra vez. ¿Qué marco en Trello y qué sigue?» Se aceptó **Validar que el pedido pueda ser confirmado (2)** por ese caso y el caso positivo anterior: en ese momento **5/9**. El estado concreto del pedido no completado no fue especificado; no se atribuye prueba de todos los estados, incidencia o pedido ajeno. La ausencia de la acción de repetir validó el bloqueo visible; Evitar confirmaciones duplicadas quedó pendiente de la prueba específica de doble toque. Evidencia: [aceptacion-elegibilidad-expo-go.json](evidencias/confirmacion-recepcion/aceptacion-elegibilidad-expo-go.json).

El usuario posteriormente reportó: «Amigo, hice dos toques rápidos: se cerró el diálogo, apareció Recepción confirmada y al actualizar conservó la misma referencia, sin permitir confirmar otra vez. ¿Qué marco en Trello y qué sigue?» Se acepta **Evitar confirmaciones duplicadas (4)** por este comportamiento nativo y las pruebas técnicas previas de exclusión e idempotencia. Checklist vigente: **6/9**, criterios 1 a 6. El reporte no afirma que alcanzó a ver Confirmando ni permite contar peticiones, escrituras, notas o notificaciones reales. No acredita concurrencia entre dispositivos ni caída del proceso. Evidencia: [aceptacion-doble-toque-expo-go.json](evidencias/confirmacion-recepcion/aceptacion-doble-toque-expo-go.json).

El usuario informó después exactamente: «Amigo, Actualizar y Reintentar fallaron sin perder el pedido ni la confirmación. Reinicié el backend y Reintentar recuperó los datos y quitó el aviso. ¿Qué marco en Trello y qué sigue?» Se acepta el caso de **error de lectura y recuperación**, sin añadir un criterio completo: **Manejar errores (7)** continúa pendiente del fallo al confirmar y la recuperación con **Verificar recepción**. Por tanto, permanecen **6/9**, criterios 1 a 6. La fuente es el reporte textual del usuario sobre Expo Go; el agente no observó el teléfono ni inspeccionó peticiones HTTP o la base. No se atribuye al reporte prueba de escritura fallida, respuesta perdida después de guardar o reenvío automático. Evidencia: [aceptacion-error-lectura-expo-go.json](evidencias/confirmacion-recepcion/aceptacion-error-lectura-expo-go.json).

El usuario no dispone de otro pedido Completado pendiente de recepción, de prueba o realmente recibido, y eligió continuar con una **prueba controlada**. Esa elección autoriza preparar un caso ficticio aislado para el fallo al confirmar y su verificación; no constituye su preparación, ejecución o aceptación. La indicación para Trello es mantener **En progreso**: este reporte no permite marcar un punto nuevo y el agente no ha comprobado ni modificado el tablero.

### Aceptación del caso controlado, 8 de noviembre de 2026

El usuario informó exactamente: «Amigo, Confirmar y Verificar fallaron sin perder el pedido ficticio. Restablecer y verificar habilitaron Confirmar sin envío automático. Confirmé: quedaron 2 intentos y 1 recepción, se conservó al actualizar y salí. ¿Qué sigue?» Se acepta **Manejar errores (7)** combinando este caso de fallo de confirmación/verificación con la lectura real aceptada previamente. El avance es **7/9**, criterios 1 a 7. El caso ficticio no escribió en el backend: los 2 intentos y 1 recepción son contadores de memoria. No se atribuyen a este reporte prueba de respuesta perdida después de guardar, escritura real fallida, reapertura/sesión o vacío. El agente no observó el teléfono ni modificó Trello. Evidencia: [aceptacion-error-confirmacion-controlada-expo-go.json](evidencias/confirmacion-recepcion/aceptacion-error-confirmacion-controlada-expo-go.json).

- [x] Mostrar opción de confirmar recepción
- [x] Validar que el pedido pueda ser confirmado
- [x] Enviar confirmación a la API
- [x] Evitar confirmaciones duplicadas
- [x] Actualizar el estado del pedido
- [x] Mostrar mensaje de confirmación
- [x] Manejar errores
- [ ] Probar la funcionalidad
- [ ] Revisar el código

## Guía del primer caso (conservada como referencia)

1. Recargar el Expo ya abierto de David e iniciar sesión con la cuenta de prueba.
2. Entrar en **Cuenta → Confirmación de recepción** y seleccionar un pedido completado pendiente de recepción. Si no hay uno disponible, informar ese resultado para preparar el caso siguiente.
3. Comparar referencia, productos, cantidades y subtotal con Historial.
4. Abrir **Confirmar recepción** y elegir **Todavía no**: el pedido debe conservarse pendiente.
5. Con un pedido de prueba o realmente recibido, volver a abrir el diálogo y confirmar. Debe aparecer **Recepción confirmada**, su fecha y desaparecer la opción de confirmar de nuevo.
6. Pulsar **Actualizar recepciones**: la confirmación debe conservarse.

Respuesta sugerida: «Amigo, apareció Recepción confirmada, desapareció el botón y se conservó al actualizar. La referencia, las cantidades y los importes coinciden con Historial.»

Los casos pendientes se guían por separado: vacío y reapertura/cierre de sesión según disponibilidad. El fallo al confirmar/verificación controlado ya fue aceptado en `cc6be76`; su acceso temporal fue retirado en una etapa separada. No se marcan como aceptados anticipadamente. El PR y la revisión de Zenaida corresponden a una etapa posterior.

## Guía de elegibilidad (conservada como referencia)

1. En Historial, pulsar Actualizar historial e identificar la referencia reciente de un pedido propio Cancelado, En revisión o Confirmado. No cambiar su estado para esta prueba.
2. Volver a Cuenta → Confirmación de recepción y pulsar Actualizar recepciones. Ese pedido no debe aparecer como opción para confirmar; la sección solo consulta pedidos Completados.
3. Abrir de nuevo el pedido cuya recepción ya se confirmó. Debe conservar Recepción confirmada y no ofrecer otro envío.
4. Si no hay un pedido no completado disponible, informar ese resultado antes de preparar un caso controlado.

Esta comprobación verifica el comportamiento visible de elegibilidad y la ausencia de repetición desde la UI. No prueba por sí sola autorización de pedidos ajenos, concurrencia o respuesta perdida; esos alcances no se atribuyen al usuario.

La colección está limitada a los 12 pedidos completados más recientes. La ausencia de un pedido antiguo no demuestra por sí sola un bloqueo por estado, ni se exige que aparezcan todos los pedidos completados.

## Guía de doble toque (conservada como referencia)

Se necesita otro pedido Completado cuya recepción siga pendiente, de prueba o realmente recibido. No alterar pedidos ni generar compras para disponer de un ejemplo. Si no hay uno disponible, el usuario lo informa y se prepara una alternativa controlada.

1. Seleccionar ese pedido, anotar su referencia y abrir Confirmar recepción.
2. En el diálogo, dar dos toques rápidos a **Sí, recibí mi pedido**. La primera acción debe bloquear el envío o sustituir la vista por su progreso; la segunda no debe iniciar otra confirmación visible.
3. Al finalizar, comprobar Recepción confirmada, misma referencia y ausencia del botón para repetir. Pulsar Actualizar recepciones y comprobar que se conserva.

Reportar el comportamiento observado sin afirmar un número de escrituras o notificaciones del servidor a partir de la pantalla. El bloqueo nativo complementa las pruebas técnicas existentes de exclusión síncrona, transición atómica e idempotencia; no demuestra por sí solo exactamente una escritura ni recuperación ante caída del proceso.

## Guía de error de lectura y reintento (conservada como referencia)

1. Con el backend funcionando, entrar en Confirmación de recepción y dejar seleccionado el pedido confirmado, con sus datos visibles.
2. El usuario detiene solo el backend compartido en la terminal donde lo arrancó, mediante Ctrl+C. Expo permanece abierto. El agente no inicia ni detiene procesos.
3. Pulsar Actualizar recepciones y esperar el aviso. El pedido, su resumen y su confirmación deben conservarse.
4. Con el backend todavía detenido, pulsar Reintentar. Debe volver a fallar sin vaciar los datos.
5. El usuario vuelve a iniciar ese mismo backend con el comando que usó antes. Tras esperar a que esté listo, pulsa Reintentar en el teléfono.
6. Deben desaparecer el aviso y recuperarse los datos de la misma referencia, manteniendo Recepción confirmada y sin ofrecer repetirla.

Este caso solo comprueba lectura. Manejar errores sigue pendiente hasta verificar también el fallo al confirmar y la recuperación con Verificar recepción, con otro pedido pendiente o una prueba controlada si no hay uno disponible. No enviar una confirmación durante esta prueba de lectura.

## Preparación histórica: fallo controlado al confirmar y verificación

La alternativa elegida por el usuario ya está preparada en desarrollo. La aceptación de lectura real anterior quedó en `39ce307`; la implementación controlada tiene su etapa separada en `9b6f9f5`. El acceso **Cuenta → Confirmación de recepción → Probar fallo de confirmación** crea `DEMO-RECEPCION-01`, con 2 unidades y subtotal de $120.00 MXN. Si el botón no aparece, recargar solo el Expo existente. No se necesita otro pedido real ni detener el backend.

La [guía completa](PRUEBA-CONTROLADA-RECEPCION.md) detalla el fallo antes de guardar, **Verificar recepción** mientras falla, **Restablecer conexión simulada**, nueva verificación sin envío automático, confirmación explícita, **Actualizar recepciones** y **Salir de la prueba**. Los contadores del panel pertenecen únicamente al Repository ficticio en memoria; no cuentan peticiones o escrituras reales. La sesión ficticia es independiente de las credenciales de la cuenta. El caso reutiliza el controlador, ViewModel y pantalla reales, se limita a `__DEV__` y se descarta al salir o perder foco. La app exterior puede realizar sus lecturas habituales; el caso ficticio no usa HTTP ni almacenamiento.

La preparación pasó **866/866 pruebas móviles**, TypeScript, lint con 0 errores y 0 advertencias y `git diff --check`. La QA web de 390 × 844 en el Metro `8081` que el usuario ya tenía abierto comprobó la entrada real anónima, el caso ficticio, fallo y conservación con contadores 1/0, verificación fallida, restablecimiento sin envío, verificación que habilita confirmar manteniendo 1/0 y confirmación explícita que termina en 2/1. Actualizar conservó la confirmación y 2/1; Salir devolvió la pantalla real anónima, y reentrar creó otro caso pendiente desde 0/0, que también se cerró. No hubo errores de consola; apareció una advertencia web de Animated por usar el fallback JavaScript de `useNativeDriver`. La revisión técnica no identificó bloqueadores. Evidencia separada: [prueba-error-confirmacion-controlada.json](evidencias/confirmacion-recepcion/prueba-error-confirmacion-controlada.json) y [captura web del pedido ficticio confirmado](evidencias/confirmacion-recepcion/prueba-controlada-confirmada-web.png).

Esta evidencia web y técnica no sustituye el reporte nativo del usuario. El checklist continúa **6/9**; **Manejar errores (7)** espera ese reporte junto con la lectura real aceptada. **Probar la funcionalidad (8)** y **Revisar el código (9)** siguen pendientes. La respuesta perdida después de guardar es otro escenario y no se acredita con este fallo previo a guardar. Después de la aceptación se retirarán el helper y su acceso temporal en otro commit, conservando la historia y antes de publicar o abrir PR. No se modifica Trello ni se inicia Expo o el backend por esta preparación.

La preparación y sus pendientes descritos en el apartado anterior son históricos. El reporte nativo posterior registrado en la aceptación vigente completa Manejar errores (7), con el alcance ficticio declarado. La retirada del acceso temporal se registra por separado.

## Retirada y siguiente comprobación nativa

La aceptación está registrada en `cc6be76`. Se retiró el helper controlado y se restauró el flujo normal conservando los commits, la guía histórica y sus evidencias. Tras la retirada pasaron 861/861 pruebas móviles, TypeScript, lint y `git diff --check`; la entrada web normal mostró la protección sin sesión y ningún panel ficticio. El backend no cambió. Véase [el registro de retirada](PRUEBA-CONTROLADA-RECEPCION.md#retirada-verificada-8-de-noviembre-de-2026).

El siguiente recorrido usa el pedido **real ya confirmado**, sin enviar otra confirmación:

1. Cerrar Expo Go por completo y reabrir el proyecto existente de David. Entrar en Cuenta → Confirmación de recepción y abrir la misma referencia.
2. Comprobar **Recepción confirmada**, fecha de confirmación, cantidades y subtotal; no debe ofrecer confirmar de nuevo. Pulsar **Actualizar recepciones** y verificar que se conserva.
3. Cerrar sesión desde Cuenta: los datos personales y el acceso a recepción deben ocultarse. Si se vuelve a abrir la ruta sin sesión, debe pedir ingresar.
4. Ingresar con la misma cuenta: recuperar el pedido confirmado, sin otro envío, y comprobar Actualizar recepciones.

Después falta comprobar el estado vacío según disponibilidad de una cuenta sin pedidos Completados: **No hay recepciones disponibles**, permanencia al actualizar y **Ver mis pedidos** hacia Historial. No se borran ni cambian pedidos para provocar este estado. Si no existe esa cuenta, se acordará un caso aislado. **Probar la funcionalidad (8)** y **Revisar el código (9)** permanecen pendientes; esta retirada no los completa ni autoriza un PR.

## Aceptación de reapertura y sesión — 8 de noviembre de 2026

> Amigo, la recepción se conservó al reabrir, se ocultó al cerrar sesión y volvió con la misma cuenta. Actualizar funciona y no permite confirmar otra vez. Sigamos con la prueba del estado vacío.

Se registra el resultado reportado del pedido real confirmado: reapertura, ocultación al cerrar sesión, recuperación con la misma cuenta, actualización y bloqueo de repetir la confirmación. El agente no observó el teléfono ni verificó otra cuenta o sesión caducada. [Evidencia textual](evidencias/confirmacion-recepcion/aceptacion-sesion-expo-go.json).

El checklist permanece **7/9**. Para completar **Probar la funcionalidad (8)** queda el vacío; el usuario eligió «Preparemos un caso vacío aislado». Esta aceptación se conserva en un commit documental separado de la preparación. No se modifican pedidos, Trello o servicios y no se publica PR. **Revisar el código (9)** sigue pendiente de Zenaida.

## Preparación vigente: vacío aislado — 8 de noviembre de 2026

La aceptación de sesión quedó en `7307e28`; el caso vacío temporal se preparó en `46555c9`. La [guía de vacío](PRUEBA-VACIO-RECEPCION.md) explica **Probar recepciones vacías**, actualización, **Ver mis pedidos** hacia el Historial real, regreso y **Salir de la prueba**. Reutiliza MVVM y Repository con una lista ficticia en memoria, solo en desarrollo, sin cambiar pedidos ni credenciales reales. La simulación se descarta al salir o perder foco.

Pasaron **864/864 pruebas móviles**, TypeScript, lint y `git diff --check`, además de revisión técnica sin bloqueadores. La QA web sobre el Metro existente comprobó vacío, actualización, navegación y descarte a 1280 × 720; el navegador estaba sin sesión, por lo que la vuelta mostró la protección real de acceso. No se atribuye observación de las recepciones personales del teléfono. Sin errores de consola; una advertencia web de Animated sobre el fallback de `useNativeDriver`. [Evidencia](evidencias/confirmacion-recepcion/prueba-vacio-controlada.json) y [captura](evidencias/confirmacion-recepcion/prueba-vacio-web.png).

Falta el reporte nativo del usuario. El checklist permanece **7/9**; Probar la funcionalidad (8) espera esta comprobación y Revisar el código (9) espera a Zenaida. Tras la aceptación se retirarán el helper y su acceso en otro commit antes del PR. Se conservan la guía, las evidencias, las ramas y los commits. No se iniciaron ni detuvieron servicios, no se modificó Trello ni se publicó la rama.
