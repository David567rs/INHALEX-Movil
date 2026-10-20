# Conexión de Avisos

Actividad de ZenaidaGR en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/avisos`, basada en `develop` `0f0b764a4ad78e40f12112c4debcd7982ccdfd2c`. David567rs revisará el futuro PR hacia `develop`. El cierre anterior está separado en `6610412`, el diseño en `1f383f3` y su aceptación/autorización de API en `46c86aa`.

El usuario aceptó el diseño y autorizó conectar la API en la misma rama, con MVVM, Repository y commits por etapa. La conexión está verificada en `1b9d572`; el recorrido positivo (`fcc0c72`), vacío controlado (`7d97f85`) y error/reintento de carga fueron aceptados por reportes de Expo Go. El montaje `21ece6e` se retiró en `bb32a17`, con TypeScript/lint aprobados en esa etapa. Quedan pendientes continuidad por cuenta, prueba completa y revisión real; esta aceptación solo actualiza documentación.

Avisos está **7/9**: criterios 1-7 aceptados por reportes del usuario. El criterio 6 acredita una interfaz controlada0/0 y el 7 una prueba GET de carga y recuperación; no prueban una API vacía ni fallo de marcado PATCH. Los criterios 8 y 9 siguen pendientes. La [aceptación vigente](evidencias/avisos/expo-go-aceptacion.json) conserva las fuentes textuales; el [diseño](DISENO-AVISOS.md) y las verificaciones anteriores son historia. El agente no observó el teléfono ni leyó o modificó Trello, y el marcado no está confirmado.

## Contrato existente del backend

Las rutas requieren el Bearer de la sesión y son relativas al prefijo `/api`:

| Operación | Ruta | Contrato |
| --- | --- | --- |
| Consultar bandeja | GET `/notifications/me` | `{ items, unread }`, con los últimos **12** avisos de la cuenta y contador global de no leídos. |
| Marcar un aviso | PATCH `/notifications/me/:id/read` | Sin body; devuelve el aviso completo confirmado por el servidor. |

El controlador no expone parámetros de consulta o paginación para el listado: no se envían cursor, página, límite o filtro remoto. El servicio ordena por creación descendente y utiliza su límite predeterminado de 12. **Todos** y **No leídos** filtran únicamente los elementos cargados; no representan todas las notificaciones históricas ni permiten pedir otra página.

`unread` cuenta los avisos no leídos del conjunto personal completo, no solo los 12 cargados. Puede superar tanto la cantidad cargada como la cantidad de no leídos visibles. No se iguala al tamaño del filtro, no se decrementa por deducción del cliente y no demuestra por sí solo que todos los no leídos estén en pantalla.

Una bandeja vacía con `unread: 0` muestra **Aún no tienes avisos**. Si no hay elementos cargados pero `unread > 0`, muestra **No hay avisos recientes disponibles**, conservando el contador global sin afirmar que la cuenta carece de avisos. El filtro local No leídos sin coincidencias usa **Tus avisos recientes están al día** y aclara el alcance reciente aunque queden no leídos fuera de la lista.

El servidor aplica un filtro de propiedad por **`userId === JWT.sub` O `userEmail === JWT.email` normalizado**. Ese es el comportamiento existente; el cliente no envía otro usuario o correo para elegir propietario. La proyección móvil descarta `userId`, `userEmail` y `metadata`, conservando únicamente los campos públicos necesarios para presentar el aviso. El JWT permanece privado en el cliente de autorización compartido.

El aviso contiene ID, título, mensaje, tipo, severidad y las fechas disponibles de creación y lectura. `readAt: null` identifica un aviso no leído; las fechas ausentes permanecen ausentes o se presentan como no disponibles. No se fabrican con la hora del teléfono. Una respuesta de marcado debe corresponder al ID solicitado; una respuesta inconsistente no confirma un nuevo estado.

No existe un GET de detalle: el mensaje ya viene completo en el listado y se usa para el detalle local. El PATCH rechaza un ID inválido con **400** y también responde **400** si no encuentra un aviso propio, incluido uno ajeno; no se transforma ese contrato en un 404 ni se revela otro propietario.

Fuentes existentes: [controlador](../Server/src/modules/notifications/notifications.controller.ts), [servicio](../Server/src/modules/notifications/notifications.service.ts) y [schema](../Server/src/modules/notifications/schemas/customer-notification.schema.ts). Esta actividad no modifica esos archivos. El endpoint de marcado masivo existente queda fuera del alcance: no se agrega **Marcar todos como leídos**.

## MVVM, Repository y sesión

El recorrido mantiene **NoticesScreen → useNoticesViewModel / createNoticesController → casos de uso → NoticesRepository → ApiNoticesRepository → HttpClient**, con `Notice` como modelo y `NoticesProvider` para el ciclo de vida, compuesto en bootstrap con la autorización privada compartida. La vista comunica acciones y recibe estado público; no hace HTTP, no recibe el token y no decide el propietario de los avisos.

La conexión conserva la identidad visual aprobada y las cinco pestañas. Sustituye las escenas y datos de ejemplo por estados de carga, datos reales, vacío y error. Sin sesión se pide ingresar: no se representa una lista vacía como si fuera la bandeja personal. La bandeja no añade persistencia, polling, push, permisos del sistema, dependencias o configuración nueva.

Cada lectura o marcado queda asociado al objeto de autorización vigente. Salir, cambiar de cuenta o iniciar otra autorización, incluso de la misma cuenta, retira los datos previos y cancela/descarta respuestas tardías. **401** y **403** purgan el contenido personal del módulo; no se conserva una bandeja anterior después de una denegación. El manejo de sesión usa los contratos existentes sin exponer credenciales o persistir avisos entre cuentas.

## Abrir el detalle y marcar como leído

**Abrir un aviso solo consulta su detalle local. No marca leído ni ejecuta una escritura.** El marcado requiere pulsar explícitamente el botón **Marcar como leído** del detalle. Se evita repetir la acción mientras está pendiente y no se presenta un estado leído nuevo antes de validar la confirmación del PATCH.

Después del PATCH confirmado se conserva el aviso completo ya leído y se consulta GET `/notifications/me` para conciliar bandeja y contador global. El contador se toma de esa respuesta; no se calcula restando uno ni contando los elementos visibles.

Si ese GET posterior falla, **el aviso confirmado permanece leído**. Se informa que falta actualizar la bandeja/contador y **Reintentar** solo repite el GET: no vuelve a ejecutar el PATCH. El último contador confirmado no se presenta como una conciliación nueva. Un fallo de lectura o escritura no borra el snapshot personal anterior ni inventa una confirmación; la recuperación de una escritura incierta debe consultar el servidor antes de atribuirle un resultado.

Red, timeout o 5xx conservan el último snapshot confirmado de la misma autorización y ofrecen recuperación explícita. Los payloads, correos, metadata o diagnósticos del servidor no se exponen como mensajes de pantalla. El error de marcado 400 se presenta de forma segura y permite recuperar la bandeja, sin mostrar datos ajenos o forzar un estado leído.

## Criterios de Trello: 7/9

- [x] Crear sección de avisos
- [x] Obtener avisos disponibles
- [x] Mostrar título, mensaje y fecha
- [x] Diferenciar avisos leídos y no leídos
- [x] Permitir consultar el detalle
- [x] Mostrar mensaje si no existen avisos
- [x] Manejar errores de carga
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Los reportes del usuario aceptan 1-7; el 6 corresponde a la bandeja vacía controlada y el 7 a error/reintento GET de carga. Las pruebas técnicas no completan 8 o 9 por anticipado. La revisión formal corresponde a David567rs desde su cuenta, en un futuro PR de ZenaidaGR. Puede marcarse el 7 y mantenerse Trello En progreso; el agente no verifica ni realiza ese marcado.

## Snapshot histórico: primera prueba funcional, aceptada por reporte del usuario

Las comprobaciones propias de API ya pasaron y la conexión se registra en su commit separado. Recargar el proyecto de Zenaida **8083** y abrir **Cuenta → Avisos**, con backend local **3200** y Metro de David **8082** activos. El agente no inicia sesión, crea avisos o escribe en la API real para preparar esta guía.

1. Ingresar con la cuenta habitual de prueba y abrir **Cuenta → Avisos**. Esperar la carga y comprobar que se muestran avisos propios, sin rótulos o contenido de muestra.
2. Revisar título, mensaje y fecha disponible de los avisos. Si falta una fecha, debe identificarse su ausencia sin asignarle una fecha inventada. Distinguir leído/no leído y observar el contador global, que puede ser mayor que los avisos visibles.
3. Abrir el detalle de un aviso no leído, si existe. Comprobar el mensaje completo y volver a la bandeja: **abrirlo no debe marcarlo leído** ni cambiar por sí solo el contador.
4. Volver a ese detalle y pulsar explícitamente **Marcar como leído**. Esperar la confirmación y la actualización de la bandeja. Comprobar el estado leído y el contador conciliado por el servidor; no esperar necesariamente que coincida con el número de elementos cargados.
5. Pulsar **Actualizar avisos** en la bandeja. Comprobar que recupera la información y conserva el estado de lectura confirmado. Consultar un detalle leído no debe ejecutar otro marcado automáticamente.
6. Reportar el resultado antes de aceptar criterios. **Si la bandeja está vacía o no hay avisos no leídos, informar ese caso**; no crear avisos manualmente, modificar la base o fabricar pedidos/eventos para llenar la prueba. La ausencia de datos no constituye por sí sola una aceptación de marcado o diferenciación.

## Pruebas posteriores, todavía pendientes

Después del recorrido positivo se guiarán los casos necesarios, sin declararlos aprobados ahora:

1. **Filtro y detalle:** Todos/No leídos sobre elementos realmente cargados, diferenciación y consulta sin marcado automático.
2. **Vacío real:** respuesta vacía de una cuenta disponible para la prueba, actualización conservando el vacío y navegación correspondiente; no borrar avisos reales para fabricarlo.
3. **Error de lectura y recuperación:** aviso de error conservando la bandeja confirmada y GET explícito al reintentar. Si se prueba una interrupción local, conservar ambos Metro y los datos de la cuenta.
4. **Marcado confirmado con conciliación fallida:** conservar el aviso leído y recuperar mediante GET, comprobando que Reintentar no repita PATCH. La QA sintética ya cubrió técnicamente este caso, sin aceptación nativa. Si hace falta otro montaje manual para Expo Go, se acordará e identificará por separado; no se presenta esa futura prueba física como realizada.
5. **Reapertura y sesión:** recuperar la bandeja al reabrir, ocultarla al salir y recuperarla con la misma cuenta, sin atribuir caché persistente al módulo ni aceptar aislamiento ampliado entre cuentas por anticipado.
6. **Revisión formal:** después de los reportes y una solicitud expresa, preparar el PR de `feature/avisos` hacia `develop` y solicitar la revisión real de David567rs. No abrir ni fusionar por esta autorización de conexión.

## Verificación y commits

La verificación propia se registra en `docs/evidencias/avisos/verificacion-api.json`, separada de los resultados históricos del diseño:

| Comprobación | Resultado de la API |
| --- | --- |
| TypeScript global y lint | Aprobados después de retirar la ruta QA. |
| Pruebas móviles | **735/735**, 0 fallos; **58 nuevas**: 7 dominio, 14 Repository, 8 HTTP y 29 controlador. |
| Reentrancia | Tres casos nuevos incluidos en las 29 pruebas del controlador, tras corregir carreras de sesión/solicitud. |
| Expo Doctor | **1.20.4, 21/21**. |
| Exportaciones finales | Android **1532** / web **1081** módulos, sin la ruta QA. |
| QA web | CSS **397×1000 / 320×820**, con sesión y fetch sintéticos; Repository, HttpClient, controlador y UI reales. |

La QA comprobó contador global **7** con **3** avisos cargados, filtro con dos no leídos y apertura del detalle sin PATCH. El marcado explícito disparó PATCH y GET conciliador. Los fallos de PATCH y de lectura/reintento conservaron lista y detalle; recuperar la red permitió conciliar mediante GET. Un PATCH confirmado seguido de GET fallido mantuvo el aviso **Leído**, y reintentar pasó del snapshot **GET8/PATCH3** a **GET9/PATCH3**, sin otra escritura, antes de recargar la prueba.

También se comprobaron bandeja vacía **0 elementos/0 no leídos**, vacío **0/19** con título neutral, filtro local vacío con contador global **9**, y 401/salida ocultando datos. Se corrigió la presentación de `items: []` con `unread > 0`, sin convertir el contador global en uno local. No hubo errores de consola; quedaron dos advertencias compartidas preexistentes de sombras y fallback `useNativeDriver` a JavaScript en web.

Capturas **web**: [bandeja397](evidencias/avisos/api-bandeja-web-397.png), [bandeja320](evidencias/avisos/api-bandeja-web-320.png), [detalle leído](evidencias/avisos/api-detalle-leido-web-397.png), [error de marcado](evidencias/avisos/api-error-marcado-web-397.png), [conciliación pendiente](evidencias/avisos/api-conciliacion-pendiente-web-397.png), [vacío](evidencias/avisos/api-vacio-web-397.png), [filtro vacío](evidencias/avisos/api-filtro-vacio-web-320.png), [sesión sintética](evidencias/avisos/api-sesion-web-320.png), [ruta real anónima](evidencias/avisos/api-ruta-real-anonima-web-320.png) y [acceso desde Cuenta](evidencias/avisos/api-acceso-cuenta-web-320.png). Las ocho primeras usan datos y sesión sintéticos; las dos últimas verifican la ruta real sin cuenta autenticada: pide ingresar, vuelve a Cuenta con cinco pestañas y **Ver avisos de mi cuenta**, y mantiene la protección al reentrar. Ninguna es una captura de Expo Go ni prueba TalkBack o texto ampliado.

En el cierre de API `1b9d572`, la ruta de QA web se retiró antes de exportar; la búsqueda entonces no halló muestras o rutas de esa QA en la funcionalidad, ruta o bootstrap. La nueva prueba DEV de vacío descrita al final pertenece a una fase temporal posterior, separada de este snapshot técnico.

Las ocho pruebas HTTP usan transporte real contra servidores efímeros de loopback y datos ficticios; no son una API autenticada Nest/MongoDB real. El único GET técnico al endpoint real `/api/notifications/me` fue sin Bearer y respondió **401**. El agente no realizó lecturas autenticadas o escrituras de avisos reales.

Se preservaron entornos y paquetes/locks, los seis documentos de cierre de David, identidad y stash. Backend **3200/PID33524**, Metro David **8082/PID28288** y Metro Zenaida **8083/PID13476** conservaron sus procesos, con health y Metro respondiendo200. No se modificaron backend, dependencias o configuración.

Se preservan las fases: cierre previo `6610412`, diseño `1f383f3` y aceptación/autorización `46c86aa`. La conexión verificada se guarda en su commit propio **`feat(notices): conectar avisos con la API`**, con SHA consultable en Git; cada aceptación posterior se registrará tras el reporte real. No se anticipan SHA de API, CI remota, aprobación o PR.

Esta fase no modifica backend, paquetes, entorno, identidades, stash o la copia de David. No incorpora marcado masivo, push, polling o almacenamiento de avisos. El agente no observó Expo Go ni leyó o modificó Trello; TalkBack, texto ampliado y otras condiciones físicas tendrán evidencia específica si se prueban.
## Snapshot histórico: recorrido positivo de Avisos aceptado (5/9)

El usuario reportó exactamente: «Amigo, ya aparecen mis avisos en Expo Go, pude abrir el detalle, marcar uno como leído y actualizar. ¿Qué marco en Trello y qué sigue?». Por el recorrido guiado previo se aceptan **Obtener avisos disponibles; Mostrar título, mensaje y fecha; Diferenciar avisos leídos y no leídos; Permitir consultar el detalle** (2-5), además de Crear sección de avisos (1). La actualización queda aceptada como parte del recorrido positivo; no crea un criterio adicional. Fuente textual del usuario, sin observación directa del teléfono o acceso a Trello por el agente. No se atribuye una prueba independiente del filtro Todos/No leídos ni de vacío o errores.

Puede marcar 2-5 y mantener En progreso, **5/9**; el marcado no está confirmado. API `1b9d572`, diseño `1f383f3`, aceptación visual `46c86aa` y cierre `6610412` conservan sus fases. Este reporte se guarda en su propio commit documental. Las 735 pruebas, Doctor y exportaciones son resultados de la conexión anterior, sin repetirse por documentación ni convertirlos en pruebas nativas nuevas.

A la consulta de una cuenta sin avisos, el usuario respondió exactamente «No, preparemos una prueba controlada». Se autoriza preparar un montaje temporal y aislado de bandeja vacía para Expo Go de Zenaida8083, sin borrar o marcar avisos reales, cambiar credenciales o modificar el backend. Ese montaje todavía no está preparado y **Mostrar mensaje si no existen avisos** (6) continúa pendiente hasta su reporte. No confundir el filtro No leídos vacío con la bandeja vacía. Después siguen errores/reintento, reapertura/sesión y el futuro PR solicitado para revisión real de David567rs. Conservar código funcional, ambas copias, servicios, entorno, dependencias, identidades y stash; no publicar o abrir PR por esta aceptación.

## Prueba controlada temporal de bandeja vacía

**Estado actual: aceptada por reporte del usuario y retirada.** Los pasos y resultados siguientes conservan la preparación `21ece6e`; la aceptación quedó en `7d97f85` y la comprobación de retirada aparece al final. La interfaz controlada no acredita que una cuenta o API reales estén vacías.

### Snapshot histórico de preparación (21ece6e, 5/9)

El usuario autorizó exactamente **«No, preparemos una prueba controlada»** al no disponer de otra cuenta sin avisos. El positivo real está guardado en `fcc0c72`; el montaje temporal ya está preparado y verificado técnicamente para revisar la interfaz vacía en Expo Go **8083**, sin borrar o marcar sus avisos, crear otra cuenta backend o modificar credenciales/base de datos. Avisos mantiene **5/9** y **Mostrar mensaje si no existen avisos** (6) sigue pendiente del reporte nativo.

### Alcance del helper DEV

La entrada **Probar bandeja vacía** solo se ofrece en desarrollo desde `/avisos` y abre `/qa-avisos-vacio`. Los dos archivos temporales de ruta/pantalla anidan `AuthSessionProvider` de sesión local y `NoticesProvider` de controlador/acciones locales alrededor de **NoticesScreen real**, conservando el ViewModel y comportamiento de la pantalla. El Repository local tipado se compone con `createNoticesActions`. Su consulta `list` espera aproximadamente 350 ms y devuelve **`{ items: [], unread: 0 }`**. `markRead` rechaza sin escribir; la bandeja vacía no ofrece un aviso que marcar.

El banner **Prueba controlada** identifica el montaje. **Salir de la prueba** reemplaza la ruta por `/avisos`, volviendo al contexto normal. No se usa `HttpClient`, token, almacén o cuenta reales dentro del helper y no hay fallback al backend. **RootLayout y el runtime de autenticación productivo no se modifican.** El resto de la aplicación puede mantener sus lecturas normales; esta garantía no significa cero HTTP de toda la app.

La fixture representa bandeja vacía **0 elementos/0 no leídos**, no el filtro No leídos sin coincidencias ni el caso de cero elementos recientes con contador global positivo. La UI vacía no muestra un contador; al usuario se le pide comprobar el mensaje. Una confirmación posterior acreditará este estado de interfaz controlado, sin probar que la API real o una cuenta real estén vacías. El agente no observa el teléfono ni accede a Trello.

### Guía nativa histórica: recorrido ya reportado

Recargar el proyecto en Expo Go de Zenaida **8083**, sin detener backend o Metros ni borrar avisos:

1. Abrir **Cuenta → Avisos** y pulsar **Probar bandeja vacía**.
2. Confirmar el banner **Prueba controlada**. Esperar la consulta local y comprobar **Aún no tienes avisos**.
3. Pulsar **Actualizar avisos**. Debe aparecer **Actualizando…** y, tras la espera local, conservarse la bandeja vacía sin error; no se hace una consulta HTTP del helper.
4. Pulsar **Explorar catálogo**, comprobar que abre Catálogo y regresar con **Atrás** al montaje. Esto prueba navegación; la carga del catálogo utiliza su contexto normal y no forma parte de la fixture vacía.
5. Pulsar **Salir de la prueba**. Debe abrir `/avisos` en su contexto normal. Comprobar que los avisos reales siguen disponibles con sus estados de lectura anteriores, sin que el helper los haya borrado, marcado o modificado.
6. Reportar el resultado antes de aceptar el criterio 6. La autorización y la QA web del agente no sustituyen ese reporte de Expo Go.

### Snapshot técnico del montaje antes de la retirada

**TypeScript y lint completos aprobaron con exit 0**, después de tipar el Repository local y componerlo con `createNoticesActions`. En QA web CSS de **320×820** se comprobó la entrada desde `/avisos` anónima, que pide **Iniciar sesión**, y el acceso DEV al montaje. La fixture usó **0 elementos/0 no leídos**, sin contador visible en la UI vacía; **Actualizar avisos** mostró **Actualizando…** y volvió al mensaje vacío sin desbordamiento horizontal. **Explorar catálogo** abrió `/catalogo`, pero la carga web del Catálogo mostró un error de conexión: se verifica la ruta, sin afirmar carga de productos. Back volvió a la QA y **Salir de la prueba** reemplazó la ruta por `/avisos`, que volvió a pedir ingresar sin conservar la sesión local.

Capturas web: [bandeja vacía controlada](evidencias/avisos/prueba-vacio-web-320.png) y [salida de la prueba](evidencias/avisos/prueba-vacio-salida-web-320.png). El [recibo controlado](evidencias/avisos/prueba-vacio.json) incluye resultados y guardas: entorno y cuatro paquetes/locks, los seis documentos de David, identidad/credencial ZenaidaGR, stash y tres procesos conservados; sin cambios Server o runtime global. No se repitieron las 735 pruebas, Doctor o exportaciones por esta fixture temporal; sus resultados anteriores siguen como snapshot de API. Estas comprobaciones web no sustituyen Expo Go ni aceptan el criterio 6; el agente no observó el teléfono.

El snapshot `21ece6e` mantenía **5/9** hasta el reporte del usuario y requería registrar la aceptación controlada antes de retirar los dos archivos temporales y la entrada DEV en **otro commit**, antes de exportaciones finales, publicación o PR. Sus comprobaciones y resultados se conservan arriba; la aceptación posterior aparece a continuación y la retirada sigue pendiente. No se modifican root layout, backend, sesión real, dependencias, entorno, identidad, stash o copia de David para este montaje.

## Snapshot histórico: bandeja vacía controlada aceptada (6/9)

El usuario confirmó exactamente: «Amigo, apareció «Aún no tienes avisos», se mantuvo al actualizar, «Explorar catálogo» abrió Catálogo y al salir volvieron mis avisos reales sin cambios. ¿Qué marco en Trello y qué sigue?». Ese reporte de Expo Go acepta **Mostrar mensaje si no existen avisos** (6), con fixture local 0/0, actualización y navegación. También confirma el regreso a sus avisos reales sin cambios. No prueba una bandeja vacía de una cuenta o API reales ni un filtro No leídos sin coincidencias; el agente no observó el dispositivo ni accedió a Trello.

Avisos queda **6/9**, criterios 1-6 aceptados. Puede marcar el 6 y mantener En progreso, sin confirmar marcado. El [recibo controlado](evidencias/avisos/prueba-vacio.json) añade la aceptación limitada y conserva los resultados técnicos previos. La aceptación se registra en commit documental propio; el siguiente commit retirará helper y entrada DEV y comprobará TypeScript/lint. **La retirada todavía está pendiente** y debe completarse antes de exports finales, publicación o PR. Los resultados API y del montaje conservan su fase y no se repiten por esta documentación.

## Snapshot histórico: helper retirado, error y reintento pendientes (6/9)

La aceptación del vacío quedó guardada en `7d97f85`. Ya se eliminaron los dos archivos temporales y la entrada DEV: `/avisos` coincide por hash con API `1b9d572`, los archivos temporales están ausentes y la búsqueda en `Mobile/src` devuelve cero referencias al helper. **TypeScript y lint completos aprobaron con exit 0 después de la retirada**. No se repitieron la suite móvil, Doctor o exportaciones; los resultados originales del montaje y de API permanecen como historia.

El [recibo de retirada](evidencias/avisos/retirada-prueba-vacio.json) documenta estos checks; se conserva la separación de commits, sin inventar un SHA futuro. Avisos mantiene **6/9**, criterios 1-6 aceptados, con error/reintento (7), prueba completa (8) y revisión real David567rs (9) pendientes. No se infiere marcado Trello ni observación del teléfono por el agente. La siguiente guía usa la bandeja real y solo lecturas GET.

<a id="siguiente-prueba-error-y-reintento-de-lectura"></a>

## Guía histórica: error y reintento de lectura

El montaje temporal ya está retirado. No hace falta marcar como leído ni cambiar avisos para probar errores:

1. Con backend y ambos Metros activos, abrir **Cuenta → Avisos** en Expo Go de Zenaida **8083**, esperar sus avisos reales y abrir un aviso cualquiera, **Leído** o **Nuevo**, sin marcarlo.
2. En la terminal que ya ejecuta el backend local, pulsar **Ctrl+C solo allí**. Mantener Metro **8082/8083** y Expo Go abiertos; no cerrar la aplicación ni cambiar o apagar WiFi, para aislar el fallo del backend. El agente no detiene servicios ni modifica la API.
3. Pulsar **Actualizar avisos**. Debe aparecer el aviso de conexión y conservarse la lista, selección, detalle y estados de lectura ya cargados.
4. Con el backend todavía detenido, pulsar **Reintentar**. Debe seguir el aviso sin perder los datos ni inventar cambios de lectura. No pulsar **Marcar como leído** durante esta prueba.
5. Reiniciar el mismo backend en la misma terminal con su comando habitual. Desde la raíz del repositorio es `npm run dev:server`; desde `Server`, `npm run start:dev`. Esperar el arranque antes de continuar, sin abrir una segunda instancia ni cambiar configuración.
6. Pulsar **Reintentar**. Debe recuperar el mismo aviso, quitar el aviso de error y conservar el contexto de la cuenta. Solo se prueba carga GET, sin PATCH. Reportar el resultado antes de aceptar **Manejar errores de carga** (7).

Error/reintento (7), prueba completa y continuidad por cuenta (8) y revisión real de David567rs (9) siguen pendientes. No hay publicación o PR autorizado por este reporte.
## Estado vigente: error y reintento aceptados (7/9)

El usuario confirmó exactamente: «Amigo, Actualizar y Reintentar fallaron sin perder los avisos ni el detalle. Reinicié el backend y Reintentar recuperó los datos y quitó el aviso. ¿Qué marco en Trello y qué sigue?». Se acepta **Manejar errores de carga** (7) por la prueba guiada de lectura GET: conserva avisos y detalle durante los fallos y recupera datos al restablecer el backend. No se atribuye una prueba nativa de error de PATCH, continuidad de sesión o inspección del servidor al agente.

Puede marcar el criterio 7 y mantener En progreso, **7/9**. El agente no observó Expo Go ni leyó o modificó Trello; el marcado no está confirmado. Esta fase solo actualiza documentación y conserva el historial y los checks técnicos anteriores, sin cambios de código, backend, servicios, entorno o dependencias. El helper fue retirado en `bb32a17`. Probar la funcionalidad (8) y la revisión real de David567rs (9) siguen pendientes.

## Siguiente prueba: reapertura y continuidad por cuenta

Con backend y Metros funcionando, usar Expo Go de Zenaida **8083**:

1. Antes de cerrar, consultar un aviso real y recordar su título y estado de lectura.
2. Cerrar Expo Go por completo, reabrir el proyecto y esperar la restauración de sesión. Abrir **Cuenta → Avisos**, seleccionar el mismo aviso y comprobar sus datos y estado de lectura. **Actualizar avisos** debe funcionar. No es necesario restaurar automáticamente la pantalla o selección exactas.
3. Desde **Cuenta**, cerrar sesión. Volver a **Avisos**: debe pedir **Iniciar sesión** sin mostrar avisos de la cuenta anterior.
4. Ingresar con la misma cuenta, abrir **Avisos** y comprobar que vuelven los avisos propios y su estado de lectura. **Actualizar avisos** debe funcionar.
5. Reportar el resultado antes de aceptar **Probar la funcionalidad** (8). No se exige una segunda cuenta ni se cambia el backend o el estado de lectura para esta prueba.

Solo después del reporte se prepara el PR cuando el usuario lo solicite expresamente; **Revisar el código** (9) requiere revisión real de David567rs. Esta guía no anticipa resultados de sesión ni aprobación.
