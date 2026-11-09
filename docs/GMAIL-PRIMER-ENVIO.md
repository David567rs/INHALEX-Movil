# Autorizar Gmail y enviar un correo de prueba

El Gmail de contacto es el remitente. Su titular autoriza al backend a enviar correo mediante `gmail.send`. El destinatario de la prueba solo necesita un buzón para recibirlo.

## Configurar Google Cloud

1. Inicia sesión con el Gmail de contacto en Google Cloud. Crea o selecciona un proyecto para INHALEX y habilita Gmail API en ese proyecto. [Activar Gmail API](https://console.cloud.google.com/apis/enableflow;apiid=gmail.googleapis.com).
2. Abre **Google Auth Platform → Branding** y usa **Comenzar** si es la primera configuración. Escribe un nombre como **INHALEX correo**, el correo de soporte y el correo de contacto. Para un Gmail personal, selecciona **Externo** como audiencia. [Branding](https://console.cloud.google.com/auth/branding).
3. En **Audience / Público**, deja la aplicación en **Testing / En pruebas** y añade el Gmail de contacto en **Usuarios de prueba**. [Audience](https://console.cloud.google.com/auth/audience).
4. En **Data Access / Acceso a los datos**, añade solo `https://www.googleapis.com/auth/gmail.send` y guarda. [Data Access](https://console.cloud.google.com/auth/scopes).
5. En **Clients / Clientes**, crea un cliente OAuth de tipo **Aplicación de escritorio** y descarga el JSON al crearlo. Guárdalo como `credentials.json` en Descargas o conserva su nombre y ajusta la ruta del siguiente comando. [Clients](https://console.cloud.google.com/auth/clients).

## Autorizar el buzón en Windows

Desde PowerShell, entra a la carpeta `Server` de la rama local `codex/verificacion-correo`. En el comando cambia `<GMAIL_DE_CONTACTO>` por la dirección remitente.

```powershell
Set-Location 'C:\Users\David\.codex\worktrees\inhalex-verificacion-correo\Server'
npm.cmd run gmail:authorize -- "$env:USERPROFILE\Downloads\credentials.json" "<GMAIL_DE_CONTACTO>"
```

Abre la URL que muestra la terminal en un navegador de esta misma computadora dentro de cinco minutos. Confirma que la cuenta seleccionada sea el Gmail de contacto y concede el permiso de envío. El asistente recibe la respuesta en `127.0.0.1` y guarda la autorización y el secreto de verificación en `Server/.env.gmail.local`. Git ignora ese archivo. Conserva tanto el JSON descargado como el archivo local en tu equipo.

Para volver a autorizar, mueve el archivo anterior a una carpeta privada fuera del repositorio y repite el comando. El asistente crea un archivo nuevo de forma exclusiva. Repite esta operación cuando Google indique que la autorización venció o fue revocada.

## Primer correo

Con la autorización guardada, elige un buzón al que tengas acceso. Ejecuta este comando una sola vez, sustituyendo el valor entre comillas por el correo elegido.

```powershell
npm.cmd run gmail:send-test -- "<DESTINATARIO_DE_PRUEBA>"
```

El comando usa el mismo adaptador del backend que enviará los códigos. Gmail debe aceptar el mensaje y el buzón de destino debe recibir **Prueba de correo de INHALEX** desde el Gmail de contacto. Comprueba remitente y asunto en Entrada o Spam. Esta prueba de entrega se ejecuta directamente desde la terminal.

En el piloto externo en modo **Testing**, la autorización de Gmail y su token de renovación caducan a los siete días del consentimiento. Al pasar de piloto a uso público, revisar los requisitos de Google para el permiso sensible y realizar una prueba con MongoDB aislado antes de integrar las rutas en los clientes. [Caducidad de OAuth](https://developers.google.com/identity/protocols/oauth2#expiration).

Consulta la documentación de Google para revisar el retorno local, el alcance del permiso y la petición de envío. [OAuth de escritorio](https://developers.google.com/identity/protocols/oauth2/native-app#redirect-uri_loopback) · [Permisos de Gmail](https://developers.google.com/workspace/gmail/api/auth/scopes) · [Envío con Gmail API](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send).
