# Bolsa de compras: conexión a la API

Actividad de ZenaidaGR en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/bolsa-compras`, creada desde `develop` en `a943e7d164bce14689eb8373cf689bfb8ff1329b`. David567rs revisará el futuro PR hacia `develop`. El usuario aceptó el diseño en Expo Go y autorizó continuar con la conexión en la misma rama; su cita exacta se conserva en [expo-go-aceptacion.json](evidencias/bolsa-compras/expo-go-aceptacion.json). El [diseño y sus verificaciones](DISENO-BOLSA-COMPRAS.md) conservan el hito visual anterior.

## Recorrido MVVM y Repository

`Bolsa / Agregar desde Detalle → useCartViewModel → controlador compartido → CartActions → CartRepository → ApiCartRepository → HttpClient`.

Bootstrap compone el controlador con la sesión pública y el cliente HTTP autenticado. El token permanece privado en esa composición y el transporte; las vistas, el ViewModel y el contexto React no reciben credenciales. `CartProvider` conserva un único estado entre Detalle y Bolsa. Se retiraron las muestras y el selector de vista previa de la aplicación normal, conservando el diseño aceptado y las cinco pestañas.

Detalle permite **Agregar a mi bolsa**; las filas de Bolsa permiten abrir Detalle, cambiar cantidad con **− / +** y **Quitar**. **Actualizar bolsa** consulta el estado remoto. Se conservan las funciones integradas de Favoritos y sesión. No se modificaron backend, CORS, dependencias, `.env` ni el almacenamiento de sesión.

## Contrato existente

Todas las rutas son relativas a `/api` y requieren el Bearer de la sesión. La API identifica la cuenta desde el JWT; no se envía un ID de usuario.

| Operación | Ruta | Cuerpo |
| --- | --- | --- |
| Consultar | `GET /cart` | Sin cuerpo |
| Agregar | `POST /cart` | `{ productId, quantity }` |
| Cambiar cantidad | `PATCH /cart/:productId` | `{ quantity }` |
| Quitar | `DELETE /cart/:productId` | Sin cuerpo |

Todas las operaciones devuelven la bolsa completa: `{ items, totalItems, subtotal, currency }`. Cada fila contiene `{ productId, quantity, subtotal, product }`. `totalItems` suma unidades, mientras que el número de filas cuenta productos distintos. `POST` suma la cantidad al producto existente hasta el máximo de 25; `PATCH` establece la cantidad indicada. La móvil no utiliza reemplazo ni vaciado completo.

Dominio y Repository validan IDs de 24 caracteres hexadecimales y cantidades enteras de **1 a 25**, sin coerción ni recorte. La interfaz bloquea disminuir de 1 o aumentar de 25; quitar un producto requiere **Quitar**. El mapeador comprueba identidades, duplicados, cantidades, importes finitos, moneda y sumas de unidades/subtotales. Reutiliza el mapeador público de Catálogo y descarta campos ajenos a la presentación. Las respuestas de agregar, cambiar y quitar también deben confirmar el resultado solicitado.

### Importes y promociones

El precio unitario mostrado es el subtotal de la fila dividido entre su cantidad, confirmado por la API. El resumen muestra **Subtotal** y **Total de productos** con el subtotal remoto; **Envío: Por definir** queda fuera de ese importe. **Continuar con mi pedido** sigue deshabilitado: esta actividad no crea pedidos ni cotiza envíos.

El `CartService` existente aplica una promoción activa con precio menor al base sin consultar `promoEndsAt`. El mapeador de Bolsa respeta ese contrato y valida sus importes aunque la fecha de promoción haya vencido. Por ello, Bolsa puede mostrar un precio distinto de Catálogo o Detalle, cuyos mapeadores sí consideran esa fecha. Esta diferencia pertenece al backend existente; no se corrigió el servidor dentro de esta actividad.

## Confirmación, errores y sesión

- Las lecturas y escrituras se serializan. Durante una solicitud se bloquean nuevas operaciones para evitar dobles envíos y respuestas que se solapen.
- Agregar, modificar y quitar publican la bolsa completa solo después de validar la respuesta del servidor; no se anticipan cantidades ni totales locales.
- Los fallos de lectura o escritura conservan la última bolsa confirmada y muestran un aviso seguro. Tras un fallo de escritura, las mutaciones quedan bloqueadas hasta completar una consulta **GET** mediante **Reintentar**. Así se comprueba si la operación llegó al servidor antes de permitir otra escritura; no hay reintentos automáticos de `POST`.
- Sin sesión se ofrece inicio de sesión y no se consulta una bolsa personal. Cerrar sesión o cambiar de autenticación limpia la bolsa local, cancela operaciones y descarta respuestas anteriores, incluso tras otro login a la misma cuenta.
- Un `401` vacía y bloquea Bolsa hasta volver a autenticarse. La acción explícita para iniciar sesión realiza la salida local antes de abrir el formulario y conserva el aviso existente si falla el borrado seguro. Los fallos de red y otros estados HTTP no se interpretan como expiración.
- Los productos se conservan en el backend; esta actividad no añade una copia personal persistente en el dispositivo.

## Recorrido positivo en Expo Go, aceptado por el usuario

Reutiliza el QR de Metro de Zenaida en **8083** y el backend compartido en **3200**, conservando Metro de David en **8082** y la configuración actual.

1. Inicia sesión con una cuenta de prueba en **Cuenta**.
2. Abre **Catálogo → un producto disponible → Agregar a mi bolsa** y espera la confirmación.
3. Abre **Bolsa** y comprueba el producto, foto, precio unitario, cantidad y subtotal.
4. Pulsa **+**, espera la confirmación y comprueba cantidad e importes. Pulsa **−** y verifica de nuevo. En cantidad 1, disminuir debe quedar bloqueado.
5. Pulsa **Actualizar bolsa** y comprueba que mantiene los datos confirmados sin aviso de error.
6. Pulsa **Quitar** y espera la respuesta: la fila debe desaparecer y el resumen actualizarse. Si era el último producto, debe aparecer **Tu bolsa aún está vacía**.

El usuario confirmó agregar, cambiar cantidades, actualizar, quitar y totales correctos. La aceptación contextual del recorrido guiado completa los criterios 1, 2, 3, 4, 5 y 7: **6/10**. La cita exacta está en la evidencia de aceptación. Los límites 1/25 se aceptaron después mediante otra confirmación exacta. Vacío real detallado, error/reintento, reapertura y cambios de sesión permanecen pendientes.

## Criterios de Trello: 9/10

Se conserva el checklist exacto de la captura del usuario:

- [x] Agregar productos a la bolsa
- [x] Mostrar los productos agregados
- [x] Modificar la cantidad de productos
- [x] Eliminar productos de la bolsa
- [x] Calcular el total de la compra
- [x] Evitar cantidades inválidas
- [x] Mantener actualizada la información de la bolsa
- [x] Manejar errores de conexión
- [x] Probar la funcionalidad
- [ ] Revisar el código

El diseño y el recorrido completo están aceptados por el usuario en Expo Go: **9/10**. Solo falta la revisión real de David567rs; el marcado del usuario todavía no está confirmado. El agente no observó directamente el dispositivo ni leyó o modificó Trello. La revisión real de David567rs queda para el futuro PR de ZenaidaGR hacia `develop`.

Las comprobaciones técnicas de esta conexión pasaron: 369 pruebas (47 de Bolsa), TypeScript, lint, Doctor 21/21 y exportaciones Android 1455 / web 1003. La QA web comprobó agregar, cantidad, total, vacío, error/reintento,401 y cierre de sesión a 320/397 px con sesión y transporte simulados. La ruta QA se retiró antes de las exportaciones. Los resultados se registran en [verificacion-api.json](evidencias/bolsa-compras/verificacion-api.json). Las pruebas HTTP aisladas usan una API y almacenamiento simulados; no acreditan escrituras en MongoDB real, SecureStore nativo ni aceptación en Expo Go. Los resultados históricos del diseño o de Favoritos conservan su propio alcance. Los cambios permanecen locales, sin commit, publicación de rama ni PR en esta etapa.

## Límites de cantidad, aceptados por el usuario

1. Agrega un producto disponible y, en Bolsa, comprueba que en cantidad 1 **−** queda deshabilitado.
2. Usa **+**, esperando cada confirmación, hasta 25. **+** debe quedar deshabilitado y no debe existir cantidad 26. En el Detalle de ese mismo producto, agregar debe indicar **Máximo de 25 unidades** y quedar bloqueado.
3. Vuelve a Bolsa, pulsa **−** y comprueba que baja a 24 con el importe correspondiente. No hace falta crear un pedido.

El usuario confirmó exactamente: «Amigo, no permite bajar de 1 ni superar 25, y al bajar a 24 actualiza el total. Sigamos con la prueba de bolsa vacía.». Se acepta **Evitar cantidades inválidas** (6) y Bolsa avanza a **7/10**. Esta evidencia procede del chat, sin observación directa del dispositivo por el agente.

## Bolsa vacía, aceptada por el usuario

1. En Bolsa, con la misma cuenta, pulsa **Quitar** en cada producto y espera la confirmación de cada eliminación.
2. Al quitar el último, comprueba **Tu bolsa aún está vacía**, sin productos ni importes anteriores.
3. Pulsa **Actualizar bolsa**: debe conservar el estado vacío sin aviso de error.
4. Pulsa **Explorar catálogo** y comprueba que abre Catálogo.

El usuario confirmó exactamente: «Amigo, apareció «Tu bolsa aún está vacía», se mantuvo al actualizar y «Explorar catálogo» abrió Catálogo. Sigamos con la prueba de error y reintento.». El vacío, su actualización y el acceso a Catálogo quedan aceptados como evidencia parcial del criterio 9, **Probar la funcionalidad**. No existe un criterio independiente de vacío: Bolsa permanece **7/10**, con 8, 9 y 10 pendientes. El agente no observó el teléfono ni leyó o modificó Trello.

## Error y reintento, aceptados por el usuario

La API local compartida está en 3200; Metro de Zenaida está en 8083 y debe permanecer activo. El agente no detuvo ni reinició servicios para esta guía.

1. Con la API encendida, agrega un producto y comprueba que está visible en Bolsa con su cantidad y total.
2. En la terminal donde corre esa API local, pulsa **Ctrl+C**. Mantén Expo/Metro activo.
3. En Bolsa pulsa **Quitar** y espera el aviso de error: la fila, cantidad e importes deben conservarse. Las mutaciones quedan bloqueadas hasta consultar el estado remoto.
4. Sin encender aún la API, pulsa **Reintentar**. Debe fallar la lectura y conservar la última bolsa confirmada. El botón que antes decía **Actualizar bolsa** se llama ahora **Reintentar**.
5. Vuelve a iniciar el backend con el mismo comando en esa misma terminal. Cuando termine de arrancar, pulsa **Reintentar** en Bolsa: debe recuperar la lista, retirar el aviso y habilitar los controles.

Reintentar consulta mediante GET; no repite automáticamente Quitar ni Agregar. En esta prueba con la API detenida antes de Quitar, el producto debe seguir en la lista al recuperarla. El usuario confirmó exactamente: «Amigo, fallaron Quitar y Reintentar sin perder el producto ni los importes. Reinicié el backend y Reintentar recuperó la lista sin errores. ¿Qué marco en Trello y qué sigue?». Se acepta **Manejar errores de conexión** (8): **8/10**. Después se comprobarán reapertura y cierre/reingreso de la misma cuenta para completar el criterio 9. La revisión real 10 queda para el PR futuro.

## Reapertura y continuidad por cuenta, aceptadas por el usuario

Mantén activos backend 3200 y Metro de Zenaida 8083.

1. Con la sesión iniciada, deja un producto visible en Bolsa y anota su cantidad.
2. Cierra completamente Expo Go en el teléfono. Reabre el proyecto de Zenaida y entra en Bolsa: debe recuperar el producto y la cantidad sin pedir credenciales.
3. En Cuenta pulsa **Cerrar sesión**. Regresa a Bolsa: debe ocultar el contenido personal y ofrecer **Iniciar sesión**.
4. Inicia sesión con la misma cuenta. Vuelve a Bolsa y comprueba que recupera el producto y su cantidad.

El usuario confirmó exactamente: «Amigo, la bolsa se conservó al reabrir, se ocultó al cerrar sesión y volvió al ingresar con la misma cuenta. Cantidades y totales correctos. Abre el PR hacia develop para que David567rs lo revise.». Se acepta **Probar la funcionalidad** (9): **9/10**, y queda autorizada la apertura del PR hacia develop para revisión de David567rs. La prueba física entre dos cuentas diferentes no queda acreditada por este recorrido. **Revisar el código** (10) corresponde a la revisión real de David567rs en el futuro PR de ZenaidaGR hacia develop. La autorización permite publicar la rama y solicitar revisión; todavía no permite fusionarla.

## Revisión pendiente

La revisión técnica de agentes no sustituye **Revisar el código** (10). Mantener la tarjeta en progreso y conservar el PR abierto hasta los checks y la revisión de David567rs. El PR se integrará mediante merge commit hacia develop después de la autorización correspondiente.
