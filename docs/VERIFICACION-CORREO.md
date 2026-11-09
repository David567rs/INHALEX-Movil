# Verificación de correo al registrarse

La app móvil solicita el código y completa el alta mediante las rutas de registro verificado. Después muestra la cuenta creada y ofrece volver a Cuenta. El registro anterior, `POST /api/auth/register`, sigue disponible para los clientes que todavía lo usan. El requisito de verificación en el servidor se activará cuando esos clientes puedan completar el nuevo recorrido.

## Recorrido en la app

1. La persona completa el formulario de registro y pulsa **Enviar código**. Ve el correo al que se envió, un campo de seis dígitos y las acciones **Confirmar correo**, **Reenviar código** y **Cambiar correo**.
2. Al introducir el código válido, el servidor verifica la dirección y permite completar el alta. Si el código es incorrecto o venció, el formulario explica cómo corregirlo o pedir otro. Cambiar de correo inicia un reto para la nueva dirección.
3. Cuando el alta termina, la pantalla indica **Correo verificado** y ofrece **Volver a Cuenta**. Las cuentas existentes conservan su acceso. Su correo quedará pendiente de verificar hasta completar una comprobación propia.

## Servicio y controles

- El backend genera un código aleatorio de un solo uso, asociado al correo y al propósito de registro. Como punto de partida para pruebas se proponen diez minutos de vigencia, cinco intentos por reto y un minuto entre reenvíos. Aplicar límites por correo y origen también al inicio y al reenvío para que crear otro reto no restablezca indefinidamente los intentos.
- Guardar un resumen autenticado del código y comprobar el vencimiento al usarlo. Invalidar el código anterior al reenviar y consumir la prueba de verificación al completar el alta. La creación concurrente debe respetar el correo único y permitir recuperar un resultado incierto sin crear otra cuenta.
- La app mantiene el formulario en memoria mientras se confirma el código. El servidor guarda la fecha de verificación en las cuentas que pasan el flujo. Las cuentas anteriores conservan su estado de acceso. La futura recuperación de contraseña requiere comprobar antes la titularidad del correo asociado.
- Un servicio de envío en el backend recibe el destinatario y el mensaje. Las primeras pruebas capturan el correo en una dependencia simulada. La configuración del remitente real depende de qué dominio o buzón tiene disponible INHALEX. Las credenciales del proveedor se gestionan en el entorno del backend.
- La vista muestra los estados del ViewModel y el Repository comunica con la API. La verificación de correo es una etapa propia, seguida por recuperación de contraseña, que reutilizará el servicio de envío con sus propios códigos y límites.

## Criterios de la primera integración

Probar el alta con código correcto, incorrecto, vencido y reutilizado. Comprobar que el reenvío invalida el código anterior, el cambio de correo exige otro código y el fallo del proveedor permite recuperarse. Antes de activar el requisito, comprobar registro en móvil y web, inicio de sesión de cuentas existentes y el contrato que consume Alexa.

## Contrato del backend

| Ruta | Entrada | Respuesta |
| --- | --- | --- |
| `POST /api/auth/register/verification` | `email` | `202` con `challengeId`, `expiresInSeconds` y `resendAfterSeconds` |
| `POST /api/auth/register/verified` | Campos del registro más `challengeId` y `code` | `201` con `accessToken`, `user` y cookie de sesión |

Para reenviar se usa la primera ruta y se conserva el nuevo `challengeId`. MongoDB reserva un intento antes de comprobar el código y marca un reto válido como consumido con una actualización condicional. Se guarda `emailVerifiedAt` al crear el usuario. Si el alta se interrumpe después del consumo, se puede intentar iniciar sesión si la cuenta se creó, o solicitar otro código si el correo sigue libre. El índice único de correo protege el alta ante carreras entre registros.

El límite es de cinco intentos por reto, un minuto entre envíos al mismo correo y, en una ventana de una hora, cinco solicitudes de código por correo y treinta por IP de conexión. Se cuentan las solicitudes aunque el envío posterior falle. Los retos y contadores vencidos se limpian mediante índices TTL, y el servidor comprueba el vencimiento sin esperar a la limpieza.

Las pruebas de registro usan un remitente simulado. En ejecución, el backend usa Gmail API cuando está seleccionado el proveedor y están presentes sus credenciales. La ruta de solicitud de código devuelve `503` si el remitente está sin configurar. `EMAIL_VERIFICATION_SECRET` debe ser aleatorio, de al menos 32 caracteres e independiente de `JWT_SECRET`. La app y la web pueden integrar las rutas nuevas mientras `/api/auth/register` sigue disponible. El requisito para todos los registros queda para una activación coordinada. [Guía de autorización y primer envío](GMAIL-PRIMER-ENVIO.md).

## Verificación local

La compilación del servidor y sus 191 pruebas pasaron en la etapa del backend con correo simulado. En la prueba posterior con Gmail y MongoDB aislado, el backend entregó un código real, creó una sola cuenta y guardó `emailVerifiedAt`. Rechazó usar el código con otro correo y volver a usarlo después del alta. La base temporal se eliminó al terminar.

En móvil, el Repository usa las rutas verificadas y el ViewModel conserva el borrador en memoria, controla el reenvío y descarta el desafío si cambia el correo. Si un reenvío queda sin confirmación, solicita un nuevo código antes de habilitar el alta. Pasaron las 868 pruebas móviles, TypeScript y lint. Una prueba local del ViewModel con operaciones simuladas comprobó el rechazo de un código incorrecto, el vencimiento, el cambio de correo, el reenvío fallido y su recuperación, y la protección contra el doble toque.

La prueba en el teléfono requiere que la app apunte a un backend de esta rama con el proveedor de correo configurado. Desde **Crear cuenta**, completa el formulario, pulsa **Enviar código** e introduce el código recibido. El resultado esperado es **Correo verificado**, con acceso a **Volver a Cuenta**.

## Resultado del alta con Gmail del 9 de noviembre de 2026

El usuario confirmó que recibió el código por Gmail, lo introdujo y vio **Correo verificado**. Los registros del backend de `codex/verificacion-correo` y una consulta de solo lectura a su MongoDB temporal confirmaron el alta.

| Comprobación | Resultado |
| --- | --- |
| Solicitud de código | `POST /api/auth/register/verification` respondió HTTP `202`. |
| Confirmación del registro | `POST /api/auth/register/verified` respondió HTTP `201`. |
| Cuenta guardada | La base temporal contenía una sola cuenta, correspondiente al correo de prueba. |
| Correo verificado | MongoDB guardó `emailVerifiedAt` como fecha con el valor `2026-11-09T06:28:10.648Z`. |
| Código de un solo uso | Se encontró un reto consumido, con `consumedAt` registrado. |

El primer intento, observado en Chrome desde `localhost:8083`, quedó bloqueado en la comprobación previa de CORS. Se habilitó ese origen únicamente en la instancia temporal del puerto `3221` y la comprobación previa respondió HTTP `204`.

El reporte de esa primera alta no identificó el cliente usado. La aceptación en el teléfono físico se documenta a continuación.

## Prueba del registro en Expo Go del 9 de noviembre de 2026

En un teléfono físico vinculado al backend temporal de `codex/verificacion-correo`, el usuario confirmó que recibió el código por Gmail, lo introdujo en Expo Go y vio **Correo verificado**.

| Comprobación | Resultado |
| --- | --- |
| Solicitud desde el teléfono vinculado | `POST /api/auth/register/verification` respondió HTTP `202`. |
| Alta desde Expo Go | `POST /api/auth/register/verified` respondió HTTP `201`. |
| Persistencia en MongoDB temporal | La consulta de solo lectura encontró una sola cuenta y confirmó que `emailVerifiedAt` era una fecha con valor `2026-11-09T23:15:06.018Z`. |
| Consumo del código | Se encontró un solo reto con `consumedAt` registrado. |

Al cerrar la prueba, se detuvo la instancia del puerto `3221` y se eliminó su base temporal. El backend habitual respondió `ok` en el puerto `3200`.

Referencia de seguridad: [OWASP, validación y verificación de correo](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html#email-ownership-verification).
