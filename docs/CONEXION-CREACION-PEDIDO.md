# Conexión de Creación de pedido

El [PR #14](https://github.com/David567rs/INHALEX-Movil/pull/14), **Implementar Creación de pedido con MVVM y Repository**, está **cerrado y fusionado hacia `develop` por ZenaidaGR**, tras su revisión real. La aprobación corresponde a `50196363f46ac4028809506f7e4cf552009cd2c4` a las **2026-10-20T02:08:35Z**; el merge ocurrió a las **02:08:44Z** en `77b9ab5aa8ca4171669ddda8b42adee028cefc59`. Backend CI **39357046873** y Mobile CI **39357046851** terminaron correctamente sobre ese mismo HEAD. La [evidencia de integración](evidencias/creacion-pedido/integracion-pr14.json) y la [revisión de ZenaidaGR](https://github.com/David567rs/INHALEX-Movil/pull/14#pullrequestreview-5579968969) completan **11/11**, incluido **Revisar el código** (11). No añaden pruebas nativas nuevas. El usuario ya reportó actualizar Trello tras la guía de marcar11 y mover la tarjeta a **Terminado**; el agente no leyó ni modificó el tablero.

La implementación al abrir el PR fue `93940dd5b597929ae5be978546907a10be943994`, con base `1808ba1`. Backend CI (`39356903357`) y Mobile CI (`39356903516`) estaban en progreso sobre ese HEAD: ese es el snapshot histórico de apertura, conservado en el [recibo de publicación](evidencias/creacion-pedido/preparacion-pr14.json). La CI final aprobada corresponde al HEAD `50196363`, verificado antes del merge y registrado arriba.

La solicitud de apertura fue: «Amigo, ya marqué «Probar la funcionalidad». Abre el PR de Creación de pedido desde feature/creacion-pedido hacia develop para que Zenaida lo revise.». Después de la revisión, merge y guía de cierre, el usuario confirmó: «Amigo, ya actualicé Trello. Actualicemos INHALEX-Movil e INHALEX-Movil-Zenaida con develop antes de empezar la siguiente actividad.». Se registra ese mensaje como reporte contextual del marcado11/cierre/Terminado, sin observación del tablero ni confirmación independiente de otros marcados por el agente.

Ambas copias ya están en **`develop`**, commit **`77b9ab5aa8ca4171669ddda8b42adee028cefc59`**. La copia de David conservó sus documentos locales de cierre al cambiar de rama y la de Zenaida está limpia; no se modificó su stash. El recibo local `inhalex-sincronizacion-pr14.json` y la evidencia de integración registran la sincronización. Ambas quedan listas para que el usuario elija la siguiente actividad; **no se inició ninguna nueva** ni se publica otro commit por este paso.

La [guía de diseño](DISENO-CREACION-PEDIDO.md) y su [verificación](evidencias/creacion-pedido/verificacion-diseno.json) son snapshots históricos de la vista previa sintética. La [verificación de API](evidencias/creacion-pedido/verificacion-api.json) y la QA temporal también se conservan con su alcance propio. El cierre vigente y los resultados posteriores a retirar QA se registran por separado en [cierre-pruebas-y-retiro-qa.json](evidencias/creacion-pedido/cierre-pruebas-y-retiro-qa.json), sin sustituir los reportes nativos del usuario.

## Contrato y composición

La vista y su ViewModel utilizan el controlador de Creación de pedido. El controlador consume `OrderCreationActions`, compuesto con `ApiOrderCreationRepository` en `bootstrap`. Las vistas no realizan peticiones HTTP ni reciben JWT, claves idempotentes o registros privados de recuperación. El dominio define entradas, cotización, incidencias, recibo, errores y contratos sin dependencias de React Native, Expo o del transporte.

Se reutilizan sesión, Bolsa, Direcciones y Perfil integrados. La lectura autenticada reúne GET `/cart`, GET `/addresses` y GET `/auth/me`; la ruta `/creacion-pedido` requiere la sesión restaurada antes de mostrar datos personales. La selección de dirección pertenece al pedido en preparación: **no ejecuta PATCH de dirección ni cambia la principal**. Nombre, correo, teléfono y notas de contacto son editables en el formulario del pedido y no modifican Perfil.

| Operación | Entrada y resultado |
| --- | --- |
| POST `/orders/draft/preview` | `{items:[{productId,quantity}]}`; cotización con productos normalizados, disponibilidad, precios, incidencias, subtotal, unidades y firma. No crea pedido. |
| POST `/orders/confirm` | Bearer de la sesión y cabecera `Idempotency-Key`; productos, contacto, dirección guardada y `previewSignature`. Devuelve recibo y cotización confirmada. |
| GET `/cart` | Reconsulta de la Bolsa para comprobar su estado antes de una limpieza posterior al recibo. |
| DELETE `/cart` | Limpieza condicionada después de confirmar y guardar el recibo; respuesta validada como Bolsa vacía. |

No se llama a POST `/orders/draft`, que sí crearía un borrador. La confirmación del backend existente crea el pedido **en revisión** y puede reservar inventario; no representa un pago, una venta completada ni una promesa de entrega. El servidor no se modifica para esta actividad y el agente no crea pedidos contra la API real durante su verificación.

## Entradas, resumen e incidencias

- Entre uno y veinte productos distintos, con identificadores MongoDB válidos y cantidades enteras de uno a veinticinco. No se envían precios calculados por la vista.
- Contacto: nombre de 2–120 caracteres, correo válido de 5–120, teléfono de 10–15 dígitos y notas opcionales de hasta 600 caracteres. Se recortan extremos; el correo se normaliza a minúsculas. Los errores de campos se presentan junto al formulario.
- La dirección guardada debe pertenecer a la cuenta. Aunque el DTO histórico permite omitirla, este recorrido móvil requiere elegir una dirección registrada antes de confirmar.
- La firma corresponde a la cotización recibida. El servidor vuelve a evaluar productos, promociones vigentes e inventario; puede ajustar cantidades, retirar productos o informar disponibilidad bajo pedido y revisión manual.
- La pantalla muestra cantidades, precios e incidencias de esa cotización. No toma el subtotal anterior de Bolsa como una confirmación del importe: el servicio de pedidos evalúa el vencimiento de promociones y puede diferir del servicio de Bolsa existente.
- El resumen rotula **Subtotal de productos** y **Envío: Por definir**. El contrato actual no proporciona costo de envío, impuestos, método de pago o un gran total cobrado; la interfaz no los inventa.

Antes de la primera confirmación se reconsultan contexto, Bolsa y dirección para detectar cambios. Si cambiaron, se actualiza el resumen y se pide revisarlo. Una respuesta de conflicto por firma o una solicitud rechazada requiere una nueva revisión del resumen, en lugar de reenvío automático. Los errores se transforman en mensajes seguros; no se muestran cuerpos de error, credenciales ni detalles internos.

## Prevención de duplicados y recuperación

Cada intento usa una clave UUID impredecible creada en la composición. Se guarda una entrada privada por cuenta **antes del primer POST**: cuenta, clave, entrada normalizada y fase pendiente. Un fallo de almacenamiento bloquea el envío. Un error de red, timeout o respuesta incierta conserva exactamente la misma entrada y clave para un **reintento explícito**; el formulario queda bloqueado para impedir que ese intento se transforme en otro pedido. Reabrir o cambiar la sesión no provoca un POST automático.

En Android/iOS, `SecureOrderAttemptStore` utiliza Expo SecureStore con `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, servicio `inhalex.order.attempt` y clave `inhalex.order.attempt.<accountId>`. El registro contiene solo la entrada necesaria y un recibo mínimo; **no contiene JWT**. La validación reconstruye una whitelist, congela snapshots, comprueba la cuenta y serializa lecturas, escrituras y eliminación por cuenta. Un registro corrupto, de otra cuenta o un error nativo bloquea la continuación con un error de almacenamiento; no se borra automáticamente ni se rota la clave. El tamaño permitido depende de la plataforma: una escritura rechazada debe resolverse antes de enviar. Se usan las [API de SecureStore de SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/securestore/).

En web se utiliza exclusivamente `MemoryOrderAttemptStore`, sin `localStorage` ni `sessionStorage`, coherente con la sesión web en memoria. Una recarga completa pierde ese registro y no acredita recuperación duradera. La persistencia nativa y sus fallos requieren la prueba específica en dispositivo; los tests con puertos simulados no la sustituyen.

Cuando llega una confirmación válida, se muestra su recibo y se guarda la fase confirmada antes de permitir cualquier limpieza. Si falla esa escritura, se conserva el recibo visible, la Bolsa no se borra y el reintento utiliza la misma clave para recuperar y guardar el resultado. Si el recibo confirmado ya está persistido, la recuperación no vuelve a crear el pedido: solo ofrece comprobar o actualizar la Bolsa. Fallar su limpieza mantiene el recibo y permite reintentar únicamente esa actualización.

El backend existente busca una clave idempotente global antes de resolver la identidad de la solicitud. La copia móvil usa claves UUID impredecibles y recuperación separada por cuenta, sin exponerlas en el estado público. Esto no convierte el endpoint en una garantía nueva de autorización por cuenta; cambiar ese comportamiento del servidor queda fuera de esta actividad.

## Bolsa y límites de concurrencia

El controlador de Bolsa concede una lease de checkout: impide que otras operaciones locales modifiquen la colección mientras se confirma o reconcilia. Las respuestas de una pantalla cerrada o una sesión anterior no publican datos ni liberan la lease de una operación nueva. Salir o cambiar de cuenta limpia el estado público, descarta respuestas tardías y permite recuperar únicamente el intento de la cuenta correspondiente al volver a entrar.

Tras guardar el recibo, se consulta la Bolsa. Solo se elimina si los productos y cantidades actuales coinciden con la entrada original **y** los productos normalizados del resultado confirmado también coinciden con esa entrada. Si el servidor ajustó cantidades, omitió productos o se detecta una Bolsa distinta, se conserva la colección y se explica en el recibo. Una Bolsa ya vacía se considera reconciliada. El recibo confirmado se conserva si falla la actualización.

**Límite del backend actual:** GET `/cart` seguido de DELETE `/cart` no es una operación atómica frente a cambios desde otro dispositivo. La lease bloquea operaciones locales y la comparación conserva cambios detectados antes de la lectura, pero no garantiza protección ante una escritura remota entre esa lectura y el borrado. No se afirma protección de concurrencia entre dispositivos; resolverla exigiría un contrato condicional o transaccional del servidor.

## Primera prueba en Expo Go

Usar el QR de David en Metro **8082**, recargar la aplicación y mantener activos el backend y los Metro existentes. Realizar esta prueba solo con una cuenta de prueba, una dirección ficticia válida y un producto de prueba en Bolsa.

1. Iniciar sesión y abrir Bolsa. Anotar el producto, cantidad y subtotal; pulsar **Continuar con mi pedido**.
2. Revisar los productos y cantidades del resumen recibido, el subtotal de productos y envío por definir. Elegir una dirección guardada sin cambiar la principal; revisar o corregir contacto y notas.
3. Pulsar **Confirmar pedido**. Comprobar el estado de carga y bloqueo; un segundo toque rápido durante el envío no debe generar otro intento.
4. Esperar el recibo con referencia del pedido y estado **En revisión**. Conservar la pantalla hasta que termine la actualización de Bolsa.
5. Volver a Bolsa: debe estar vacía si productos y cantidades coincidían. Si el resumen ajustó la selección o la colección cambió, comprobar el aviso y que se conserve la Bolsa correspondiente.

Este recorrido es la guía histórica previa a los reportes posteriores. Validaciones, vacío/sin dirección, error y reintento, recuperación simulada y sesión ya fueron reportados con su alcance correspondiente. El PR14 posterior quedó revisado y fusionado por ZenaidaGR, y ambas copias se actualizaron con ese `develop`. No se inició Historial, Seguimiento o Avisos.

## Trello y evidencia

La verificación técnica final pasó **558/558 pruebas**, TypeScript, lint, Doctor **21/21** y exportaciones Android/web. La QA web empleó la interfaz, controladores y Repository reales con sesión y transporte simulados: comprobó recibo, validación, vacío, falta de dirección, conflicto, respuesta incierta y limpieza pendiente. La ruta temporal se retiró. Consulta `evidencias/creacion-pedido/verificacion-api.json` para el alcance exacto y las capturas; estos resultados no completan criterios de Expo Go.

El recorrido positivo completó criterios1,2,3,4,5,7,9; error/reintento añadió8; doble toque añadió **Evitar la creación duplicada del pedido** (6), con ese alcance y sin afirmar conteo en MongoDB. Los reportes posteriores de sesión y recuperación simulada, junto con retirada QA y comprobaciones finales, completaron **Probar la funcionalidad** (10). La revisión real de ZenaidaGR sobre el [PR #14, ya fusionado](https://github.com/David567rs/INHALEX-Movil/pull/14) completa **Revisar el código** (11): **11/11**. El usuario reportó actualizar Trello tras la guía final de marcar11 y mover a Terminado. El agente no accedió al tablero. La actualización solicitada de ambas copias a `develop77b9ab5` ya se realizó, conservando los documentos locales de cierre; la siguiente actividad espera la elección del usuario.

## Validaciones de contacto aceptadas en Expo Go

El usuario confirmó: «Amigo, rechazó los campos vacíos, el nombre de una letra, el correo inválido y el teléfono de nueve dígitos. Corregí los datos y la bolsa conservó el producto. ¿Qué sigue?». La aceptación registra exactamente esos casos como evidencia parcial de **Probar la funcionalidad** (10), sin agregar criterios: continúa **7/11**. No acredita límites superiores, todos los formatos posibles, duplicados, errores de red o recuperación. No se observó el teléfono ni se comprobó tráfico o MongoDB.

## Bolsa vacía aceptada en Expo Go

El usuario confirmó exactamente: «Amigo, apareció «Tu pedido empieza en la bolsa», se mantuvo al actualizar y «Explorar catálogo» abrió Catálogo. ¿Qué sigue?». Se registra el mensaje, permanencia del vacío al actualizar y navegación a Catálogo como evidencia parcial del criterio 10. Continúa **7/11**; no se añade una aceptación de duplicados, errores o prueba completa. El agente no observó el dispositivo ni consultó la API real o Trello.

## Falta de dirección aceptada en Expo Go

El usuario confirmó: «Amigo, sin dirección apareció «Un destino para tu selección» y Confirmar quedó bloqueado. Agregar dirección abrió Direcciones y, al volver sin crear una, siguió bloqueado. ¿Qué sigue?». Se registra el estado sin dirección, bloqueo de Confirmar y recorrido a Direcciones/regreso como evidencia parcial del criterio 10. Continúa **7/11**, sin aceptar criterios nuevos. El agente no observó el teléfono ni consultó la API real o Trello.

## Error de conexión antes del envío y reintento aceptados

1. Desde Cuenta, volver a la cuenta de prueba que tiene dirección. Con el backend activo, agregar un producto y abrir **Continuar con mi pedido**. Seleccionar dirección y contacto válidos; escribir la nota **Prueba de reconexión**.
2. Mantener esta pantalla, Expo Go y ambos Metro abiertos. En la terminal del backend local3200, pulsar **Ctrl+C** para detener solo la API.
3. Pulsar **Confirmar pedido** una vez y esperar el aviso: falla la reconsulta previa al envío. Debe conservar productos, cantidades, dirección, contacto y nota; no debe aparecer referencia ni éxito. Confirmar queda bloqueado hasta actualizar.
4. Pulsar **Reintentar** con la API apagada: debe volver a fallar conservando esos datos.
5. Reiniciar el backend con su comando habitual (desde la raíz de INHALEX-Movil: `npm --prefix Server run start:dev`). Pulsar **Reintentar**: debe recuperar el resumen, conservar la nota y habilitar Confirmar sin enviar un pedido automáticamente. La prueba termina ahí, con el pedido preparado y sin otra confirmación válida.

El usuario confirmó exactamente: «Amigo, fallaron Confirmar y Reintentar sin perder los datos ni la nota. Reinicié el backend y Reintentar recuperó el resumen y habilitó Confirmar, sin mostrar una referencia nueva. ¿Qué marco en Trello y qué sigue?». Completa **Manejar errores durante la creación** (8): **8/11**, aceptados 1,2,3,4,5,7,8,9 y pendientes 6,10,11. El alcance es fallo **antes** del POST; no sustituye respuesta incierta posterior al envío, limpieza pendiente o duplicados. El agente no observó el dispositivo ni consultó API o MongoDB para verificarlo; Trello sigue sin marcado confirmado.

## Doble toque de Confirmar aceptado en Expo Go

El usuario confirmó exactamente: «Amigo, hice dos toques rápidos en Confirmar: se bloqueó el botón, apareció el recibo En revisión y la bolsa quedó vacía. ¿Qué marco en Trello y qué sigue?». Completa el criterio6 con alcance de bloqueo nativo ante doble toque, junto a las comprobaciones técnicas anteriores: **9/11**. El agente no observó el teléfono ni consultó MongoDB; no se proporcionó referencia exacta y no se afirma unicidad en base de datos a partir de un recibo visible. No acredita recuperación de respuesta perdida o limpieza pendiente.

## Reapertura y salida/reingreso tras el pedido terminado aceptados

El usuario confirmó exactamente: «Amigo, al reabrir la bolsa siguió vacía y no apareció otro recibo. Al cerrar sesión pidió ingresar y, al volver con la misma cuenta, continuó vacía. ¿Qué sigue?». Se registra la conservación del vacío y ausencia de otro recibo al reabrir, el requerimiento de ingreso al salir y el vacío tras reingresar con la misma cuenta. Añade evidencia parcial a **Probar la funcionalidad** (10), sin nuevos criterios: continúa **9/11**. El agente no observó el dispositivo, no verificó pedidos o MongoDB y no accedió a Trello.

## Recuperación temporal: evidencia histórica, montaje retirado

La pantalla **Prueba de recuperación** y sus accesos ya se retiraron después de los dos reportes del usuario. La antigua ruta `/qa-recuperacion-pedido` y el enlace **Prueba de recuperación · simulada** no forman parte de la aplicación actual. Este apartado conserva resultados y límites de la prueba histórica; no contiene instrucciones vigentes para volver a entrar ni se requiere repetir los recorridos.

El montaje empleó la View, ViewModel, controlador y Repository reales con una sesión ficticia y transporte simulado, sin credencial real ni fallback hacia la API real. Dentro de QA se desactivó la navegación a módulos reales. El store nativo de prueba utilizó claves `inhalex.qa.order.attempt.<accountId>` y servicio `inhalex.order.qa`, separados de los intentos productivos; web usó solo memoria. El agente no observó el teléfono ni instrumentó SecureStore nativo.

### Reportes del usuario

**Respuesta perdida:** «Amigo, en la prueba simulada recuperé la confirmación después de Reabrir prueba. Apareció el recibo y quedaron 1 pedido, 2 confirmaciones y 0 unidades. Sigamos con la prueba de limpieza pendiente.». Confirmó recibo recuperado tras recrear controladores y contadores **1 pedido / 2 confirmaciones / 0 unidades**.

**Limpieza pendiente:** «Amigo, se conservó el recibo al fallar la limpieza. Tras Reabrir prueba y reintentar quedaron 1 pedido, 1 confirmación y 0 unidades. Ya salí de la prueba. ¿Qué sigue?». Confirmó recibo conservado, recuperación de Bolsa sin otro envío de confirmación, contadores **1 pedido / 1 confirmación / 0 unidades** y salida de la prueba. Esta es la novena confirmación del recorrido funcional; su alcance original fue evidencia parcial del10, completado después de retirar QA y verificar.

Los contadores pertenecen al backend sintético, no a pedidos reales consultados en MongoDB. **Reabrir prueba** recreó controladores sobre el mismo runtime, backend simulado y store; no demostró que el servidor ficticio sobreviviera a cerrar por completo Expo Go o reiniciar el proceso. Una recarga completa web también habría perdido sus registros en memoria.

### Verificación web histórica

El agente principal comprobó ambos recorridos en **397×1000** y **320×820**, sin desbordamiento horizontal ni errores de consola. Respuesta perdida terminó en **1/2/0**, y limpieza pendiente en **1/1/0**, con controladores recreados sobre el mismo entorno simulado. Las capturas son [respuesta perdida, web](evidencias/creacion-pedido/qa-recuperacion-respuesta-web.png) y [limpieza pendiente, web](evidencias/creacion-pedido/qa-recuperacion-limpieza-web.png); el recibo técnico histórico es [qa-recuperacion-verificacion.json](evidencias/creacion-pedido/qa-recuperacion-verificacion.json). Esa QA web no acredita dispositivo ni inspección física de SecureStore; los reportes del usuario están registrados por separado.

### Retirada y verificación final

Se restauró `OrderCreationScreen.tsx` desde su respaldo, con SHA256 **C1C7E97E1580E4896942E377597EAD41949F4E1CEEC0A2EE5942BF45AA776037**. Se eliminaron exactamente cinco archivos temporales: la ruta `qa-recuperacion-pedido.tsx` y los cuatro archivos de `testing/` denominados `OrderRecoveryQaScreen.tsx`, `createOrderRecoveryQaRuntime.ts`, `createOrderRecoveryQaStore.ts` y `createOrderRecoveryQaStore.web.ts`. La búsqueda final no encontró referencias de esta QA en `Mobile/src` ni en `Mobile/tests`; se conservaron sus evidencias históricas en documentación.

Tras la retirada pasaron **TypeScript**, **lint**, **558/558 pruebas**, **Expo Doctor 1.21.5: 21/21** y exportaciones **Android y web**. El [recibo de cierre](evidencias/creacion-pedido/cierre-pruebas-y-retiro-qa.json) registra la retirada y esas comprobaciones finales. No se atribuyen al agente pruebas físicas adicionales ni creación de pedidos contra la API real.

Creación de pedido queda completa e integrada: **11/11**, con revisión real de ZenaidaGR y ambas CI correctas sobre `50196363`, seguida del merge del [PR #14](https://github.com/David567rs/INHALEX-Movil/pull/14) hacia `develop` en `77b9ab5`. La nueva evidencia de revisión completa únicamente el criterio11; no añade otra prueba nativa ni modifica los snapshots técnicos históricos. El usuario reportó cierre/Terminado de Trello en respuesta a la guía, sin acceso del agente al tablero. Ambas copias ya se actualizaron a `develop77b9ab5`, con documentos de cierre conservados en David y Zenaida limpia. No se inició la actividad siguiente; el usuario la elegirá después de este cierre.
