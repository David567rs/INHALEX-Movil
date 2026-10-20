# Conexión de Historial de pedidos

La actividad continúa en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/historial-pedidos`, desde `develop` en `77b9ab5aa8ca4171669ddda8b42adee028cefc59`. David567rs es responsable y ZenaidaGR revisará el futuro PR hacia `develop`.

El [PR #15, Implementar Historial de pedidos con MVVM y Repository](https://github.com/David567rs/INHALEX-Movil/pull/15) está abierto por **David567rs**, desde **feature/historial-pedidos** hacia **develop**, con revisión solicitada a **ZenaidaGR**. Historial permanece **8/9**, pendiente únicamente **Revisar el código**. La solicitud fue: «Amigo, ya marqué esos dos puntos. Abre el PR de Historial desde `feature/historial-pedidos` hacia `develop` para que Zenaida lo revise.». Confirma el marcado de **Ordenar los pedidos de forma clara** y **Probar la funcionalidad**. La [aceptación textual](evidencias/historial-pedidos/expo-go-aceptacion.json) y el [recibo de apertura](evidencias/historial-pedidos/preparacion-pr.json) conservan la autorización y su resultado. El agente no observó el teléfono ni leyó o modificó Trello; no hay aprobación ni merge. El [diseño y sus datos sintéticos](DISENO-HISTORIAL-PEDIDOS.md) se conservan como historia.

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

## Criterios: 8/9

- [x] Crear pantalla de historial
- [x] Obtener pedidos desde la API
- [x] Mostrar fecha, total y estado
- [x] Ordenar los pedidos de forma clara
- [x] Permitir seleccionar un pedido
- [x] Mostrar mensaje si no existen pedidos
- [x] Manejar errores de conexión
- [x] Probar la funcionalidad
- [ ] Revisar el código

El usuario confirmó marcar **Ordenar los pedidos de forma clara** y **Probar la funcionalidad**. El resto del marcado no se amplía por inferencia. «Total» corresponde al **Subtotal de productos** que devuelve el contrato, sin envío o pagos inferidos. Mantener **En progreso** y dejar **Revisar el código** pendiente para ZenaidaGR en el PR, sin sustituir esa aprobación por revisión de agentes.

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

### Siguiente paso: revisión de código

El [PR #15](https://github.com/David567rs/INHALEX-Movil/pull/15) ya está abierto y GitHub confirmó la solicitud a **ZenaidaGR**. **Revisar el código** (9) permanece pendiente. El [cuerpo del PR](PR-HISTORIAL-PEDIDOS.md) conserva alcance, contratos y validación. Zenaida revisará desde su cuenta **Files changed → Review changes → Approve → Submit review** cuando esté conforme. La aprobación debe corresponder al HEAD vigente y Backend CI/Mobile CI deben comprobarse sobre ese mismo commit antes del merge. Mantener Trello **En progreso** y 8/9 hasta su revisión; esta solicitud no fusiona ni inicia otra actividad.

La apertura se hizo con el commit de implementación **726101a8606ee92ad1a184c28d9649d6129fdf7b**. En ese snapshot estaban en ejecución [Mobile CI 39398704705](https://github.com/David567rs/INHALEX-Movil/actions/runs/39398704705) y [Backend CI 39398704687](https://github.com/David567rs/INHALEX-Movil/actions/runs/39398704687). El commit documental posterior enlaza el PR y su revisión; los checks de apertura no prueban por sí solos la CI del HEAD posterior. Consultar el estado actual en GitHub. El conector devolvió 403 al intentar crear el PR; se completó mediante la credencial configurada de Git, verificando la cuenta David567rs sin exponer credenciales.

## Verificación y límites

La [verificación de la conexión](evidencias/historial-pedidos/verificacion-api.json) pasó TypeScript, lint, **618/618 pruebas**, Expo Doctor 1.21.5 **21/21**, y exportaciones Android (**1508 módulos**) y web (**1057 módulos**). Se añadieron **60 pruebas**: 6 de dominio, 15 de Repository, 31 de controlador y 8 con sockets HTTP reales contra una API simulada en loopback. Cubren contrato y proyección, cantidades/importes, cursor, selección, conservación al fallar, reintento, cancelación, 401 y aislamiento de autorización. Las 558 pruebas y las exportaciones de la etapa visual permanecen como evidencia histórica distinta; no se reutilizan como resultados de esta conexión.

La QA web con datos y sesión sintéticos a **397/320 px** comprobó lista, selección, filtros, error con datos conservados, recuperación, vacío y 401 sin desbordamiento horizontal. Se comprobó también la ruta real anónima hacia el login y Cuenta con cinco pestañas. Sus capturas son [resumen sintético](evidencias/historial-pedidos/api-resumen-sintetico-397.png), [vacío sintético](evidencias/historial-pedidos/api-vacio-sintetico-320.png), [error con datos conservados](evidencias/historial-pedidos/api-error-conserva-sintetico-397.png) y [ruta real anónima](evidencias/historial-pedidos/api-ruta-real-anonimo-397.png). La ruta QA temporal se retiró antes de las exportaciones finales.

En la verificación técnica anterior, la API local real respondió **401** a GET `http://localhost:3200/api/orders/me` sin Bearer. El agente no consultó pedidos reales autenticados ni creó o modificó pedidos. Las pruebas HTTP usan una API simulada y las capturas de datos corresponden a fixtures. Los reportes posteriores del usuario acreditan la validación funcional de Expo Go: recorrido positivo, vacío, recuperación, orden, filtros y salida/reingreso; no hubo observación directa del teléfono. Backend y ambos Metro se conservaron en aquella comprobación; los estados de `8082` y `8083` respondieron HTTP 200, con configuración, dependencias, identidades y stash intactos según el recibo de verificación. Este turno solo registra documentación, sin ejecutar de nuevo la suite o alterar servicios.

La preparación del PR repitió **618/618 pruebas**, TypeScript, lint, `npm run doctor` (**1.20.4, 21/21**) y exportación Android (**1508 módulos**) después de ampliar la etiqueta accesible de cada pedido para incluir fecha, estado, subtotal y unidades. El ajuste conserva el diseño visual; TalkBack físico no se atribuye a estas comprobaciones. La semántica sigue la [documentación oficial de React Native 0.86](https://reactnative.dev/docs/0.86/accessibility#accessibilitylabel). La exportación y las capturas web anteriores conservan su alcance histórico.

Esta etapa no añade seguimiento, confirmación de recepción, cancelación, repetición de compra ni cambios a pedidos, bolsa, direcciones, sesión o dependencias. Se conservan identidad INHALEX, cinco pestañas, configuración, servicios, identidades de Git y respaldo de Zenaida. La solicitud actual autoriza publicación y PR para revisión; no autoriza aprobación ni integración a `develop`.
