# Diseño de Avisos

> **Snapshot histórico de diseño aceptado en Expo Go**, guardado en `1f383f3`. El usuario reportó exactamente: «Amigo, ya revisé el diseño de Avisos en Expo Go y me gustó. Sigamos con la conexión a la API en feature/avisos, manteniendo MVVM, Repository y commits por etapa.». La [aceptación vigente](evidencias/avisos/expo-go-aceptacion.json) acepta solo **Crear sección de avisos** (1): **1/9**. El agente no observó el teléfono ni accedió a Trello; el marcado no está confirmado. La [conexión posterior](CONEXION-AVISOS.md) ya está implementada y verificada técnicamente, pendiente del reporte funcional del usuario. Lo que sigue conserva el alcance y checklist del snapshot visual anterior a ese reporte.

La actividad actual comprende únicamente el diseño autorizado por el usuario en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/avisos`, desde `develop` `0f0b764a4ad78e40f12112c4debcd7982ccdfd2c`. ZenaidaGR es responsable y David567rs revisará el futuro PR hacia `develop`. El cierre anterior de Seguimiento se copió y guardó por separado en `6610412`, sin modificar David ni su evidencia de 8/8.

La verificación técnica propia del diseño quedó aprobada y guardada en `1f383f3`. En ese snapshot el checklist estaba **0/9**, antes de la aceptación visual posterior registrada arriba. Las muestras y resultados técnicos siguientes permanecen como historia de diseño, sin validar la futura API.

## Alcance visual

La ruta `/avisos` se abre desde **Cuenta** y presenta una **vista previa** con datos locales de ejemplo, sin avisos de la cuenta. Las escenas **Bandeja**, **Sin avisos** y **Error de carga** permiten revisar la composición visual sin depender de la red o del backend.

**Bandeja** contiene tres ejemplos, dos no leídos y uno leído. Los filtros **Todos** y **No leídos** muestran esas muestras; su contador o diferenciación visual no representan el número real de avisos de un usuario. Cada ejemplo muestra título, mensaje y fecha para evaluar jerarquía y legibilidad. Seleccionar un ejemplo permite consultar su detalle local. Abrirlo no cambia su estado leído ni ejecuta marcado individual o de todos como leídos.

**Sin avisos** muestra **Aún no tienes avisos** y **Error de carga** presenta **No pudimos cargar los avisos**. Son composiciones sintéticas, sin una respuesta vacía o un fallo real de la API. Las acciones que permitan explorar esas escenas solo administran estado temporal de presentación; no prueban actualización o reintento remoto.

Se conservan las cinco pestañas, los colores, tipografía, bordes, espacios y sesión existentes. Esta fase no incluye HTTP, credenciales de avisos, almacenamiento, push, permisos del sistema, suscripciones, marcado real como leído o cambios del backend. Tampoco inicia Reseñas o Confirmación de recepción.

## MVVM y Repository

La separación es **NoticesPreviewScreen → useNoticesPreviewViewModel → LoadNoticesPreview → NoticesPreviewRepository → LocalNoticesPreviewRepository**, con `NoticePreview` en `features/notices/domain/models/NoticePreview.ts`. El caso de uso está en `domain/useCases/loadNoticesPreview.ts`; `createNoticesPreviewAction()` en bootstrap construye e inyecta el Repository local. `NoticesEntry` ofrece el acceso desde Cuenta.

La View presenta la escena, el filtro y la selección. El ViewModel administra esos valores en memoria y solicita los ejemplos mediante el caso de uso de dominio. El Repository local de solo lectura implementa el contrato de muestras. El dominio permanece independiente de React Native y HTTP; la pantalla no hace peticiones ni conoce credenciales.

La futura conexión a avisos se acordará después de aceptar este diseño y de una autorización expresa. El diseño no demuestra disponibilidad de avisos reales, sincronización, persistencia del estado leído o manejo de errores de red.

## Criterios de Trello: 0/9

El checklist exacto de la captura aportada por el usuario es:

- [ ] Crear sección de avisos
- [ ] Obtener avisos disponibles
- [ ] Mostrar título, mensaje y fecha
- [ ] Diferenciar avisos leídos y no leídos
- [ ] Permitir consultar el detalle
- [ ] Mostrar mensaje si no existen avisos
- [ ] Manejar errores de carga
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Todos permanecen pendientes. Después del reporte real de aceptación del diseño en Expo Go podrá marcarse solo **Crear sección de avisos** (1). Los títulos, mensajes, fechas, estados, detalle, vacío y error de ejemplo no completan los criterios funcionales restantes. La revisión formal corresponderá a David567rs en el futuro PR de ZenaidaGR. El agente no leyó ni modificó Trello y no observó el dispositivo.

## Actividades restantes indicadas por el usuario

El usuario mostró **Avisos**, **Reseñas** y **Confirmación de recepción** como actividades restantes. Aquí se registra únicamente esa relación y la autorización para el diseño de Avisos. No se inventan checklist, responsable, rama u orden adicional para Reseñas o Confirmación de recepción; sus alcances se acordarán cuando corresponda.

## Commits por fase

El cierre de Seguimiento está guardado primero en `6610412`. El diseño de Avisos ya pasó sus comprobaciones y se prepara su commit local propio **`feat(notices): diseñar bandeja de avisos`**, según [VERSIONAMIENTO.md](VERSIONAMIENTO.md). Su SHA se consulta en Git después de guardarlo; no se introduce una referencia circular ni se afirma por anticipado que el commit exista.

La conexión a la API tendrá otro commit cuando el usuario la autorice. Las aceptaciones y evidencias posteriores se registrarán por fase después del reporte real. Esta autorización no incluye API, publicación de la rama, apertura de PR, aprobación o merge anticipados.

## Revisión visual pendiente en Expo Go

Reutilizar el proyecto y QR habitual de Zenaida, **Metro 8083**, manteniendo backend y ambos Metro activos. No cambiar servicios o configuración para revisar estas escenas locales.

1. Abrir **Cuenta → Avisos** y comprobar que la pantalla identifica una vista previa con datos de ejemplo.
2. En **Bandeja**, revisar los tres avisos y distinguir los dos no leídos del leído. Comprobar título, mensaje y fecha como contenido de muestra.
3. Elegir **No leídos** y comprobar que aparecen solo los dos ejemplos correspondientes. Volver a **Todos** para recuperar los tres.
4. Consultar el detalle de un ejemplo y volver a la lista. Su estado leído debe permanecer igual; consultar no equivale a marcar como leído.
5. Elegir **Sin avisos** y comprobar **Aún no tienes avisos**; elegir **Error de carga** y comprobar **No pudimos cargar los avisos**. Son escenas visuales: no detener el backend ni presentar sus acciones como prueba de red.
6. Volver a Cuenta y comprobar navegación, desplazamiento y cinco pestañas, sin recortes de texto o controles. Reportar el resultado antes de aceptar el criterio 1.

## Verificación y límites actuales

Las comprobaciones propias ya realizadas están en `docs/evidencias/avisos/verificacion-diseno.json`:

| Comprobación | Resultado de esta etapa |
| --- | --- |
| TypeScript global y lint | Aprobados y repetidos tras el ajuste final de `aria-pressed`. |
| Pruebas móviles | **677/677 existentes**, 0 fallos y **0 nuevas**. |
| Expo Doctor | **1.20.4, 21/21**. |
| Exportaciones finales | Android **1529** / web **1078** módulos, después de `aria-pressed`. |
| QA web con ejemplos locales | CSS **397×1000** y **320×820**, sin desbordamiento horizontal ni errores de consola. |

La QA comprobó tres muestras (**dos no leídas y una leída**), filtro No leídos con dos resultados, detalle del primer ejemplo y del leído, y vuelta conservando estados y filtrado. Abrir el detalle no marca leído. Las escenas Sin avisos y Error de carga, incluido el reintento de la muestra, funcionaron como composiciones locales. También se comprobó Cuenta con cinco pestañas, login alcanzable mediante scroll, acceso a Avisos y reentrada con muestras iniciales. Los controles nuevos miden al menos **44 px CSS**; no es una medición física del teléfono.

Se conservaron tres advertencias de componentes compartidos: propiedades `shadow*` deprecadas, fallback de `useNativeDriver` a JavaScript en web y `pointerEvents` deprecado. No hubo errores de consola. No se presentan como fallos nuevos resueltos ni como prueba de accesibilidad nativa.

Capturas **web sintéticas**: [bandeja 397 px](evidencias/avisos/bandeja-web-397.png), [bandeja 320 px](evidencias/avisos/bandeja-web-320.png), [detalle](evidencias/avisos/detalle-web-397.png), [vacío](evidencias/avisos/vacio-web-320.png), [error](evidencias/avisos/error-web-320.png) y [Cuenta](evidencias/avisos/acceso-cuenta-web-320.png). No son capturas de Expo Go.

Los hashes de entornos y paquetes/locks, los seis documentos de cierre locales de David, la identidad de Zenaida y el stash `81196109270f00fa7edf03a8a8ec6f8bdc963131` permanecieron intactos. Se conservaron los procesos de backend **3200 / PID33524**, Metro David **8082 / PID28288** y Metro Zenaida **8083 / PID13476**. Esta verificación no modifica servidor, sesión, dependencias o configuración.

La [aceptación vigente](evidencias/avisos/expo-go-aceptacion.json) ya registra `accepted: true` por el reporte textual del usuario y **1/9**, sin observación directa del teléfono por el agente. No hay capturas nativas aportadas; TalkBack y texto ampliado en dispositivo siguen pendientes. Las verificaciones anteriores son propias del diseño de Avisos, no de la conexión recién autorizada.

El orden posterior es diseño verificado y commit local → revisión visual real → autorización de API → implementación y pruebas → aceptación funcional → PR hacia `develop` → revisión real de David567rs → integración. Se preservan David, servidor, sesión, servicios, entornos, dependencias, identidades y stash.
