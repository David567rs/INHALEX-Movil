# Solicitudes de eliminación de cuenta y datos

## Alcance de esta implementación

La app y el formulario web registran **una solicitud pendiente**, con reautenticación y consentimiento explícito. No borran, desactivan, anonimizan ni cierran automáticamente una cuenta. Tampoco cancelan pedidos, generan reembolsos o envían correos. El recibo nunca declara que la eliminación ya ocurrió.

El usuario confirmó a INHALEX, mediante `danielcruzhernandezinhalex@gmail.com`, como responsable de atender las solicitudes y revisar la conservación de información. Los plazos de atención y conservación no están definidos en esta implementación. No se inventa un plazo ni se declara este flujo como certificación de cumplimiento o aceptación de Google Play.

## Contrato técnico

Rutas relativas al prefijo `/api`:

| Ruta | Acceso | Resultado |
| --- | --- | --- |
| `GET /account-deletion/me` | JWT, cuenta activa comprobada en la base | `{ request: null }` o recibo propio |
| `POST /account-deletion/me` | JWT, cuenta activa y contraseña actual | Recibo pendiente idempotente |
| `GET /account-deletion` | Público, sin app ni sesión | Formulario web y alternativa de contacto |
| `POST /account-deletion/requests` | Público, correo y contraseña actual | Recibo pendiente idempotente |
| `GET /admin/account-deletion?cursor=...` | JWT de administrador y rol/estado comprobados en base | Cola de hasta 50 solicitudes con cursor |

Los POST exigen JSON y `confirmation: "ELIMINAR"`. El POST propio recibe `{ password, confirmation }`; el público añade `email`. El recibo es `{ request: { id, status: "pending", createdAt } }`. `createdAt` es ISO 8601 y permanece igual al reintentar. El identificador del recibo corresponde a la cuenta, por lo que debe tratarse como información privada y no publicarse en capturas o tickets abiertos.

El formulario público usa una petición del mismo origen, omite cookies y no emite JWT. El botón se bloquea durante el envío; después de cualquier resultado se borra el campo contraseña. Si se pierde la respuesta, reintentar devuelve la misma solicitud. No se guarda la contraseña, un token o el contenido del formulario en almacenamiento web, registros de aplicación o documentos de la cola. Las contraseñas se verifican con bcrypt; se comparte la limitación de intentos de autenticación existente.

Una cuenta inactiva puede solicitar eliminación por el formulario externo si aún conoce su contraseña; esto no la reactiva. Quien no pueda autenticarse puede escribir desde su correo registrado al contacto confirmado. El responsable verifica la identidad sin solicitar contraseñas ni datos de pago por correo.

## Almacenamiento y operación

La colección `account_deletion_requests` contiene solamente `_id` (ID de cuenta, clave única de MongoDB), `status: pending` y `createdAt`. Un upsert atómico con `$setOnInsert` y recuperación de colisión de clave evita duplicados concurrentes. El registro no es una copia del perfil. La consulta administrativa obtiene el correo de la cuenta al leer la cola; no expone contraseñas ni tokens.

El responsable debe consultar regularmente `GET /api/admin/account-deletion` con una sesión administrativa mediante un cliente interno autorizado. La cola es de lectura: no existe todavía pantalla administrativa de procesamiento ni endpoint de cierre. El servicio no manda avisos por correo. Que una solicitud se almacene **no prueba que alguien la haya atendido**.

Procedimiento antes de cerrar una solicitud:

1. Recuperar el recibo y confirmar la identidad. No trasladar contraseñas, JWT ni copias completas de datos personales a Trello, GitHub o correo.
2. Identificar los datos vinculados a la cuenta en el sistema completo: perfil, direcciones, favoritos, bolsa, avisos, reseñas, pedidos, recepciones, autenticación y vínculos externos. Revisar también copias de seguridad, archivos, registros y servicios de terceros que realmente se usen.
3. Resolver pedidos o devoluciones que correspondan y determinar cualquier conservación necesaria con su fundamento y duración. Comunicar qué datos se eliminan y qué datos se conservan, por qué y durante cuánto tiempo. No tratar una solicitud como una cancelación o un reembolso automático.
4. Ejecutar un procedimiento de eliminación o anonimización **revisado y autorizado**, con revocación de acceso y verificación de referencias. Esta entrega no incluye ni ejecuta un script destructivo, y no basta con poner al usuario como inactivo.
5. Verificar el resultado y comunicarlo al solicitante a través del contacto confirmado. Documentar el cierre con datos mínimos en el registro operativo autorizado. El estado persistido seguirá `pending` hasta que se implemente y verifique el mecanismo de cierre; no fingir un estado completado.

## Pendientes antes de publicación pública

- Acordar y documentar plazos de atención, conservación y borrado de copias, junto con los sistemas y proveedores afectados.
- Implementar y verificar el procesamiento y cierre de solicitudes: la cola por sí sola no elimina cuentas o datos.
- Publicar el formulario en una URL estable **HTTPS**, accesible sin iniciar sesión, sin reinstalar la app y sin geobloqueos. `/api/account-deletion` local no es la URL pública para la ficha de Play.
- Probar el formulario publicado, la cola administrativa y el recorrido móvil con una cuenta de prueba autorizada; las pruebas automatizadas de esta entrega usan mocks y no escriben cuentas o solicitudes reales.
- Verificar que proxy, infraestructura y monitorización no registren cuerpos de autenticación; esta implementación no configura registros de terceros. Usar un límite de tráfico compartido en el borde si hay varias réplicas: el limitador heredado vive en memoria de un proceso y se reinicia al reiniciar el servidor.
- Mantener coherentes la política de privacidad publicada, la información de seguridad de datos y lo que efectivamente elimina o conserva el operador.

## Comprobaciones técnicas realizadas — 8 de noviembre de 2026

Las 37 pruebas de las tres suites del módulo pasaron dentro de las 234 pruebas del backend. Cubren reautenticación, acceso propio, estado activo, rechazo de administradores desactualizados, DTO, límite de intentos, upsert idempotente y colisión concurrente, ausencia de credenciales en el registro, cola limitada y cabeceras del formulario. El JavaScript del formulario se ejecuta con DOM y fetch simulados: doble envío bloqueado, contraseña limpiada, cookies omitidas, errores 401/429/500 y respuesta perdida sin reenvío automático. Las 17 pruebas móviles del módulo verifican sesión, validación, concurrencia, respuesta tardía y comprobación antes de reenviar. Todo usa mocks. No equivale a una prueba de borrado completo, una comprobación contra MongoDB real ni una aceptación nativa en Expo Go.
