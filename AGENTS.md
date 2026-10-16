# INHALEX Movil

## Proyecto y contexto

Este repositorio tiene copias locales independientes para David y Zenaida. Obtén la raíz de la copia en la que estás trabajando con `git rev-parse --show-toplevel` y úsala explícitamente como directorio de trabajo. La copia de David está en `C:\Users\David\Documents\INHALEX-Movil` y la de Zenaida en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`. Conserva cada operación dentro de la copia indicada por el usuario y comprueba su raíz antes de modificar ramas o crear commits.

Lee `docs/PLAN-DE-TRABAJO.md` para conocer el reparto y las dependencias acordadas con el usuario. El proyecto anterior en `C:\Users\David\Documents\Proyecto-INHALEX` es una referencia para recuperar código; conserva sus archivos e historial salvo que el usuario solicite cambios allí.

## Orden de trabajo

El usuario organizó el plan antes de la implementación y autorizó la recuperación del código y los diseños existentes. El backend y la base móvil se integraron mediante los PR #1 y #2. Registro quedó integrado mediante el PR #3, con aprobación real de ZenaidaGR, checks aprobados y merge de David567rs a `develop` en `7d308e3`. El usuario comprobó creación de cuenta y correo duplicado en Expo Go. Registro descarta el token recibido y no inicia ni persiste sesión.

Inicio de sesión quedó integrado en `develop` mediante el PR #4 el 16 de octubre de 2026. ZenaidaGR aprobó el HEAD `1b95841b3058c91a90bda4b69ea715e9eef86e1f`, Backend CI y Mobile CI terminaron correctamente y David567rs fusionó el PR con el merge commit `1031e001b8d79dde662497ceed5f803549e48d20`. Los nueve criterios están satisfechos. El Repository envía POST `/auth/login`; el caso de uso normaliza el correo y conserva la contraseña exacta. El ViewModel administra validación, carga, bloqueo de envíos duplicados, cancelación y errores seguros: 401 genérico y 429. Una respuesta válida publica solamente los datos públicos del usuario en Cuenta y permite cerrar la sesión local.

El JWT permanece privado en el coordinador de sesión. En nativo se escribe y lee mediante SecureStore con clave `inhalex.auth.access-token` y servicio `inhalex.auth.session`; la lectura y restauración se incorporan en la rama de Persistencia descrita abajo. En web permanece únicamente en memoria: el store devuelve `null` al leer y no usa almacenamiento persistente del navegador. Cerrar sesión limpia el estado local e intenta eliminar el token guardado, mostrando un error si no confirma la eliminación; no revoca el JWT en el backend. Registro sigue sin iniciar sesión. No impongas la complejidad del registro al login ni alteres la contraseña.

La etapa integrada de Login contó con 105 pruebas móviles, TypeScript, lint, Expo Doctor 21/21 y exportaciones Android/web aprobados. La API real se comprobó con Nest y MongoDB temporales: 201, 401 equivalente para correo desconocido o contraseña incorrecta, 400, 429 y perfil con Bearer. La QA web pasó, incluidos carga, doble toque, cancelación, cierre local y conexión interrumpida. El 16 de octubre de 2026 el usuario confirmó en Expo Go los tres casos consultados: aviso con contraseña incorrecta, entrada con la correcta y cierre de sesión sin errores. La evidencia es su respuesta en el chat, registrada en `docs/evidencias/inicio-sesion/expo-go-aceptacion.json`; las imágenes del repositorio siguen siendo web.

La aceptación anterior de Login confirmó el flujo de escritura y eliminación de SecureStore sin errores reportados; esa respuesta no constituyó una inspección del almacenamiento ni una prueba de restauración. La nueva aceptación de reapertura pertenece a Persistencia y se registra abajo. Teclado y lector de pantalla en Android no tienen evidencia específica. La aprobación y el merge de Login están registrados en `docs/evidencias/inicio-sesion/integracion-pr4.json`; su tarjeta puede quedar «Terminado» (9/9), con el estado de Trello a cargo del usuario.

Ambas copias se actualizaron por fast-forward a `1031e00`. Zenaida permanece en `develop`, con su stash y `.env` conservados. David trabaja en `feature/persistencia-sesion`, creada desde ese commit. La implementación de Persistencia ya incluye `SessionTokenStore.get`, `VerifySessionAction`, `SessionRepository` y GET `/auth/me` con un cliente Bearer dedicado al token candidato. El provider inicia una restauración idempotente y el snapshot público distingue `checking`, `anonymous`, `authenticated` y `recovery-error`. Cuenta e Inicio de sesión presentan comprobación, avisos y reintento; un error recuperable permite iniciar otra sesión. Un login nuevo invalida la restauración anterior y cerrar sesión la cancela e intenta borrar el token. Ante un token malformado o rechazado con 401 se intenta eliminarlo y se informa si el borrado falla; red, timeout y 503 conservan el token guardado sin publicar una sesión autenticada.

La actividad está lista para PR con 8/9 criterios aceptados. El usuario confirmó en Expo Go recuperación al reabrir, estado anónimo tras salir y reabrir, y recuperación mediante Reintentar sin pedir correo ni contraseña después de que fallara y se restableciera la API local de su laptop. También confirmó que apareció el aviso. Las respuestas exactas están en `docs/evidencias/persistencia-sesion/expo-go-aceptacion.json`; son hechos reportados por el usuario, no observación directa del dispositivo por el agente. La validación del token se acredita con su implementación, las pruebas automatizadas de 401 y la restauración válida aceptada; no se afirma una prueba de token caducado en Android físico. Solo queda pendiente la revisión real de ZenaidaGR mediante el PR único de esta actividad hacia `develop`, cuya apertura autorizó el usuario. El usuario actualiza Trello.

Pasaron las comprobaciones finales de esta rama: 146 pruebas móviles, TypeScript global, lint sin advertencias, Expo Doctor 21/21 y exportaciones Android (1378 módulos) y web (926 módulos). La API aislada y las siete fases del coordinador en Node con HTTP real y almacenamiento simulado pasaron; esas pruebas no acreditan almacenamiento nativo. La QA web utilizó una ruta temporal `src/app/session-qa.tsx`, componentes reales y API real, con `get/set/clear` simulados. Esa ruta se eliminó antes de las exportaciones finales. Sus capturas se rotulan como web con almacenamiento simulado y no prueban persistencia real del navegador ni SecureStore en Android. Los resultados se documentan en `docs/evidencias/persistencia-sesion/verificacion.json`, `api-verificacion-aislada.json` y `coordinator-real-http.json`. La aceptación humana no incluye token caducado en dispositivo, TalkBack ni inspección directa del almacenamiento. Conserva un solo PR de esta actividad.

El nuevo proyecto Expo se ejecuta desde Mobile/, mientras que la app fuente se conserva en Mobile/inhalex-app/. Reutiliza los recursos por actividad siguiendo las ramas y PR del plan.

El flujo acordado para la ejecución es documentación inicial en `main`, creación de `develop`, PR de base del backend, PR de base móvil y PR por actividad funcional. El nuevo historial debe mostrar ese flujo desde el inicio. Recupera el código mediante importaciones y adaptaciones declaradas en sus PR; inicia Git en esta raíz sin copiar la carpeta `.git` del proyecto anterior.

Las ramas funcionales parten de `develop` y sus PR apuntan a `develop`. David y Zenaida revisan los PR del otro desde sus cuentas. Las ramas y responsables detallados están en el plan; no reasignes actividades por conveniencia técnica.

David567rs es el propietario y administrador. ZenaidaGR aceptó la invitación y tiene escritura, sin administración. La regla activa de `main` permite integraciones solo a David mediante PR y mantiene las comprobaciones y revisión obligatorias. Zenaida puede revisar PR hacia `main`, pero no actualizar ni fusionar esa rama. Consulta `docs/CUENTAS-Y-PERMISOS.md` para preparar la identidad Git y la autenticación de cada copia; no cambies la configuración global ni crees commits o revisiones en nombre del otro integrante.

## Arquitectura

La aplicación prevista es Android con Expo, React Native y TypeScript. Consume la API NestJS; MongoDB permanece detrás del backend.

- `presentation`: pantallas, componentes y ViewModels; las vistas muestran estado y ejecutan acciones.
- `domain`: entidades, contratos de repositorios, casos de uso y errores independientes del transporte y de React Native.
- `data`: implementaciones de Repository, API, almacenamiento, DTO y mapeadores.
- `bootstrap`: composición e inyección de dependencias concretas.
- `core`: configuración y servicios técnicos compartidos.

Las pantallas no realizan peticiones HTTP. El dominio no importa implementaciones de `data` ni errores del cliente HTTP. Los ViewModels utilizan las operaciones del dominio; `bootstrap` conecta las implementaciones.

Avisos pertenece a Zenaida y consiste en una bandeja dentro de la app con consulta de avisos y estado leído.

## Validación y entrega

Al incorporar código, define comprobaciones reales para su alcance. Los PR de funcionalidades incluyen evidencia del comportamiento, validaciones pertinentes y revisión del compañero. Conserva los checklists de las actividades y vuelve a verificarlos en el nuevo proyecto.

La release parte de `develop`, pasa por QA, se integra en `main` y devuelve sus correcciones a `develop`. El tag de versión apunta al commit aprobado de `main` y dispara el build Android firmado. Firma, EAS y publicación se configuran en su etapa correspondiente.
