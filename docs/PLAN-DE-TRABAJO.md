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

## Catálogo de productos integrado: 7/9

El [PR #6](https://github.com/David567rs/INHALEX-Movil/pull/6) quedó cerrado y fusionado en `develop` por ZenaidaGR a las `2026-10-17T12:42:43Z`. Su aprobación a las `2026-10-17T12:42:14Z` corresponde al HEAD final `b98cbdc61e9b052dd4009300795ed4c4f0242bde`. [Backend CI](https://github.com/David567rs/INHALEX-Movil/actions/runs/39033399079) y [Mobile CI](https://github.com/David567rs/INHALEX-Movil/actions/runs/39033399082) concluyeron con `success` sobre ese HEAD.

El merge `fc13bbf7afcd0ee81e9f0f7dadce8931852d9b78` tiene padres `d5171b2510a1ba6a17fa0d95d4e01a61cbbff7fb` y `b98cbdc61e9b052dd4009300795ed4c4f0242bde`. La [evidencia de integración](evidencias/catalogo-productos/integracion-pr6.json) registra esos hechos. El usuario había autorizado abrir el PR con pendientes para conservar el orden Catálogo → Categorías → Detalle. La aprobación real completa ahora la revisión de código; no completa los otros criterios pendientes.

- [x] Diseñar pantalla del catálogo.
- [x] Obtener productos desde la API.
- [x] Mostrar nombre, imagen, precio y datos principales.
- [x] Manejar estado de carga.
- [x] Mostrar mensaje cuando no existan productos.
- [x] Manejar errores de conexión.
- [ ] Verificar navegación al detalle del producto.
- [ ] Probar la funcionalidad.
- [x] Revisar el código.

Catálogo queda 7/9. Detalle depende de `feature/detalle-producto`, posterior en el plan, y la prueba completa sigue pendiente. La integración no convierte la tarjeta en 9/9. El usuario indicó «listo» después de la guía de Trello; el agente no comprobó ni modificó el tablero en vivo.

Se conserva la [aceptación funcional previa](evidencias/catalogo-productos/expo-go-aceptacion.json), reportada por el usuario desde Expo Go, y la [QA web](evidencias/catalogo-productos/api-verificacion.json). El [contrato de conexión](CONEXION-CATALOGO.md) describe paginación pública, estados, mapeo y recursos recuperados; el [diseño](DISENO-CATALOGO.md) conserva la vista previa histórica. Las 179 pruebas y exportaciones aprobadas pertenecen a Catálogo. El fixture de API utilizó Controller/Service/ValidationPipe reales y modelos Mongo simulados; no se presenta como una prueba de MongoDB real.

## Líneas o categorías: diseño aceptado y API implementada

Ambas copias se actualizaron a `fc13bbf`, conservando sus `.env` y el stash de Zenaida `81196109270f00fa7edf03a8a8ec6f8bdc963131`. Zenaida permanece en `develop`; David creó `feature/lineas-categorias` desde ese merge en `C:\Users\David\Documents\INHALEX-Movil`.

El 18 de octubre de 2026 el usuario aceptó el diseño de Líneas en Expo Go y autorizó conectar la API en esta misma rama con MVVM y Repository. Después confirmó: «Ya probé en Expo Go, amigo: aparecen las categorías, cambian los productos al elegir otra y funciona «Ver todos». Ya marqué esos puntos en Trello. Sigamos con la prueba de categoría sin productos.». La [aceptación](evidencias/lineas-categorias/expo-go-aceptacion.json) procede del chat; no hay observación directa del teléfono ni capturas nativas. La captura inicial de Trello con ocho criterios sin marcar se conserva como snapshot histórico 0/8; el diseño no tiene casilla. El estado actual es En progreso, 6/8 aceptados: después confirmó el mensaje de línea vacía y «Ver todos» hacia el producto de prueba, con datos sintéticos. El usuario había marcado cinco puntos y puede marcar ahora el de vacío; el agente no modificó el tablero.

La conexión está implementada en `features/productLines`: entidad `ProductLine { id, name, count }`, contrato Repository asíncrono, caso de uso y mapeador de GET público `/products/categories`, composición diferida y ViewModel con carga, actualización, error/reintento, selección y cancelación. Admite líneas personalizadas válidas y conteo cero. «Ver productos de esta línea» vuelve a Catálogo con el filtro; cambiarlo o quitarlo reinicia la paginación y cancela la consulta anterior. El vacío filtrado tiene mensaje propio. Se eliminó el código de vista previa y se conserva el [diseño histórico](DISENO-LINEAS-CATEGORIAS.md) y [su evidencia](evidencias/lineas-categorias/verificacion-diseno.json). No se modifica Server, autenticación, dependencias o `.env`, ni se implementa Detalle, búsqueda, Favoritos o Bolsa.

Pasaron 206/206 pruebas móviles (27 nuevas), TypeScript, lint global sin advertencias, Doctor 21/21 y exportaciones finales Android (1415 módulos) y web (963 módulos); la revisión independiente no encontró bloqueadores. La API aislada pasó 15 grupos HTTP con Controller, Service y validación DTO reales y modelos Mongo simulados; nueve grupos adicionales usaron Repository y casos de uso móviles reales contra HTTP. No se conectó una base real ni se cargó `.env`; los upserts de categorías por defecto quedan simulados. La [QA web](evidencias/lineas-categorias/api-verificacion.json) confirmó filtro y paginación, vacíos, error/reintento con datos conservados y descarte de respuestas obsoletas al cambiar rápido de línea, sin desbordamiento en 393×852. El [contrato de conexión](CONEXION-LINEAS-CATEGORIAS.md) detalla resultados y recorrido pendiente en Expo Go. TalkBack, escalado de fuente y movimiento reducido no se probaron físicamente.

- [x] Obtener líneas o categorías desde la API.
- [x] Mostrar las categorías disponibles.
- [x] Permitir seleccionar una categoría.
- [x] Filtrar los productos según la categoría.
- [x] Manejar categoría sin productos.
- [x] Verificar navegación.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

Los seis criterios se apoyan en la confirmación humana, no únicamente en la QA técnica. Solo siguen pendientes prueba funcional completa y revisión. El recorrido vacío de Expo Go se aceptó con datos sintéticos; la guía conserva como historia los diez grupos HTTP del helper, sin cambios de datos ni `.env`. El usuario informó que restauró el backend real; después se verificaron health correcto y cinco categorías reales sin categorías QA, con Metro 8082 activo. El siguiente recorrido de error/reintento de Líneas sigue pendiente. No se creó PR o push. Se conserva el orden Catálogo → Categorías → Detalle y Catálogo permanece 7/9.
