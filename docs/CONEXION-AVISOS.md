# Conexión de Avisos

Actividad de ZenaidaGR en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/avisos`, basada en `develop` `0f0b764a4ad78e40f12112c4debcd7982ccdfd2c`. David567rs revisará el futuro PR hacia `develop`. El cierre anterior está separado en `6610412`, el diseño en `1f383f3` y su aceptación/autorización de API en `46c86aa`.

El usuario aceptó el diseño en Expo Go y autorizó conectar la API en la misma rama, con MVVM, Repository y commits por etapa. La conexión está **terminada y verificada técnicamente**; la aceptación funcional real de la API sigue pendiente. Se registra en su commit de fase **`feat(notices): conectar avisos con la API`**, sin anticipar un SHA circular ni publicación.

Avisos permanece **1/9**: solo **Crear sección de avisos** (1) está aceptado. Los criterios 2-9 esperan sus reportes y revisión real. La [aceptación vigente](evidencias/avisos/expo-go-aceptacion.json) conserva la fuente textual del usuario; el [diseño](DISENO-AVISOS.md) y sus muestras/verificaciones son historia visual. El agente no observó el teléfono ni leyó o modificó Trello, y el marcado no está confirmado.

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

## Criterios de Trello: 1/9

- [x] Crear sección de avisos
- [ ] Obtener avisos disponibles
- [ ] Mostrar título, mensaje y fecha
- [ ] Diferenciar avisos leídos y no leídos
- [ ] Permitir consultar el detalle
- [ ] Mostrar mensaje si no existen avisos
- [ ] Manejar errores de carga
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Solo el diseño aceptado completa 1. El contenido sintético, la autorización para conectar y las pruebas técnicas aprobadas no aceptan 2-9 por anticipado. La revisión formal corresponde a David567rs desde su cuenta, en un futuro PR de ZenaidaGR. Puede marcarse1, manteniendo Trello En progreso; el agente no verifica ni realiza su marcado.

## Primera prueba funcional pendiente en Expo Go

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

La ruta temporal se retiró antes de exportar; la búsqueda de Preview, EJEMPLO o `qa-avisos` no halló muestras o rutas de QA en la funcionalidad, ruta o bootstrap del producto final.

Las ocho pruebas HTTP usan transporte real contra servidores efímeros de loopback y datos ficticios; no son una API autenticada Nest/MongoDB real. El único GET técnico al endpoint real `/api/notifications/me` fue sin Bearer y respondió **401**. El agente no realizó lecturas autenticadas o escrituras de avisos reales.

Se preservaron entornos y paquetes/locks, los seis documentos de cierre de David, identidad y stash. Backend **3200/PID33524**, Metro David **8082/PID28288** y Metro Zenaida **8083/PID13476** conservaron sus procesos, con health y Metro respondiendo200. No se modificaron backend, dependencias o configuración.

Se preservan las fases: cierre previo `6610412`, diseño `1f383f3` y aceptación/autorización `46c86aa`. La conexión verificada se guarda en su commit propio **`feat(notices): conectar avisos con la API`**, con SHA consultable en Git; cada aceptación posterior se registrará tras el reporte real. No se anticipan SHA de API, CI remota, aprobación o PR.

Esta fase no modifica backend, paquetes, entorno, identidades, stash o la copia de David. No incorpora marcado masivo, push, polling o almacenamiento de avisos. El agente no observó Expo Go ni leyó o modificó Trello; TalkBack, texto ampliado y otras condiciones físicas tendrán evidencia específica si se prueban.
