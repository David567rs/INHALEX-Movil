# Conexión de Historial de pedidos

Historial de pedidos quedó integrado en `develop` mediante el PR #15, aprobado y fusionado por ZenaidaGR. El usuario confirmó actualizar Trello y solicitó sincronizar ambas copias. **INHALEX-Movil** e **INHALEX-Movil-Zenaida** están ahora en **develop930d2023ecb801ce985acaad8dfad03657a998ae**, iguales a `origin/develop`, conservando los seis documentos locales de cierre en David y Zenaida limpia.

El [PR #15, Implementar Historial de pedidos con MVVM y Repository](https://github.com/David567rs/INHALEX-Movil/pull/15) está **cerrado y fusionado** hacia `develop` por **ZenaidaGR**. Su [aprobación real](https://github.com/David567rs/INHALEX-Movil/pull/15#pullrequestreview-5583096544) corresponde al HEAD **6a460b5e3b4df2aa0a8cce2ade1809ef8701d540**, a las **2026-10-20T09:16:08Z**; el merge ocurrió a las **09:16:16Z**, en **930d2023ecb801ce985acaad8dfad03657a998ae**. [Backend CI](https://github.com/David567rs/INHALEX-Movil/actions/runs/39399080059) y [Mobile CI](https://github.com/David567rs/INHALEX-Movil/actions/runs/39399080064) pasaron sobre el mismo HEAD aprobado. Historial completa **9/9**, incluido **Revisar el código**. La [evidencia de integración](evidencias/historial-pedidos/integracion-pr15.json) y la [aceptación](evidencias/historial-pedidos/expo-go-aceptacion.json) registran el cierre y la sincronización; el [recibo de apertura](evidencias/historial-pedidos/preparacion-pr.json) queda histórico. El usuario informó «Amigo, ya actualicé Trello» en respuesta a la guía final de marcar9 y mover a Terminado. El agente no observó el teléfono ni leyó o modificó el tablero.

## Contrato existente de la API

Las rutas de historial están bajo el prefijo `/api`, requieren JWT Bearer y responden `Cache-Control: private, no-store`:

| Operación | Ruta | Respuesta |
| --- | --- | --- |
| Primera página propia | GET `/orders/me` | `orders` y `nextCursor`, hasta 20 pedidos. |
| Página siguiente propia | GET `/orders/me?cursor=...` | Página siguiente con el cursor recibido, sin inventar un número de página o parámetro de tamaño. |
| Resumen de un pedido propio | GET `/orders/me/:id` | Datos del pedido seleccionado, productos y dirección de envío disponible. |

El servidor identifica al propietario mediante `customerUserId` igual a `JWT.sub`; no usa un ID elegido por la vista ni recurre a coincidencias de correo. Solo incluye `pending_review`, `confirmed`, `cancelled` y `completed`: **En revisión**, **Confirmado**, **Cancelado** y **Completado**. La lista contiene `id`, `reference`, `status`, `currency`, `totalItems`, `subtotal` y `createdAt`. Se ordena por `createdAt` descendente, con `_id` descendente como desempate. `nextCursor` nulo indica el final.

El resumen conserva las cantidades, precios y subtotales del pedido, aunque el catálogo actual haya cambiado, y puede incluir su dirección. El importe visible se identifica como **Subtotal de productos**, sin deducir un envío cobrado, pago o total final no presente en el contrato. Un ID inválido o ajeno responde 404; un cursor inválido responde 400. Ninguna ruta permite consultar pedidos ajenos por proporcionar su ID. Contrato revisado en `Server/src/modules/orders/orders.controller.ts` y `customer-order-history.service.ts`, sin cambios del servidor.

## MVVM y comportamiento de la conexión

La composición mantiene `OrderHistoryScreen` → `useOrderHistoryViewModel` / `createOrderHistoryController` → `OrderHistoryActions`, construidas por `createOrderHistoryActions` → `OrderHistoryRepository` → `ApiOrderHistoryRepository` → `HttpClient`, con dependencias inyectadas desde bootstrap. `OrderHistoryState` distingue `checking`, `anonymous`, `recovery-error`, `loading`, `ready`, `error` y `session-expired`; antes del primer GET, `orders` es `null`, distinto del vacío confirmado `[]`. El token permanece privado y fuera de la vista y del estado público. Los resultados propios de la conexión están registrados en la verificación actual.

Cuenta abre **Historial de pedidos** en `/historial-pedidos` para consultar los datos de la cuenta activa. La pantalla incorpora carga inicial, **Actualizar historial** para obtener la primera página y **Cargar más pedidos** con el cursor de páginas de hasta 20 elementos. **Todos / En curso / Completados** filtran solo los pedidos ya cargados, sin representar la colección completa mientras existan páginas pendientes. Seleccionar una fila consulta y despliega el resumen del pedido; esta selección no lo modifica ni abre un seguimiento de envío. La consulta no añade POST, PATCH o DELETE, repetición de compra o persistencia del historial en el dispositivo.

`refresh` cancela la carga de más elementos y un GET de detalle anterior; si falla, conserva la lista y el resumen confirmados. Si tiene éxito y el pedido seleccionado todavía aparece, vuelve a consultar su detalle para no presentar un resumen anterior junto a un estado actualizado. `loadMore` utiliza el cursor opaco, elimina IDs repetidos y mantiene orden descendente por fecha e ID; ante un fallo conserva la lista y el cursor para reintentar, y bloquea los cursores repetidos. `selectOrder` cancela la consulta de la selección anterior; `retryDetail` vuelve a consultar únicamente el resumen seleccionado.

Cambiar o cerrar la sesión invalida las solicitudes anteriores y oculta los datos personales inmediatamente, incluso si un nuevo inicio corresponde al mismo ID de usuario. El ciclo `start`/`stop` cancela trabajo y descarta respuestas tardías. Un 401 en cualquier lectura oculta los datos del módulo y presenta el estado de sesión vencida sin alterar la sesión global. Estas protecciones tienen cobertura técnica; el usuario confirmó además reapertura, ocultación al cerrar sesión y recuperación al ingresar con la misma cuenta. Su reporte no se amplía a escenarios adicionales de respuestas tardías o cambio de identidad que no describió.

## Criterios: 9/9

- [x] Crear pantalla de historial
- [x] Obtener pedidos desde la API
- [x] Mostrar fecha, total y estado
- [x] Ordenar los pedidos de forma clara
- [x] Permitir seleccionar un pedido
- [x] Mostrar mensaje si no existen pedidos
- [x] Manejar errores de conexión
- [x] Probar la funcionalidad
- [x] Revisar el código

La revisión real completa el criterio9 e Historial **9/9**. El usuario reportó actualizar Trello tras la guía de marcar **Revisar el código**, adjuntar el PR, añadir comentario y mover a **Terminado**; la fuente es su mensaje y el agente no ejecutó o verificó acciones en el tablero. «Total» corresponde al **Subtotal de productos** del contrato, sin envío o pagos inferidos. La aprobación formal de ZenaidaGR no añade otra prueba física.

## Primera prueba real en Expo Go: recorrido positivo aceptado

El usuario confirmó consulta, presentación, resumen y actualización. Los pasos siguientes conservan la guía del recorrido; no acreditan por sí solos orden, paginación o las cinco pestañas en su teléfono. Reutilizar el QR de Metro de David (**8082**) y la API habitual (**3200**), conservando su configuración y el Metro de Zenaida. Si Metro de David no estuviera activo, desde `C:\Users\David\Documents\INHALEX-Movil`:

```sh
npm --prefix Mobile run start -- --port 8082
```

1. Iniciar sesión con la cuenta de prueba que ya creó un pedido en la actividad anterior y abrir **Cuenta → Historial de pedidos**.
2. Comprobar que aparece su referencia real, fecha, subtotal de productos, unidades y estado; no deben aparecer referencias `EJEMPLO-...` ni rótulos de vista previa.
3. Seleccionar el pedido y revisar los productos, cantidades e importes del resumen. Compararlos con el pedido realizado; no hace falta crear otro para esta prueba de lectura.
4. Pulsar **Actualizar historial** y comprobar que conserva los datos confirmados sin duplicar el pedido. Si hay varios, revisar que los más recientes aparecen primero. La paginación solo puede probarse si la cuenta dispone de otra página real.
5. Regresar a Cuenta y comprobar que las cinco pestañas y la sesión siguen disponibles. Reportar los resultados antes de marcar criterios adicionales.

### Historial vacío: aceptado por reporte del usuario

El usuario confirmó literalmente: «Amigo, apareció «Aún no tienes pedidos», se mantuvo al actualizar y «Explorar catálogo» abrió Catálogo.». Acepta el criterio 6 y el acceso a Catálogo desde el vacío. No acredita por sí solo ausencia de datos de otra cuenta, orden, errores o el recorrido completo. La guía que siguió se conserva abajo.

1. Cerrar la sesión actual desde Cuenta y entrar con **otra cuenta de prueba que no tenga pedidos**. Si no existe, registrarla desde **Crear cuenta** e iniciar sesión; el registro no inicia sesión automáticamente.
2. Abrir **Cuenta → Historial de pedidos** y comprobar **Aún no tienes pedidos** y **Cuando hagas tu primer pedido, su historia comenzará aquí.**. No deben aparecer los pedidos de la cuenta anterior.
3. Pulsar **Actualizar historial**. Tras la carga, debe mantenerse el vacío sin aviso de error.
4. Pulsar **Explorar catálogo** y comprobar que abre Catálogo. Después puede regresar a la cuenta original.

Se conserva la guía sin eliminar pedidos ni modificar la base de datos o el backend para producir el vacío. El criterio 6 está aceptado; aquel reporte de vacío no acreditaba por sí solo el recorrido de sesión, aceptado posteriormente en la sección final.

### Error y reintento: aceptados por reporte del usuario

El usuario confirmó literalmente: «Amigo, apareció el aviso y se conservaron los pedidos y el resumen. Al reiniciar el backend y pulsar Reintentar, desapareció el aviso y se recuperaron los datos.». Acepta el criterio 7: aviso, conservación de lista/resumen y recuperación tras reiniciar la API. No se infiere que haya probado el segundo reintento con la API todavía detenida. Los pasos guiados se conservan abajo.

1. Volver a la cuenta original con pedidos, abrir **Cuenta → Historial de pedidos** y desplegar un resumen. Esperar a que la lista y el detalle terminen de cargar.
2. En la terminal del **backend local de INHALEX**, detener solo ese proceso con `Ctrl+C`. Mantener abiertos Expo Go y los Metro de David **8082** y Zenaida **8083**. Conservar la pantalla de Historial abierta; no recargar toda la aplicación ni cerrar sesión durante la interrupción.
3. En Expo Go pulsar **Actualizar historial** y esperar el aviso de conexión. La lista, importes y resumen previamente cargados deben conservarse.
4. Con el backend todavía detenido, pulsar **Reintentar** en el aviso principal: debe volver a avisar y conservar los datos, sin representar un vacío confirmado.
5. Reiniciar el backend en su misma terminal. Desde `C:\Users\David\Documents\INHALEX-Movil`, ejecutar:

```sh
npm run dev:server
```

6. Esperar a que Nest termine de iniciar. Pulsar **Reintentar** en el aviso principal de Historial. Deben desaparecer el aviso y el estado de carga, conservarse los pedidos y recuperarse el resumen seleccionado.

El recorrido de error y recuperación está aceptado por el mensaje anterior. El agente no detiene o reinicia servicios ni crea, modifica o elimina pedidos en este turno.

### Orden, filtros y recorrido de sesión: aceptados por el usuario

El reporte final fue exactamente: «Amigo, el orden y los filtros funcionan. Los pedidos volvieron al reabrir, se ocultaron al cerrar sesión y regresaron al ingresar con la misma cuenta.». Acepta **Ordenar los pedidos de forma clara** (4) y completa **Probar la funcionalidad** (8), junto al recorrido positivo, vacío y recuperación ya aceptados. La fuente es el chat, sin observación directa del dispositivo. Los pasos guiados se conservan a continuación.

1. En la cuenta con pedidos, abrir **Historial → Todos**. Comprobar que las fechas más recientes aparecen antes que las antiguas. Si todos tienen la misma fecha, reportarlo; no crear ni cambiar pedidos para forzar otra fecha.
2. Comprobar **En curso** (solo **En revisión** y **Confirmado**) y **Completados** (solo **Completado**), y volver a **Todos**. Cuando un filtro no tenga coincidencias, debe mostrar **No hay pedidos en este filtro**. Los filtros solo representan las páginas cargadas; si aparece **Cargar más pedidos**, puede comprobarse la continuación sin duplicados. La paginación física no se acredita si la cuenta carece de otra página.
3. Cerrar Expo Go por completo y volver a abrir el proyecto desde el QR habitual, conservando Metro y el backend activos. Abrir **Cuenta → Historial de pedidos**: la sesión debe restaurarse y volver a consultar sus pedidos; el resumen desplegado no necesita permanecer abierto.
4. Cerrar sesión desde Cuenta y volver a abrir Historial. Debe pedir **Iniciar sesión** sin mostrar referencias, importes o dirección del historial anterior.
5. Iniciar sesión con la misma cuenta y abrir Historial. Comprobar que vuelven sus pedidos y que puede desplegar un resumen.

Los criterios 4 y 8 están aceptados por el reporte anterior. No se infieren paginación física de más de 20 pedidos, lectura con texto ampliado, TalkBack o casos de sesión distintos de los reportados.

### Revisión e integración: completadas

GitHub confirma el [PR #15](https://github.com/David567rs/INHALEX-Movil/pull/15) cerrado y fusionado por ZenaidaGR. La aprobación y las dos CI correctas corresponden al HEAD final **6a460b5**; el merge **930d202** tiene como padres **77b9ab5** y **6a460b5**. Se completa **Revisar el código** (9): **9/9**. El [cuerpo preparado del PR](PR-HISTORIAL-PEDIDOS.md) conserva el snapshot de publicación; no representa el estado posterior del cierre.

La apertura se hizo con el commit de implementación **726101a8606ee92ad1a184c28d9649d6129fdf7b**. En ese snapshot estaban en ejecución [Mobile CI 39398704705](https://github.com/David567rs/INHALEX-Movil/actions/runs/39398704705) y [Backend CI 39398704687](https://github.com/David567rs/INHALEX-Movil/actions/runs/39398704687). Esos checks se conservan como historia; los finales aprobados son **39399080064 / 39399080059**, sobre **6a460b5**. El conector devolvió 403 al intentar crear el PR; se completó mediante la credencial configurada de Git, verificando la cuenta David567rs sin exponer credenciales.

El usuario confirmó el cierre de Trello y solicitó actualizar **INHALEX-Movil** e **INHALEX-Movil-Zenaida** con `develop`. Ambas copias quedaron en **930d202**, iguales a `origin/develop`. En David se comprobó ascendencia y árbol idéntico entre6a460b5y930d202, se avanzó `develop` con su valor anterior esperado y se cambió a esa rama, conservando hashes SHA256 de los seis documentos locales. Se guardó respaldo en TEMP. Zenaida avanzó con `merge --ff-only` y quedó limpia. No se usó stash, reset, commit o push nuevo.

Entornos, dependencias, identidades y stash conservaron sus valores; el respaldo de Zenaida `81196109270f00fa7edf03a8a8ec6f8bdc963131` sigue intacto. Backend3200 y Metro8082/8083 conservaron procesos **37472/28288/13476** y respondieron HTTP200, sin reinicio. El recibo de sincronización está en `TEMP/inhalex-sincronizacion-pr15.json` y resumido en la evidencia de integración. La siguiente actividad del plan es **Seguimiento del pedido**, de David, en **feature/seguimiento-pedido**, pero su rama y diseño esperan la solicitud del usuario.

## Verificación y límites

La [verificación de la conexión](evidencias/historial-pedidos/verificacion-api.json) pasó TypeScript, lint, **618/618 pruebas**, Expo Doctor 1.21.5 **21/21**, y exportaciones Android (**1508 módulos**) y web (**1057 módulos**). Se añadieron **60 pruebas**: 6 de dominio, 15 de Repository, 31 de controlador y 8 con sockets HTTP reales contra una API simulada en loopback. Cubren contrato y proyección, cantidades/importes, cursor, selección, conservación al fallar, reintento, cancelación, 401 y aislamiento de autorización. Las 558 pruebas y las exportaciones de la etapa visual permanecen como evidencia histórica distinta; no se reutilizan como resultados de esta conexión.

La QA web con datos y sesión sintéticos a **397/320 px** comprobó lista, selección, filtros, error con datos conservados, recuperación, vacío y 401 sin desbordamiento horizontal. Se comprobó también la ruta real anónima hacia el login y Cuenta con cinco pestañas. Sus capturas son [resumen sintético](evidencias/historial-pedidos/api-resumen-sintetico-397.png), [vacío sintético](evidencias/historial-pedidos/api-vacio-sintetico-320.png), [error con datos conservados](evidencias/historial-pedidos/api-error-conserva-sintetico-397.png) y [ruta real anónima](evidencias/historial-pedidos/api-ruta-real-anonimo-397.png). La ruta QA temporal se retiró antes de las exportaciones finales.

En la verificación técnica anterior, la API local real respondió **401** a GET `http://localhost:3200/api/orders/me` sin Bearer. El agente no consultó pedidos reales autenticados ni creó o modificó pedidos. Las pruebas HTTP usan una API simulada y las capturas de datos corresponden a fixtures. Los reportes posteriores del usuario acreditan la validación funcional de Expo Go: recorrido positivo, vacío, recuperación, orden, filtros y salida/reingreso; no hubo observación directa del teléfono. Backend y ambos Metro se conservaron en aquella comprobación; los estados de `8082` y `8083` respondieron HTTP 200, con configuración, dependencias, identidades y stash intactos según el recibo de verificación. Este turno solo registra documentación, sin ejecutar de nuevo la suite o alterar servicios.

La preparación del PR repitió **618/618 pruebas**, TypeScript, lint, `npm run doctor` (**1.20.4, 21/21**) y exportación Android (**1508 módulos**) después de ampliar la etiqueta accesible de cada pedido para incluir fecha, estado, subtotal y unidades. El ajuste conserva el diseño visual; TalkBack físico no se atribuye a estas comprobaciones. La semántica sigue la [documentación oficial de React Native 0.86](https://reactnative.dev/docs/0.86/accessibility#accessibilitylabel). La exportación y las capturas web anteriores conservan su alcance histórico.

Esta etapa no añade seguimiento, confirmación de recepción, cancelación, repetición de compra ni cambios a pedidos, bolsa, direcciones, sesión o dependencias. Se conservan identidad INHALEX, cinco pestañas, configuración, servicios, identidades de Git y respaldo de Zenaida. La integración y la sincronización de ambas copias quedan registradas; no se inicia la siguiente actividad por esta solicitud.
