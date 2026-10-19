# Conexión de Direcciones de envío

La actividad continúa solo en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/direcciones-envio`, desde `27d2495`. David567rs es responsable y ZenaidaGR revisará el futuro PR a `develop`. El usuario aceptó el diseño y autorizó la conexión: «Amigo, ya revisé el diseño de Direcciones en Expo Go y me gustó. Sigamos con la conexión a la API en la misma rama feature/direcciones-envio, manteniendo MVVM y Repository.».

La [aceptación textual](evidencias/direcciones-envio/expo-go-aceptacion.json) completa **9/10**, criterios 1 a 9: diseño, alta/lista, validación, edición/eliminación, principal, vacío, error/reintento y recorrido final de sesión. Los casos de validación reportados fueron campos vacíos, etiqueta de una letra, teléfono de nueve dígitos y CP de cuatro, sin atribuir límites superiores u otros casos. El agente no observó el teléfono ni leyó o modificó Trello; su marcado no está confirmado. Mantener la tarjeta **En progreso** hasta revisión e integración. El [diseño](DISENO-DIRECCIONES-ENVIO.md) y sus verificaciones se conservan como historia.

El usuario confirmó exactamente: «Amigo, las direcciones y la principal se conservaron al reabrir, se ocultaron al cerrar sesión y volvieron al ingresar con la misma cuenta. Abre el PR de Direcciones hacia develop para que Zenaida lo revise.». Esa respuesta completa **Probar la funcionalidad** (9) y autoriza preparar la publicación y el PR; no acredita una prueba física entre dos cuentas distintas. Solo falta **Revisar el código** (10), mediante revisión real de ZenaidaGR.

## Contrato existente de la API

Todas las rutas están bajo `/api`, requieren JWT Bearer y operan sobre la cuenta identificada por el token. Cada respuesta válida devuelve el **arreglo completo de direcciones**, también después de crear, editar, seleccionar o eliminar:

| Operación | Ruta | Datos enviados |
| --- | --- | --- |
| Consultar | GET `/addresses` | Sin cuerpo. |
| Crear | POST `/addresses` | Campos requeridos del alta y opcionales utilizados. |
| Editar | PATCH `/addresses/:addressId` | Campos autorizados que se actualizan; el contrato admite cambios parciales. |
| Establecer principal | PATCH `/addresses/:addressId` | `{ "isDefault": true }`. |
| Eliminar | DELETE `/addresses/:addressId` | Sin cuerpo; se solicita confirmación previa en la interfaz. |

Cada elemento público contiene `id`, `label`, `recipientName`, `phone`, `street`, `exteriorNumber`, `neighborhood`, `municipality`, `state`, `postalCode`, `isDefault` y, si existen, `interiorNumber` y `references`. El backend limita la colección a **cinco direcciones**. La primera creada se vuelve principal; seleccionar otra desmarca las demás. Al eliminar la principal, el servidor asigna la primera restante si hace falta. Esta selección identifica la dirección principal de la cuenta: no crea un pedido ni selecciona un envío de checkout.

Los DTO recortan los extremos de los textos y aplican estas reglas:

| Campo | Alta | Validación |
| --- | --- | --- |
| `label` | Requerido | 2–40 caracteres. |
| `recipientName`, `street` | Requeridos | 2–120 caracteres cada uno. |
| `phone` | Requerido | 10–15 dígitos, sin separadores. |
| `exteriorNumber` | Requerido | 1–20 caracteres. |
| `neighborhood`, `municipality`, `state` | Requeridos | 2–100 caracteres cada uno. |
| `postalCode` | Requerido | Exactamente cinco dígitos; conservarlo como texto. |
| `interiorNumber` | Opcional | 0–20 caracteres. |
| `references` | Opcional | 0–300 caracteres. |
| `isDefault` | Opcional | Booleano. |

PATCH permite omitir campos para conservarlos y enviar cadena vacía en interior o referencias para limpiarlos. Un PATCH sin cambios ni `isDefault` se rechaza. La validación global rechaza propiedades adicionales. Los errores incluyen 400 para datos/identificador inválidos o límite de cinco, 401 para sesión inválida y 404 para una dirección o cuenta inexistente.

Contrato consultado en `Server/src/modules/users/addresses.controller.ts`, `addresses.service.ts` y `dto/create-shipping-address.dto.ts` / `update-shipping-address.dto.ts`, sin modificar backend ni configuración.

## MVVM y comportamiento de la conexión

`ShippingAddressesScreen → useShippingAddressesViewModel / createShippingAddressesController → ShippingAddressActions → ShippingAddressRepository → ApiShippingAddressRepository → HttpClient`, con composición en bootstrap y token privado fuera de los estados de presentación.

Cuenta → **Direcciones de envío** abre `/direcciones-envio` con sesión real. El flujo incorpora consulta, **Nueva dirección**, edición, guardado, elección de principal, actualización y eliminación con confirmación dentro de la pantalla. La lista se actualiza con la colección confirmada por el servidor. Se conserva el diseño visual, sin ejemplos ni selector sintético en el recorrido normal, y las cinco pestañas permanecen disponibles.

Las operaciones se bloquean mientras hay otra en curso. Los fallos conservan la colección confirmada y el borrador. Una mutación incierta o cualquier fallo recuperable de GET activa `requiresRefresh` y exige un GET exitoso antes de otra escritura. **Reintentar** consulta, sin reenviar POST/PATCH/DELETE automáticamente. La reconciliación conserva los textos del borrador abierto; si el GET confirma que la dirección editada es principal, también refleja `isDefault: true` sin descartar esos textos. Salir o cambiar de sesión limpia contenido personal y descarta respuestas tardías; un 401 limpia y bloquea la colección hasta recuperar la autenticación. La aceptación nativa se limita a las confirmaciones registradas; no se atribuye aceptación de 401 ni de otros escenarios no reportados.

## Criterios: 9/10

- [x] Agregar formulario para registrar dirección
- [x] Crear pantalla de direcciones
- [x] Validar campos obligatorios
- [x] Guardar dirección mediante la API
- [x] Mostrar direcciones registradas
- [x] Permitir seleccionar una dirección
- [x] Permitir editar o eliminar una dirección
- [x] Manejar errores de conexión
- [x] Probar la funcionalidad
- [ ] Revisar el código

Solo **Revisar el código** (10) espera la revisión real de ZenaidaGR sobre el PR. La revisión técnica de agentes no la sustituye.

## Preparación del PR autorizada

El usuario autorizó commit y publicación de `feature/direcciones-envio` desde David567rs, PR hacia `develop` y solicitud de revisión a ZenaidaGR. La preparación está autorizada; todavía no se declara un PR abierto ni se asigna número o URL. Esta solicitud no autoriza merge. Las comprobaciones finales de preparación se registrarán por separado con sus resultados reales; la CI remota se comprobará sobre el HEAD publicado.

## Primera prueba real en Expo Go

Reutilizar Metro de David (`8082`) y la API habitual (`3200`), manteniendo la configuración actual. Si Metro no está activo, desde la raíz de David:

```sh
npm --prefix Mobile run start -- --port 8082
```

1. Iniciar sesión con una **cuenta de prueba** en Cuenta y abrir **Direcciones de envío**. Comprobar que se consulta su lista real, sin Casa/Trabajo sintéticos ni rótulos de vista previa.
2. Pulsar **Nueva dirección** y crear una dirección ficticia reconocible, por ejemplo etiqueta `Prueba Casa`, destinatario `Cuenta de prueba`, teléfono `5512345678`, calle `Calle Ejemplo`, exterior `10`, colonia `Centro`, municipio `Municipio de prueba`, estado `Estado de prueba` y código postal `12345`. Interior y referencias pueden quedar vacíos. Pulsar **Guardar dirección** una vez y esperar la colección confirmada con la nueva tarjeta.
3. Pulsar **Editar** en esa dirección ficticia, cambiar un dato y pulsar **Guardar cambios**. Comprobar el resultado en la lista; **Actualizar direcciones** debe conservar lo confirmado.
4. Crear una segunda dirección ficticia, por ejemplo `Prueba Trabajo`, y pulsar **Usar como principal**. Verificar que solo una de las dos queda marcada **Dirección principal**; actualizar y comprobar que se conserva la elección.
5. Pulsar **Eliminar** en una de las direcciones ficticias y confirmar con **Eliminar dirección** en el aviso dentro de la pantalla. **Conservar** cancela esa eliminación. Esperar la respuesta y actualizar para comprobar su ausencia y la principal restante.

El usuario ya confirmó este flujo positivo, validación, vacío, error/reintento y reapertura/salida/reingreso con la misma cuenta. Solo queda la revisión real del código. Son confirmaciones textuales; el agente no observó el dispositivo ni operó servicios para obtenerlas.

## Verificación y límites

La [verificación de conexión](evidencias/direcciones-envio/verificacion-api.json) registra TypeScript y lint con salida 0, **485/485 pruebas** y Doctor **21/21** aprobados. Son 424 pruebas base y 61 nuevas: 14 de dominio, 16 del Repository, 29 del controlador y dos de integración HTTP. Las exportaciones Android y web finalizaron con salida 0, con bundles `entry-aea1d3f08629852c0d5ee741d2f18534.hbc` y `entry-b41e984c2760690891bee55bdf2a2ebd.js`.

La QA web utilizó componentes, Repository y HttpClient reales, con transporte y sesión simulados. Cubrió lista, principal, alta, validación de vacío, edición, fallo de conexión con borrador conservado y guardado bloqueado, GET explícito de recuperación conservando el borrador, guardado posterior, eliminación cancelada/confirmada hasta vacío y ocultación al salir. A 320 px, el documento midió 320 px y no hubo contenido exterior; también se revisó visualmente la lista a 397 px. La ruta temporal `qa-direcciones` se eliminó antes de las comprobaciones finales. La ruta real sin sesión mostró el acceso al login, sin fixtures.

La integración HTTP usa sockets reales contra una API y almacenamiento simulados; no prueba el backend activo ni realiza mutaciones sobre direcciones reales. La QA web no es una grabación de Expo Go. Los resultados pertenecen a esta conexión y no reutilizan la evidencia de diseño. Las confirmaciones posteriores dejan Direcciones en **9/10**, sin reescribir los snapshots técnicos anteriores. Teclado físico, TalkBack, texto ampliado y aislamiento físico entre cuentas no se atribuyen por las comprobaciones técnicas ni por el recorrido reportado con la misma cuenta.

Se conservan `.env`, servicios, identidades, stash, cinco pestañas y la otra copia. Commit, publicación y PR están autorizados y en preparación; no se declara apertura ni merge por anticipado.
