# Plan de trabajo de INHALEX Movil

**Actividad vigente:** Seguimiento conectado y verificado técnicamente en `feature/seguimiento-pedido`, David, base `930d202`, con MVVM y Repository. Diseño `34b4f83`, aceptación visual `14b8453` y API en su propio commit local. **0/8** criterios funcionales pendientes del usuario; primera prueba en Expo Go: abrir un pedido desde Historial y Actualizar seguimiento. Pasaron 677 pruebas móviles, 50 backend, TypeScript/lint, Doctor y exportaciones Android/web. No publicar ni abrir PR ahora. El último apartado prevalece; Historial sigue integrado **9/9** mediante el PR #15.

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

## Estado vigente: Direcciones de envío, diseño pendiente de aceptación (0/10)

Este apartado prevalece sobre los estados históricos anteriores. El [PR #12](https://github.com/David567rs/INHALEX-Movil/pull/12), creado por David567rs, fue aprobado por ZenaidaGR sobre `ef60a37207c26dab1ee00c7869fb8e0f397d590c` a las `2026-10-19T11:49:28Z` y fusionado por ella a `develop` a las `11:49:37Z`, en `27d2495301bd52aa32749220c77f9dca24d0dde5`, con Backend CI y Mobile CI correctos sobre ese HEAD. La [evidencia de integración](evidencias/perfil-usuario/integracion-pr12.json) registra la revisión formal que completa **Perfil 10/10**, sin añadir aceptación nativa. El usuario confirmó después Trello actualizado; su estado vigente se registra en `evidencias/perfil-usuario/expo-go-aceptacion.json`. El agente no leyó ni modificó el tablero.

La tarea actual corresponde a David y se realiza solo en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/direcciones-envio`, creada desde `27d2495`. ZenaidaGR revisará el futuro PR a `develop`. Se conservan `.env`, servicios, identidades y el stash de Zenaida.

El [diseño de Direcciones](DISENO-DIRECCIONES-ENVIO.md) mantiene MVVM, Repository local de solo lectura y bootstrap. Cuenta → **Direcciones de envío** (etiqueta accesible **Ver diseño de direcciones**) abre `/direcciones-envio`, con **Vista previa**, **Direcciones de ejemplo para revisar el diseño**, composiciones **Con direcciones / Sin direcciones** y muestras Casa/Trabajo. **Nueva dirección** y **Editar** abren un borrador en memoria; **Cancelar** lo descarta y vuelve. **Guardar dirección**, eliminar, seleccionar y **Dirección principal** están deshabilitados. Número interior y Referencias son opcionales; Estado/Municipio o alcaldía se presentan sin asumir una ubicación real. No hay validación funcional, conexión a la API o persistencia. Se conservan cinco pestañas y sesión.

La captura contiene exactamente estos diez criterios, todos pendientes:

- [ ] Agregar formulario para registrar dirección
- [ ] Crear pantalla de direcciones
- [ ] Validar campos obligatorios
- [ ] Guardar dirección mediante la API
- [ ] Mostrar direcciones registradas
- [ ] Permitir seleccionar una dirección
- [ ] Permitir editar o eliminar una dirección
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Direcciones permanece **0/10**, con diseño pendiente de aceptación en Expo Go. Solo tras aprobarlo podrán aceptarse 1 y 2; muestras y borrador no completan los criterios 5, 6 o 7 ni otros funcionales. Las comprobaciones propias se registrarán con resultados reales en `evidencias/direcciones-envio/verificacion-diseno.json`; no se reutilizan conteos de Perfil. Esta etapa permanece local, sin commit, publicación ni PR. Tras aceptar el diseño se continuará con conexión, aceptación funcional y revisión real del compañero.

Verificación propia de Direcciones completada: TypeScript, lint, 424/424 pruebas existentes, Doctor 21/21, exportaciones Android/web y QA web a 320/397 px aprobados, según docs/evidencias/direcciones-envio/verificacion-diseno.json. Lista, formulario, borrador, Cancelar y regreso a Cuenta con cinco tabs verificados. La revisión técnica no sustituye la aceptación en Expo Go ni acredita funcionalidades reales; Direcciones sigue 0/10. Zenaida limpia en develop, .env, identidades, stash y servicios conservados.

## Estado vigente: Direcciones conectadas, aceptación funcional pendiente (2/10)

El usuario confirmó exactamente: «Amigo, ya revisé el diseño de Direcciones en Expo Go y me gustó. Sigamos con la conexión a la API en la misma rama feature/direcciones-envio, manteniendo MVVM y Repository.». La [aceptación textual](evidencias/direcciones-envio/expo-go-aceptacion.json) completa únicamente los criterios 1 y 2: **2/10**. Este apartado prevalece sobre el estado visual anterior. El agente no observó el teléfono ni leyó o modificó Trello; el marcado del usuario no está confirmado.

La [conexión de Direcciones](CONEXION-DIRECCIONES-ENVIO.md) está implementada solo en la copia de David, rama `feature/direcciones-envio`, con MVVM, Repository y bootstrap. GET/POST `/addresses` y PATCH/DELETE `/addresses/:addressId` requieren Bearer y devuelven la colección completa, máximo cinco. Seleccionar establece una dirección principal mediante `{isDefault:true}`, sin crear pedido o checkout. Incluye alta, edición, actualización, principal y eliminación con confirmación en pantalla, sin muestras en el recorrido normal. Una operación bloquea las demás; error conserva datos/borrador. Mutación incierta o GET recuperable fallido exige GET exitoso antes de otra escritura, sin reenvío automático. La reconciliación conserva los textos del borrador y marca `isDefault:true` si la dirección editada se confirmó principal. Salir/cambiar sesión limpia datos y descarta respuestas tardías; 401 limpia y bloquea hasta recuperar autenticación.

- [x] Agregar formulario para registrar dirección
- [x] Crear pantalla de direcciones
- [ ] Validar campos obligatorios
- [ ] Guardar dirección mediante la API
- [ ] Mostrar direcciones registradas
- [ ] Permitir seleccionar una dirección
- [ ] Permitir editar o eliminar una dirección
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

La primera prueba real será Cuenta con sesión de prueba → Direcciones → crear ficticia y verla → editar/actualizar → segunda dirección y cambio de principal → eliminar con confirmación y comprobar lista. Validación, vacío, error/reintento y reapertura/sesiones siguen después. La guía no acepta criterios sin confirmación posterior. La [verificación propia de conexión](evidencias/direcciones-envio/verificacion-api.json) pasó TypeScript/lint, 485/485 pruebas (61 nuevas), Doctor 21/21 y exportaciones Android/web. La QA web usó componentes/Repository/HttpClient reales con transporte y sesión simulados; a 320 px no hubo contenido exterior y se revisó la lista a 397 px. La ruta temporal `qa-direcciones` se retiró antes de los checks finales; la ruta real sin sesión está protegida y sin fixtures. Son resultados técnicos, sin aceptación nativa funcional adicional: se mantiene 2/10. Se conservan cinco pestañas, configuración, servicios, identidades, stash y la otra copia. Sin commit, publicación ni PR; la revisión real futura corresponde a ZenaidaGR.


## Estado vigente: Direcciones, flujo positivo aceptado en Expo Go (6/10)

Este último apartado prevalece sobre los estados anteriores. El usuario confirmó exactamente: «Amigo, ya pude guardar, editar, seleccionar como principal, actualizar y eliminar direcciones en Expo Go. ¿Qué marco en Trello y qué sigue?». La aceptación textual en docs/evidencias/direcciones-envio/expo-go-aceptacion.json completa los criterios 4, 5, 6 y 7, además del diseño 1 y 2: 6/10. No se observó directamente el teléfono ni se leyó o modificó Trello; el usuario todavía no confirmó el marcado del tablero.

Continúa solo en David, feature/direcciones-envio, con MVVM y Repository. El siguiente paso es probar validaciones en Expo Go: Guardar formulario vacío; luego datos de prueba con etiqueta A, teléfono de nueve dígitos y código postal de cuatro; corregir y guardar una sola vez. Interior y Referencias pueden quedar vacíos. No aceptar Validar campos obligatorios (3) antes de la confirmación. Después siguen vacío, error/reintento (8), recorrido de reapertura/salida/reingreso (9) y revisión real de ZenaidaGR (10). Mantener la tarjeta En progreso. Sin commit, publicación ni PR.

Esta actualización solo registra aceptación y guía; no modifica código ni repite pruebas. La evidencia técnica de conexión permanece como snapshot previo: 485/485 pruebas, TypeScript/lint, Doctor 21/21 y exportaciones aprobadas. Se conservan rama, cinco pestañas, servicios, configuración, identidades, stash y la otra copia.


## Estado vigente: Direcciones, validaciones aceptadas en Expo Go (7/10)

Este apartado prevalece sobre los estados anteriores. El usuario confirmó: «Amigo, rechazó los campos vacíos, la etiqueta de una letra, el teléfono de nueve dígitos y el código postal de cuatro. Al corregirlos guardó la dirección. ¿Qué marco en Trello y qué sigue?». Esto completa Validar campos obligatorios (3), además de 1, 2 y 4–7 ya aceptados: 7/10. La evidencia textual está en docs/evidencias/direcciones-envio/expo-go-aceptacion.json; no se observó el teléfono ni se aceptan límites superiores o formatos no reportados. Trello no fue leído ni modificado por el agente y su marcado sigue sin confirmar.

Siguiente prueba: vacío, en una cuenta de prueba, eliminando solo las direcciones ficticias hasta dejar cero. Comprobar Aún no tienes direcciones; Actualizar direcciones conserva el vacío sin error; Nueva dirección abre el formulario vacío y Cancelar vuelve al estado vacío. Este paso solo aporta evidencia parcial a Probar la funcionalidad (9). Después se guían errores/reintento (8), reapertura/salida/reingreso (9) y revisión real de ZenaidaGR (10). Mantener la tarjeta En progreso.

Solo se actualiza documentación y aceptación; no hay cambios de código ni nuevas ejecuciones de tests. Continúa en INHALEX-Movil, feature/direcciones-envio, con MVVM y Repository. Se conservan servicios, configuración, identidades, stash, cinco pestañas y la otra copia. Sin commit, publicación ni PR.


## Estado vigente: Direcciones, vacío aceptado y prueba de error/reintento pendiente (7/10)

El usuario confirmó: «Amigo, apareció «Aún no tienes direcciones», se mantuvo al actualizar y Nueva dirección abrió el formulario vacío. Cancelar regresó al vacío. Sigamos con la prueba de error y reintento.». Se registra como evidencia parcial de Probar la funcionalidad (9), sin completar un criterio adicional. Continúan aceptados 1–7 y pendientes 8, 9 y 10. El agente no observó el teléfono ni leyó o modificó Trello.

Próximo paso manual en Expo Go: con la API local encendida, crear una dirección ficticia, abrir Editar y cambiar un dato sin guardar. Mantener Expo Go y Metro abiertos; detener solo el backend local 3200 desde su terminal. Guardar y Reintentar deben fallar conservando el borrador y la colección confirmada, sin aviso de éxito. Reiniciar backend y pulsar Reintentar: GET debe conservar el borrador y habilitar Guardar, sin reenviar el cambio automáticamente; guardar una vez y actualizar después. Esta guía no acepta errores/reintento por anticipado. El criterio 8 espera confirmación y el 9 también requiere el recorrido final de reapertura/salida/reingreso. La revisión real futura corresponde a ZenaidaGR (10).

Inspección de solo lectura confirmó API 3200 PID30280 y Metro 8082 PID28288 / 8083 PID13476, sin detenerlos; Mobile solo tiene .env.example y su configuración de desarrollo apunta por defecto a API local 3200. No se cambió configuración ni código, ni se ejecutaron pruebas nuevas. Esta actualización documental mantiene rama feature/direcciones-envio en INHALEX-Movil, MVVM y Repository, estado 7/10, servicios, identidades, stash y la otra copia. Sin commit, publicación ni PR.


## Estado vigente: Direcciones, preparación de PR autorizada (9/10)

Este apartado prevalece sobre los estados anteriores. El usuario confirmó exactamente: «Amigo, las direcciones y la principal se conservaron al reabrir, se ocultaron al cerrar sesión y volvieron al ingresar con la misma cuenta. Abre el PR de Direcciones hacia develop para que Zenaida lo revise.». La evidencia textual en `evidencias/direcciones-envio/expo-go-aceptacion.json` completa **Probar la funcionalidad** (9). Están aceptados los criterios 1–9: **9/10**; solo **Revisar el código** (10) espera la revisión real de ZenaidaGR. El agente no observó el teléfono ni leyó o modificó Trello; no se acredita una prueba física entre dos cuentas distintas ni se confirma el marcado del tablero. Mantener la tarjeta **En progreso** hasta revisión e integración.

Ya están aceptados diseño, alta/lista, edición/eliminación, principal, validación de los casos reportados, vacío, error/reintento y reapertura/salida/reingreso con la misma cuenta. La [guía de conexión](CONEXION-DIRECCIONES-ENVIO.md) conserva el contrato y los límites de cada evidencia. La revisión técnica de agentes no sustituye el criterio 10.

El usuario autoriza commit y publicación de `feature/direcciones-envio` desde la copia de David, PR de David567rs hacia `develop` y solicitud de revisión a ZenaidaGR. El estado es preparación autorizada; todavía no se declara PR abierto ni número o URL. No fusionar por esta solicitud. La verificación previa registra 485 pruebas, TypeScript/lint, Doctor 21/21 y exportaciones; sus snapshots se conservan. Las comprobaciones finales de preparación se registrarán por separado con resultados reales y la CI se consultará sobre el HEAD publicado.

Mantener MVVM y Repository, configuración, servicios, identidades, stash, cinco pestañas y la otra copia. El cierre documental anterior de Perfil/PR #12 permanece como está. Esta actualización no ejecuta pruebas ni modifica código.


## Estado vigente: PR #13 de Direcciones abierto (9/10)

El [PR #13](https://github.com/David567rs/INHALEX-Movil/pull/13), Implementar Direcciones de envío con MVVM y Repository, está abierto por David567rs desde feature/direcciones-envio hacia develop. GitHub confirmó a ZenaidaGR como revisora solicitada. La implementación publicada es eeca4d86474e002f3a454dfd8de8b756bae1f70f; el recibo está en docs/evidencias/direcciones-envio/preparacion-pr13.json. Consultar la CI del HEAD vigente después del enlace documental: no se declara aprobada por los resultados locales.

Direcciones permanece 9/10: el usuario aceptó el recorrido en Expo Go, incluida reapertura y salida/reingreso con la misma cuenta. Solo Revisar el código (10) espera revisión real de ZenaidaGR. El agente no observó el teléfono ni leyó o modificó Trello; mantener la tarjeta En progreso hasta revisión e integración. No hay aprobación ni merge. Esta actualización enlaza el PR sin cambiar código funcional y conserva configuración, servicios, identidades, stash y la otra copia.


## Estado vigente: diseño de Creación de pedido, 0/11

Este apartado prevalece sobre los estados históricos anteriores. El [PR #13](https://github.com/David567rs/INHALEX-Movil/pull/13) de Direcciones fue aprobado por ZenaidaGR sobre `b022340c3d4e0f222966c1d6f9bc57100a693fea` el 19 de octubre de 2026 a las 22:07:51 UTC y fusionado por ella en `1808ba1cbcd8940c84759395c6818ee950aa140d` a las 22:07:59 UTC. Backend CI 39254776289 y Mobile CI 39254776306 terminaron correctamente sobre ese HEAD. La revisión formal completa Direcciones **10/10**, sin añadir prueba nativa nueva; evidencia en `docs/evidencias/direcciones-envio/integracion-pr13.json`. El usuario mostró la captura de aprobación y merge; no ha confirmado todavía el marcado final de Trello y el agente no leyó ni modificó el tablero.

Ambas copias se sincronizaron limpias con `develop` en `1808ba1` antes de esta actividad, conservando entornos, identidades, servicios y el stash de Zenaida `81196109270f00fa7edf03a8a8ec6f8bdc963131`. La tarea actual está solo en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/creacion-pedido`, creada desde ese commit; la copia de Zenaida permanece en `develop`.

El usuario autorizó **solo diseño** de Creación de pedido. La ruta `/creacion-pedido` se abre desde Bolsa mediante **Mostrar diseño de pedido**, visible incluso en anónimo o vacío; con bolsa cargada, el acceso inferior se llama **Ver diseño de pedido**. Presenta datos sintéticos en memoria, dos productos (129 × 2 + 119 = 377 MXN), envío por definir y Casa/Trabajo como direcciones de ejemplo. El ViewModel cambia las composiciones **Con productos / Sin dirección / Bolsa vacía** y la selección visual local; el caso de uso y Repository local de solo lectura se componen en bootstrap. **Confirmar pedido** queda deshabilitado, sin creación HTTP, confirmación de éxito, persistencia o limpieza de bolsa. No se consulta la cuenta, bolsa o dirección real desde esta vista previa; se conservan cinco pestañas y los módulos integrados.

La [guía de diseño](DISENO-CREACION-PEDIDO.md) y `docs/evidencias/creacion-pedido/expo-go-aceptacion.json` conservan el checklist exacto: **0/11**, sin aceptación visual del usuario ni funcional con la API. El checklist no incluye un punto independiente de diseño y las muestras no completan criterios reales de pedido. Las comprobaciones técnicas se documentan después de ejecutarlas y no acreditan dispositivo. Próximo paso: el usuario revisa la vista previa en Expo Go con Metro de David **8082**; después autoriza la conexión en la misma rama. No iniciar Historial, Seguimiento ni Avisos. Esta etapa no autoriza commit, publicación o PR.

## Verificación del diseño de Creación de pedido

La [verificación visual](evidencias/creacion-pedido/verificacion-diseno.json) registra TypeScript, lint, 485/485 pruebas existentes, Doctor 21/21, exportaciones Android/web y QA web a 320/397 píxeles CSS aprobados. La composición y la selección son muestras locales aisladas; Confirmar sigue inactivo. No existe aceptación nativa ni prueba funcional de creación: se mantiene **0/11**. El siguiente paso es revisar solo el diseño desde Bolsa en Expo Go (David 8082) y, después de la aceptación del usuario, continuar con la conexión en la misma rama. Sin commit, publicación ni PR.

## Estado vigente: Creación de pedido, conexión implementada y prueba funcional pendiente (0/11)

El usuario aceptó el diseño en Expo Go y autorizó continuar en `feature/creacion-pedido`: «Amigo, ya revisé el diseño de Creación de pedido en Expo Go y me gustó. Sigamos con la conexión a la API en la misma rama feature/creacion-pedido, manteniendo MVVM y Repository.». La [aceptación textual](evidencias/creacion-pedido/expo-go-aceptacion.json) registra diseño aceptado y **0/11 funcionales**; no existe un criterio independiente de diseño y no se completa ninguno por anticipado. La guía y verificación visual anteriores quedan como historia.

La [conexión](CONEXION-CREACION-PEDIDO.md) utiliza sesión, Bolsa, Direcciones y Perfil reales, cotiza con POST `/orders/draft/preview` y confirma con POST `/orders/confirm`, Bearer, firma y clave idempotente. No crea borradores mediante POST `/orders/draft`. Contacto editable para el pedido y selección local de dirección sin modificar la principal; cantidades, precios e incidencias se toman de la cotización del servidor. Se mantiene subtotal de productos y envío por definir, sin pago o total final inventado.

Recuperación por cuenta: en nativo, SecureStore guarda el intento antes del POST y el recibo antes de la limpieza; web usa solo memoria. Una respuesta incierta exige reintentar la misma entrada y clave de forma explícita; un recibo confirmado evita otro POST y permite únicamente actualizar Bolsa. Fallar almacenamiento bloquea el envío o limpieza, sin borrar registros corruptos automáticamente. La lease bloquea cambios locales; la Bolsa se limpia solo si su lectura actual y los productos normalizados del recibo coinciden con la entrada. La comparación no ofrece atomicidad frente a otro dispositivo entre GET y DELETE, límite del servidor sin modificar.

Próxima prueba: cuenta de prueba con una dirección ficticia válida y un producto de prueba; Bolsa → Continuar con mi pedido → revisar productos/cantidades/subtotal, dirección y contacto → Confirmar con bloqueo del doble toque → recibo En revisión → verificar Bolsa vacía si coincidía o conservada ante ajustes. Esperar respuesta del usuario antes de marcar. Las pruebas técnicas actuales se registran en `evidencias/creacion-pedido/verificacion-api.json`, sin atribuir pedidos reales al agente ni observación de Expo Go. Mantener En progreso, sin commit, publicación o PR. Continúa solo en David; conservar cinco pestañas, servicios, configuración, identidades, stash y copia de Zenaida. Historial, Seguimiento y Avisos siguen fuera de esta etapa.


## Verificación técnica de la conexión de Creación de pedido

La implementación actual pasó **558/558 pruebas** (73 nuevas sobre las 485 existentes), TypeScript, lint, Doctor **21/21**, exportaciones Android (1498 módulos) y web (1047 módulos), y `git diff --check`. La evidencia separada es `docs/evidencias/creacion-pedido/verificacion-api.json`. La QA web con UI/controladores/Repository reales y transporte/sesión simulados comprobó validación local, resumen, recibo, vacío, sin dirección, conflicto, respuesta perdida con un solo pedido y recuperación de limpieza sin otro POST de creación; no hubo desbordamiento horizontal a 320/397 píxeles CSS ni errores de consola. La ruta temporal `qa-pedido` fue retirada; la ruta real anónima pide iniciar sesión sin muestras.

Backend y Metro 8082/8083 respondieron HTTP 200 al cierre. Entornos, dependencias, identidades y stash se conservaron; Zenaida sigue limpia en develop1808ba1. El agente no detuvo servicios ni creó pedidos contra la API real. Diseño aceptado, **0/11 funcionales** pendientes hasta el reporte en Expo Go; la prueba positiva y luego validaciones/error/recuperación siguen el orden de la guía. Sin commit, push o PR.

## Estado vigente: Creación de pedido, recorrido positivo aceptado (7/11)

Este apartado prevalece sobre los estados anteriores. El usuario confirmó exactamente: «Amigo, revisé el resumen, seleccioné la dirección y confirmé. Apareció la referencia En revisión y la bolsa quedó vacía. ¿Qué marco en Trello y qué sigue?». La aceptación textual en docs/evidencias/creacion-pedido/expo-go-aceptacion.json completa los criterios **1, 2, 3, 4, 5, 7 y 9: 7/11**. Pendientes 6 (duplicados), 8 (errores), 10 (recorrido completo) y 11 (revisión real de ZenaidaGR). Mantener Trello En progreso; el agente no observó el teléfono ni accedió al tablero, y no se confirma aún el marcado del usuario. No se afirma prevención de duplicados por un único envío correcto.

Siguiente prueba en Expo Go de David (8082): agregar nuevamente un producto porque Bolsa quedó vacía; abrir Continuar con mi pedido. Probar nombre, correo y teléfono vacíos y luego nombre A, correo correo-invalido y teléfono 123456789. Pulsar Confirmar debe mostrar errores locales sin referencia ni limpieza de Bolsa; el botón puede seguir habilitado para mostrar esos errores. Notas es opcional. Restaurar datos válidos, comprobar que se retiran los avisos de campo y volver a Bolsa sin una confirmación válida adicional: el producto debe permanecer. Esta evidencia solo aporta a Probar la funcionalidad (10), sin aceptar otro criterio por adelantado. Después siguen vacío/sin dirección, errores/reintento, respuesta incierta, limpieza pendiente y recuperación al reabrir/cambiar sesión.

Solo se actualiza documentación y aceptación; no hay cambios de código, tests nuevos, commit, push o PR. Se conserva la verificación técnica previa de 558 pruebas como snapshot histórico. Continúa únicamente en INHALEX-Movil, feature/creacion-pedido, con MVVM y Repository; no modificar servicios, entornos, identidades, stash, cinco pestañas ni copia de Zenaida. Historial, Seguimiento y Avisos quedan para sus propias actividades.

## Estado vigente: Creación de pedido, validaciones de contacto aceptadas (7/11)

Este apartado prevalece sobre la guía anterior. El usuario confirmó exactamente: «Amigo, rechazó los campos vacíos, el nombre de una letra, el correo inválido y el teléfono de nueve dígitos. Corregí los datos y la bolsa conservó el producto. ¿Qué sigue?». Se añade la aceptación textual como evidencia parcial de Probar la funcionalidad (10), sin aceptar otro criterio: **7/11**, aceptados 1,2,3,4,5,7,9 y pendientes 6,8,10,11. No se acredita todo formato o límite superior, doble toque, fallos de red ni recuperación. El agente no observó el teléfono ni consultó Trello o MongoDB; el marcado del tablero continúa sin confirmar.

Próximo paso manual, solo Bolsa vacía: con backend activo y la misma cuenta de prueba en Expo Go de David8082, quitar únicamente los productos de prueba de Bolsa. Abrir Revisar pedido pendiente; esperar Tu pedido empieza en la bolsa, sin Confirmar pedido. Actualizar resumen conserva vacío sin error y Explorar catálogo abre Catálogo. Conservar las direcciones actuales; el caso sin dirección se hará posteriormente con otra cuenta de prueba sin direcciones. Si aparece recibo o recuperación pendiente, reportar antes de seguir sin reenviar una confirmación. Después faltan errores/reintento, incertidumbre, limpieza pendiente y recuperación de sesión. No dar por terminado el criterio10 ni prevenir duplicados6 con estas pruebas.

Solo documentación y aceptación; no código, tests nuevos, commit, push o PR. El snapshot técnico previo de 558 pruebas permanece histórico. Mantener En progreso y la rama feature/creacion-pedido de INHALEX-Movil, MVVM y Repository, cinco pestañas, servicios, configuración, identidades, stash y la copia de Zenaida. No iniciar otra actividad.

## Estado vigente: Creación de pedido, Bolsa vacía aceptada (7/11)

El usuario confirmó exactamente: «Amigo, apareció «Tu pedido empieza en la bolsa», se mantuvo al actualizar y «Explorar catálogo» abrió Catálogo. ¿Qué sigue?». La aceptación textual registra mensaje, vacío conservado al actualizar y navegación a Catálogo como evidencia parcial del criterio10, sin aceptar un criterio nuevo: 7/11, aceptados1,2,3,4,5,7,9; pendientes6,8,10,11. No se observó el dispositivo ni se consultó API real o Trello. Mantener En progreso; marcado del usuario todavía no confirmado.

Próximo paso: mantener backend y Expo Go de David8082 activos. En Cuenta, cerrar sesión e ingresar con otra cuenta de prueba sin direcciones (registrarla desde Registro si hace falta), conservando las direcciones de la original. Agregar producto de prueba y abrir Continuar con mi pedido: esperar Un destino para tu selección y Confirmar deshabilitado. Agregar dirección abre Direcciones con Aún no tienes direcciones; volver sin registrar conserva bloqueo. Este caso no crea pedido y sigue siendo evidencia parcial10. Después volver a una cuenta con dirección para error/reintento, incertidumbre, limpieza pendiente y recuperación.

Solo documentación y aceptación, sin código, tests nuevos, commit, push o PR. Snapshot técnico previo558pruebas sin repetir. Conservar feature/creacion-pedido en INHALEX-Movil, MVVM/Repository, cinco pestañas, servicios, configuración, identidades, stash y copia de Zenaida. No empezar otra actividad.

## Estado vigente: Creación de pedido, falta de dirección aceptada (7/11)

El usuario confirmó exactamente: «Amigo, sin dirección apareció «Un destino para tu selección» y Confirmar quedó bloqueado. Agregar dirección abrió Direcciones y, al volver sin crear una, siguió bloqueado. ¿Qué sigue?». Se registra como evidencia parcial del criterio10: **7/11**, aceptados1,2,3,4,5,7,9; pendientes6,8,10,11. Sin observación del teléfono, API real, MongoDB o Trello por el agente; marcado del usuario aún no confirmado. Mantener En progreso.

Próximo paso manual: regresar en Cuenta a la cuenta de prueba con dirección. Con API activa, agregar producto, abrir Continuar con mi pedido, elegir dirección/contacto válidos y nota Prueba de reconexión. Mantener pantalla, Expo Go y Metro abiertos. Detener solo API local3200 con Ctrl+C desde su terminal; Confirmar una vez debe fallar en la reconsulta previa conservando resumen/dirección/contacto/nota, sin referencia y con Confirmar bloqueado. Reintentar con API apagada vuelve a fallar. Reiniciar API con comando habitual; Reintentar recupera resumen, conserva nota y habilita Confirmar sin envío automático. Terminar con el pedido preparado, sin otra confirmación válida. Esta prueba no cubre incertidumbre después del POST ni duplicados; criterio8 espera reporte, luego siguen recuperación e idempotencia.

Solo documentación y aceptación, sin código, tests nuevos, commit, push o PR. El agente no detuvo servicios ni envió pedidos. Snapshot técnico previo558pruebas sin repetir; conservar rama feature/creacion-pedido en INHALEX-Movil, MVVM y Repository, cinco pestañas, entornos, identidades, stash y copia de Zenaida. No iniciar otra actividad.

## Estado vigente: Creación de pedido, error previo al envío y reintento aceptados (8/11)

El usuario confirmó exactamente: «Amigo, fallaron Confirmar y Reintentar sin perder los datos ni la nota. Reinicié el backend y Reintentar recuperó el resumen y habilitó Confirmar, sin mostrar una referencia nueva. ¿Qué marco en Trello y qué sigue?». Se acepta Manejar errores durante la creación (8) con alcance de fallo de la reconsulta previa al POST y recuperación conservando borrador: **8/11**, aceptados1,2,3,4,5,7,8,9; pendientes6,10,11. El reporte no acredita incertidumbre después de crear, duplicados, limpieza pendiente o persistencia duradera. El agente no observó teléfono ni consultó API real, MongoDB o Trello; el marcado continúa sin confirmar. Mantener En progreso.

Próxima prueba manual: backend activo y pedido de prueba ya preparado con dirección/contacto válidos. Hacer dos toques rápidos en Confirmar pedido en la misma pantalla; bloqueo inmediato y Confirmando si alcanza a verse. Esperar recibo En revisión, anotar y comunicar referencia, y volver a Bolsa para comprobar limpieza. Una referencia visible aporta evidencia de UI y no demuestra por sí sola unicidad en MongoDB. No aceptar6 por anticipado. Ante conflicto/error, reportarlo sin repetir envíos. Después faltan incertidumbre, limpieza pendiente y recuperación.

Solo documentación y aceptación; sin código, tests nuevos, commit, push o PR. El agente no detuvo servicios ni envió pedidos. La verificación previa de558pruebas sigue histórica; conservar feature/creacion-pedido en INHALEX-Movil, MVVM/Repository, cinco pestañas, servicios, entornos, identidades, stash y copia de Zenaida. No iniciar otra actividad.

## Estado vigente: Creación de pedido, doble toque aceptado (9/11)

El usuario confirmó exactamente: «Amigo, hice dos toques rápidos en Confirmar: se bloqueó el botón, apareció el recibo En revisión y la bolsa quedó vacía. ¿Qué marco en Trello y qué sigue?». Se acepta el criterio6 con alcance de doble toque bloqueado en Expo Go junto al código/tests previos: **9/11**, aceptados1-9 y pendientes10,11. No se observó el teléfono ni consultó API o MongoDB; el usuario no proporcionó referencia exacta y no se afirma unicidad en base de datos a partir de un recibo visible. Trello no leído/modificado; marcado del usuario sin confirmar. Mantener En progreso.

Próximo recorrido manual: mantener backend y Metro abiertos. Cerrar Expo Go por completo, reabrir QR de David8082; Bolsa debe seguir vacía y Revisar pedido pendiente mostrar Tu pedido empieza en la bolsa sin recibo/referencia nuevos. Cuenta cerrar sesión: Bolsa pide iniciar sesión. Ingresar con la misma cuenta: continúa vacía. No agregar ni confirmar otro pedido. Aporta a criterio10 sin completarlo todavía.

Después aún falta QA controlada de respuesta perdida posterior al POST y limpieza pendiente/recuperación. No hay control actual determinista sin montaje temporal; no presentar apagar red/cerrar app durante Confirmando como prueba de una fase exacta. El montaje futuro debe ser explícito y retirarse; no improvisar cambios de backend o entorno, ni abrir PR antes de terminar. Esta actualización solo documenta aceptación y guía, sin código, tests nuevos, commit, push o PR; agente no detuvo servicios ni envió pedidos. Conservar feature/creacion-pedido de INHALEX-Movil, MVVM/Repository, cinco pestañas, servicios, configuración, identidades, stash y copia de Zenaida. Snapshot558pruebas conservado.

## Estado vigente: Creación de pedido, reapertura aceptada y QA temporal de recuperación lista (9/11)

El usuario confirmó exactamente: «Amigo, al reabrir la bolsa siguió vacía y no apareció otro recibo. Al cerrar sesión pidió ingresar y, al volver con la misma cuenta, continuó vacía. ¿Qué sigue?». Aporta al criterio10 sin completarlo todavía; **9/11**, aceptados1-9 y pendientes10,11. El agente no observó teléfono ni consultó pedidos, MongoDB o Trello. Marcado del usuario sin confirmar; mantener En progreso.

Se preparó la herramienta temporal de desarrollo /qa-recuperacion-pedido, accesible desde Creación mediante Prueba de recuperación · simulada. Usa sesión, direcciones, contacto, productos y backend sintéticos, con View/ViewModel/controller/Repository reales y fetch inyectado sin fallback a red. Ningún pedido real. SecureStore QA nativo remapea prefijo inhalex.qa.order.attempt. y serviceinhalex.order.qa; instancia compartida por módulo serializa intentos/limpieza entre factories. Web usa memoria por runtime. Las navegaciones a cuenta/direcciones normales están suprimidas dentro del ejemplo; Salir regresa a la aplicación real. No modifica auth, backend, dependencias o entorno.

Verificado: TypeScript/lint,558/558pruebas y exportAndroid1502módulos. QAweb397x1000/320x820sin desbordamiento ni errores consola: respuesta perdida registra1pedido/1confirmación/2unidades, controladores nuevos recuperan pendiente sin POST y reintento termina1/2/0; limpieza falla conservando recibo1/1/2, controladores nuevos recuperan faseconfirmada y reintento termina1/1/0. Evidencia separada docs/evidencias/creacion-pedido/qa-recuperacion-verificacion.json, capturas qa-recuperacion-respuesta-web.png y qa-recuperacion-limpieza-web.png. Esto no acredita SecureStore físico o prueba de Expo Go. Servicios3200/8082/8083 activos y Zenaida limpia en develop1808ba1; entornos/dependencias/identidades/stash preservados.

Próximo paso nativo SOLOrespuesta perdida: recargar ExpoGo8082, Bolsa/Revisarpedidopendiente/enlaceQA, Probar respuesta perdida, Confirmar ejemplo, esperar La confirmación está pendiente y Pedidos simulados1. Pulsar Reabrir prueba SINcerrarExpoGo y luego Reintentar confirmación; esperar recibo y1pedido/2confirmaciones/0unidades. Terminar ahí sin Pasar a limpieza pendiente; segundo escenario tras reporte. Reabrir prueba crea controladores nuevos con backend/store vivos, no demuestra continuidad del backend ficticio al cerrar el proceso.

Retirar montaje después de aceptar ambos casos y antes de completar10/publicar: eliminar routeQA y los cuatro archivos de features/orderCreation/testing; quitar enlace/props temporales del OrderCreationScreen. Backup previo reconstruido y validado sintácticamente en TEMP/inhalex-order-screen-before-recovery-qa.tsx; hashes y regla de comparación en la evidencia. Si el screen cambió después de QA, fusionar manualmente, no sobreescribir nuevas ediciones. No tocar el resto de la rama. No commit, push o PR aún; preservar cinco pestañas y copia de Zenaida. El agente no detuvo servicios ni envió pedidos reales.

## Estado vigente: Creación de pedido, respuesta perdida simulada aceptada (9/11)

El usuario confirmó exactamente: «Amigo, en la prueba simulada recuperé la confirmación después de Reabrir prueba. Apareció el recibo y quedaron 1 pedido, 2 confirmaciones y 0 unidades. Sigamos con la prueba de limpieza pendiente.». Se añade evidencia parcial10 del recorrido guiado de Expo Go con datos/transporte sintéticos, sin un criterio nuevo: **9/11**, pendientes10,11. El agente no observó teléfono ni instrumentó SecureStore o consultó MongoDB/Trello. El reporte no acredita continuidad del backend ficticio tras cerrar Expo Go. El snapshot técnico previo de558pruebas/Android/QAweb permanece separado y no se repite.

Siguiente caso manual, mismo montaje: Pasar a limpieza pendiente (o Probar limpieza pendiente si volvió al menú), Confirmar ejemplo una vez; conservar recibo En revisión y esperar aviso de limpieza con1pedido/1confirmación/2unidades. Mantener Expo Go abierto; Reabrir prueba debe recuperar recibo confirmado y Reintentar actualización de bolsa terminar1pedido/1confirmación/0unidades. El contador de confirmaciones permanece1; si aparece Recuperar confirmación o aumentan envíos, reportar sin aceptar. Anotar resultado y pulsar Salir de la prueba para volver a pantalla normal antes de retirar la herramienta.

Tras el reporte, retirar SOLO rutaQA, cuatro archivos testing y props/enlace QA del OrderCreationScreen antes de completar10/publicar. Evidencia qa-recuperacion-verificacion.json conserva ruta/hash backup de Screen previo y hash QAesperado: comparar antes de restaurar para no perder nuevas ediciones. Luego verificaciones finales y futura revisión Zenaida11; no commit, push o PR todavía. Esta actualización solo documenta aceptación/guía, sin código o tests nuevos. Conservar feature/creacion-pedido en INHALEX-Movil, MVVM/Repository, cinco pestañas, servicios, configuración, identidades, stash y copia de Zenaida. Trello no accedido y marcado sin confirmar; mantener En progreso.

## Estado vigente: Creación de pedido, pruebas cerradas y QA retirada (10/11)

Este apartado prevalece sobre las instrucciones históricas de prueba. El usuario confirmó exactamente: «Amigo, se conservó el recibo al fallar la limpieza. Tras Reabrir prueba y reintentar quedaron 1 pedido, 1 confirmación y 0 unidades. Ya salí de la prueba. ¿Qué sigue?». Se completa Probar la funcionalidad (10) después de aceptar ambos escenarios simulados y terminar la retirada y comprobaciones finales: **10/11**, aceptados1-10; solo Revisar el código (11) espera la revisión real de ZenaidaGR. La aceptación se registra en docs/evidencias/creacion-pedido/expo-go-aceptacion.json. El agente no observó el teléfono, consultó MongoDB o accedió a Trello. Los contadores simulados no acreditan fallos reales del servidor ni continuidad del backend sintético después de cerrar el proceso.

Se eliminaron la ruta qa-recuperacion-pedido y sus cuatro archivos de soporte; OrderCreationScreen volvió al respaldo normal con SHA256 C1C7E97E1580E4896942E377597EAD41949F4E1CEEC0A2EE5942BF45AA776037, comprobando antes el hash temporal para conservar nuevas ediciones. No quedan referencias QA en Mobile/src o Mobile/tests. Pasaron las comprobaciones posteriores: TypeScript, lint, 558/558 pruebas, Doctor21/21 y exportaciones Android1498 y web1047 módulos. La evidencia final separada es docs/evidencias/creacion-pedido/cierre-pruebas-y-retiro-qa.json; los snapshots previos de API y QA se conservan como históricos.

Continúa feature/creacion-pedido de INHALEX-Movil en1808ba1, sin commits nuevos. Zenaida permanece limpia en develop1808ba1; se conservan entornos, dependencias, identidades, stash y servicios3200/8082/8083. MVVM, Repository y cinco pestañas se mantienen. No se crean pedidos reales desde el agente. Siguiente paso: el usuario marca Probar la funcionalidad y mantiene En progreso; después solicita abrir el PR hacia develop para ZenaidaGR. No hay autorización de publicación en este turno, PR abierto, aprobación formal ni merge. No iniciar Historial, Seguimiento o Avisos.

## Estado vigente: preparación autorizada del PR de Creación de pedido (10/11)

El usuario confirmó: «Amigo, ya marqué «Probar la funcionalidad». Abre el PR de Creación de pedido desde feature/creacion-pedido hacia develop para que Zenaida lo revise.». Esto autoriza preparar el commit, publicar la rama de David567rs y abrir el PR hacia develop solicitando revisión a ZenaidaGR. El criterio10 está marcado según su reporte; no se afirma lectura del tablero ni marcado nuevo de otros criterios. Se mantiene10/11, con Revisar el código11 pendiente. No se autoriza ni se realiza merge por esta solicitud.

La preparación verifica origen develop1808ba1, sin PR duplicado abierto. TypeScript, lint y558/558pruebas se comprueban nuevamente antes de publicar; Doctor21/21 y exportaciones posteriores a retirar QA se conservan en el recibo cierre-pruebas-y-retiro-qa.json para la misma implementación. No quedan herramientas temporales ni cambios del servidor, configuración o dependencias. Estado en preparación: todavía no se declara número/URL, revisión solicitada o CI aprobada. Conservar la otra copia limpia, identidades, entornos, stash y servicios; no iniciar otra actividad.

## Estado vigente: PR #14 de Creación de pedido abierto (10/11)

El PR #14, Implementar Creación de pedido con MVVM y Repository, está abierto por David567rs desde feature/creacion-pedido hacia develop: https://github.com/David567rs/INHALEX-Movil/pull/14. GitHub confirmó requested_reviewers=[ZenaidaGR]. El commit de implementación publicado y HEAD al crear es93940dd5b597929ae5be978546907a10be943994; base1808ba1. El recibo es docs/evidencias/creacion-pedido/preparacion-pr14.json. Backend CI39356903357 y Mobile CI39356903516 estaban en progreso sobre ese HEAD al solicitar revisión; consultar de nuevo el HEAD vigente después del commit de enlace documental antes de afirmar resultados. No se declara aprobación o merge.

Antes de publicar pasaron otra vez TypeScript, lint y558/558pruebas; Doctor21/21 y exportaciones Android/web de la misma implementación se conservan en cierre-pruebas-y-retiro-qa.json. Los árboles de Mobile/src y Mobile/tests se registran para comprobar que el enlace documental no altera código. El conector GitHub devolvió403en escrituras; creación y solicitud se realizaron mediante REST con la credencial Git existente, verificando David567rs y sin exponerla. La revisión técnica acotada no sustituye a ZenaidaGR.

Creación de pedido permanece10/11, con Revisar el código11 pendiente. El usuario confirmó marcar Probar la funcionalidad10; Trello no fue accedido por el agente. Mantener En progreso hasta revisión e integración. Conservar ambas copias, servicios, entornos, dependencias, identidades y stash; Zenaida sigue en develop1808ba1. No iniciar otra actividad ni fusionar este PR por la solicitud de apertura.

## Estado vigente: PR #14 de Creación de pedido aprobado e integrado (11/11)

Este apartado prevalece sobre el estado histórico de PR abierto. GitHub confirma la aprobación real de ZenaidaGR sobre50196363f46ac4028809506f7e4cf552009cd2c4 a2026-10-20T02:08:35Z y el merge realizado por ella a02:08:44Z en77b9ab5aa8ca4171669ddda8b42adee028cefc59 hacia develop. Fecha local:19deoctubrede2026. El merge tiene como padres1808ba1 y5019636. Backend CI39357046873 y Mobile CI39357046851 terminaron success sobre el HEAD aprobado. PR14cerrado/merged: https://github.com/David567rs/INHALEX-Movil/pull/14. Evidencia: docs/evidencias/creacion-pedido/integracion-pr14.json.

La revisión formal completa Revisar el código11 y deja Creación de pedido11/11, sin pruebas nativas nuevas ni observación del dispositivo. El usuario aportó captura de aprobación e integración; el marcado final de Trello y su traslado a Terminado aún no están confirmados. El agente no accede al tablero. Recomendar marcar Revisar el código, adjuntar PR14, añadir comentario de cierre y mover a Terminado. Luego el usuario solicita actualizar ambas copias con develop antes de la próxima actividad.

Este turno solo registra el cierre en la copia de David: sin cambiar ramas, sincronizar develop, detener servicios, modificar configuración/dependencias/identidades o tocar el stash. No hay commit o push nuevo, merge adicional del agente ni nueva actividad. Los snapshots técnicos anteriores y el montaje QA retirado permanecen históricos.

## Estado vigente: Trello confirmado y ambas copias actualizadas con develop tras PR #14

El usuario informó: «Amigo, ya actualicé Trello. Actualicemos INHALEX-Movil e INHALEX-Movil-Zenaida con develop antes de empezar la siguiente actividad.». Se registra su confirmación del cierre de Trello sin atribuir lectura o modificación del tablero al agente. Creación de pedido permanece11/11 e integrada mediante PR14.

Ambas copias están ahora en develop77b9ab5aa8ca4171669ddda8b42adee028cefc59, iguales a origin/develop. Se comprobó ascendencia para avance rápido y árbol idéntico entre5019636y77b9ab5. En David se avanzó develop comprobando su valor anterior y se cambió de rama conservando hash idéntico de los seis archivos locales de cierre. En Zenaida se aplicó merge--ff-only; quedó limpia. No se descartó, guardó en stash ni creó commit con los documentos; siguen locales en David para conservarlos en la siguiente rama autorizada.

Entornos, dependencias, identidades y stash se comprobaron contra el recibo previo. El stash de Zenaida81196109270f00fa7edf03a8a8ec6f8bdc963131 permanece intacto. Backend3200yMetro8082/8083 conservan los mismos procesos30692/28288/13476 y respondieron HTTP200; no se reiniciaron servicios ni instalaron dependencias. No hay cambios funcionales nuevos, pruebas nativas nuevas, push o actividad siguiente. Evidencia de sincronización en TEMP/inhalex-sincronizacion-pr14.json y en docs/evidencias/creacion-pedido/integracion-pr14.json. Próximo paso: el usuario indica la siguiente actividad y el alcance inicial de diseño; mantener MVVM y Repository.

## Snapshot histórico: diseño de Historial de pedidos en feature/historial-pedidos (0/9)

El usuario autorizó solo diseño de Historial de pedidos en INHALEX-Movil, manteniendo MVVM y Repository, y aportó captura con nueve criterios exactos. Se creó feature/historial-pedidos desde develop77b9ab5aa8ca4171669ddda8b42adee028cefc59, conservando los seis documentos locales de cierre del PR14. La copia de Zenaida continúa en develop77b9ab5 sin cambios. No se inicia la conexión a la API por esta autorización.

La ruta /historial-pedidos se abre desde Cuenta mediante Historial de pedidos, etiqueta Mostrar diseño de historial, visible también en anónimo. OrderHistoryPreviewScreen recibe desde bootstrap createOrderHistoryPreviewAction, que compone caso de uso con LocalOrderHistoryPreviewRepository. El ViewModel administra composiciones Con pedidos/Sin pedidos, filtros locales Todos/En curso/Completados y resumen desplegable de un ejemplo. Tres muestras inmutables EJEMPLO-001/002/003, fechas19/16/10octubre2026, estados En revisión/Confirmado/Completado, subtotales547/348/507MXN y3/2/3unidades. No se inventa un cargo de envío, pago o entrega; no se consulta sesión, historial real o almacenamiento. Cambiar composición/filtro borra selección. Sin pedidos muestra Aún no tienes pedidos y Explorar catálogo abre Catálogo. Seguimiento y repetir compra siguen fuera del alcance.

Pasaron TypeScript y lint después de los ajustes de accesibilidad,558/558pruebas existentes(sin tests nuevos),Doctor1.21.5con21/21,exportacionesAndroid1504módulosyweb1053. QAweb397x1000y320x820sin desbordamiento:listaordenada,filtros3/2/1,resúmeneslocalescorrectos,vacío,navegaciónCatálogo/Cuenta,registroalcanzableenCuenta ycincoTabsintactas. Radioschecked,filtrospressedyresumenexpandedseexpresanexplícitamenteparalawebsinquitaraccessibilityState nativo. Hay tres avisos web conocidos de componentes existentes(shadow,useNativeDriver,pointerEvents),sinerrorconsola; no se consideran prueba de API de Catálogo. El agente no observó el teléfono, TalkBack o texto ampliado nativo.

Guía docs/DISENO-HISTORIAL-PEDIDOS.md, checklist/aceptación pendiente docs/evidencias/historial-pedidos/expo-go-aceptacion.json y verificación técnica propia verificacion-diseno.json. Mantener0/9: la implementación de muestra no completa criterios funcionales, y el usuario aún no aprobó la pantalla en Expo Go. Después de esa aceptación se podrá marcar Crear pantalla de historial1; los demás esperan comportamiento real y pruebas futuras. El agente no leyó ni modificó Trello. Próximo paso: recargar Expo Go de David8082 y revisar Cuenta→Historial, muestras/resumen/filtros/vacío/regreso. Esperar su reporte antes de conectar API en la misma rama.

Se conservan servicios, entornos, dependencias, identidades y stash. Sin commit,push,PR o actividad siguiente. La revisión técnica acotada no sustituye la revisión formal futura de ZenaidaGR.

## Snapshot histórico: Historial aceptado funcionalmente, revisión real pendiente (8/9)

Después de aprobar el diseño, el usuario confirmó exactamente: «Amigo, aparecen mis pedidos con fecha, subtotal y estado. El resumen y Actualizar historial funcionan.». Se aceptaron **Obtener pedidos desde la API** (2), **Mostrar fecha, total y estado** (3, conforme al contrato de **Subtotal de productos**) y **Permitir seleccionar un pedido** (5). La confirmación posterior fue exactamente: «Amigo, apareció «Aún no tienes pedidos», se mantuvo al actualizar y «Explorar catálogo» abrió Catálogo.». Se aceptó **Mostrar mensaje si no existen pedidos** (6). Después informó exactamente: «Amigo, apareció el aviso y se conservaron los pedidos y el resumen. Al reiniciar el backend y pulsar Reintentar, desapareció el aviso y se recuperaron los datos.». Se aceptó **Manejar errores de conexión** (7). El reporte final fue exactamente: «Amigo, el orden y los filtros funcionan. Los pedidos volvieron al reabrir, se ocultaron al cerrar sesión y regresaron al ingresar con la misma cuenta.». Se aceptan **Ordenar los pedidos de forma clara** (4) y **Probar la funcionalidad** (8). Junto con **Crear pantalla de historial** (1), Historial queda **8/9**, aceptados 1–8; solo **Revisar el código** (9) permanece pendiente. La aceptación textual está en `docs/evidencias/historial-pedidos/expo-go-aceptacion.json`; el diseño y sus pruebas son snapshots históricos. El agente no observó el teléfono ni leyó o modificó Trello, y el marcado actual no está confirmado. No se infieren paginación real de más de 20 pedidos, segundo reintento con la API todavía detenida, TalkBack o texto ampliado. Pueden marcarse los puntos aceptados manteniendo la tarjeta **En progreso**.

La implementación continúa en la copia de David, `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/historial-pedidos` desde `develop77b9ab5`. Mantiene MVVM y Repository: `OrderHistoryScreen`, `useOrderHistoryViewModel` / `createOrderHistoryController`, `OrderHistoryActions`, `OrderHistoryRepository`, `ApiOrderHistoryRepository` y `HttpClient`, con composición en bootstrap y token privado. Solo usa GET autenticados `/orders/me`, `/orders/me?cursor=...` y `/orders/me/:id`. Los datos pertenecen a la cuenta identificada por JWT; la lista utiliza hasta 20 pedidos por página y cursor opaco, con fecha e ID descendentes. El resumen seleccionado consulta productos y dirección histórica disponibles, sin inferir envío, pago o entrega; los estados son **En revisión / Confirmado / Cancelado / Completado** y el importe **Subtotal de productos**.

**Actualizar historial** obtiene la primera página y **Cargar más pedidos** su continuación; **Todos / En curso / Completados** se aplican solo a los pedidos cargados de la sesión actual. Las lecturas recuperables conservan lista, cursor y resumen previos; un cambio de autorización o salida oculta datos y descarta respuestas tardías. Un 401 oculta el contenido del módulo sin publicar la información de otra cuenta. Actualizar con éxito vuelve a consultar el detalle seleccionado si sigue presente. No se añade seguimiento, escritura de pedidos, persistencia o repetición de compra.

La verificación técnica final propia pasó TypeScript, lint, **618/618 pruebas** (60 nuevas: 6 de dominio, 15 de Repository, 31 de controlador y 8 de HTTP en loopback), Doctor 1.21.5 **21/21** y exportaciones Android **1508** / web **1057** módulos. QA web sintética a 397/320 px comprobó lista, selección, filtros, error con datos conservados, reintento, vacío y 401, sin desbordamiento horizontal; la ruta real anónima conduce al login y Cuenta conserva cinco pestañas. La ruta temporal QA se retiró antes de exportar. La API real respondió 401 al GET `/api/orders/me` sin Bearer; no hubo consultas reales autenticadas o escrituras de pedidos. Ambos Metro respondieron HTTP 200 a su estado; configuración, dependencias, identidades y stash se conservaron. Evidencia actual: `docs/evidencias/historial-pedidos/verificacion-api.json`, separada del diseño histórico.

Guía de conexión: `docs/CONEXION-HISTORIAL-PEDIDOS.md`. La implementación y la validación funcional quedan cerradas. Siguiente paso: el usuario marca **Ordenar los pedidos de forma clara** (4) y **Probar la funcionalidad** (8), mantiene Trello **En progreso** y solicita abrir el PR desde `feature/historial-pedidos` hacia `develop`, con ZenaidaGR como revisora. El reporte no autoriza publicación: no crear commit, push o PR todavía. **Revisar el código** (9) exige la revisión real futura de ZenaidaGR y no se completa por revisión de agentes. Esta actualización solo documenta aceptación y siguiente paso; no ejecuta pruebas nuevas ni altera servicios, configuración, código o datos.

Creación de pedido permanece **11/11** e integrada mediante el PR #14; se conservan su cierre y la sincronización previa. Mantener las cinco pestañas, copia de Zenaida, backend, ambos Metro, entornos, dependencias, identidades y stash. No hay commit, push, PR o integración por esta autorización; la revisión real futura corresponde a ZenaidaGR hacia `develop`. No iniciar Seguimiento o Avisos por anticipado.

## Snapshot histórico: preparación autorizada del PR de Historial (8/9)

El usuario autorizó exactamente: «Amigo, ya marqué esos dos puntos. Abre el PR de Historial desde `feature/historial-pedidos` hacia `develop` para que Zenaida lo revise.». Confirma el marcado de **Ordenar los pedidos de forma clara** (4) y **Probar la funcionalidad** (8), sin atribuir acceso a Trello al agente ni extender el reporte a otros criterios. Historial continúa **8/9**, aceptados 1–8; solo **Revisar el código** (9) espera revisión real de ZenaidaGR.

Se autoriza preparar commit/publicación de la rama de David567rs y PR hacia `develop`, solicitando revisión a ZenaidaGR. Este registro describe **preparación**, sin afirmar PR abierto, número, URL, revisión solicitada, aprobación o CI remota. No se autoriza merge. La propuesta de descripción está en `docs/PR-HISTORIAL-PEDIDOS.md` y sigue `.github/PULL_REQUEST_TEMPLATE.md`; se completarán el recibo y los enlaces después de confirmar la apertura.

La base es `77b9ab5`, integración de Creación de pedido mediante el PR #14. Historial reutiliza los contratos del backend existente y añade la conexión móvil de solo lectura, con MVVM, Repository y bootstrap; no modifica el servidor, dependencias o configuración. La última verificación pasó TypeScript, lint y **618/618 pruebas**; la repetición para preparar la publicación todavía no tiene un resultado nuevo declarado. Doctor **21/21** y exportaciones Android **1508** / web **1057** módulos se conservan como snapshot vigente de la misma implementación. La QA web usa datos sintéticos; la aceptación de Expo Go procede de los reportes del usuario y el agente no observó el dispositivo. Mantener la tarjeta **En progreso**, servicios, entornos, identidades, dependencias, stash y la otra copia. La revisión técnica de agentes no sustituye a ZenaidaGR; no iniciar Seguimiento o Avisos.

## Snapshot histórico: PR #15 de Historial abierto (8/9)

El [PR #15](https://github.com/David567rs/INHALEX-Movil/pull/15) está abierto por David567rs, desde `feature/historial-pedidos` hacia `develop`, sin borrador ni merge. GitHub confirmó `requested_reviewers=[ZenaidaGR]`. El commit de implementación y HEAD al abrir es `726101a8606ee92ad1a184c28d9649d6129fdf7b`; la base de la actividad sigue siendo `77b9ab5`, integración de Creación de pedido mediante el PR #14. Los documentos de cierre de ese PR se transportaron intencionalmente y conservan su alcance histórico.

Antes de publicar volvieron a pasar TypeScript, lint y **618/618 pruebas**. `npm run doctor` resolvió Expo Doctor **1.20.4**, con **21/21**, y Android exportó **1508 módulos** tras ampliar mínimamente la etiqueta accesible de cada pedido con fecha, estado, importe y unidades. Web (**1057 módulos**) y QA visual son snapshots anteriores a ese ajuste sin cambio visual; no se afirma que se repitieran. La evidencia técnica y la aceptación textual de Expo Go siguen separadas; no hay observación directa del dispositivo por el agente.

Al abrir, Mobile CI `39398704705` y Backend CI `39398704687` estaban en progreso sobre el primer HEAD. El enlace documental añadirá otro HEAD; comprobar sus checks vigentes antes de declarar CI final aprobada o plantear integración. Historial permanece **8/9**, criterios 1–8 aceptados y **Revisar el código** (9) pendiente. Los marcados 4 y 8 están confirmados por el usuario, sin acceso a Trello por el agente; mantener la tarjeta **En progreso**.

Siguiente paso: Zenaida abre el PR desde **ZenaidaGR**, revisa **Files changed** y, si está conforme, envía **Review changes → Approve → Submit review**. Esperar la confirmación de esa revisión y los checks del HEAD final; esta solicitud de apertura no autoriza el merge. La futura integración seguirá el flujo de merge commit hacia `develop`. Mantener MVVM/Repository, cinco pestañas, servicios, entornos, dependencias, identidades, stash y la otra copia. No iniciar Seguimiento o Avisos.

## Snapshot histórico: PR #15 de Historial aprobado e integrado (9/9)

GitHub confirma que el [PR #15](https://github.com/David567rs/INHALEX-Movil/pull/15) está cerrado y fusionado hacia `develop`. ZenaidaGR [aprobó el HEAD final](https://github.com/David567rs/INHALEX-Movil/pull/15#pullrequestreview-5583096544) `6a460b5e3b4df2aa0a8cce2ade1809ef8701d540` a las **2026-10-20T09:16:08Z** y realizó el merge a las **09:16:16Z**, en `930d2023ecb801ce985acaad8dfad03657a998ae`. Sus padres son `77b9ab5aa8ca4171669ddda8b42adee028cefc59` y `6a460b5e3b4df2aa0a8cce2ade1809ef8701d540`. Backend CI `39399080059` y Mobile CI `39399080064` completaron `success` sobre el mismo HEAD aprobado. Evidencia: `docs/evidencias/historial-pedidos/integracion-pr15.json`.

La revisión formal completa **Revisar el código** (9): Historial queda **9/9**. El cierre no aporta nuevas pruebas de Expo Go ni observación directa del teléfono por el agente; los resultados técnicos previos se conservan. El usuario había confirmado marcar 4 y 8, pero todavía no confirmó el marcado de 9 ni el cierre de Trello. El agente no leyó ni modificó el tablero.

Siguiente paso del usuario: marcar **Revisar el código**, adjuntar el enlace del PR #15, añadir comentario de cierre y mover la tarjeta a **Terminado**. Después solicitar actualizar ambas copias con `develop`. No sincronizar ni cambiar ramas por este cierre: David permanece en `feature/historial-pedidos` en `6a460b5` y Zenaida en `develop77b9ab5`. Este turno solo registra revisión e integración, sin nuevos commits, push, pruebas o cambios de código, servicios, configuración, dependencias, identidades o stash. El cierre del PR #14 y la historia técnica se conservan; la siguiente actividad espera el orden acordado y una solicitud del usuario.

## Snapshot histórico: Trello confirmado y ambas copias actualizadas tras PR #15

El usuario confirmó exactamente: «Amigo, ya actualicé Trello. Actualicemos INHALEX-Movil e INHALEX-Movil-Zenaida con develop antes de empezar la siguiente actividad.». Se registra su reporte del cierre de Trello; el agente no leyó ni modificó el tablero. Historial continúa **9/9**, integrado mediante el PR #15 con aprobación real de ZenaidaGR y ambas CI correctas sobre el HEAD final.

Las dos copias quedaron en `develop`, commit `930d2023ecb801ce985acaad8dfad03657a998ae`, iguales a `origin/develop`. En David se avanzó `develop` mediante fast-forward comprobando el valor anterior `77b9ab5`, y se cambió desde la rama funcional en `6a460b5` tras verificar árbol idéntico entre esta y el merge. Los seis documentos locales de cierre se respaldaron en TEMP y conservaron sus hashes SHA256 antes y después del cambio de rama. En Zenaida se hizo `merge --ff-only` y el árbol quedó limpio. Los documentos de cierre siguen locales en David, sin nuevo commit o push.

Se preservaron variables de entorno, dependencias, nombre/correo y usuario de credencial Git, y el stash de Zenaida `81196109270f00fa7edf03a8a8ec6f8bdc963131`. Los servicios backend **3200** y Metro **8082/8083** mantuvieron sus procesos **37472 / 28288 / 13476** y respondieron HTTP 200; no se reiniciaron ni se instalaron dependencias. Recibo: `TEMP/inhalex-sincronizacion-pr15.json`. Esta sincronización no agrega pruebas de dispositivo ni cambios funcionales.

El próximo paso del plan es **Seguimiento del pedido**, de David, en `feature/seguimiento-pedido`, empezando solo por diseño con MVVM y Repository. Esperar la solicitud del usuario antes de crear esa rama o iniciar trabajo; no se empieza la actividad por esta sincronización. Conservar las dos copias, servicios, entornos, identidades y respaldo. Los cierres de PR #14/#15 y sus verificaciones históricas se conservan.

## Estado vigente: diseño de Seguimiento del pedido, commits por fase (0/8)

El usuario autorizó solo el diseño de **Seguimiento del pedido** en la copia de David, `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/seguimiento-pedido`, manteniendo MVVM y Repository. Pidió guardar commits separados por fase. El cierre documental de Historial quedó previamente en el commit independiente `49df3b3`, sin modificar su aceptación **9/9** ni integración mediante PR #15. La rama de Seguimiento parte de `develop` en `930d2023ecb801ce985acaad8dfad03657a998ae` y conserva ese cierre separado; no reescribir la historia anterior.

La pantalla `/seguimiento-pedido`, desde Cuenta, muestra **Vista previa** y datos locales `EJEMPLO-...`. Bootstrap compone Repository local de solo lectura, caso de uso y ViewModel para seis composiciones: **En revisión**, **Confirmado**, **Completado**, **Cancelado**, **Pedido no encontrado** y **Error de conexión**. Los estados son hechos del ejemplo, sin prometer envío/entrega o fechas de etapas. El diseño no consulta la API ni utiliza credenciales o almacenamiento de Seguimiento; conserva sesión, historial, pedidos reales y backend. Se mantienen cinco pestañas e identidad INHALEX.

Checklist exacto de la captura del usuario, todos pendientes: **Obtener estado del pedido desde la API; Mostrar información del pedido; Mostrar estado actual; Actualizar la información correctamente; Manejar pedidos no encontrados; Manejar errores de conexión; Probar distintos estados del pedido; Revisar el código**. Seguimiento queda **0/8**. No existe criterio independiente de diseño: aprobar las muestras no completa información, actualización o errores reales. El agente no observó el teléfono ni leyó o modificó Trello. La [guía de diseño](DISENO-SEGUIMIENTO-PEDIDO.md) y [aceptación inicial](evidencias/seguimiento-pedido/expo-go-aceptacion.json) separan los alcances.

La [verificación propia](evidencias/seguimiento-pedido/verificacion-diseno.json) pasó: TypeScript, lint, **618/618 pruebas existentes** ejecutadas de nuevo, Doctor **1.20.4 21/21**, Android **1515 módulos** y web **1064 módulos**. QA web a **397×1000 / 320×820** comprobó las seis composiciones, actualización/reintento locales, cancelación terminal, resumen de 377 MXN, regreso/reentrada y cinco pestañas, sin desbordamiento y con controles nuevos de al menos 44 px. No hubo errores de consola; persisten dos advertencias de componentes compartidos (sombras y fallback de animación web). No sustituye Expo Go, TalkBack o texto ampliado.

El diseño se guarda en un commit local exclusivo `feat(orders): diseñar seguimiento del pedido`, según [VERSIONAMIENTO.md](VERSIONAMIENTO.md); obtener su SHA de Git. API y aceptaciones posteriores tendrán commits separados cuando el usuario autorice cada fase y se cuente con sus resultados. Se conservaron entornos, dependencias, identidades, stash, backend y ambos Metro; Zenaida permanece limpia en `develop` `930d202`. No hay publicación, PR, revisión o merge de Seguimiento.

Próximo paso: revisar las seis composiciones en Expo Go de David **8082**, desde Cuenta; esperar el reporte del usuario antes de conectar la API. La revisión futura del PR hacia `develop` corresponde a ZenaidaGR. Conservar servicios, entornos, dependencias, identidades, stash y la copia de Zenaida; no empezar Avisos o funcionalidades adicionales en esta etapa visual.

## Estado vigente: aceptación visual y autorización de conexión de Seguimiento

El usuario reportó: «Amigo, ya revisé el diseño de Seguimiento en Expo Go y me gustó. Sigamos con la API en feature/seguimiento-pedido, manteniendo MVVM, Repository y commits por etapa.». Se acepta el diseño de `34b4f83` y se registra esa aceptación en un commit documental propio. No hay observación directa del dispositivo ni acceso a Trello por el agente; **0/8** continúa hasta la aceptación funcional correspondiente.

La conexión conserva la misma rama, responsables, arquitectura y orden. Tendrá un commit independiente tras comprobar contrato, aislamiento por cuenta, actualización, no encontrado y errores. Después se guiarán las pruebas reales en Expo Go. No se autoriza publicación, PR o integración por esta solicitud; ZenaidaGR revisará el futuro PR hacia `develop`. Conservar ambas copias y servicios.

## Estado vigente: Seguimiento conectado, aceptación funcional pendiente (0/8)

La conexión está terminada con MVVM, Repository y bootstrap, guardada en su propio commit local de API después del diseño `34b4f83` y aceptación visual `14b8453`. No hay publicación o PR. Las aceptaciones posteriores se registrarán en commits separados al recibir cada reporte real. La [guía de conexión](CONEXION-SEGUIMIENTO-PEDIDO.md) conserva los ocho criterios exactos sin marcar y el orden de pruebas.

GET autenticados `/orders/me/:id` y `/orders/me/:id/tracking` aportan el conjunto de pedido; tracking es la autoridad del estado. Se conservan fechas null sin inventarlas, snapshots confirmados ante error recuperable y aislamiento por identidad/selección; 401, 403 y 404 retiran la información según su caso. Se abre desde el resumen seleccionado de Historial. Cuenta sin ID guía a Historial. No hay muestras en el producto, polling, almacenamiento, escrituras o cambios del backend.

La [verificación propia](evidencias/seguimiento-pedido/verificacion-api.json) registra **677/677 pruebas móviles**, incluidas 59 nuevas, **50/50 del contrato backend**, TypeScript/lint, Doctor **21/21**, Android **1521** y web **1070** módulos. La ruta temporal de QA se retiró antes de exportar. QA web sintética a 397/320 px comprobó actualización/estados, fecha ausente, selección, errores/reintento, 401/403/404 y salida, sin desbordamientos o errores de consola. HTTP loopback usó transporte real contra fixtures, no MongoDB real. La lectura local sin Bearer respondió 401; no se consultaron pedidos reales autenticados ni hubo escrituras. Se conservaron servicios y configuración, y Zenaida sigue limpia en `develop` `930d202`.

Siguiente paso: el usuario prueba en Expo Go **Cuenta → Historial → seleccionar un pedido → Ver seguimiento del pedido → Actualizar seguimiento** y reporta los datos reales. **0/8** hasta esa aceptación; no se marca Trello por pruebas técnicas. Después se guía no encontrado, error/reintento, estados disponibles y reapertura/sesión, respetando commits por fase. La revisión real queda para ZenaidaGR en el futuro PR autorizado. No avanzar a Avisos o publicación.
