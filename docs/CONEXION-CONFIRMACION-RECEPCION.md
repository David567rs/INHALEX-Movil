# Confirmación de recepción: conexión a la API

8 de noviembre de 2026. Implementación de David en `INHALEX-Movil`, rama `feature/confirmacion-recepcion`, desde `develop` `0f619021b4de5d5436b0f43c122d9cba6b306da3`. El usuario aceptó el diseño en Expo Go y autorizó esta etapa. Se mantiene el diseño aprobado y el historial de commits. El primer caso correcto de la API, la elegibilidad visible, el doble toque y el error de lectura con recuperación ya fueron aceptados por reporte del usuario. El checklist permanece en 6/9; Manejar errores espera también el fallo al confirmar y la verificación posterior.

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

- [x] Mostrar opción de confirmar recepción
- [x] Validar que el pedido pueda ser confirmado
- [x] Enviar confirmación a la API
- [x] Evitar confirmaciones duplicadas
- [x] Actualizar el estado del pedido
- [x] Mostrar mensaje de confirmación
- [ ] Manejar errores
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

Los casos pendientes se guían por separado: fallo al confirmar/verificación mediante la prueba controlada elegida, vacío y reapertura/cierre de sesión según disponibilidad. No se marcan como aceptados anticipadamente. El PR y la revisión de Zenaida corresponden a una etapa posterior.

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

## Siguiente prueba: fallo controlado al confirmar y verificación

La alternativa controlada fue elegida por el usuario porque no dispone de otro pedido completado pendiente de recepción, de prueba o realmente recibido. Su preparación y aceptación quedan pendientes de sus propias evidencias. Debe usar datos ficticios aislados, sin modificar pedidos reales ni revertir una recepción ya confirmada. El usuario conserva el control de Expo y del backend compartido; esta aceptación no inicia ni detiene servicios.

El recorrido previsto, una vez preparado el caso y documentado su acceso, es:

1. Abrir el pedido ficticio pendiente, pulsar **Confirmar recepción** y después **Sí, recibí mi pedido** con el fallo controlado de escritura activo.
2. Comprobar que aparece un aviso, se conservan la referencia y el resumen, no se anuncia una confirmación nueva y se ofrece **Verificar recepción**. Debe permanecer bloqueada una nueva confirmación hasta consultar correctamente.
3. Probar **Verificar recepción** con el fallo controlado de lectura activo: el aviso y el pedido deben conservarse al terminar el intento.
4. Restablecer la consulta en el caso controlado y pulsar **Verificar recepción**. Si el caso simula que la escritura no se guardó, debe conservar la recepción pendiente y habilitar **Confirmar recepción**, sin enviarla automáticamente.
5. Confirmar de forma explícita y comprobar **Recepción confirmada** y ausencia de opción de repetir. El resultado debe registrarse como comportamiento de un caso ficticio controlado, sin atribuirlo a una escritura real del backend.

La guía no acredita resultados anticipados. La respuesta perdida después de guardar es un escenario distinto y no queda demostrada por este recorrido de fallo antes de guardar. **Manejar errores (7)** permanece pendiente hasta evaluar el reporte de esta prueba junto con la lectura real ya aceptada. **Probar la funcionalidad (8)** y **Revisar el código (9)** también siguen pendientes.
