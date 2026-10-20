# Implementar Seguimiento del pedido con MVVM y Repository

El resumen de Historial necesitaba una vista para consultar el recorrido de un pedido propio. Este cambio permite abrir **Ver seguimiento del pedido**, revisar productos, subtotal, estado y fechas registradas, y actualizar la información con recuperación ante fallos de conexión.

## Actividad y alcance

- **Actividad:** Seguimiento del pedido.
- **Responsable:** David567rs.
- **Rama de origen y destino:** `feature/seguimiento-pedido` → `develop`.
- **Base:** `930d2023ecb801ce985acaad8dfad03657a998ae`, integración de Historial mediante el [PR #15](https://github.com/David567rs/INHALEX-Movil/pull/15).
- **Revisora requerida:** ZenaidaGR, desde su propia cuenta.
- **Criterios aceptados:** 7/8. Solo la revisión real del código (8) sigue pendiente.

Desde **Cuenta → Historial de pedidos → seleccionar pedido → Ver seguimiento del pedido**, la ruta `/seguimiento-pedido?id=<ObjectId>` consulta ese pedido. Cuenta sin ID conduce a Historial; sin sesión se pide ingresar. Se conservan las cinco pestañas y el diseño aprobado, sin controles de pruebas o muestras en el producto.

- [x] Obtener estado del pedido desde la API.
- [x] Mostrar información del pedido.
- [x] Mostrar estado actual.
- [x] Actualizar la información correctamente.
- [x] Manejar pedidos no encontrados.
- [x] Manejar errores de conexión.
- [x] Probar distintos estados del pedido.
- [ ] Revisar el código: pendiente de ZenaidaGR desde su cuenta.

El usuario aceptó en Expo Go consulta/actualización, no encontrado con reintento, conservación de datos al fallar la conexión, recuperación posterior, los recorridos de Confirmado, Completado y Cancelado, reapertura y salida/reingreso con la misma cuenta. Los reportes exactos se conservan en la evidencia de aceptación; el agente no observó el teléfono ni leyó o modificó Trello. La tarjeta permanece En progreso hasta revisión e integración.

## Código y recursos recuperados

La implementación de Seguimiento es nueva dentro de `Mobile/src/features/orderTracking`, adaptando los patrones de Historial, sesión compartida y `HttpClient` ya presentes en esta base del repositorio. No se importa otro paquete de código desde `Proyecto-INHALEX`, ni se incorporan recursos externos nuevos.

La separación queda en modelo y Repository de dominio, casos de uso, mapper y `ApiOrderTrackingRepository`, controlador/guard de ruta/timeline, Provider, ViewModel y pantalla. `Mobile/src/bootstrap/createApplicationServices.ts` compone el cliente autenticado y las dependencias; Expo Router aporta la selección desde Historial y el acceso de Cuenta.

Se conserva el trabajo por fases: diseño `34b4f83`, aceptación visual `14b8453`, API `c1ac906`, consulta/actualización `3a4fb9e`, no encontrado `4d3007e`, error/reintento `6791928`, estados `5afa8b5` y reapertura/sesión `5a2561d`.

El cierre documental de Historial (`49df3b3`) se transporta intencionalmente en esta rama, sin cambiar su integración, pruebas o aceptación 9/9. Los documentos y evidencias del diseño de Seguimiento permanecen como snapshots históricos; el módulo Preview y la ruta temporal de QA fueron retirados de la aplicación conectada. Las capturas sintéticas preservadas no se presentan como capturas de Expo Go.

## Dependencias y contratos

Depende de autenticación/Persistencia ya integradas, Creación de pedido ([PR #14](https://github.com/David567rs/INHALEX-Movil/pull/14)) e Historial ([PR #15](https://github.com/David567rs/INHALEX-Movil/pull/15)). Reutiliza endpoints existentes del servidor, bajo `/api`, sin cambios en `Server`, paquetes, archivos `.env`, almacenamiento o configuración pública adicional:

| Orden de lectura | Endpoint autenticado | Uso |
| --- | --- | --- |
| 1 | GET `/orders/me/:id` | Identidad, productos, cantidades, subtotal y dirección histórica disponible. |
| 2 | GET `/orders/me/:id/tracking` | Resumen actualizado, estado y fechas de confirmación, cancelación y finalización. |

El servidor delimita el pedido por `JWT.sub` y `customerUserId`; el cliente no selecciona otro propietario por correo o rol. El token permanece privado en el cliente de autorización compartido. El Repository valida que ambos GET correspondan a la misma identidad, referencia, creación, moneda, unidades y subtotal antes de publicar un conjunto completo. Tracking es la autoridad sobre el estado, que puede cambiar entre ambas lecturas.

Los estados son **En revisión**, **Confirmado**, **Cancelado** y **Completado**. `confirmedAt`, `cancelledAt` y `completedAt` pueden ser `null`: no se inventan fechas, confirmaciones ausentes o promesas de envío/entrega. Cancelado termina el recorrido. El importe se rotula **Subtotal de productos**, sin cargos de envío inferidos.

**Actualizar seguimiento** y **Reintentar** solo realizan lecturas explícitas. Error de red, timeout o 5xx conserva el último conjunto confirmado del mismo pedido; 404 retira sus datos y ofrece Historial, 403 los retira y 401 presenta sesión vencida para ese contexto de autorización. Cambiar el ID, salir o cambiar de autorización retira los datos previos y cancela/descarta respuestas tardías. No se añade polling, persistencia de seguimiento, escritura de pedidos, cambio de estados, cancelación ni confirmación de recepción.

## Verificación

Las comprobaciones actuales de preparación se distinguen de la evidencia técnica anterior de API y del reporte nativo del usuario. Consultar Backend CI y Mobile CI sobre el HEAD vigente del PR; la aprobación local no sustituye esos checks.

| Comprobación o escenario | Comando o procedimiento | Resultado observado |
| --- | --- | --- |
| TypeScript, preparación actual | En `Mobile`: `npm run typecheck` | Aprobado. |
| Lint, preparación actual | En `Mobile`: `npm run lint` | Aprobado. |
| Pruebas móviles, preparación actual | En `Mobile`: `npm test` | 677/677, 0 fallos. |
| Expo Doctor, preparación actual | En `Mobile`: `npm run doctor` | Doctor 1.20.4, 21/21. |
| Android, preparación actual | En `Mobile`: `npm run export:android` | Aprobado, 1521 módulos. |
| Contrato backend, snapshot anterior | Dos suites existentes, según la evidencia de API | 50/50; no repetidas en esta preparación, sin cambio funcional. |
| Exportaciones, snapshot anterior | `export:android` / `export:web` de Mobile | Android 1521 / web 1070 módulos; el resultado Android actual se registra aparte. Web no se repite ahora. |
| Dominio/Repository/controlador/HTTP, snapshot de API | Suites nuevas, incluidas en las 677 | 59 nuevas: 6 dominio, 16 Repository, 29 controlador/ruta/timeline, 8 HTTP loopback. Transporte real contra API/cuentas sintéticas efímeras, sin MongoDB real. |
| QA web sintética, snapshot anterior | Componentes reales con sesión y acciones sintéticas, 397×1000 y 320×820 | Estados, fechas ausentes, refresh, retención/reintento, 401/403/404, cambio de ID y salida sin desbordamiento o errores de consola. Ruta QA retirada; no repetida ahora. |
| Consulta, estados, no encontrado, errores y sesión en Expo Go | Recorridos guiados y reportes textuales del usuario | Aceptados funcionalmente; 1–7, sin observación directa del teléfono por el agente. |
| Revisión de Zenaida y CI remota | Revisar y comprobar checks del HEAD publicado | Aprobación humana y checks pendientes al preparar el PR; consultar su estado vigente. |

Evidencia: [preparación actual](evidencias/seguimiento-pedido/preparacion-pr.json), [guía de conexión](CONEXION-SEGUIMIENTO-PEDIDO.md), [aceptación del usuario](evidencias/seguimiento-pedido/expo-go-aceptacion.json), [snapshot técnico de API](evidencias/seguimiento-pedido/verificacion-api.json), [diseño histórico](DISENO-SEGUIMIENTO-PEDIDO.md) y [verificación del diseño](evidencias/seguimiento-pedido/verificacion-diseno.json). QA sintética: [vista 397 px](evidencias/seguimiento-pedido/api-qa-web-397.png), [vista 320 px](evidencias/seguimiento-pedido/api-qa-web-320.png), [error conservando datos](evidencias/seguimiento-pedido/api-error-qa-web-397.png) y [no encontrado](evidencias/seguimiento-pedido/api-no-encontrado-qa-web-320.png).

El agente no consultó pedidos reales autenticados ni escribió en la API real para esta implementación; el único GET técnico al backend local sin Bearer respondió 401. Las pruebas con fixtures no acreditan por sí solas ownership en Nest/MongoDB real. Los reportes del usuario no equivalen a inspección de SecureStore, tráfico HTTP, TalkBack, texto ampliado o validación ampliada entre dos cuentas.

## Revisión e integración

- [ ] Se comprobaron los criterios de aceptación de esta actividad. Queda pendiente el criterio 8: revisión real de Zenaida.
- [x] Se respetó la separación de arquitectura y se revisaron los contratos afectados.
- [x] Se inspeccionó el contenido: sin secretos, dependencias instaladas o salidas de compilación; las capturas documentales son evidencia intencional.
- [x] Las comprobaciones pertinentes pasaron en el nuevo proyecto. TypeScript/lint, 677 pruebas, Doctor y Android actuales aprobados; la CI remota se comprobará tras publicar.
- [ ] El otro integrante revisó y aprobó desde su propia cuenta: Zenaida para PR de David, David para PR de Zenaida.
- [x] El destino coincide con el flujo acordado y se utilizará merge commit.

Mantener el PR abierto hasta revisión real de ZenaidaGR y checks aprobados en el HEAD vigente. La apertura no autoriza fusionar por anticipado. Después de la integración se registrará la evidencia, se guiará Trello y se actualizarán ambas copias con `develop` cuando corresponda. No es una release ni incluye publicación Android.
