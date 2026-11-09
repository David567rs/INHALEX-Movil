# Verificación de correo al registrarse

Diseño inicial del flujo para registros nuevos. La app y la web comparten `POST /api/auth/register`, que hoy crea la cuenta, devuelve `accessToken` y `user` y establece la cookie. La web usa esa respuesta para iniciar sesión automáticamente. La app muestra la cuenta creada y ofrece volver a Cuenta. El requisito de verificación se activará cuando los clientes que usan el registro puedan completar el nuevo recorrido.

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

Referencia de seguridad: [OWASP, validación y verificación de correo](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html#email-ownership-verification).
