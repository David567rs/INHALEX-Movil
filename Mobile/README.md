# INHALEX: base móvil

Proyecto Expo SDK 57 con React Native, TypeScript y Expo Router. Esta base recupera la identidad visual, Inicio, Experiencia y las cinco pestañas. Registro, Inicio de sesión y Persistencia están integrados; Cuenta muestra el usuario de la sesión validada. ZenaidaGR aprobó y fusionó el [PR #5](https://github.com/David567rs/INHALEX-Movil/pull/5) con ambas CI correctas el 17 de octubre de 2026 en `d5171b2` (9/9 criterios). El usuario aceptó el diseño de Catálogo en Expo Go y autorizó su conexión a la API en la misma rama; la conexión ya está implementada, con aceptación parcial de 3/9 y los restantes casos funcionales y revisión pendientes. Favoritos y Bolsa conservan su estado de preparación. Las actividades siguen el [plan](../docs/PLAN-DE-TRABAJO.md).

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

## Catálogo: API implementada y aceptación parcial 3/9

David trabaja en `feature/catalogo-productos` desde `d5171b2`; Zenaida permanece en `develop`, con su `.env` y stash conservados. El diseño de `CatalogScreen` y `ProductCard` originales se adaptó con seis JPEG de frascos y la identidad INHALEX. Durante la vista previa, el Repository suministró datos locales de demostración y el ViewModel administró la presentación y la elección de cuadrícula o lista, con dependencias compuestas en `bootstrap`.

Las imágenes y precios de demostración permitieron evaluar la composición visual; no acreditan inventario, disponibilidad o precios comerciales. La vista previa no consultó la API de productos ni implementó búsqueda, filtros, categorías, detalle, favoritos o bolsa. La restauración de sesión integrada conserva su propio comportamiento. La QA del diseño se realizó con la API de 3200 apagada, sin consultas del catálogo.

La etapa de vista previa pasó TypeScript, lint global sin advertencias, las 146 pruebas existentes, Expo Doctor 21/21 y exportaciones finales Android (1391 módulos) y web (939 módulos). No se añadieron pruebas para ese diseño estático. En web a 393×852 y 320×568 se comprobaron ambos modos sin desbordamiento horizontal, seis imágenes de 1024×1536 cargadas, desplazamiento hasta Rosas, Inicio → «Descubrir aromas» → Catálogo y Cuenta → Inicio. El selector usa áreas de 44×44, rol radio y estado `aria-checked` verificados en web.

El código usa una columna con `fontScale > 1.25` y conserva la política de movimiento reducido; escalado de fuente nativo, TalkBack y movimiento reducido en dispositivo no se ejercitaron. El [alcance de diseño](../docs/DISENO-CATALOGO.md) y la [evidencia histórica web](../docs/evidencias/catalogo-productos/verificacion-diseno.json) conservan esos límites.

El 17 de octubre de 2026 el usuario aceptó el diseño en Expo Go y autorizó conectar la API en esta misma rama, manteniendo MVVM y Repository. La [respuesta textual](../docs/evidencias/catalogo-productos/expo-go-aceptacion.json) registra la aceptación actual de tres criterios: diseño, obtención desde la API y presentación de nombre, imagen, precio y datos principales. El usuario confirmó también la actualización correcta, sin capturas nativas ni observación directa del agente. La API ya está implementada con el recorrido `CatalogScreen → useCatalogViewModel/controller → ListCatalog → CatalogRepository → ApiCatalogRepository → HttpClient`: GET público `/products?page&limit`, 20 por página, «Cargar más», actualización, reintento y cancelación con generaciones. El Repository local de diseño fue sustituido; sus capturas y JSON se conservan como evidencia histórica. El trabajo de Catálogo está en progreso; la tarjeta capturada está en «Por hacer» y el usuario puede moverla a «En progreso». No hay PR ni push de esta etapa. La actividad completa tendrá un único PR posterior.

La conexión pasó 179/179 pruebas (33 nuevas: 25 de Repository/caso de uso y 8 del controlador de presentación), TypeScript, lint sin advertencias, Doctor 21/21 y exportaciones Android (1406 módulos) y web (954 módulos). La QA final a 393×852 y 320×568 y los 12 grupos HTTP del entorno aislado se detallan en [CONEXION-CATALOGO.md](../docs/CONEXION-CATALOGO.md). Ese entorno usa Controller/Service/ValidationPipe reales con modelos Mongo simulados; no prueba una conexión a MongoDB real. Pasaron también lista vacía con «Volver a consultar», sustitución de datos anteriores, respuesta malformada con error seguro/reintento y fallo de red. El DOM confirmó los estados finales; las siete capturas están rotuladas por sus píxeles y no acreditan todos los errores ni el resultado final 23/23. La [evidencia final web](../docs/evidencias/catalogo-productos/api-verificacion.json) conserva esa distinción. La aceptación es 3/9; estado de carga, vacío, errores, navegación al detalle, prueba completa y revisión siguen pendientes. Detalle depende de `feature/detalle-producto` y no se implementa en este paso. La [guía de error/reintento](../docs/CONEXION-CATALOGO.md#prueba-local-de-error-y-reintento-pendiente) documenta el siguiente recorrido; todavía no se recibió su resultado.

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
