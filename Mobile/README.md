# INHALEX: base móvil

Proyecto Expo SDK 57 con React Native, TypeScript y Expo Router, identidad INHALEX y cinco pestañas. Registro, Login, Persistencia, Catálogo y Líneas están integrados. Líneas completó 8/8 mediante el [PR #7](https://github.com/David567rs/INHALEX-Movil/pull/7); Catálogo tiene 9/9 aceptados en rama, con integración de navegación pendiente y tarjeta abierta hasta el merge. David continúa en `feature/detalle-producto`: diseño, datos completos y cambio de producto aceptados en Expo Go, junto con error y recuperación (5/9). La navegación de Catálogo fue aceptada, sin cambiar el conteo 5/9 de Detalle; el usuario autorizó abrir el PR hacia `develop` para Zenaida, incluyendo los accesos de navegación a Favoritos y Bolsa; URL y CI todavía sin confirmar. Las actividades siguen el [plan](../docs/PLAN-DE-TRABAJO.md).

## Abrir el proyecto

Git Bash, desde cualquier ubicación:

```bash
cd /c/Users/David/Documents/INHALEX-Movil
npm ci --prefix Mobile
npm run dev:mobile
```

CMD:

```bat
cd /d C:\Users\David\Documents\INHALEX-Movil
npm ci --prefix Mobile
npm run dev:mobile
```

En la copia de Zenaida se sustituye INHALEX-Movil por INHALEX-Movil-Zenaida. Expo abre en el puerto 8082. Ambos equipos deben usar copias independientes; cada persona conserva su identidad Git local.

Escanea el QR con Expo Go en Android. Para LAN, el teléfono y la laptop deben estar en la misma red. El comando `npm run web:mobile` abre la vista web para comprobar navegación y diseño; esa revisión no sustituye la prueba en Android.

## API y configuración

El `.env` del servidor permanece en `Server/`. Para configurar la URL pública de la móvil, copia `Mobile/.env.example` a `Mobile/.env` y adapta `EXPO_PUBLIC_API_URL`. El valor inicial es `http://localhost:3200/api`; en desarrollo Android se sustituye el host de loopback por el host LAN privado de Metro o por `10.0.2.2` para el emulador. Con un teléfono físico y un túnel, usa explícitamente la dirección LAN del servidor o una URL HTTPS accesible.

La URL conserva el puerto de la API y su prefijo `/api`. La distribución exige una URL HTTPS explícita. La navegación se abre sin arrancar el servidor; para crear una cuenta o iniciar sesión el backend debe estar accesible.

Los valores `EXPO_PUBLIC_*` son visibles en la aplicación compilada. La móvil solo necesita la dirección pública de la API; las credenciales MongoDB, JWT, respaldos y llaves de servicio pertenecen al backend.

## Arquitectura

Las rutas están en `src/app`. `src/shared` contiene componentes reutilizados y movimiento accesible; `core` contiene tema, configuración y transporte HTTP. `bootstrap/createApplicationServices.ts` compone las dependencias concretas bajo demanda. Las pantallas reciben operaciones del dominio; la configuración de API no bloquea la navegación.

Registro e Inicio de sesión contienen entidades, contratos, casos de uso y errores en `domain`, Repositories y mapeadores en `data`, y Views/ViewModels en `presentation`. El dominio es independiente de Expo y HTTP. El POST público `/auth/register` envía cinco campos y descarta el token de la respuesta: crear una cuenta no inicia sesión.

Inicio de sesión usa POST `/auth/login`. Normaliza el correo sin modificar la contraseña; presenta carga, bloquea nuevos envíos y edición durante la espera, y cancela la espera al abandonar la vista. Los errores 401 no distinguen correo desconocido de contraseña incorrecta; 429 muestra un mensaje de demasiados intentos. Tras una respuesta válida, Cuenta muestra los datos públicos del usuario y permite cerrar sesión.

El JWT queda privado en el coordinador y se guarda en nativo mediante SecureStore: clave `inhalex.auth.access-token`, servicio `inhalex.auth.session`. Persistencia incluye lectura y verificación al arrancar, descritas abajo. En web se conserva solo en memoria durante la ejecución: el store no lo persiste y su lectura devuelve `null`. El cierre de sesión limpia el estado local e intenta eliminar el JWT guardado, e informa si no puede confirmar la eliminación. No revoca el JWT en el backend. No se guardan contraseñas. El [plan de trabajo](../docs/PLAN-DE-TRABAJO.md) distingue la aceptación de Login del alcance de las pruebas y aceptación de Persistencia en Expo Go.

## Comprobaciones

Desde la raíz, en Git Bash o CMD:

```bash
npm run typecheck:mobile
npm run lint:mobile
npm run test:mobile
npm run doctor:mobile
npm run export:mobile
```

La etapa integrada de Login pasó 105 pruebas móviles con Node 24, TypeScript ya instalado, transporte y almacenamiento simulados. Cubren URL, destino, errores, timeout, cancelación, JSON, validación y Repositories de Registro/Login, sesión actual y contrato del adaptador de almacenamiento; no acceden a MongoDB ni al servidor real. TypeScript, lint, Expo Doctor 21/21 y exportaciones Android/web pasaron en esa etapa. Las comprobaciones de la etapa integrada de Persistencia se detallan a continuación.

Por separado se comprobó Login con componentes Nest y MongoDB reales en un entorno temporal aislado: 201, 401 equivalente para correo desconocido o contraseña incorrecta, 400, 429 y GET `/auth/me` con Bearer. La QA web pasó acceso, errores, carga, doble toque, cancelación, cierre local y conexión interrumpida; su evidencia está en `docs/evidencias/inicio-sesion/`.

El 16 de octubre de 2026 el usuario confirmó en Expo Go que apareció el aviso con contraseña incorrecta, pudo entrar con la correcta y cerrar sesión sin errores. La [aceptación registrada](../docs/evidencias/inicio-sesion/expo-go-aceptacion.json) procede del chat; no incluye imágenes nativas. El flujo nativo espera las operaciones de escritura y eliminación de SecureStore: se aceptó su recorrido sin errores reportados, sin inspeccionar el almacenamiento ni probar restauración. Teclado y lector de pantalla en Android siguen sin evidencia específica.

Inicio de sesión completó 9/9 criterios y se integró mediante el [PR #4](https://github.com/David567rs/INHALEX-Movil/pull/4): aprobación de ZenaidaGR sobre `1b95841`, Backend CI y Mobile CI correctos y merge de David567rs a `develop` en `1031e00`, el 16 de octubre de 2026. La [evidencia de integración](../docs/evidencias/inicio-sesion/integracion-pr4.json) conserva los identificadores completos. La exportación Android comprueba el bundle JavaScript y los recursos: el AAB firmado se generará en la etapa de release.

## Persistencia de sesión integrada

Persistencia se desarrolló en `feature/persistencia-sesion` desde `1031e00` y completó 9/9 criterios. El usuario confirmó recuperación al reabrir, estado anónimo después de salir y recuperación mediante Reintentar sin introducir correo ni contraseña tras restablecer la API local. Las [respuestas exactas](../docs/evidencias/persistencia-sesion/expo-go-aceptacion.json) proceden del chat; el agente no observó directamente el dispositivo. La validación reúne la implementación, las pruebas automatizadas de 401 y la restauración válida aceptada; no se atribuye al usuario una prueba de token caducado en Android. ZenaidaGR aprobó el HEAD `f137d4821dd24dd087637df3fe367c80076372e2` del PR #5 y lo fusionó a `develop` el 17 de octubre de 2026, tras pasar Backend CI y Mobile CI. El merge es `d5171b2510a1ba6a17fa0d95d4e01a61cbbff7fb`; la [evidencia de integración](../docs/evidencias/persistencia-sesion/integracion-pr5.json) conserva sus padres. El usuario confirmó la tarjeta «Terminado».

`SessionTokenStore` ofrece `get`, `set` y `clear`. El provider inicia una restauración idempotente: lee el token y ejecuta `VerifySessionAction → SessionRepository → ApiSessionRepository → GET /auth/me`. Un cliente dedicado utiliza el token candidato, sin publicarlo como sesión actual. El mapeador transforma el perfil plano de la API en los cinco datos públicos del usuario. El snapshot que recibe la presentación contiene estado, usuario público y mensaje: `checking`, `anonymous`, `authenticated` o `recovery-error`; nunca incluye el JWT.

Cuenta e Inicio de sesión muestran carga, error y reintento según el estado. Un error recuperable permite iniciar otra sesión. Un login nuevo invalida la restauración anterior; el cierre de sesión cancela las operaciones anteriores, limpia el estado local e intenta borrar el token. Ante un token malformado o rechazado con 401 se intenta eliminarlo y se informa si el borrado falla. Si falla la conexión, se agota el tiempo o la API devuelve 503, se conserva el token guardado para reintentar, sin publicar un usuario autenticado antes de verificarlo. Web continúa sin persistencia del navegador: `get` devuelve `null` y `set/clear` no escriben en `localStorage` ni `sessionStorage`.

Las comprobaciones finales de Persistencia pasaron: 146 pruebas móviles, TypeScript global, lint sin advertencias, Expo Doctor 21/21 y exportaciones Android (1378 módulos) y web (926 módulos). También pasaron la API aislada y siete fases del coordinador en Node con HTTP real y almacenamiento simulado. Los resultados se documentan en [verificacion.json](../docs/evidencias/persistencia-sesion/verificacion.json), [api-verificacion-aislada.json](../docs/evidencias/persistencia-sesion/api-verificacion-aislada.json) y [coordinator-real-http.json](../docs/evidencias/persistencia-sesion/coordinator-real-http.json).

La QA web utilizó componentes de la aplicación y la API real, con lectura, escritura y borrado simulados mediante una ruta temporal de prueba. Sus capturas se identifican como web con almacenamiento simulado: no demuestran persistencia real del navegador ni SecureStore en Android. Esa ruta se eliminó antes de las exportaciones finales. La confirmación posterior de Expo Go acepta restauración, cierre/reapertura y aviso/reintento tras un fallo de la API local; no incluye token caducado en dispositivo, TalkBack ni inspección directa del almacenamiento. El [plan](../docs/PLAN-DE-TRABAJO.md) registra los nueve criterios completos y el cierre del PR #5.

## Catálogo: 9/9 aceptados en rama, integración pendiente

El [PR #6](https://github.com/David567rs/INHALEX-Movil/pull/6) quedó cerrado y fusionado por ZenaidaGR el 17 de octubre de 2026. Aprobó el HEAD `b98cbdc61e9b052dd4009300795ed4c4f0242bde` y Backend CI/Mobile CI pasaron sobre ese HEAD. El merge es `fc13bbf7afcd0ee81e9f0f7dadce8931852d9b78`; la [evidencia de integración](../docs/evidencias/catalogo-productos/integracion-pr6.json) conserva sus padres y las ejecuciones de CI.

El PR #6 dejó 7/9 (histórico), con revisión de código completada. La aceptación posterior de categoría conservada al volver del detalle y «Nuestra colección» sin filtro completa, junto con las pruebas acumuladas, 9/9 aceptados en rama. La navegación todavía debe integrarse mediante el PR de Detalle hacia `develop`; el usuario informó Trello actualizado y la tarjeta permanece abierta hasta ese merge. El agente no leyó ni modificó Trello en vivo.

El [contrato y comprobaciones de Catálogo](../docs/CONEXION-CATALOGO.md), el [diseño histórico](../docs/DISENO-CATALOGO.md) y las evidencias conservan sus límites: las pruebas aisladas utilizaron modelos Mongo simulados, las capturas son web y la aceptación nativa fue reportada por el usuario. Las 179 pruebas y exportaciones son resultados históricos de esa actividad.

## Líneas o categorías integradas: 8/8

ZenaidaGR aprobó el HEAD final `6e787da42ba9273032a21374b92f0f56b9bc1437` del [PR #7](https://github.com/David567rs/INHALEX-Movil/pull/7) y lo fusionó a `develop` en `b0b9856f7470d8f9b76a8de2d462b29ac3f2d4eb`, después de pasar Backend CI y Mobile CI sobre ese HEAD. La actividad completó 8/8; el usuario confirmó Trello actualizado/cerrado, sin lectura ni modificación del tablero por el agente. La [evidencia de integración](../docs/evidencias/lineas-categorias/integracion-pr7.json) conserva los datos completos.

Se conservan [contrato y QA](../docs/CONEXION-LINEAS-CATEGORIAS.md), [diseño histórico](../docs/DISENO-LINEAS-CATEGORIAS.md) y [confirmaciones de Expo Go](../docs/evidencias/lineas-categorias/expo-go-aceptacion.json). La aceptación humana incluyó selección, filtro, «Ver todos», vacío mediante datos sintéticos y error/recuperación con categorías y selección conservadas. El agente no observó el teléfono. Las 206 pruebas, TypeScript, lint sin advertencias, Doctor 21/21 y exportaciones Android 1415/web 963 son resultados de Líneas; no se atribuyen a la nueva etapa de Detalle.

## Detalle de producto: datos y errores aceptados en Expo Go (5/9)

El 18 de octubre de 2026 el usuario confirmó: «Ya revisé el diseño de Detalle de producto en Expo Go, amigo, y me gustó.». Ese mensaje aceptó el diseño (1/9 en ese momento). Después confirmó datos completos y cambio de producto, y finalmente aviso, datos conservados y recuperación tras reiniciar el backend: criterios 1, 2, 3, 4 y 7, 5/9. No se afirma que haya marcado esos puntos en Trello. La [aceptación](../docs/evidencias/detalle-producto/expo-go-aceptacion.json) procede del chat, sin observación directa del teléfono ni capturas nativas. David continúa en `feature/detalle-producto`; Zenaida permanece en `develop`, con su stash y `Server/.env` conservados.

La [conexión implementada](../docs/CONEXION-DETALLE-PRODUCTO.md) usa `useProductDetailViewModel/controller → GetProductDetail → ProductDetailRepository → ApiProductDetailRepository → HttpClient`, compuesta en `createProductDetailAction`. GET público `/products/:idOrSlug` aporta datos base y `longDescription`, `benefits`, `presentation` y `origin` disponibles. Mapea solo campos públicos, comprueba identidad y cancela consultas obsoletas; un fallo recuperable al actualizar conserva el producto y un 404 elimina el anterior. El usuario ya confirmó datos completos, cambio de producto y error/reintento en Expo Go. La [navegación fue aceptada](../docs/CONEXION-DETALLE-PRODUCTO.md#navegación-aceptada); no completa los criterios pendientes de Detalle ni cambia su 5/9. El usuario autorizó abrir el PR y aclaró que «Agregar acceso» significa navegar a las pestañas existentes. Corazón y bolsa ya abren «Ver favoritos»/«Ver bolsa», sin guardar favoritos, añadir productos ni simular un estado guardado. La [QA web de accesos](../docs/evidencias/detalle-producto/verificacion-accesos.json) pasó en 393 y 320 px, conserva cinco pestañas y no presenta desbordamiento. Se repitieron TypeScript, lint sin advertencias, 236/236 pruebas, Doctor 21/21 y exportaciones Android 1426/web 974 tras retirar la ruta QA. Los criterios 5/6 están técnicamente listos para aceptación; faltan su prueba nativa, el recorrido completo y la revisión. El conteo humano permanece 5/9. Las funciones completas corresponden a las actividades posteriores de Zenaida y no bloquean estos accesos.

Pasaron 236/236 pruebas (30 nuevas: 22 de dominio/datos y 8 del controlador), TypeScript, lint global sin advertencias, Doctor 21/21 y exportaciones Android 1426/web 974, ambas con salida 0. [HTTP real](../docs/evidencias/detalle-producto/api-http-real.json) comprobó solo GET sobre 3200. [La QA web](../docs/evidencias/detalle-producto/verificacion-api.json) usó HTTP temporal 3216 con snapshots de productos públicos y CORS para 8082; no prueba un dispositivo ni navegador contra el backend real. La ruta QA se eliminó y 3216 se cerró; backend, configuración, autenticación y los `.env` se conservaron.

El [diseño inicial](../docs/DISENO-DETALLE-PRODUCTO.md) usaba snapshots en memoria y Repository de lectura. [Su verificación histórica](../docs/evidencias/detalle-producto/verificacion-diseno.json) conserva 206 pruebas, TypeScript, lint, Doctor y exportaciones Android 1422/web 970, con QA web de snapshots inyectados debido a CORS. Esos resultados no prueban la conexión nueva. Catálogo tiene 9/9 aceptados en rama; la integración de la navegación espera el PR de Detalle y la tarjeta sigue abierta hasta el merge. No se declara PR o push nuevo.

## Versión

La base comienza en `0.1.0`, con `versionCode: 1`. El [esquema de versiones](../docs/VERSIONAMIENTO.md) conserva `0.y.z` durante desarrollo y `1.0.0` para la primera entrega estable. Firma y vinculación EAS se configurarán antes de esa entrega.

## Comprobación en Expo Go aceptada

El usuario aceptó restauración al reabrir, estado anónimo tras salir y reabrir, y el siguiente recorrido con la API local de su laptop: fallo de conexión → aviso → servidor restablecido → Reintentar → Cuenta recuperada sin correo ni contraseña. La confirmación es textual y no una observación directa del agente. Estos pasos permiten repetir el recorrido manteniendo la configuración existente.

Trabaja desde la copia de David. En Git Bash:

```bash
cd /c/Users/David/Documents/INHALEX-Movil
```

En CMD:

```bat
cd /d C:\Users\David\Documents\INHALEX-Movil
```

Si utilizas la API local y el backend no está activo, ejecuta `npm run dev:server` y mantén esa terminal abierta. En otra terminal de la misma raíz, ejecuta `npm run dev:mobile` si Metro no está iniciado. Si ya está abierto, pulsa `r` en su terminal para recargar el código, sin cerrar la sesión desde Cuenta.

Conserva la configuración existente de la API y mantén Metro accesible para el teléfono. Si la API es local y el host LAN no se detecta o Metro usa túnel, la URL pública debe apuntar a `http://<IPv4-de-la-laptop>:3200/api` en `Mobile/.env`; no cambies las credenciales del servidor.

1. Abre Cuenta e inicia sesión con una cuenta de prueba si todavía no aparece el usuario.
2. Fuerza el cierre de Expo Go. Interrumpe solo la conexión con la API, manteniendo Metro accesible, y reabre: debe mostrar un aviso con reintento y permitir abrir Login, sin dar por validada la sesión.
3. Restablece la conexión con la API y reintenta: debe recuperar la cuenta sin pedir la contraseña.

El [PR #5](https://github.com/David567rs/INHALEX-Movil/pull/5) ya está integrado con aprobación real y CI satisfactorio. Estos pasos conservan el alcance de su aceptación funcional; la prueba de lector de pantalla o TalkBack no está marcada como realizada.
