# Plan de trabajo de INHALEX Movil

Acuerdos del 14 de octubre de 2026 para reiniciar la aplicación móvil con un repositorio independiente, aprovechar el backend y el código anterior, y documentar el flujo de trabajo del profesor desde el inicio.

El esquema de versiones y el flujo acordado están en [VERSIONAMIENTO.md](VERSIONAMIENTO.md).

David tiene once actividades funcionales y Zenaida cuatro. Cada actividad tendrá su propia rama, PR y evidencia de funcionamiento. Avisos será una bandeja dentro de la app.

## Ubicación y estructura

La carpeta de trabajo es `C:\Users\David\Documents\INHALEX-Movil`, al lado de `Proyecto-INHALEX`. La conversación conserva los acuerdos y este plan permite retomarlos desde otra conversación si hace falta.

La estructura prevista incluye `Server/`, `Mobile/`, `docs/` y `.github/`. El backend se recuperará como API compartida; la app Android utilizará Expo, React Native y TypeScript. El proyecto anterior se conserva como referencia.

## Preparación del repositorio

1. Preparar el README, `.gitignore`, documentación de arquitectura, reparto y reglas de colaboración.
2. Crear el commit inicial en `main` y crear `develop` desde ese estado.
3. Configurar las revisiones y comprobaciones de los PR en `main` y `develop` según las capacidades del repositorio.
4. Abrir `feature/backend-base` desde `develop`. Recuperar la API, documentar configuración y contratos, verificar compilación y pruebas existentes, y añadir su CI. Integrar mediante PR hacia `develop`.
5. Abrir `feature/mobile-bootstrap` desde `develop`. Incorporar la estructura, navegación, tema, configuración de API, cliente HTTP y composición de dependencias. Añadir CI móvil con comprobaciones reales e integrar mediante PR hacia `develop`.

David coordinará los PR de preparación y Zenaida los revisará. Son tareas de infraestructura adicionales a las quince actividades funcionales.

## Actividades y ramas

Cada fila corresponde a una rama creada desde el `develop` actualizado y un PR hacia `develop`. El título del PR identificará la misma actividad de la tarjeta.

| Etapa | Responsable | Actividad | Rama |
| --- | --- | --- | --- |
| 1 | David | Registro de usuario | `feature/registro-usuario` |
| 1 | David | Inicio de sesión | `feature/inicio-sesion` |
| 1 | David | Persistencia de sesión | `feature/persistencia-sesion` |
| 2 | David | Catálogo de productos | `feature/catalogo-productos` |
| 2 | David | Líneas o categorías | `feature/lineas-categorias` |
| 2 | David | Detalle de producto | `feature/detalle-producto` |
| 3 | David | Perfil del usuario | `feature/perfil-usuario` |
| 3 | David | Direcciones de envío | `feature/direcciones-envio` |
| 3 | Zenaida | Búsqueda de productos | `feature/busqueda-productos` |
| 3 | Zenaida | Favoritos | `feature/favoritos` |
| 3 | Zenaida | Bolsa de compras | `feature/bolsa-compras` |
| 4 | David | Creación de pedido | `feature/creacion-pedido` |
| 4 | David | Historial de pedidos | `feature/historial-pedidos` |
| 4 | David | Seguimiento del pedido | `feature/seguimiento-pedido` |
| 4 | Zenaida | Avisos | `feature/avisos` |

## Dependencias e integración

En la etapa 1 se integran registro, inicio de sesión y persistencia en ese orden. Comparten contratos y estado de autenticación, por lo que cada PR se integra antes de abrir el siguiente.

En la etapa 2 se integra catálogo, después categorías y finalmente detalle. Los identificadores, tipos de producto, filtros y puntos de composición deben quedar estables para incorporar búsqueda, favoritos y bolsa.

En la etapa 3 David desarrolla perfil y direcciones mientras Zenaida incorpora búsqueda, favoritos y bolsa. Favoritos y bolsa requieren sesión e identificación del producto. Catálogo y búsqueda comparten sus tipos y operaciones públicas; el acceso entre módulos se realiza por contratos. Coordinar las modificaciones de pantallas y navegación evita cambios simultáneos en los mismos archivos.

En la etapa 4 la creación de pedido requiere sesión, direcciones y bolsa integradas. Después se incorporan historial y seguimiento. Zenaida puede desarrollar Avisos en paralelo y verificar su integración con eventos del pedido.

Zenaida puede preparar criterios y diseños de sus actividades durante las primeras etapas. La aceptación funcional requiere integración con la API y verificación de las dependencias.

## Separación de MVVM y Repository

| Parte | Responsabilidad |
| --- | --- |
| View | Mostrar estado y comunicar acciones del usuario. |
| ViewModel | Administrar estado de pantalla y ejecutar operaciones del dominio. |
| Dominio | Definir entidades, contratos de repositorios, casos de uso y errores propios. |
| Repository de datos | Implementar contratos utilizando API o almacenamiento y transformar DTO en entidades. |
| Bootstrap | Construir las implementaciones e inyectarlas en los consumidores. |

Las pantallas no hacen peticiones HTTP. El dominio es independiente de React Native, del transporte y de implementaciones de datos. La composición de dependencias concretas permanece en `bootstrap`.

Antes de dividir la implementación se acordarán los contratos de sesión, producto, bolsa y pedido: identificadores, entradas, resultados, operaciones y errores. Cada responsable implementará las capas necesarias de sus propias funcionalidades.

## Avisos

Zenaida implementará una bandeja dentro de la app para consultar avisos del usuario, mostrar el estado leído y actualizarlo. El backend anterior cuenta con operaciones de listado, marcado individual y marcado de todos como leídos. Los criterios específicos se completarán con el checklist de la tarjeta antes de implementar esta actividad.

## Procedimiento de cada PR

1. Actualizar `develop` y crear la rama de la actividad desde ese estado.
2. Implementar la actividad y comprobar los criterios de su tarjeta.
3. Abrir el PR hacia `develop` con alcance, origen del código recuperado, dependencias y evidencia de funcionamiento.
4. Ejecutar TypeScript, lint y las pruebas pertinentes mediante CI.
5. Recibir revisión del compañero: Zenaida revisa los PR de David y David los de Zenaida, desde sus propias cuentas.
6. Resolver observaciones e integrar con un merge commit para conservar visibles las ramas y sus revisiones.

La actividad queda terminada cuando funciona integrada con la API, satisface su checklist y tiene el PR aprobado. Las verificaciones del proyecto anterior se repetirán en el nuevo proyecto.

## Release y entrega Android

1. Crear `release/v1.0.0` desde `develop` cuando las quince actividades estén integradas.
2. Realizar pruebas de integración y QA, incluyendo dispositivo Android y el recorrido de registro, acceso, catálogo, bolsa, pedido y consulta posterior.
3. Corregir los problemas de la release y abrir el PR hacia `main`.
4. Devolver las correcciones a `develop` mediante PR.
5. Crear el tag `v1.0.0` sobre el commit aprobado de `main`.
6. Usar ese tag para disparar GitHub Actions y generar el AAB firmado mediante EAS.

La vinculación de EAS, credenciales de firma y configuración de Google Play se realizará antes de la entrega correspondiente. Compilar el AAB y publicarlo son operaciones distintas.

## Registro de usuario integrado

El backend y la base móvil se integraron mediante los PR #1 y #2. Registro se completó en `feature/registro-usuario` y se integró mediante el [PR #3](https://github.com/David567rs/INHALEX-Movil/pull/3), con aprobación de ZenaidaGR y merge de David567rs a `develop` en `7d308e351999eb9a1dfb8e36a5f331f050f8ce61`. Backend CI y Mobile CI pasaron. El usuario aprobó el diseño, las validaciones y la conexión de Registro en Expo Go.

Estado de los criterios de la tarjeta de Registro:

- [x] Diseñar pantalla de registro: aprobado en Expo Go.
- [x] Agregar campos requeridos: nombre, apellido, correo, teléfono, contraseña y confirmación.
- [x] Validar campos obligatorios.
- [x] Validar formato de correo.
- [x] Validar contraseña y su confirmación exacta.
- [x] Conectar con la API de INHALEX: POST `/api/auth/register`, probado con componentes Nest y MongoDB reales en entorno aislado.
- [x] Manejar registro correcto: confirmación solo después de respuesta válida y limpieza del formulario.
- [x] Mostrar mensajes de error: validación local, correo duplicado y fallos de API/conexión.
- [x] Probar la funcionalidad de registro: el usuario confirmó en Expo Go creación de cuenta y aviso de correo duplicado.
- [x] Revisar el código mediante el PR y la revisión real de ZenaidaGR; aprobado e integrado.

Las reglas puras permanecen en el dominio y el estado del formulario en el ViewModel. Correo utiliza la misma versión de `validator` que el backend; nombre, teléfono y contraseña siguen las reglas del DTO, sin recortar contraseñas. El caso de uso revalida los datos normalizados antes de enviarlos y excluye la confirmación de contraseña.

El recorrido es `RegisterScreen → useRegisterViewModel → RegisterUser → RegistrationRepository → ApiRegistrationRepository → HttpClient`. `bootstrap` compone las dependencias al primer envío. El mapeador convierte `_id` a `id`, conserva solamente los datos públicos requeridos y descarta el JWT. No se añade sesión ni navegación autenticada. El botón «Crear cuenta» bloquea nuevas pulsaciones y edición durante la petición; al abandonar la vista cancela la espera, sin asumir que el servidor deshizo una operación ya recibida. No hay reintentos automáticos de creación.

Comprobaciones de esta etapa:

- 50 pruebas móviles: URL/transporte, reglas de Registro, normalización, contrato del Repository, DTO, errores HTTP, red, timeout y cancelación.
- TypeScript, lint y exportaciones web y Android aprobados. Expo Doctor ya pasó 21/21 en la etapa de validaciones; esta etapa no añade dependencias.
- Nest con `AuthController`, `AuthService`, `UsersService` y `UserSchema` reales, MongoDB temporal separado de la instancia del usuario: 201, 409, 400, persistencia única y contraseña verificada con bcrypt (coste 12). No se cargó `AppModule` ni el `.env` del usuario.
- Interfaz web a 393 px contra esa API: éxito, carga con campos bloqueados, doble toque con una sola petición, 409 en correo, limpieza del error al corregirlo y salida durante la espera. Los estados y la conexión interrumpida tienen evidencia en `docs/evidencias/registro-usuario/`.
- Expo Go: el usuario confirmó que crea la cuenta y muestra el aviso de correo duplicado. La evidencia es su confirmación en el chat; las capturas del repositorio corresponden a web.

Los diez criterios están satisfechos (10/10). La tarjeta de Registro puede quedar «Terminado»; el estado de Trello lo actualiza el usuario. La evidencia de aprobación humana es la revisión de ZenaidaGR en el PR #3.

Comprobaciones de referencia, desde la copia de David y usando Git Bash o CMD:

1. Arrancar el backend habitual con `npm run dev:server` y la app con `npm run dev:mobile` en otra terminal, desde la raíz del repositorio.
2. Con teléfono y laptop en la misma red, abrir Cuenta → Crear cuenta. Usar un correo de prueba nuevo y confirmar que aparece «Tu cuenta está lista».
3. Repetir con el mismo correo: debe señalar que ya está registrado y permitir corregirlo sin perder el resto del formulario.
4. Probar una interrupción de conexión y verificar el mensaje sin cierre de la app ni reenvío automático. La creación puede haber llegado al servidor aunque se pierda la respuesta.
5. Verificar teclado, desplazamiento y lectura accesible en Android. La comprobación con lector de pantalla y la interrupción de conexión en Android siguen sin evidencia específica.

La revisión humana y la integración de Registro quedaron completadas mediante el PR #3.

Si Expo usa un túnel o el host LAN no se detecta, configurar únicamente `EXPO_PUBLIC_API_URL=http://<IPv4-de-la-laptop>:3200/api` en `Mobile/.env` y reiniciar Metro. Conservar las credenciales en `Server/.env`.

## Inicio de sesión integrado

El usuario autorizó actualizar ambas copias con `develop` y empezar solo el diseño de Inicio de sesión. La copia de David y la de Zenaida se actualizaron a `7d308e3`. En Zenaida se preservó el archivo local generado `Mobile/.gitignore` en un stash identificado como «respaldo local antes de actualizar develop»; la versión integrada ya contiene ese archivo. David desarrolló la actividad en `feature/inicio-sesion`, creada desde ese mismo commit. La actividad se integró después mediante el PR #4; el estado actual de las copias se recoge en la implementación de Persistencia.

Se adapta la presentación de `Proyecto-INHALEX/Mobile/inhalex-app/src/features/auth/presentation/screens/LoginScreen.tsx`, revisión `526a21e11da1cd1e3f6edea350c7731f90e205bf`: título «Bienvenido», correo, contraseña con mostrar/ocultar, botón «Entrar» y enlace «Crear cuenta». Se reutilizan `AuthScaffold` y `FormField` ya integrados; no se importa el ViewModel original ni su contexto de sesión.

La ruta es `/sign-in`. Cuenta ofrece «Iniciar sesión» y «Crear cuenta» cuando no hay una sesión actual; Registro enlaza a Inicio de sesión. Los enlaces entre los formularios usan `replace` para evitar acumular pantallas. El usuario aprobó el diseño, los campos y las validaciones locales, y autorizó continuar con la API en esta misma rama.

Las reglas de `domain/validation/loginValidation.ts` comprueban correo y contraseña obligatorios, correo válido con la misma biblioteca del backend y longitud de contraseña de 8 a 128 caracteres según `LoginDto`. La longitud se verifica con `validator/isLength`, incluyendo su tratamiento de Unicode; no se limita el input por unidades UTF-16 ni se recorta la contraseña. Una contraseña totalmente blanca se considera obligatoria como prevalidación adicional al DTO; los espacios de cualquier contraseña no blanca se conservan. No se exigen mayúsculas, números o símbolos para iniciar sesión. La pantalla muestra errores por campo, solicita foco al primero inválido después de renderizar y permite corregirlos. La etapa previa utilizaba «Validar datos» para comprobar el formato; ahora el formulario valida antes de enviar las credenciales a la API.

El recorrido actual es `LoginScreen → useLoginViewModel → AuthSession → LoginUser → LoginRepository → ApiLoginRepository → HttpClient`. El caso de uso recorta y convierte a minúsculas el correo, revalida los datos de salida y conserva la contraseña exacta. El Repository realiza POST `/api/auth/login` y el mapeador acepta solo una respuesta válida con usuario y token. El ViewModel presenta carga, bloquea envíos duplicados y edición durante la petición, y cancela la espera al abandonar la vista. El error 401 muestra el mismo mensaje para correo desconocido o contraseña incorrecta; 429 informa del exceso de intentos. Los errores de conexión y almacenamiento tienen mensajes propios, sin publicar detalles técnicos ni credenciales.

El coordinador conserva el JWT de forma privada y publica solamente los datos públicos del usuario en Cuenta. Antes de publicar la sesión, el adaptador nativo escribe el token en SecureStore con clave `inhalex.auth.access-token` y servicio `inhalex.auth.session`. En web el JWT permanece solo en memoria. Al integrar Login no se leían credenciales ni se restauraba la sesión al arrancar; esa implementación se incorpora después en Persistencia de sesión, descrita abajo. No se guardan contraseñas. El cierre de sesión limpia el estado local e intenta eliminar el token guardado; si el borrado falla, informa que no pudo confirmar la eliminación. El cierre local no revoca el JWT emitido por el backend. Registro conserva su comportamiento independiente: crear una cuenta no inicia sesión.

Estado de la tarjeta de Inicio de sesión (el usuario actualiza Trello):

- [x] Diseñar pantalla de inicio de sesión: aprobado por el usuario.
- [x] Agregar campos de usuario/correo y contraseña: correo y contraseña aprobados por el usuario.
- [x] Validar campos obligatorios: formato de correo y longitud de contraseña aprobados por el usuario en la etapa local.
- [x] Conectar con la API de INHALEX: comprobado con Nest/MongoDB aislados y aceptado por el usuario en Expo Go.
- [x] Manejar inicio de sesión correcto: el usuario confirmó que pudo entrar con la contraseña correcta en Expo Go.
- [x] Mostrar mensaje cuando las credenciales sean incorrectas: el usuario confirmó el aviso con contraseña incorrecta en Expo Go.
- [x] Guardar la sesión de forma segura: adaptador SecureStore con pruebas automatizadas y recorrido nativo de escritura/eliminación esperadas aceptado sin errores reportados. No se inspeccionó el almacenamiento; la restauración al arrancar corresponde a Persistencia.
- [x] Probar la funcionalidad completa: QA web aprobada y confirmación del usuario en Expo Go de contraseña incorrecta, acceso correcto y cierre de sesión sin errores.
- [x] Revisar el código mediante el PR #4: ZenaidaGR aprobó el HEAD `1b95841b3058c91a90bda4b69ea715e9eef86e1f`; David567rs integró el PR con ambas CI correctas.

Verificación de diseño: TypeScript, lint, las 50 pruebas existentes, Expo Doctor 21/21 y exportaciones web/Android aprobados. Se comprobó en web a 393 y 320 px: edición de campos, máscara y alternancia de contraseña, botón deshabilitado, navegación Cuenta → Inicio de sesión ↔ Registro → Cuenta y desplazamiento sin desbordamiento horizontal. La comprobación visual es web; teclado y lector de pantalla Android requieren revisión en dispositivo. Las capturas están en `docs/evidencias/inicio-sesion/`.

Verificación de validaciones: 61 pruebas aprobadas (11 nuevas de Login), TypeScript, lint, Expo Doctor 21/21 y exportaciones web/Android. La comprobación web cubrió campos vacíos, errores al salir del campo, correo inválido, contraseña corta, corrección progresiva, foco al primer inválido, resultado válido con contraseña sin reglas fuertes y eliminación del resultado anterior al editar. Enter ejecuta la validación y conserva el foco si la contraseña no es válida; el caso web utiliza compatibilidad de `blurOnSubmit` porque React Native Web todavía no aplica `submitBehavior`. En Android se utiliza `submitBehavior` y queda pendiente la prueba del teclado en dispositivo. Se comprobó ausencia de desbordamiento horizontal en los tamaños de teléfono usados, y la navegación a Registro reinicia los valores y errores de Login. La evidencia está en `validacion-verificacion.json` y las capturas de la misma carpeta.

Verificación de la conexión a la API y la sesión actual:

- 105 pruebas móviles aprobadas: transporte, validación, normalización, Repositories, mapeadores, errores 401/429, cancelación, coordinación de sesión y adaptador de almacenamiento con implementación simulada.
- TypeScript, lint, Expo Doctor 21/21 y exportaciones Android/web aprobados.
- API real con `AuthController`, `AuthService`, `UsersService`, `UserSchema`, JWT y guard de autenticación, conectada a una base MongoDB temporal nueva. Las cuentas sintéticas se crearon mediante el registro real. Se comprobaron login 201, contraseña incorrecta y correo inexistente con 401 y el mismo mensaje, payload inválido 400 y límite de intentos 429. El token permitió GET `/api/auth/me` con 200; sin token devolvió 401. Se verificaron persistencia, bcrypt con coste 12 y actualización de `lastLoginAt`.
- La prueba aislada no cargó `AppModule` ni el `.env` del usuario, ni utilizó su instancia MongoDB o cuentas reales. Sus resultados no acreditan almacenamiento en Android físico.
- QA web aprobada contra esa API: formulario vacío sin petición, carga con campos bloqueados, 401 con contraseña borrada, 201 con Cuenta autenticada, doble toque con una sola petición, cierre local, salida durante la petición sin sesión tardía, 429 a 320 px sin desbordamiento y mensaje al detener la API. Evidencia: `docs/evidencias/inicio-sesion/api-verificacion.json`, `api-verificacion-aislada.json` y capturas de esa carpeta.

Aceptación humana en Expo Go, 16 de octubre de 2026:

- Pregunta: «¿En Expo Go apareció el aviso con contraseña incorrecta, pudiste entrar con la correcta y cerrar sesión sin errores?».
- Respuesta textual del usuario: «Sí, los tres casos funcionaron».
- Evidencia: [expo-go-aceptacion.json](evidencias/inicio-sesion/expo-go-aceptacion.json), basada en la confirmación del chat. No hay imágenes nativas; las capturas de la carpeta corresponden a web.

El recorrido nativo implementado espera `SecureStore.setItemAsync` antes de publicar la sesión y `SecureStore.deleteItemAsync` al cerrarla. La aceptación confirma ese flujo sin errores reportados; no acredita inspección directa del token almacenado, lectura o restauración al reiniciar, ni revocación del JWT en el backend. La restauración se implementa y valida por separado en Persistencia de sesión. Teclado y lector de pantalla en Android siguen sin evidencia específica y no se atribuyen a esta respuesta.

Los nueve criterios están satisfechos (9/9). El [PR #4](https://github.com/David567rs/INHALEX-Movil/pull/4), desde `feature/inicio-sesion` hacia `develop`, quedó cerrado y fusionado por David567rs el 16 de octubre de 2026. ZenaidaGR aprobó el HEAD `1b95841b3058c91a90bda4b69ea715e9eef86e1f` y las comprobaciones `Backend verification` y `Mobile verification` concluyeron con `success`. El merge commit es `1031e001b8d79dde662497ceed5f803549e48d20`, con padres `7d308e351999eb9a1dfb8e36a5f331f050f8ce61` y `1b95841b3058c91a90bda4b69ea715e9eef86e1f`. La evidencia está en [integracion-pr4.json](evidencias/inicio-sesion/integracion-pr4.json). La tarjeta de Login puede quedar «Terminado»; el usuario actualiza Trello.

## Persistencia de sesión integrada

Persistencia se desarrolló en `feature/persistencia-sesion` desde el merge `1031e00`. La lectura, restauración y verificación están implementadas y sus comprobaciones locales finales pasaron. El usuario aceptó en Expo Go recuperación al reabrir, estado anónimo después de salir y aviso/reintento tras fallar y restablecerse la API local. El [PR #5](https://github.com/David567rs/INHALEX-Movil/pull/5), de David567rs hacia `develop`, quedó aprobado y fusionado por ZenaidaGR el 17 de octubre de 2026, con Backend CI y Mobile CI correctas. El usuario confirmó la tarjeta «Terminado».

Estado de los nueve criterios de la tarjeta de Persistencia:

- [x] Guardar token seguro: se reutiliza el guardado privado aceptado en Login, con escritura esperada antes de publicar la sesión.
- [x] Utilizar Expo SecureStore: adaptador nativo integrado, con pruebas automatizadas y flujo de Login/cierre aceptado en Expo Go.
- [x] Restaurar al abrir: lectura inicial y verificación implementadas y probadas; el usuario confirmó recuperación al reabrir Expo Go.
- [x] Validar token: GET `/api/auth/me` con Bearer y perfil plano, pruebas automatizadas de token rechazado/401 y restauración válida aceptada en Expo Go. No incluye prueba de token caducado en Android físico.
- [x] Redirigir según estado: el usuario confirmó acceso a Cuenta tras recuperar la sesión y ausencia de acceso después de salir; carga y estados están cubiertos por pruebas automatizadas.
- [x] Eliminar al cerrar sesión: el usuario confirmó que salir y reabrir mantiene la aplicación fuera de Cuenta; la coordinación de borrado tiene pruebas automatizadas. No se inspeccionó el almacenamiento directamente.
- [x] Errores de restauración: token rechazado, red, timeout, servicio y almacenamiento cubiertos por pruebas automatizadas; el usuario confirmó en Expo Go el aviso con la API local inaccesible y la recuperación mediante Reintentar al restablecer el servidor, sin pedir correo ni contraseña.
- [x] Probar cerrar/abrir: recuperación de la sesión válida y estado anónimo tras cerrar sesión aceptados por el usuario en Expo Go; la interrupción de conexión se verifica en el criterio de errores.
- [x] Revisar código: ZenaidaGR aprobó el HEAD `f137d4821dd24dd087637df3fe367c80076372e2` del PR #5 y lo fusionó tras pasar ambas CI.

Los nueve criterios están completos (9/9), incluida la revisión real de ZenaidaGR. Las confirmaciones de reapertura y reintento proceden del usuario, separadas de las pruebas de Node y de la aceptación anterior de Login. El usuario confirmó el cierre de la tarjeta en Trello.

Contratos y recorrido implementados:

- `SessionTokenStore.get/set/clear` mantiene el JWT detrás del límite de almacenamiento. El adaptador nativo usa la misma clave, servicio y opciones para leer, escribir y borrar. La presentación no recibe credenciales.
- `VerifySessionAction → SessionRepository → ApiSessionRepository → HttpClient` consulta GET `/auth/me`. El bootstrap crea un cliente dedicado con el Bearer candidato mientras el coordinador sigue sin publicar una sesión autenticada. El mapeador recibe un perfil plano y conserva solo `id`, nombre, apellido, correo y teléfono.
- El provider invoca una restauración idempotente y el snapshot público distingue `checking`, `anonymous`, `authenticated` y `recovery-error`. Cuenta e Inicio de sesión muestran comprobación, avisos y reintento. Un error recuperable permite iniciar otra sesión.
- Un login nuevo invalida la restauración anterior. Cerrar sesión cancela operaciones anteriores, limpia el estado local e intenta borrar el token; las operaciones obsoletas no pueden publicar usuarios ni eliminar un login posterior.
- Un token malformado o un 401 llevan a intentar borrar la credencial guardada, con un error recuperable si el borrado falla. Red, timeout y 503 conservan el token y muestran un error recuperable, sin publicar un usuario autenticado. Web permanece solo en memoria durante la ejecución: `get` devuelve `null` y no hay persistencia en `localStorage` ni `sessionStorage`.

Verificación disponible de esta rama:

- 146 pruebas móviles aprobadas con transporte y almacenamiento simulados, incluidos lectura, verificación, estados y carreras de restauración, login y cierre. TypeScript global y lint sin advertencias aprobados.
- Expo Doctor 21/21 y exportaciones finales Android (1378 módulos) y web (926 módulos) aprobados sobre el código de esta rama.
- API real aislada y siete fases del coordinador en Node con HTTP real y almacenamiento simulado aprobadas. Son pruebas del contrato y de la coordinación, sin acreditar almacenamiento nativo ni reapertura de Expo Go.
- QA web mediante componentes reales y API real, con `get/set/clear` simulados en una ruta temporal `src/app/session-qa.tsx`. Las capturas se rotulan como web con almacenamiento simulado; no prueban persistencia del navegador ni Android físico. La ruta se eliminó antes de las exportaciones finales.

La evidencia se documenta en [verificacion.json](evidencias/persistencia-sesion/verificacion.json), [api-verificacion-aislada.json](evidencias/persistencia-sesion/api-verificacion-aislada.json) y [coordinator-real-http.json](evidencias/persistencia-sesion/coordinator-real-http.json). El [PR #5](https://github.com/David567rs/INHALEX-Movil/pull/5), «Implementar Persistencia de sesión con MVVM y Repository», quedó cerrado y fusionado por ZenaidaGR a las `2026-10-17T11:16:04Z`. Su aprobación corresponde al HEAD final `f137d4821dd24dd087637df3fe367c80076372e2`; `Backend verification` y `Mobile verification` concluyeron con `success`. El merge es `d5171b2510a1ba6a17fa0d95d4e01a61cbbff7fb`, con padres `1031e001b8d79dde662497ceed5f803549e48d20` y `f137d4821dd24dd087637df3fe367c80076372e2`. La [evidencia de integración](evidencias/persistencia-sesion/integracion-pr5.json) conserva estas comprobaciones. TalkBack y lector de pantalla en Android siguen sin comprobación específica.

Aceptación funcional reportada por el usuario en Expo Go, 16 de octubre de 2026:

- Respuesta textual: «Ya probé en Expo Go, amigo: recupera la sesión al reabrir y, después de cerrar sesión, ya no entra a la cuenta. Sigamos con la prueba del reintento cuando falle la conexión.».
- Evidencia: [expo-go-aceptacion.json](evidencias/persistencia-sesion/expo-go-aceptacion.json), confirmación del chat de recuperación válida y cierre/reapertura sin volver a Cuenta.
- Confirmación del aviso ante el fallo de conexión: «si aparecio». El usuario indicó que utiliza la API local de su laptop.
- Confirmación posterior exacta: «Sí, amigo, al pulsar Reintentar recuperó mi cuenta sin pedir correo ni contraseña. Ahora abramos el PR para que Zenaida lo revise.».
- Recorrido aceptado: API local inaccesible → aviso de recuperación → servidor restablecido → Reintentar → Cuenta recuperada sin introducir correo ni contraseña. La prueba física fue reportada por el usuario y no observada directamente por el agente.
- No confirma token caducado en dispositivo, TalkBack ni inspección directa de SecureStore. El criterio de validación reúne código, pruebas automatizadas de 401 y restauración válida aceptada; no se presenta como una prueba física de caducidad.

Recorrido aceptado de reintento, reproducible desde la copia de David:

1. En Git Bash o CMD, abrir `C:\Users\David\Documents\INHALEX-Movil`. Si se utiliza la API local y el backend no está activo, ejecutar `npm run dev:server`; mantenerlo abierto. Iniciar Metro en otra terminal con `npm run dev:mobile` si hace falta, o pulsar `r` en la terminal de Metro para recargar sin cerrar la sesión desde Cuenta.
2. Entrar en Cuenta e iniciar sesión si hace falta. Forzar el cierre de Expo Go e interrumpir solo la conexión con la API local antes de reabrir, manteniendo Metro accesible y conservando la configuración existente.
3. Comprobar aviso, opción de Login y reintento; restablecer la conexión y recuperar la sesión sin contraseña.

La [guía móvil](../Mobile/README.md#comprobación-en-expo-go-aceptada) incluye los comandos para ambas terminales y la configuración LAN. Se conserva el entorno existente y las credenciales del servidor. El PR #5 está integrado y el usuario confirmó su tarjeta «Terminado».

## Catálogo: 9/9 aceptados en rama, integración pendiente

El [PR #6](https://github.com/David567rs/INHALEX-Movil/pull/6) quedó cerrado y fusionado en `develop` por ZenaidaGR a las `2026-10-17T12:42:43Z`. Su aprobación a las `2026-10-17T12:42:14Z` corresponde al HEAD final `b98cbdc61e9b052dd4009300795ed4c4f0242bde`. [Backend CI](https://github.com/David567rs/INHALEX-Movil/actions/runs/39033399079) y [Mobile CI](https://github.com/David567rs/INHALEX-Movil/actions/runs/39033399082) concluyeron con `success` sobre ese HEAD.

El merge `fc13bbf7afcd0ee81e9f0f7dadce8931852d9b78` tiene padres `d5171b2510a1ba6a17fa0d95d4e01a61cbbff7fb` y `b98cbdc61e9b052dd4009300795ed4c4f0242bde`. La [evidencia de integración](evidencias/catalogo-productos/integracion-pr6.json) registra esos hechos. El usuario había autorizado abrir el PR con pendientes para conservar el orden Catálogo → Categorías → Detalle. En aquel momento la aprobación real completó la revisión de código y dejó 7/9; ese hecho histórico se conserva.

- [x] Diseñar pantalla del catálogo.
- [x] Obtener productos desde la API.
- [x] Mostrar nombre, imagen, precio y datos principales.
- [x] Manejar estado de carga.
- [x] Mostrar mensaje cuando no existan productos.
- [x] Manejar errores de conexión.
- [x] Verificar navegación al detalle del producto.
- [x] Probar la funcionalidad.
- [x] Revisar el código.

El merge del PR #6 dejó 7/9 (histórico). La aceptación posterior en Expo Go de categoría conservada y colección completa sin filtro, junto con las pruebas funcionales acumuladas y la revisión real del PR #6, deja Catálogo 9/9 aceptados en rama. La navegación aún debe integrarse en `develop` mediante el PR de Detalle. El usuario informó Trello actualizado; la tarjeta permanece abierta hasta ese merge, sin declararla Terminado ni cambios del agente en el tablero. En aquella etapa del PR #6 el usuario indicó «listo» después de la guía de Trello; el agente no comprobó ni modificó el tablero en vivo.

Se conserva la [aceptación funcional previa](evidencias/catalogo-productos/expo-go-aceptacion.json), reportada por el usuario desde Expo Go, y la [QA web](evidencias/catalogo-productos/api-verificacion.json). El [contrato de conexión](CONEXION-CATALOGO.md) describe paginación pública, estados, mapeo y recursos recuperados; el [diseño](DISENO-CATALOGO.md) conserva la vista previa histórica. Las 179 pruebas y exportaciones aprobadas pertenecen a Catálogo. El fixture de API utilizó Controller/Service/ValidationPipe reales y modelos Mongo simulados; no se presenta como una prueba de MongoDB real.

## Líneas o categorías integradas: 8/8

El [PR #7](https://github.com/David567rs/INHALEX-Movil/pull/7) quedó cerrado y fusionado por ZenaidaGR en `develop` a las `2026-10-19T04:37:00Z` (18 de octubre en Ciudad de México). Su aprobación a las `04:36:54Z` corresponde al HEAD final `6e787da42ba9273032a21374b92f0f56b9bc1437`. Backend CI `39200089592` y Mobile CI `39200089607` terminaron con `success` sobre ese mismo HEAD. El merge `b0b9856f7470d8f9b76a8de2d462b29ac3f2d4eb` tiene padres `fc13bbf7afcd0ee81e9f0f7dadce8931852d9b78` y `6e787da42ba9273032a21374b92f0f56b9bc1437`.

La [evidencia de integración](evidencias/lineas-categorias/integracion-pr7.json) registra revisión, CI y merge. La [aceptación humana](evidencias/lineas-categorias/expo-go-aceptacion.json) conserva los hitos 0/8, 5/8, 6/8 y 7/8 anteriores; la revisión real completa ahora 8/8. El usuario confirmó Trello actualizado/cerrado. El agente no leyó ni modificó el tablero en vivo.

- [x] Obtener líneas o categorías desde la API.
- [x] Mostrar las categorías disponibles.
- [x] Permitir seleccionar una categoría.
- [x] Filtrar los productos según la categoría.
- [x] Manejar categoría sin productos.
- [x] Verificar navegación.
- [x] Probar la funcionalidad.
- [x] Revisar el código.

El [contrato y QA de Líneas](CONEXION-LINEAS-CATEGORIAS.md) conserva los límites: vacío con datos sintéticos, modelos Mongo simulados en la API aislada, confirmaciones de Expo Go mediante chat y capturas web. Las 206 pruebas y las exportaciones anteriores pertenecen a Líneas, sin revalidar por sí solas Detalle.

## Detalle de producto: datos y errores aceptados en Expo Go, 5/9

David continúa en `feature/detalle-producto`, creada desde `b0b9856`. Zenaida permanece en `develop`; se conservaron `Server/.env` y su stash `81196109270f00fa7edf03a8a8ec6f8bdc963131`.

El 18 de octubre de 2026 el usuario confirmó: «Ya revisé el diseño de Detalle de producto en Expo Go, amigo, y me gustó.». Ese mensaje aceptó el diseño (1/9 en ese momento). La confirmación posterior de datos completos y cambio al abrir otro producto completó los criterios 1 a 4; la confirmación de error/recuperación añade el criterio 7: 5/9, según [la aceptación textual](evidencias/detalle-producto/expo-go-aceptacion.json). No hay observación directa del dispositivo ni capturas nativas y el agente no marcó Trello.

La [conexión a la API](CONEXION-DETALLE-PRODUCTO.md) está implementada y verificada técnicamente en la misma rama con MVVM y Repository: GET público `/products/:idOrSlug`, datos base y `longDescription`, `benefits`, `presentation` y `origin` disponibles. Pasaron 236/236 pruebas (30 nuevas: 22 de dominio/datos y 8 del controlador), TypeScript, lint sin advertencias, Doctor 21/21 y exportaciones Android 1426/web 974, repetidos después del ajuste de accesos y de retirar la ruta QA. La [evidencia API](evidencias/detalle-producto/verificacion-api.json) distingue HTTP real de lectura en 3200 y QA web mediante HTTP temporal 3216 con snapshots públicos por CORS original, sin modificarlo. Los temporales se retiraron y el backend, configuración, autenticación y `.env` se conservaron. El usuario ya aceptó consulta, presentación de datos base y adicionales y cambio de producto en Expo Go; el conteo actual 5/9 incorpora además la confirmación de aviso, datos conservados y recuperación tras reiniciar backend y pulsar Reintentar. La navegación con filtro y colección completa fue aceptada por el usuario. Catálogo queda 9/9 aceptados en rama, pendiente de integrar la navegación; Detalle mantiene 5/9, con accesos nativos, prueba completa y revisión pendientes. El usuario autorizó abrir el PR hacia `develop` para Zenaida y aclaró que los criterios 5/6 requieren únicamente iconos/accesos a las pestañas existentes. «Ver favoritos» y «Ver bolsa» están habilitados y su [QA web](evidencias/detalle-producto/verificacion-accesos.json) pasó en 393 y 320 px, sin desbordamiento y conservando cinco pestañas; ambos criterios están técnicamente listos para aceptación nativa. Guardar favoritos y agregar productos no forman parte de esos dos criterios y continúan en las actividades posteriores de Zenaida. No cambia el orden del plan.

La captura de Trello contiene exactamente estos nueve criterios:

- [x] Crear pantalla de detalle.
- [x] Obtener información del producto seleccionado.
- [x] Mostrar nombre, descripción, precio e imagen.
- [x] Mostrar información adicional disponible.
- [ ] Agregar acceso a favoritos.
- [ ] Agregar acceso a bolsa de compras.
- [x] Manejar errores al cargar el producto.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

El [diseño inicial](DISENO-DETALLE-PRODUCTO.md) y [su verificación](evidencias/detalle-producto/verificacion-diseno.json) se conservan como snapshot histórico: datos del Catálogo en memoria, QA web por inyección de snapshots debido a CORS y checks de la etapa visual. Los snapshots técnicos conservan la aceptación de su momento; el estado humano actual 5/9 está en expo-go-aceptacion.json, sin reescribir esos resultados. Error/reintento está aceptado. Los criterios 5/6 esperan comprobación de los accesos; el 8 espera el recorrido nativo de Detalle con esos accesos y el 9 una aprobación real. El [PR #8](https://github.com/David567rs/INHALEX-Movil/pull/8) está abierto hacia `develop`, con rama publicada y revisión solicitada a ZenaidaGR, sin aprobación ni merge. Consulta los checks del HEAD vigente en el PR; no se declara CI final aprobada. Catálogo mantiene 9/9 aceptados en rama, con integración de navegación pendiente y tarjeta abierta hasta el merge, y el orden Catálogo → Categorías → Detalle.

## Estado actual: Búsqueda de productos, conexión a la API

Actualización del 19 de octubre de 2026: el [PR #8](https://github.com/David567rs/INHALEX-Movil/pull/8) quedó aprobado y fusionado por ZenaidaGR en `develop` en `50d2152`; ambas CI pasaron sobre el HEAD `1a26be2`. El usuario confirmó que los accesos abren Favoritos y Bolsa en Expo Go y que actualizó Trello. Detalle queda 9/9 y la navegación pendiente de Catálogo está integrada. Los apartados anteriores conservan el estado histórico de cada etapa.

Ambas copias se sincronizaron con `develop` en `50d2152`, conservando los `.env`, las identidades de cada cuenta y el stash de Zenaida `81196109270f00fa7edf03a8a8ec6f8bdc963131`. La actividad se desarrolla en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/busqueda-productos`. ZenaidaGR es responsable y autora del [PR #9](https://github.com/David567rs/INHALEX-Movil/pull/9), abierto hacia `develop` con la implementación publicada en `80dd7ec67808c2baa0fbb94514cf232ad6751a4e` y revisión solicitada a David567rs.

El usuario aceptó el diseño y autorizó continuar en la misma rama: «Ya revisé el diseño de Búsqueda en Expo Go, amigo. Puedo escribir y borrar, y ya marqué esos puntos en Trello. Sigamos con la conexión a la API en la misma rama, manteniendo MVVM y Repository.». La [aceptación textual](evidencias/busqueda-productos/expo-go-aceptacion.json) completa «Agregar campo de búsqueda» y «Capturar texto ingresado»: **2/8**. El agente no observó el dispositivo ni modificó Trello. [Diseño y verificaciones visuales](DISENO-BUSQUEDA-PRODUCTOS.md) son historia de la etapa previa; su código local de ejemplos está retirado.

La [conexión de Búsqueda](CONEXION-BUSQUEDA-PRODUCTOS.md) conserva MVVM, bootstrap y Repository público, reutiliza `CatalogPage` y el mapeador estricto de Catálogo, y consulta GET `/products?page&limit&search`. El adaptador escapa los metacaracteres regex antes de codificar el término porque el backend actual interpreta `search` como regex. El caso de uso recorta solo extremos y valida hasta 100 caracteres, página desde 1 y límite hasta 100. La API combina nombre, descripción, descripción larga y aromas con OR, sin distinguir mayúsculas y distinguiendo acentos. El controlador separa borrador exacto y término enviado; no consulta al escribir, borrar ni elegir sugerencias. Un envío explícito activa carga, resultados, vacío o error/reintento; cancela operaciones obsoletas, evita duplicados y pagina de 20 en 20 sin repetir IDs. Reintentar el mismo término conserva productos; editar limpia los anteriores. Las tarjetas reales reutilizan fotos, precios y navegación a Detalle, con las cinco pestañas conservadas.

El usuario confirmó después que `Lavanda` aparece con foto y precio en Expo Go y que marcó esos dos puntos en Trello. Consulta y resultados quedaron aceptados: **4/8** en ese hito. Vacío, errores/reintento, distintos términos y revisión seguían pendientes. La evidencia técnica de conexión distingue HTTP real público de fixtures o capturas web. El entorno de Zenaida utiliza `8083`, separado de David `8082` y de la API `3200`, sin cambiar configuración ni servicios existentes. La revisión real del código sigue pendiente.

Verificación técnica de conexión completada: 280 pruebas, TypeScript, lint, Doctor y exportaciones Android/web aprobados. La guía y la evidencia final separan HTTP real de lectura de los fixtures web; los temporales ya están retirados. A la guía de vacío y vuelta a `Lavanda`, el usuario respondió «listo vamos con lo que sigue»; a la confirmación de aviso, resultados conservados y recuperación con Reintentar respondió «si ya quedó, vamos con lo que sigue». Tras la guía en Expo Go para comparar `LAVANDA`, `Menta` y `Lavanda` con espacios exteriores, respondió exactamente «dale ya quedó, y cada que acabes sugiereme el siguiente texto porque ya no aparece». Estas respuestas del chat completan contextualmente **7/8**, incluido el criterio 7 de distintos términos, sin observación directa del dispositivo ni cambios en Trello por el agente. Solo queda pendiente el criterio 8: la revisión real de David567rs sobre el [PR #9](https://github.com/David567rs/INHALEX-Movil/pull/9) de ZenaidaGR hacia `develop`, abierto con la revisión solicitada, sin aprobación ni merge. La CI del HEAD vigente está pendiente de verificación; no se declara aprobada.

## Estado vigente: Favoritos, diseño pendiente de aceptación (0/9)

Actualización del 19 de octubre de 2026 que prevalece sobre los estados históricos anteriores: el [PR #9](https://github.com/David567rs/INHALEX-Movil/pull/9), creado por ZenaidaGR, quedó aprobado por David567rs a las `2026-10-19T07:33:33Z` sobre `22042d77ed30e4273ac47bc4e5a4ecf8f51bc60b`. Backend CI `39215924273` y Mobile CI `39215924387` pasaron sobre ese HEAD. David567rs lo fusionó a `develop` a las `07:33:45Z` en `852614afd801cfa67a5025ac6128e1803e69f32f`. La [evidencia de integración](evidencias/busqueda-productos/integracion-pr9.json) registra la revisión real que completa **Búsqueda 8/8**. El usuario confirmó Trello actualizado; el agente no leyó ni modificó el tablero. Catálogo y Detalle también están integrados y completos.

Ambas copias se sincronizaron con `develop` en `852614a`; David permanece allí. La tarea actual se realiza solo en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/favoritos`, creada desde ese commit. ZenaidaGR conserva la responsabilidad y David567rs revisará el futuro PR a `develop`.

El [diseño de Favoritos](DISENO-FAVORITOS.md) utiliza MVVM, un Repository local de solo lectura y composición en bootstrap. La pestaña existente presenta **Vista previa**, tres muestras con fotos y precios y el selector **Con productos / Sin favoritos**. Los corazones son decorativos y quitar está deshabilitado. **Explorar catálogo** navega a la ruta existente; las muestras no abren Detalle. Se conservan las cinco pestañas y la sesión. Guardar, eliminar, persistir, autenticar y sincronizar favoritos pertenecen a la conexión posterior.

La captura de Trello contiene exactamente estos nueve criterios, todos sin marcar; no hay un criterio independiente de diseño:

- [ ] Agregar opción para marcar un producto como favorito
- [ ] Guardar el producto en favoritos
- [ ] Mostrar la lista de productos favoritos
- [ ] Permitir eliminar productos de favoritos
- [ ] Sincronizar favoritos con la API
- [ ] Mostrar mensaje cuando no haya favoritos
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Favoritos quedó **0/9** en el hito visual anterior. Las muestras y el vacío sintético no completaron los criterios 3 y 6. Las comprobaciones de diseño permanecen como historia en `evidencias/favoritos/verificacion-diseno.json`.

## Estado vigente: Favoritos aceptado funcionalmente (8/9), PR #10 abierto

El usuario aceptó el diseño en Expo Go el 19 de octubre de 2026 y autorizó continuar en la misma rama. Su mensaje exacto está en `evidencias/favoritos/expo-go-aceptacion.json`. La [conexión](CONEXION-FAVORITOS.md) mantiene MVVM y Repository, GET/PUT/DELETE autenticados y un controlador compartido entre Favoritos y el corazón del Detalle. Guardar y quitar esperan confirmación del servidor; actualizar conserva datos ante errores. Salir o cambiar de sesión limpia la lista y cancela respuestas anteriores. No se cambiaron backend, dependencias ni almacenamiento de sesión.

El usuario confirmó después exactamente: «ya pude guardar, actualizar y quitar favoritos en Expo Go. Sigamos con la prueba del estado vacío.». La respuesta al recorrido guiado acepta contextualmente los criterios 1 a 5: **5/9**, registrados en `evidencias/favoritos/expo-go-aceptacion.json`, sin observación directa del dispositivo. Ya puede marcar esos cinco puntos en Trello; el agente no leyó ni modificó el tablero y aún no hay confirmación del usuario de haberlos marcado. La próxima prueba es el vacío real autenticado, después de actualizar sin error y con navegación de **Explorar catálogo**. Vacío, errores, prueba completa y revisión continúan pendientes. La evidencia técnica en `evidencias/favoritos/verificacion-api.json` conserva el snapshot de aquella verificación; la aceptación vigente está en `expo-go-aceptacion.json`. La ruta QA temporal se retiró antes de exportar. Los cambios permanecen locales en `feature/favoritos`; no hay PR ni revisión real de David567rs todavía.

La confirmación siguiente del usuario —«apareció «Aún no tienes favoritos», se mantuvo al actualizar y «Explorar catálogo» abrió Catálogo. Sigamos con la prueba de error y reintento.»— acepta el criterio 6: **6/9**. Puede marcar **Mostrar mensaje cuando no haya favoritos**. La actividad actual es error/reintento con un producto visible y la API local detenida manualmente solo después de prepararlo; se conservan ambos Metro. No se han aceptado todavía errores, prueba completa ni revisión real. El agente no modificó Trello ni detuvo servicios.

El usuario confirmó después que fallaron **Quitar** y **Actualizar** conservando el producto y que, al reiniciar el backend y pulsar **Reintentar**, se recuperó la lista sin errores. Su mensaje exacto se conserva en `evidencias/favoritos/expo-go-aceptacion.json`. **Manejar errores de conexión** (7) queda aceptado: **7/9**, sin observación directa del dispositivo ni cambios en Trello por el agente. La última prueba para el criterio 8 será conservar un favorito al reabrir Expo Go, comprobar la pantalla anónima al salir y recuperar la lista al ingresar de nuevo con la misma cuenta. Después se preparará el PR de `feature/favoritos` a `develop`, autoría ZenaidaGR, revisión David567rs. El criterio 9 espera esa revisión real; la tarjeta sigue en progreso y aún no hay PR de Favoritos.

El usuario confirmó el favorito conservado al reabrir Expo Go, oculto al cerrar sesión y recuperado al ingresar con la misma cuenta, y solicitó abrir el PR hacia `develop` para David567rs. Su cita exacta en `expo-go-aceptacion.json` acepta **Probar la funcionalidad** (8): **8/9**. Solo queda **Revisar el código** (9), mediante revisión real de David567rs sobre el PR de ZenaidaGR. Publicar esta rama y abrir el PR está autorizado; merge y aprobación no se realizan en esta etapa. La tarjeta sigue en progreso; el agente no modificó Trello.

El [PR #10](https://github.com/David567rs/INHALEX-Movil/pull/10), «Implementar Favoritos con MVVM y Repository», ya está abierto por ZenaidaGR desde `feature/favoritos` hacia `develop`, con revisión solicitada a David567rs. Su implementación se publicó en `8dbd613d3c6b470fb52370c65a4c7d3d54b16a26`; la [evidencia de apertura](evidencias/favoritos/preparacion-pr10.json) distingue ese HEAD del commit documental posterior. La CI se consulta sobre el HEAD vigente. La aceptación permanece 8/9; aprobación y merge pendientes.

## Estado vigente: Bolsa de compras, diseño pendiente de aceptación (0/10)

Este apartado prevalece sobre los estados históricos anteriores. El [PR #10](https://github.com/David567rs/INHALEX-Movil/pull/10), de ZenaidaGR, fue aprobado por David567rs sobre `5d08fe0a392f7919c58ca77cf3b6708f899350d7` a las `2026-10-19T10:01:37Z` y fusionado por él a `develop` a las `10:01:46Z` en `a943e7d164bce14689eb8373cf689bfb8ff1329b`. Backend CI `39233961403` y Mobile CI `39233961395` terminaron correctamente sobre ese HEAD antes del merge. La [evidencia de integración](evidencias/favoritos/integracion-pr10.json) registra la revisión real que completa **Favoritos 9/9**, sin añadir aceptación nativa. El usuario confirmó Trello actualizado; el agente no leyó ni modificó el tablero.

Ambas copias se actualizaron a `develop` en `a943e7d`, con sincronización local verificada por separado. David permanece en `develop`; la tarea actual se realiza solo en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/bolsa-compras`, creada desde ese commit. ZenaidaGR conserva la responsabilidad y David567rs revisará el futuro PR a `develop`.

El [diseño de Bolsa](DISENO-BOLSA-COMPRAS.md) usa MVVM, un Repository local de solo lectura y bootstrap. `CartPreviewScreen` presenta **Vista previa**, selector **Con productos / Bolsa vacía**, Lavanda 2 × $149.00 MXN y Eucalipto 1 × $129.00 MXN, con subtotal y total de muestra de $427.00 MXN. El resumen indica **Envío: Por definir**; el total no incluye envío. Cantidad, **Quitar** y **Continuar con mi pedido** permanecen deshabilitados. El vacío muestra **Tu bolsa aún está vacía** y **Explorar catálogo**; la colección usa **Seguir explorando** con etiqueta accesible **Explorar catálogo**, hacia la misma ruta existente. Las muestras no abren Detalle. Se conservan cinco pestañas, sesión y Favoritos real. Esta etapa no conecta la API de Bolsa ni añade mutaciones, persistencia, autenticación o dependencias.

La captura del usuario muestra la tarjeta en progreso con exactamente estos diez criterios sin marcar; no contiene un criterio independiente de diseño:

- [ ] Agregar productos a la bolsa
- [ ] Mostrar los productos agregados
- [ ] Modificar la cantidad de productos
- [ ] Eliminar productos de la bolsa
- [ ] Calcular el total de la compra
- [ ] Evitar cantidades inválidas
- [ ] Mantener actualizada la información de la bolsa
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Bolsa permanece **0/10**, con aceptación del diseño en Expo Go pendiente. Las muestras, el vacío sintético y el total ilustrativo no completan criterios funcionales. Las comprobaciones propias se registrarán con resultados reales en `evidencias/bolsa-compras/verificacion-diseno.json`; los conteos históricos de Favoritos pertenecen a su actividad. Esta etapa permanece local, sin commit, publicación ni PR. Tras aceptar el diseño se continuará con conexión, operaciones reales, aceptación funcional y revisión del compañero antes de completar los criterios correspondientes.

## Estado vigente: Bolsa conectada, aceptación funcional pendiente (0/10)

El usuario confirmó exactamente: «Amigo, ya revisé el diseño de Bolsa en Expo Go y me gustó. Sigamos con la conexión a la API en la misma rama, manteniendo MVVM y Repository.». La [evidencia textual](evidencias/bolsa-compras/expo-go-aceptacion.json) acepta el diseño y autoriza la conexión en la misma rama de Zenaida, `feature/bolsa-compras`, basada en `a943e7d`. Este apartado prevalece sobre la etapa visual anterior. El checklist de diez criterios se conserva arriba; la aceptación funcional continúa **0/10** y la tarjeta en progreso.

La [conexión de Bolsa](CONEXION-BOLSA-COMPRAS.md) mantiene MVVM, Repository y composición autenticada. Detalle agrega productos; Bolsa consulta, cambia cantidades enteras 1–25 y quita con respuestas completas confirmadas por la API. Lecturas/escrituras se serializan, los fallos conservan datos y una escritura incierta exige GET con Reintentar antes de otra mutación. Cambiar/cerrar sesión limpia la bolsa local y descarta respuestas antiguas; un 401 la vacía y bloquea. Se retiraron muestras y selector, conservando el diseño aceptado, cinco pestañas y Favoritos. El total corresponde a productos; envío por definir y pedido deshabilitado. La guía documenta la limitación existente de promociones de `CartService`, que no considera `promoEndsAt`.

La verificación técnica propia está en curso y sus resultados finales se registrarán en `evidencias/bolsa-compras/verificacion-api.json`. No se cambian backend, dependencias, `.env`, almacenamiento de sesión ni servicios. El siguiente recorrido en Expo Go es iniciar sesión, Catálogo → Detalle → Agregar a mi bolsa, revisar productos y +/− con importes, Actualizar y Quitar. Esperar respuesta del usuario antes de aceptar criterios o sugerir marcarlos; el agente no observó el teléfono ni leyó o modificó Trello. Los cambios siguen locales sin commit, publicación ni PR, con revisión real futura de David567rs hacia `develop`.

Verificación técnica final de Bolsa: **369/369 pruebas** (47 nuevas), TypeScript, lint, Doctor 21/21 y exportaciones Android 1455 / web 1003 aprobados. QA web simulada a 320/397 px: agregar, cantidades, subtotal, límite 1/25, vacío, error/reintento sin repetir POST,401 y salida. Ruta QA retirada antes de exportar; HTTP aislado y sesión/transporte de QA usan datos ficticios, sin escrituras en MongoDB real ni prueba de SecureStore nativo. Consulta `docs/evidencias/bolsa-compras/verificacion-api.json` (desde docs: `evidencias/bolsa-compras/verificacion-api.json`). El diseño está aceptado; Bolsa funcional sigue **0/10** hasta confirmación del usuario y revisión humana. Sin commit, publicación ni PR.

## Estado vigente: Bolsa, recorrido positivo aceptado (6/10)

El usuario confirmó exactamente: «Amigo, ya pude agregar, cambiar cantidades, actualizar y quitar productos en Expo Go. Los totales cambian correctamente. ¿Qué marco en Trello y qué sigue?». Se aceptan los criterios 1, 2, 3, 4, 5 y 7: agregar, mostrar productos, modificar cantidades, quitar, total correcto y actualizar la bolsa. La aceptación es contextual al recorrido guiado y procede del chat; el agente no observó el teléfono ni leyó o modificó Trello. La evidencia vigente es `docs/evidencias/bolsa-compras/expo-go-aceptacion.json` (en docs: `evidencias/bolsa-compras/expo-go-aceptacion.json`). El marcado del usuario sigue sin confirmación.

Permanecen pendientes 6 (límites 1/25), 8 (errores/reintento), 9 (prueba completa con vacío y continuidad por cuenta) y 10 (revisión real de David567rs). La siguiente prueba es verificar **−** bloqueado en 1, **+** y Agregar bloqueados en 25, y disminución a 24 con importe actualizado. Luego se guiarán vacío, error/reintento y reapertura/sesión. Mantener `feature/bolsa-compras`, los servicios y la configuración actual. No abrir PR ni atribuir la revisión del compañero por anticipado. Esta actualización documental no cambia el código ni repite comprobaciones técnicas históricas.

## Estado vigente: Bolsa, límites aceptados (7/10)

El usuario confirmó exactamente: «Amigo, no permite bajar de 1 ni superar 25, y al bajar a 24 actualiza el total. Sigamos con la prueba de bolsa vacía.». Se acepta el criterio 6, **Evitar cantidades inválidas**, y Bolsa avanza a **7/10** (criterios 1–7). La evidencia textual vigente está en `docs/evidencias/bolsa-compras/expo-go-aceptacion.json`; desde docs, `evidencias/bolsa-compras/expo-go-aceptacion.json`. El agente no observó el teléfono ni leyó o modificó Trello; el marcado del usuario todavía no está confirmado.

La próxima prueba es quitar cada producto esperando confirmación, ver **Tu bolsa aún está vacía**, actualizar conservando el vacío sin error y abrir Catálogo con **Explorar catálogo**. No existe criterio independiente de vacío; se registrará como evidencia parcial de 9, **Probar la funcionalidad**, que continúa pendiente junto con 8 (errores/reintento) y 10 (revisión real). Después siguen error/reintento y continuidad por cuenta. Mantener la misma rama `feature/bolsa-compras`, código y servicios; no abrir PR por anticipado ni repetir pruebas técnicas por esta actualización documental.

## Estado vigente: Bolsa, vacío aceptado; error/reintento pendiente (7/10)

El usuario confirmó exactamente: «Amigo, apareció «Tu bolsa aún está vacía», se mantuvo al actualizar y «Explorar catálogo» abrió Catálogo. Sigamos con la prueba de error y reintento.». Quedan aceptados el vacío, su conservación al actualizar y el acceso a Catálogo, como evidencia parcial de **Probar la funcionalidad** (9). No existe criterio independiente de vacío; Bolsa sigue **7/10**, con 8, 9 y 10 pendientes. La evidencia textual vigente está en `docs/evidencias/bolsa-compras/expo-go-aceptacion.json` (en docs: `evidencias/bolsa-compras/expo-go-aceptacion.json`). El agente no observó el teléfono ni leyó o modificó Trello.

Siguiente guía: preparar un producto visible con la API activa, detener solo API local 3200 mediante Ctrl+C en su terminal y mantener Metro 8083; Quitar debe fallar conservando fila/cantidad/total. Pulsar **Reintentar** con API apagada debe fallar GET sin perder datos. Reiniciar con el mismo comando en la misma terminal y **Reintentar** debe recuperar la lista y controles. No repetir mutaciones automáticamente; el botón cambia de Actualizar a Reintentar. El agente no detuvo ni reinició servicios. Esperar confirmación para aceptar 8 y después comprobar reapertura/salida/reingreso antes de completar 9; no abrir PR ni atribuir revisión real 10 por anticipado. Mantener la misma rama y configuración.

## Estado vigente: Bolsa, errores y reintento aceptados (8/10)

El usuario confirmó exactamente: «Amigo, fallaron Quitar y Reintentar sin perder el producto ni los importes. Reinicié el backend y Reintentar recuperó la lista sin errores. ¿Qué marco en Trello y qué sigue?». Se acepta **Manejar errores de conexión** (8) y Bolsa avanza a **8/10**, con los criterios 1–8 aceptados. La evidencia textual vigente está en `docs/evidencias/bolsa-compras/expo-go-aceptacion.json` (desde docs: `evidencias/bolsa-compras/expo-go-aceptacion.json`). El agente no observó el dispositivo, no interrumpió los servicios ni leyó o modificó Trello. El marcado del usuario todavía no está confirmado.

Sigue la prueba final de **Probar la funcionalidad** (9): un producto visible y su cantidad, cerrar completamente Expo Go y reabrir el proyecto de Zenaida con backend 3200 / Metro 8083 activos, comprobar recuperación sin credenciales; cerrar sesión en Cuenta y comprobar Bolsa sin contenido personal y con acceso al login; reingresar con la misma cuenta y recuperar producto/cantidad. Esperar la confirmación antes de aceptar 9 o preparar PR. La revisión real de David567rs (10) permanece pendiente. Mantener la rama `feature/bolsa-compras` y su código/configuración; esta actualización documental no repite comprobaciones técnicas ni cambia resultados históricos.

## Estado vigente: Bolsa aceptada funcionalmente, preparación de PR (9/10)

El usuario confirmó exactamente: «Amigo, la bolsa se conservó al reabrir, se ocultó al cerrar sesión y volvió al ingresar con la misma cuenta. Cantidades y totales correctos. Abre el PR hacia develop para que David567rs lo revise.». Se acepta **Probar la funcionalidad** (9): Bolsa **9/10**. Solo queda la revisión real de David567rs (10); la revisión técnica de agentes no la sustituye. La cita está en `docs/evidencias/bolsa-compras/expo-go-aceptacion.json` (desde docs: `evidencias/bolsa-compras/expo-go-aceptacion.json`). No hay observación directa del dispositivo ni prueba física entre dos cuentas distintas. El agente no leyó ni modificó Trello, y su marcado todavía no está confirmado.

Se autoriza commit/publicación de `feature/bolsa-compras` desde ZenaidaGR y PR hacia `develop`, con solicitud de revisión a David567rs. No fusionar por esta solicitud. Conserva backend, Metro, configuración, identidades y stash. Las verificaciones técnicas de la misma implementación están en `verificacion-api.json`; la CI se consultará sobre el HEAD vigente del PR. Mantener la tarjeta en progreso hasta revisión/integración.

## Estado vigente: PR#11 de Bolsa abierto (9/10)

El [PR#11](https://github.com/David567rs/INHALEX-Movil/pull/11), **Implementar Bolsa de compras con MVVM y Repository**, quedó abierto por ZenaidaGR desde `feature/bolsa-compras` hacia `develop`, con revisión solicitada y confirmada a David567rs. Al abrirlo estaba publicado el commit de implementación `28292f3da721ac8a157844b0917320cb5dc2e9d7`, precedido por el cierre documental de Favoritos. La evidencia de apertura está en `docs/evidencias/bolsa-compras/preparacion-pr11.json` (desde docs: `evidencias/bolsa-compras/preparacion-pr11.json`).

Bolsa continúa 9/10, con **Revisar el código** pendiente; no hay aprobación ni merge. Consultar CI del HEAD vigente. La aceptación nativa procede del usuario y se distingue de la QA web simulada y las 369 pruebas técnicas ya registradas. El agente no leyó ni modificó Trello. Mantener la tarjeta en progreso hasta revisión/integración. Esta actualización enlaza el PR sin cambiar código funcional.

## Estado vigente: Perfil del usuario, diseño pendiente de aceptación (0/10)

Este apartado prevalece sobre los estados históricos anteriores. El [PR #11](https://github.com/David567rs/INHALEX-Movil/pull/11), creado por ZenaidaGR, fue aprobado por David567rs sobre `d68a9698ff5142875d6a36878173d3d88cfc8c20` a las `2026-10-19T10:55:10Z` y fusionado por él a `develop` a las `10:55:19Z`, en `559a15464e7cd778b2956b6e217855e5d26a77b0`. Backend CI y Mobile CI terminaron correctamente sobre ese HEAD antes del merge. La [evidencia de integración](evidencias/bolsa-compras/integracion-pr11.json) registra la revisión formal que completa **Bolsa 10/10**, sin añadir aceptación nativa. El usuario confirmó Trello actualizado; el agente no leyó ni modificó el tablero.

Ambas copias se sincronizaron con `develop` en `559a154`, limpias antes de iniciar Perfil, con recibo de sincronización separado. Zenaida permanece en `develop`; la actividad actual se realiza solo en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/perfil-usuario`, creada desde ese commit. David567rs conserva la responsabilidad y ZenaidaGR revisará el futuro PR a `develop`.

El [diseño de Perfil](DISENO-PERFIL-USUARIO.md) utiliza MVVM, un Repository local de solo lectura y bootstrap. Cuenta → **Perfil del usuario**, con etiqueta accesible **Ver diseño de perfil**, abre `/perfil-usuario`, incluso sin sesión durante esta etapa. `ProfilePreviewScreen` muestra **Vista previa**, **Datos de ejemplo para revisar el diseño.**, secciones **Información personal** y **Datos de contacto**, avatar VF y Valeria Flores, `valeria@example.test`, teléfono `5512345678`. **Editar datos de ejemplo**, con etiqueta accesible **Revisar diseño de edición de perfil**, abre **Editar tus datos** con un borrador de Nombres, Apellidos y Teléfono en memoria; correo de solo lectura, **Cancelar** restaura y **Guardar cambios** está deshabilitado sin acción. Se conservan cinco pestañas y sesión. No hay consulta o escritura real de perfil, validación funcional, persistencia ni cambios de autenticación, backend o dependencias.

La captura del usuario contiene exactamente estos diez criterios, todos pendientes:

- [ ] Crear pantalla de perfil
- [ ] Obtener datos del usuario desde la API
- [ ] Mostrar información personal
- [ ] Permitir editar datos autorizados
- [ ] Validar campos modificados
- [ ] Guardar cambios mediante la API
- [ ] Mostrar confirmación de actualización
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Perfil permanece **0/10**, con aceptación visual en Expo Go pendiente. Solo la aprobación posterior del diseño permitirá aceptar el criterio 1; los datos de ejemplo y el borrador no completan los demás criterios. La [verificación propia de Perfil](evidencias/perfil-usuario/verificacion-diseno.json) registra TypeScript, lint, 369/369 pruebas existentes, Doctor 21/21, exportaciones Android 1463/web 1011 y QA web a 320/397 px aprobados. Se comprobaron resumen, borrador descartable, correo de solo lectura, guardado deshabilitado y regreso a Cuenta con cinco pestañas. Teclado nativo, TalkBack y texto ampliado no se probaron físicamente. Esta etapa permanece local, sin commit, publicación ni PR. Tras aceptar el diseño se continuará con conexión y aceptación funcional, y después con la revisión real de ZenaidaGR.

## Estado vigente: PR #12 de Perfil abierto (9/10)

Actualización vigente: el usuario confirmó conservación al reabrir, ocultación al cerrar sesión y recuperación al ingresar con la misma cuenta, y autorizó publicar Perfil. Los criterios 1–9 están aceptados: 9/10. El PR #12, Implementar Perfil del usuario con MVVM y Repository, quedó abierto por David567rs desde feature/perfil-usuario hacia develop; GitHub confirmó a ZenaidaGR como revisora solicitada. La implementación está en c90e1a2c45562c1f3f631b1af37dff7eafef8813 y el recibo de apertura está en docs/evidencias/perfil-usuario/preparacion-pr12.json. Revisar CI del HEAD vigente. Solo Revisar el código (10) permanece pendiente; la revisión técnica de agentes no sustituye la aprobación del compañero. No fusionar por esta solicitud. La aceptación de Expo Go procede del chat, sin observación directa del teléfono ni prueba física entre dos cuentas distintas. El marcado de Trello no está confirmado y el agente no leyó ni modificó el tablero.

La [conexión de Perfil](CONEXION-PERFIL-USUARIO.md) continúa solo en la copia de David, rama `feature/perfil-usuario`, con MVVM, Repository y bootstrap. GET/PATCH `/auth/me` requieren Bearer; PATCH envía únicamente nombres, apellidos y teléfono conforme al DTO existente. El correo es de solo lectura. La implementación incluye consulta, **Editar datos**, validación, guardado confirmado, carga, errores/reintento y protección al cambiar/cerrar sesión. Tras PATCH actualiza los datos públicos de Cuenta mediante un callback privado ligado a la sesión esperada, sin sustituir el token ni escribir SecureStore. Los cambios de metadatos conservan las operaciones pendientes de Bolsa/Favoritos; login nuevo y logout siguen invalidándolas. Un fallo de transporte al guardar exige GET exitoso antes de otro PATCH, conserva el aviso al editar/Cancelar y permite revisar el borrador abierto después de reconciliar el perfil confirmado; no reenvía la escritura. El diseño y sus verificaciones permanecen como historia.

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

La verificación técnica registrada en verificacion-api.json pasó TypeScript, lint, 424/424 pruebas, Doctor 21/21 y exportaciones Android 1467/web 1015, con QA web sintética y HTTP real contra una API simulada. Es un registro anterior a esta aceptación nativa; no se repitieron comprobaciones por una actualización documental. Mantener cinco pestañas, rama, servicios, configuración, identidades y stash. Publicación y PR autorizados; la revisión real corresponde a ZenaidaGR y no se sustituye por la revisión técnica de agentes.
