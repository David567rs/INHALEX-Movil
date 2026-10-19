# Conexión de Perfil del usuario

La actividad continúa en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/perfil-usuario`, desde `559a154`. David567rs es responsable y ZenaidaGR revisará el futuro PR a `develop`. El usuario aceptó el diseño y autorizó la conexión en la misma rama: «Amigo, ya revisé el diseño de Perfil en Expo Go y me gustó. Sigamos con la conexión a la API en la misma rama, manteniendo MVVM y Repository.».

La [aceptación textual](evidencias/perfil-usuario/expo-go-aceptacion.json) completa los criterios **1 a 9: 9/10**. El usuario confirmó datos reales, guardado, conservación al actualizar, nombre actualizado en Cuenta y, después, rechazo de nombre vacío/de una letra y teléfono de nueve dígitos con el aviso **Tus datos se guardaron correctamente.** al corregir. El usuario confirmó después fallos de Guardar y Reintentar sin perder el borrador, y recuperación del perfil con borrador conservado y Guardar habilitado tras reiniciar el backend. El usuario confirmó después conservación al reabrir, ocultación al salir y recuperación al reingresar con la misma cuenta. Solo la revisión real sigue pendiente; autorizó abrir el PR hacia develop para ZenaidaGR. El agente no observó el teléfono ni leyó o modificó Trello; el marcado del usuario todavía no está confirmado. El [diseño](DISENO-PERFIL-USUARIO.md) y su evidencia se conservan como historia de la etapa visual.

## Contrato existente de la API

Las rutas están bajo el prefijo `/api`, requieren JWT Bearer y responden con `Cache-Control: private, no-store`:

| Operación | Ruta | Contrato |
| --- | --- | --- |
| Consultar perfil propio | GET `/auth/me` | Perfil público de la cuenta activa identificada por el JWT. |
| Actualizar perfil propio | PATCH `/auth/me` | JSON con `firstName`, `lastName` y `phone`; devuelve el perfil público confirmado. |

El servidor obtiene la identidad del token, no de un ID enviado en el formulario. La respuesta incluye `_id`, `name`, `firstName`, `lastName`, `email`, `phone` y metadatos públicos; no entrega contraseñas ni credenciales. La presentación utiliza únicamente los datos necesarios del perfil. El correo permanece de solo lectura y no se envía en PATCH. Tampoco se envían rol, estado ni otros campos: la validación global rechaza propiedades adicionales.

`UpdateProfileDto` exige los tres campos del PATCH. Los nombres se recortan y sus espacios consecutivos se reducen a uno; cada uno debe tener entre 2 y 50 caracteres, al menos una letra y únicamente letras admitidas por el DTO, espacios, apóstrofo o guion. El servicio también limita `firstName + ' ' + lastName` normalizado a 100 caracteres. El teléfono se recorta y admite de 10 a 15 dígitos, sin espacios interiores, signos o separadores. Un formato inválido responde 400. La ausencia de sesión válida o de cuenta activa responde 401.

Contrato revisado en `Server/src/modules/auth/auth.controller.ts`, `dto/update-profile.dto.ts`, `auth.service.ts`, `Server/src/modules/users/users.service.ts` y `Server/src/main.ts`. Estos archivos se consultaron sin modificarlos. GET también actualiza la actividad de la cuenta en el backend existente; no se presenta como una operación sin efectos de servidor.

## MVVM y comportamiento implementado

`ProfileScreen → useProfileViewModel / createProfileController → ProfileActions → ProfileRepository → ApiProfileRepository → HttpClient`, con composición en bootstrap y token privado fuera de la vista y del estado público.

Cuenta abre **Perfil del usuario** en `/perfil-usuario`. La pantalla utiliza datos reales, **Editar datos**, validación de los campos autorizados, **Guardar cambios** y **Cancelar**. La implementación incorpora carga, bloqueo durante guardado, confirmación tras respuesta válida y manejo de errores/reintento. Cancelar descarta el borrador. El correo continúa de solo lectura y las cinco pestañas se conservan.

La conexión conserva el último perfil confirmado ante un fallo recuperable, evita envíos duplicados y no repite PATCH automáticamente. Un fallo de transporte al guardar activa `requiresRefresh`: conserva el perfil y el borrador, muestra el aviso y bloquea otro PATCH hasta completar un GET con éxito. Editar el borrador o pulsar Cancelar no elimina ese aviso ni el requisito de consulta. El GET reconcilia el perfil confirmado; si el formulario continúa abierto, conserva el borrador para que el usuario lo revise y decida explícitamente si vuelve a guardar.

Tras un PATCH confirmado, un callback privado llama a `auth.updatePublicUser(profile, expectedSnapshot)` y actualiza los datos públicos de Cuenta únicamente si sigue vigente la sesión esperada. No sustituye el JWT ni vuelve a escribir SecureStore. La fachada privada `authorizationSession` conserva las operaciones pendientes de Bolsa y Favoritos cuando solo cambian esos metadatos; un login nuevo o logout sigue invalidando operaciones y datos anteriores. La protección de Perfil descarta respuestas tardías y limpia el contenido personal al salir o cambiar de sesión; un 401 bloquea Perfil hasta recuperar la autenticación. La aceptación nativa de estos recorridos continúa pendiente.

## Criterios: 9/10

- [x] Crear pantalla de perfil
- [x] Obtener datos del usuario desde la API
- [x] Mostrar información personal
- [x] Permitir editar datos autorizados
- [x] Validar campos modificados
- [x] Guardar cambios mediante la API
- [x] Mostrar confirmación de actualización
- [x] Manejar errores de conexión
- [x] Probar la funcionalidad
- [ ] Revisar el código

La confirmación posterior ya acredita validación y aviso visual; el error/reintento también está aceptado. La reapertura y salida/reingreso también quedaron aceptadas textualmente por el usuario. La revisión final corresponde a ZenaidaGR sobre el PR real; una revisión técnica de agentes no la sustituye.

## Revisión actual: PR hacia develop

El usuario confirmó el recorrido final y autorizó publicar feature/perfil-usuario como David567rs, abrir PR hacia develop y pedir revisión a ZenaidaGR. Perfil queda 9/10. La aprobación real del compañero (10) permanece pendiente; comprobar CI del HEAD vigente y conservar el PR abierto hasta revisión e indicación de integración. La guía siguiente conserva el recorrido ya aceptado, sin atribuir observación directa al agente.

## Primera prueba real en Expo Go

Reutilizar el QR de Metro de David (`8082`) y la API habitual (`3200`), con su configuración existente. Si Metro no está activo, desde `C:\Users\David\Documents\INHALEX-Movil`:

```sh
npm --prefix Mobile run start -- --port 8082
```

1. Iniciar sesión en **Cuenta** con una cuenta de prueba y abrir **Perfil del usuario**. Comprobar que nombre, apellidos, correo y teléfono corresponden a esa cuenta, sin muestras ni rótulos de vista previa.
2. Pulsar **Editar datos**, cambiar nombre, apellidos o teléfono de la cuenta de prueba y comprobar que el correo sigue siendo de solo lectura. **Cancelar** debe descartar el borrador sin guardar.
3. Volver a editar y comprobar un dato inválido, por ejemplo un nombre de un carácter o un teléfono de menos de diez dígitos. Debe indicarse el problema y evitar el envío. Corregirlo con datos válidos.
4. Pulsar **Guardar cambios** una vez, esperar la respuesta y comprobar el mensaje de confirmación y el resumen con los datos confirmados. Volver a Cuenta y comprobar que muestra los datos públicos actualizados; regresar a Perfil.
5. Actualizar el perfil con la acción de la pantalla y comprobar que conserva esos datos. Cerrar completamente Expo Go y reabrir el proyecto de David con la API accesible; abrir Perfil y comprobar de nuevo el resultado. Esto verifica persistencia en servidor, sin atribuir al perfil almacenamiento local del borrador.
6. Cerrar sesión desde Cuenta y comprobar que Perfil no expone los datos personales anteriores. Ingresar de nuevo con la misma cuenta y consultar su perfil.

La prueba de fallo de conexión y recuperación se guiará después de confirmar el recorrido inicial, sin detener los servicios por anticipado. El resultado de cada paso espera confirmación del usuario; esta guía no acredita que ya se haya realizado ni permite marcar criterios adicionales por sí sola.

## Verificación y límites

La [verificación de conexión](evidencias/perfil-usuario/verificacion-api.json) pasó TypeScript, lint, 424/424 pruebas (55 nuevas), Doctor 21/21 y exportaciones Android (1467 módulos) y web (1015 módulos), tras retirar la ruta temporal de QA. Las nuevas pruebas cubren DTO/mapeo, controlador, actualización pública de sesión, operaciones pendientes de Bolsa/Favoritos y HTTP por sockets reales contra una API y almacenamiento simulados. La QA web de componentes reales con datos sintéticos a 320/397 px comprobó consulta, validación, cancelación, guardado confirmado, fallos y recuperación, aviso persistente y ocultación al salir. La composición final conservó cinco pestañas y la protección de Perfil sin muestras.

Estos resultados corresponden a la conexión, no al diseño histórico. No se modificaron perfiles reales en la base activa ni se probó el servidor Nest/MongoDB mediante una cuenta real. La prueba HTTP usa una API simulada y la prueba web una composición de datos sintéticos, ambas identificadas en la evidencia. Teclado nativo, TalkBack, texto ampliado, el aislamiento físico entre dos cuentas distintas siguen sin prueba específica. El usuario sí confirmó los datos guardados al reabrir y al reingresar con la misma cuenta.

Se conservan `.env`, servicios, identidades y el stash de Zenaida. El [PR #12](https://github.com/David567rs/INHALEX-Movil/pull/12), abierto por David567rs desde feature/perfil-usuario hacia develop, tiene revisión solicitada y confirmada a ZenaidaGR. Perfil permanece 9/10; consultar CI del HEAD vigente. La aprobación real y la integración siguen pendientes.
