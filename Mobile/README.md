# INHALEX: base móvil

El usuario aceptó el **diseño de Seguimiento del pedido** de `34b4f83` en Expo Go y autorizó conectar la API en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/seguimiento-pedido`, base `930d202`, manteniendo MVVM, Repository y commits por etapa. La aceptación visual se guarda en un commit documental separado; la conexión está en preparación. **0/8** criterios funcionales pendientes: el checklist no tiene criterio independiente de diseño.

La ruta `/seguimiento-pedido`, desde **Cuenta → Seguimiento del pedido**, permite revisar seis composiciones con **Vista previa** y datos `EJEMPLO-...`: **En revisión / Confirmado / Completado / Cancelado / Pedido no encontrado / Error de conexión**. Son muestras en memoria; no indican envío o entrega ni inventan fechas de etapas. En Expo Go de David (**8082**), recarga, revisa esos seis diseños, regresa a Cuenta y comprueba las cinco pestañas.

El usuario pidió commits por fase: el cierre de Historial se guardó aparte en `49df3b3` y este diseño se guarda en su propio commit local `feat(orders): diseñar seguimiento del pedido`. API y aceptación quedarán en commits separados cuando correspondan. Consulta la [guía de diseño](../docs/DISENO-SEGUIMIENTO-PEDIDO.md), la [aceptación pendiente](../docs/evidencias/seguimiento-pedido/expo-go-aceptacion.json) y la [verificación propia](../docs/evidencias/seguimiento-pedido/verificacion-diseno.json). En esta etapa pasaron TypeScript, lint, 618 pruebas existentes, Doctor 21/21 y exportaciones Android 1515/web 1064 módulos. La QA web a 397/320 px comprobó los seis escenarios y navegación sin desbordamientos; la revisión física en Expo Go sigue pendiente. No hay publicación o PR.

## Registros de las actividades anteriores

Historial de pedidos está completo: **9/9**, integrado mediante el [PR #15](https://github.com/David567rs/INHALEX-Movil/pull/15), aprobado y fusionado por ZenaidaGR con Backend CI y Mobile CI correctas. El usuario confirmó el cierre de Trello; el agente no leyó ni modificó el tablero. Ambas copias, **INHALEX-Movil** e **INHALEX-Movil-Zenaida**, están actualizadas en `develop`, commit `930d202`, iguales a `origin/develop`. La [evidencia de integración](../docs/evidencias/historial-pedidos/integracion-pr15.json) conserva revisión y merge; no se añaden pruebas nativas por este cierre.

Mantiene MVVM y Repository con `OrderHistoryScreen`, ViewModel/controlador, casos de uso, `ApiOrderHistoryRepository` y cliente HTTP compuestos en bootstrap. Solo consulta GET autenticados `/orders/me`, su continuación con cursor y `/orders/me/:id`; no crea o modifica pedidos, seguimiento, sesión o almacenamiento. El historial es personal de la cuenta actual: fecha, unidades, estado y **Subtotal de productos**, sin cargos o entregas inferidos. **Actualizar historial** recarga la primera página; **Cargar más pedidos** consulta la siguiente página de hasta 20. **Todos / En curso / Completados** filtran únicamente los pedidos ya cargados.

La conexión conserva lista y resumen confirmados ante fallos recuperables, ofrece reintento explícito y oculta los datos al salir o cambiar de identidad de autorización. Antes de publicar volvieron a pasar TypeScript, lint y **618/618 pruebas** (60 nuevas); `npm run doctor` resolvió la versión **1.20.4**, con **21/21**, y Android pasó con **1508 módulos** tras añadir fecha, estado, importe y unidades a la etiqueta accesible del pedido. Web (**1057 módulos**) y la QA visual permanecen como snapshots anteriores a ese ajuste sin cambio visual, según [verificacion-api.json](../docs/evidencias/historial-pedidos/verificacion-api.json). La QA web sintética a 397/320 px comprobó lista, selección, filtros, error/reintento, vacío y 401 sin desbordamiento; la ruta QA se retiró antes de exportar. La ruta real anónima conduce al login y Cuenta conserva cinco pestañas. El agente solo verificó 401 sin Bearer contra el historial real; no hizo lecturas autenticadas reales ni escrituras de pedidos. Las cifras y muestras del [diseño](../docs/DISENO-HISTORIAL-PEDIDOS.md) son históricas. Consulta la [guía de conexión](../docs/CONEXION-HISTORIAL-PEDIDOS.md) y la [aceptación vigente](../docs/evidencias/historial-pedidos/expo-go-aceptacion.json).

La sincronización posterior al PR #15 está terminada:

1. Ambas copias están en `develop`, commit `930d2023ecb801ce985acaad8dfad03657a998ae`.
2. Se conservaron los seis documentos locales de cierre de David, respaldados y con los mismos hashes antes y después de cambiar de rama; siguen sin commit o push adicional. Zenaida quedó limpia.
3. Se conservaron entornos, dependencias, identidades y stash. Backend 3200 y Metro 8082/8083 mantuvieron sus procesos y respondieron HTTP 200; el recibo está en `TEMP/inhalex-sincronizacion-pr15.json`.
4. No se inició la siguiente actividad ni se creó una nueva rama. Según el plan, sigue **Seguimiento del pedido**, en la copia de David, empezando solo por diseño cuando el usuario lo solicite.

ZenaidaGR aprobó el HEAD `6a460b5e3b4df2aa0a8cce2ade1809ef8701d540` el **2026-10-20T09:16:08Z** y fusionó el PR a las **09:16:16Z**, en `930d2023ecb801ce985acaad8dfad03657a998ae`. Backend CI `39399080059` y Mobile CI `39399080064` terminaron correctamente sobre ese HEAD. Después, el usuario confirmó Trello actualizado y solicitó sincronizar ambas copias; esa operación ya terminó conservando configuración, servicios y cambios locales. El agente no observó el teléfono ni accedió a Trello; no se infieren paginación real de más de 20 pedidos, segundo reintento con la API detenida, TalkBack o texto ampliado. Los registros siguientes conservan las actividades anteriores.

**Creación de pedido quedó integrada en `develop` mediante el [PR #14](https://github.com/David567rs/INHALEX-Movil/pull/14): 11/11 criterios completos.** ZenaidaGR aprobó el HEAD `5019636` y realizó el merge en `77b9ab5` el 19 de octubre de 2026, hora de Ciudad de México; Backend CI y Mobile CI pasaron sobre el HEAD aprobado. La revisión real completa **Revisar el código (11)** sin añadir pruebas nativas nuevas. Consulta la [integración](../docs/evidencias/creacion-pedido/integracion-pr14.json), la [guía de conexión](../docs/CONEXION-CREACION-PEDIDO.md), la [aceptación](../docs/evidencias/creacion-pedido/expo-go-aceptacion.json), el [cierre de pruebas](../docs/evidencias/creacion-pedido/cierre-pruebas-y-retiro-qa.json) y la [preparación del PR](../docs/evidencias/creacion-pedido/preparacion-pr14.json). El usuario confirmó que actualizó Trello; el agente no leyó ni modificó el tablero. Ambas copias quedaron actualizadas en develop77b9ab5, conservando configuración, identidades, stash y servicios. La documentación local de cierre permanece conservada en la copia de David. Los estados posteriores son históricos; la próxima actividad espera la solicitud del usuario.

El recorrido vigente usa datos autenticados de Bolsa, Direcciones y Perfil, cotiza con POST `/orders/draft/preview` y confirma con POST `/orders/confirm`, Bearer y una clave idempotente. El Repository, los casos de uso y el controlador se componen en bootstrap; la vista no conoce HTTP, credenciales ni claves privadas. La selección de dirección solo afecta al pedido, sin modificar la principal. El contacto es editable y el resumen presenta precios y cantidades del servidor, incidencias, subtotal de productos y **Envío: Por definir**; no inventa un total cobrado ni pago completado.

En nativo, un intento por cuenta se guarda en SecureStore antes de enviar y el recibo confirmado se guarda antes de limpiar Bolsa. Una respuesta incierta requiere reintentar explícitamente con la misma entrada y clave. Un recibo confirmado permite recuperar solo la actualización de Bolsa; su fallo conserva el recibo y evita crear otro pedido. Web conserva la recuperación únicamente en memoria, igual que su sesión: no garantiza continuidad tras una recarga completa. La lease de checkout bloquea modificaciones locales; la limpieza exige comparar la Bolsa actual, la entrada original y los productos normalizados confirmados. GET seguido de DELETE no garantiza atomicidad frente a otro dispositivo, limitación del backend existente.

## Pruebas terminadas y herramienta temporal retirada

El usuario aceptó ambos escenarios simulados en Expo Go: respuesta perdida recuperada tras **Reabrir prueba** y reintentar con **1 pedido / 2 confirmaciones / 0 unidades**; limpieza pendiente con recibo conservado y recuperación con **1 pedido / 1 confirmación / 0 unidades**. Informó que salió de la prueba. Son datos sintéticos y reportes del usuario; el agente no observó el teléfono ni verificó esos contadores en la API real o MongoDB. Reabrir prueba creó controladores nuevos conservando el backend sintético, sin cerrar completamente Expo Go.

La ruta QA, sus cuatro archivos de soporte y los accesos/props temporales ya se retiraron. La pantalla normal se restauró verificando su hash contra el respaldo previo. Tras la retirada pasaron TypeScript, lint, **558/558 pruebas**, Doctor **21/21**, exportaciones Android (1498 módulos) y web (1047 módulos). La [verificación temporal](../docs/evidencias/creacion-pedido/qa-recuperacion-verificacion.json) se conserva como registro histórico separado. Antes de publicar volvieron a pasar TypeScript, lint y las 558 pruebas. La CI del HEAD final aprobado pasó y el PR #14 está cerrado y fusionado. Este cierre solo actualiza documentación y no repite pruebas ni inicia otra actividad.

## Primera prueba funcional en Expo Go (aceptada por el usuario)

Reutiliza el QR de David (**8082**) y recarga. Con una **cuenta de prueba**, una dirección ficticia válida y un producto de prueba en Bolsa:

1. Abre **Bolsa → Continuar con mi pedido** y revisa los productos, cantidades, subtotal, incidencias y envío por definir.
2. Elige una dirección guardada y revisa contacto y notas; no debe cambiar la principal de la cuenta.
3. Confirma y observa el bloqueo durante el envío, incluido un segundo toque rápido. Espera el recibo con referencia y estado **En revisión**.
4. Vuelve a Bolsa: debe quedar vacía si los productos y cantidades coincidían; si se detectaron cambios o ajustes, revisa el aviso y la colección conservada.

El usuario ya confirmó este recorrido positivo: **7/11**, criterios 1, 2, 3, 4, 5, 7 y 9. El agente no creó pedidos contra la API real ni observó el teléfono. La [verificación técnica de la API](../docs/evidencias/creacion-pedido/verificacion-api.json) conserva su snapshot previo separado de esta aceptación. La [guía de diseño](../docs/DISENO-CREACION-PEDIDO.md) y sus 485 pruebas, Doctor y exportaciones son snapshots históricos de muestras. Mantener En progreso; pendientes duplicados, errores, prueba completa y revisión. Sin commit, publicación o PR hasta la solicitud correspondiente.

Se conservan identidad INHALEX, cinco pestañas, servicios, configuración y alcance de las otras actividades. La copia de Zenaida y su respaldo no forman parte de esta implementación. No iniciar Historial, Seguimiento ni Avisos.

## Etapas anteriores: registro histórico

Proyecto Expo SDK 57 con React Native, TypeScript y Expo Router, identidad INHALEX y cinco pestañas. Registro, Login, Persistencia, Catálogo, Líneas, Detalle, Búsqueda, Favoritos, Bolsa y Perfil están integrados. El [PR #12](https://github.com/David567rs/INHALEX-Movil/pull/12) de David567rs fue aprobado por ZenaidaGR sobre `ef60a37`, con Backend CI y Mobile CI correctos, y fusionado por ella a `develop` en `27d2495` el 19 de octubre de 2026. La revisión real completa **Perfil 10/10** y el usuario confirmó Trello actualizado; la [evidencia de integración](../docs/evidencias/perfil-usuario/integracion-pr12.json) conserva el recibo verificado. La actividad actual es la [conexión de Direcciones de envío](../docs/CONEXION-DIRECCIONES-ENVIO.md), solo en la copia de David, rama `feature/direcciones-envio`, con MVVM y Repository autenticado. El usuario aceptó el recorrido completo en Expo Go: **9/10**, criterios 1 a 9, y autorizó preparar el PR. Solo falta la revisión real de ZenaidaGR; mantener Trello **En progreso** hasta revisión e integración, sin marcado confirmado por el usuario. Este estado prevalece sobre las etapas históricas del README. Las actividades siguen el [plan](../docs/PLAN-DE-TRABAJO.md).

## Direcciones: preparación del PR autorizada (hito histórico)

> Direcciones ya está **10/10**, aprobada y fusionada con el PR #13. Los párrafos siguientes conservan la guía y el estado 9/10 anterior a su revisión.

El usuario confirmó exactamente: «Amigo, las direcciones y la principal se conservaron al reabrir, se ocultaron al cerrar sesión y volvieron al ingresar con la misma cuenta. Abre el PR de Direcciones hacia develop para que Zenaida lo revise.». La [aceptación](../docs/evidencias/direcciones-envio/expo-go-aceptacion.json) completa **Probar la funcionalidad** (9): **9/10**. El agente no observó el teléfono ni leyó o modificó Trello; no se atribuye una prueba física entre dos cuentas distintas.

Ya están aceptados diseño, alta/lista, edición/eliminación, principal, validación de los casos reportados, vacío, error/reintento y reapertura/salida/reingreso. Seleccionar significa establecer la principal de la cuenta, con máximo cinco direcciones; no crea pedido ni configura checkout. Se conservan las cinco pestañas.

Se autorizó commit y publicación de `feature/direcciones-envio` por David567rs, PR hacia `develop` y solicitud de revisión a ZenaidaGR. El estado es **preparación de PR autorizada**, sin declarar todavía apertura, número o URL. No hay autorización de merge. **Revisar el código** (10) sigue pendiente; Trello permanece **En progreso** hasta revisión e integración.

Si Metro de David no estuviera activo, desde `C:\Users\David\Documents\INHALEX-Movil`:

```sh
npm --prefix Mobile run start -- --port 8082
```

El [diseño y su verificación](../docs/DISENO-DIRECCIONES-ENVIO.md) se conservan como historia. La [verificación previa de conexión](../docs/evidencias/direcciones-envio/verificacion-api.json) pasó TypeScript/lint, 485 pruebas (61 nuevas), Doctor 21/21 y exportaciones Android/web. La QA web usó componentes, Repository y HttpClient reales con transporte y sesión simulados; los tests HTTP emplean sockets reales contra una API/almacenamiento simulados. La ruta temporal `qa-direcciones` se retiró y la ruta real anónima está protegida sin muestras. El snapshot técnico conserva su aceptación histórica; las confirmaciones posteriores dejan Direcciones en 9/10. Las comprobaciones finales de preparación se registrarán por separado sin inventar resultados ni CI remota. Se mantienen configuración, servicios, identidades, stash y la otra copia.

## Probar Perfil con datos reales

> Guía reproducible y registro histórico. Perfil está **10/10**, con aprobación real de ZenaidaGR y merge del PR #12; consulta la [evidencia de integración](../docs/evidencias/perfil-usuario/integracion-pr12.json). El hito 9/10 descrito abajo fue anterior a esa revisión.

El usuario confirmó exactamente: «Amigo, ya revisé el diseño de Perfil en Expo Go y me gustó. Sigamos con la conexión a la API en la misma rama, manteniendo MVVM y Repository.». La [aceptación](../docs/evidencias/perfil-usuario/expo-go-aceptacion.json) comenzó con el diseño y ahora incluye consulta, edición, validación, guardado y aviso visual: **9/10**. Las comprobaciones técnicas de GET/PATCH `/auth/me` ya finalizaron; el agente no observó el teléfono ni modificó Trello. El usuario ya confirmó rechazo de nombres inválidos y teléfono de nueve dígitos y el aviso **Tus datos se guardaron correctamente.**. El usuario confirmó fallo de Guardar y Reintentar conservando el borrador y recuperación del perfil con Guardar habilitado al restablecer la API. El usuario también confirmó conservación al reabrir, ocultación al cerrar sesión y recuperación con la misma cuenta, y autorizó abrir el PR hacia develop para revisión de ZenaidaGR.

Reutiliza el QR de Metro de David (`8082`) y la API habitual (`3200`). Inicia sesión en **Cuenta** con una cuenta de prueba y abre **Perfil del usuario**. Revisa los datos reales y el correo de solo lectura; entra en **Editar datos**, prueba **Cancelar** y un campo inválido, corrige y pulsa **Guardar cambios**. Espera confirmación y comprueba los datos en Perfil y Cuenta, al actualizar el perfil y al reabrir Expo Go. Después revisa salida y reingreso con la misma cuenta. La [guía de conexión](../docs/CONEXION-PERFIL-USUARIO.md#primera-prueba-real-en-expo-go) detalla cada paso; ningún resultado está aceptado por anticipado.

Si falla la conexión al guardar, se conserva el último perfil confirmado y se exige consultar el perfil con éxito antes de volver a guardar. Editar o Cancelar no elimina ese aviso. La consulta mantiene el borrador que siga abierto para revisarlo; no reenvía los cambios automáticamente. El guardado confirmado también actualiza los datos públicos de Cuenta sin reemplazar la sesión.

Si Metro de David no estuviera activo, desde `C:\Users\David\Documents\INHALEX-Movil`:

```sh
npm --prefix Mobile run start -- --port 8082
```

El [diseño y su verificación](../docs/DISENO-PERFIL-USUARIO.md) se conservan como historia. La [verificación de conexión](../docs/evidencias/perfil-usuario/verificacion-api.json) pasó TypeScript, lint, 424 pruebas, Doctor 21/21 y exportaciones Android/web. La QA web de componentes reales usa datos sintéticos y el test HTTP usa una API simulada sobre sockets reales; sus límites se distinguen de la aceptación nativa reportada por el usuario. Se mantienen las cinco pestañas, configuración y servicios. El [PR #12](https://github.com/David567rs/INHALEX-Movil/pull/12), de David567rs hacia `develop`, fue aprobado y fusionado por ZenaidaGR con ambas CI correctas sobre el HEAD final; Perfil completó 10/10. Ese cierre añade revisión e integración, sin una nueva prueba nativa.

## Probar Bolsa conectada a la API

> Registro histórico de aceptación y guía reproducible. El estado actual es **Bolsa 10/10**, con aprobación real de David567rs y merge del PR #11; consulta la [evidencia de integración](../docs/evidencias/bolsa-compras/integracion-pr11.json). Los hitos 7/10 y 9/10 descritos aquí ocurrieron antes de esa revisión.

El usuario aceptó el diseño y autorizó conectar la API en la misma rama. Su [confirmación posterior](../docs/evidencias/bolsa-compras/expo-go-aceptacion.json) acepta el recorrido de agregar, mostrar, cambiar cantidades, actualizar, quitar y totales correctos, y después los límites 1/25: **7/10**. El agente no observó el teléfono ni modificó Trello. El vacío, su actualización y **Explorar catálogo** también quedaron aceptados como evidencia parcial de la prueba completa. Error/reintento y el recorrido final de reapertura/salida/reingreso también quedaron aceptados: **9/10**. El usuario autorizó abrir el PR de ZenaidaGR hacia develop para David567rs; la [guía](../docs/CONEXION-BOLSA-COMPRAS.md) describe el recorrido. Se retiraron las muestras y el selector de vista previa; se conservan las cinco pestañas, la sesión y Favoritos integrado.

Reutiliza el QR de Metro de Zenaida (`8083`) y el backend en `3200`:

1. Inicia sesión en **Cuenta** y abre **Catálogo → un producto disponible → Agregar a mi bolsa**. Espera la confirmación.
2. Entra en **Bolsa** y comprueba foto, nombre, precio, cantidad y subtotal del producto.
3. Usa **+** y **−**, esperando cada confirmación, y comprueba que cambian cantidad e importes. Disminuir queda bloqueado en 1; aumentar queda bloqueado en 25.
4. Pulsa **Actualizar bolsa** y comprueba que conserva los datos confirmados sin error.
5. Pulsa **Quitar** y verifica que la fila desaparece tras la respuesta. Si era la última, aparece **Tu bolsa aún está vacía**.

El resumen presenta **Total de productos** según la API y **Envío: Por definir**, sin incluir envío. **Continuar con mi pedido** permanece deshabilitado. Tras una escritura fallida se conservan los datos previos y se exige **Reintentar** una lectura antes de otra mutación; no hay reenvío automático. El [contrato y guía](../docs/CONEXION-BOLSA-COMPRAS.md) detallan sesión, límites y la diferencia existente entre promociones de Bolsa y Catálogo. Pasaron 369 pruebas, TypeScript, lint, Doctor 21/21, exportaciones Android/web y QA web simulada. La evidencia técnica está en [verificacion-api.json](../docs/evidencias/bolsa-compras/verificacion-api.json). La aceptación de este hito histórico era 9/10; esos resultados técnicos no sustituyeron la revisión real del compañero, completada posteriormente.

Si Metro de Zenaida no estuviera activo, desde `C:\Users\David\Documents\INHALEX-Movil-Zenaida`:

```sh
npm --prefix Mobile run start -- --port 8083
```

## Probar Favoritos conectado a la API

La [conexión de Favoritos](../docs/CONEXION-FAVORITOS.md) está integrada en `develop`, con Repository autenticado y estado compartido entre la lista y el corazón del Detalle. El usuario confirmó guardar, actualizar, quitar, vacío, error/reintento, reapertura, limpieza al salir y recuperación al reingresar. La revisión formal de David567rs y el merge del [PR #10](https://github.com/David567rs/INHALEX-Movil/pull/10) completaron **9/9**; la [aceptación](../docs/evidencias/favoritos/expo-go-aceptacion.json) distingue el recorrido nativo reportado por el usuario de la revisión de código.

Reutiliza el QR de Metro de Zenaida (`8083`) y el backend en `3200`. Inicia sesión, abre un producto del Catálogo y pulsa **Guardar en favoritos**. Comprueba que aparece en **Favoritos**, actualiza la lista y entra en su Detalle; el corazón debe seguir marcado. Vuelve a la lista y prueba **Quitar**. Las muestras anteriores de Favoritos ya no aparecen en la aplicación normal. Se conservan las cinco pestañas.

Si Metro de Zenaida no estuviera activo, desde `C:\Users\David\Documents\INHALEX-Movil-Zenaida`:

```sh
npm --prefix Mobile run start -- --port 8083
```

## Probar la conexión de Búsqueda en la copia de Zenaida

Metro de esta copia utiliza `8083`; la copia de David conserva `8082` y la API compartida `3200`. Si ya está encendido, reutiliza su QR o abre `exp://192.168.1.77:8083` en Expo Go dentro de la misma red. La dirección LAN puede cambiar al cambiar de red. Entra en **Catálogo → Buscar productos**, escribe `Lavanda` y pulsa **Buscar**. Escribir, borrar y tocar sugerencias solo modifica el borrador; la consulta requiere envío explícito. Las tarjetas muestran los datos públicos reales de Catálogo y abren Detalle. La búsqueda distingue acentos: `café` y `cafe` pueden dar resultados diferentes. La [guía de conexión](../docs/CONEXION-BUSQUEDA-PRODUCTOS.md) separa la prueba de resultados de las comprobaciones posteriores de vacío y error/reintento.

Si Metro de Zenaida no estuviera activo, desde `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, en Git Bash o CMD:

```sh
npm --prefix Mobile run start -- --port 8083
```

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

El [diseño inicial](../docs/DISENO-DETALLE-PRODUCTO.md) usaba snapshots en memoria y Repository de lectura. [Su verificación histórica](../docs/evidencias/detalle-producto/verificacion-diseno.json) conserva 206 pruebas, TypeScript, lint, Doctor y exportaciones Android 1422/web 970, con QA web de snapshots inyectados debido a CORS. Esos resultados no prueban la conexión nueva. Catálogo tiene 9/9 aceptados en rama; la integración de la navegación espera el merge del PR #8 de Detalle y la tarjeta sigue abierta hasta entonces.

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
