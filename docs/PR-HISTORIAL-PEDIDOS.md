## Actividad y alcance

La cuenta permitía crear pedidos, pero no consultar después su historial real desde la app. Este cambio añade **Cuenta → Historial de pedidos**: consulta los pedidos de la sesión activa, muestra referencia, fecha, unidades, estado y **Subtotal de productos**, y permite abrir el resumen de productos y la dirección histórica disponible. El importe respeta el contrato existente y no presenta cargos de envío, pago o entrega no confirmados.

- Actividad: Historial de pedidos.
- Responsable: David567rs.
- Rama de origen y destino: `feature/historial-pedidos` → `develop`.
- Base de la actividad: `77b9ab5`, integración del PR #14 de Creación de pedido.
- Aceptación: **8/9**, criterios 1–8 aceptados en Expo Go según los reportes del usuario; **Revisar el código** (9) pendiente de ZenaidaGR.

Incluye carga inicial, actualización, páginas de hasta 20 pedidos mediante cursor y resumen desplegable de la selección. **Todos / En curso / Completados** filtran únicamente los pedidos ya cargados; los estados reales son **En revisión / Confirmado / Cancelado / Completado**. Conserva la lista y el resumen confirmados ante errores recuperables y ofrece reintento explícito. Salir o cambiar de identidad de autorización oculta los datos anteriores y descarta respuestas tardías; un 401 protege el módulo. Se conservan las cinco pestañas.

El usuario confirmó pedidos con fecha, subtotal y estado, selección, actualización, vacío, recuperación tras restablecer el backend, orden/filtros y recuperación al reabrir y al ingresar de nuevo con la misma cuenta. Reportó haber marcado los criterios 4 y 8 en Trello; el agente no leyó ni modificó el tablero. La tarjeta permanece En progreso hasta revisión e integración.

## Código y recursos recuperados

Implementación nueva en `Mobile/src/features/orderHistory`, que adapta los patrones de controlador de sesión, Repository, errores seguros y composición ya presentes en este repositorio en la base `77b9ab5`. No recupera código o recursos nuevos de un proyecto externo. La vista previa local inicial se sustituye por el flujo autenticado; sus muestras y resultados quedan identificados como históricos.

Incluye la documentación local de cierre e integración del PR #14 que se conservó al crear esta rama; no modifica la funcionalidad de Creación de pedido. Las etiquetas accesibles de los pedidos anuncian también fecha, estado, subtotal y unidades, manteniendo el diseño aprobado.

`OrderHistoryScreen → useOrderHistoryViewModel / createOrderHistoryController → OrderHistoryActions → OrderHistoryRepository → ApiOrderHistoryRepository → HttpClient`, con composición en bootstrap. La vista no conoce credenciales o transporte; el dominio no depende de React Native. Las pruebas nuevas cubren dominio, adaptador, controlador y transporte HTTP real contra una API simulada.

## Dependencias y contratos

Depende de backend, base móvil, inicio/persistencia de sesión y Creación de pedido ya integrados; Bolsa y Direcciones aportan los datos con los que se creó el pedido y continúan con sus contratos existentes. El servidor ya ofrece el historial y este cambio no modifica `Server/`.

| Operación de solo lectura | Contrato existente |
| --- | --- |
| GET `/orders/me` | Bearer; primera página de hasta 20 resúmenes propios y `nextCursor`. |
| GET `/orders/me?cursor=...` | Bearer; cursor opaco validado y continuación del historial. |
| GET `/orders/me/:id` | Bearer; resumen y productos del pedido propio seleccionado, con dirección histórica disponible. |

Las rutas usan el prefijo `/api` y `Cache-Control: private, no-store`; el propietario se obtiene de `JWT.sub`. La lista se ordena por fecha e ID descendentes. La conexión valida IDs, cursor, estados, fechas, cantidades, moneda y coherencia de importes, y publica una proyección explícita sin notas internas o datos de otros propietarios. No añade seguimiento, confirmación de recepción, cancelación, repetición de compra, escrituras de pedidos o persistencia local. Reutiliza la configuración pública de API existente, sin dependencias o recursos nuevos.

Consulta la [guía de conexión](CONEXION-HISTORIAL-PEDIDOS.md), la [verificación técnica](evidencias/historial-pedidos/verificacion-api.json) y la [aceptación de Expo Go](evidencias/historial-pedidos/expo-go-aceptacion.json).

## Verificación

| Comprobación o escenario | Comando o procedimiento | Resultado observado |
| --- | --- | --- |
| TypeScript y lint | `npm --prefix Mobile run typecheck` / `npm --prefix Mobile run lint` | Aprobados de nuevo durante la preparación, después del ajuste de etiqueta accesible. |
| Pruebas móviles | `npm --prefix Mobile test` | 618/618 en la preparación; 60 nuevas: 6 de dominio, 15 de Repository, 31 de controlador y 8 de HTTP en loopback. |
| Expo Doctor | `npm --prefix Mobile run doctor` (1.20.4) | 21/21 en la preparación, sin cambios de dependencias. |
| Exportación Android | `npm --prefix Mobile run export:android` | Aprobada de nuevo durante la preparación: 1508 módulos, después del ajuste accesible. |
| Exportación web | Verificación anterior de la conexión | Aprobada: 1057 módulos, después de retirar la ruta QA temporal; snapshot anterior al ajuste de etiqueta, sin cambio visual. |
| Transporte HTTP | Node HTTP en loopback temporal, sin MongoDB | GET/Bearer, cursor, detalle, aislamiento, 401, 404, JSON malformado, desconexión/503 y recuperación; API y credenciales simuladas. |
| QA web sintética | Componentes y dependencias reales con sesión/datos simulados a 397/320 px | Lista, resumen, filtros, conservación ante error, reintento, vacío y 401 sin desbordamiento. Ruta QA retirada. |
| Ruta normal | Navegación web anónima | Acceso a login y Cuenta con cinco pestañas; capturas identificadas en la evidencia. |
| Backend local real | GET `/api/orders/me` sin Bearer | 401 esperado. El agente no hizo lecturas reales autenticadas ni creó o modificó pedidos. |
| Expo Go | Reportes del usuario en chat | Consulta, selección, actualización, vacío, error/recuperación, orden/filtros, reapertura y salida/reingreso aceptados; criterios 1–8. |
| CI remota | Backend CI / Mobile CI del HEAD que se publique | Pendiente de apertura y ejecución del PR; todavía no hay enlaces de checks. |
| Revisión real | ZenaidaGR desde su propia cuenta | Pendiente; criterio 9. |

Las [capturas y resultados técnicos](evidencias/historial-pedidos/verificacion-api.json) distinguen datos sintéticos de la ruta normal. La aceptación nativa procede del usuario; el agente no observó el teléfono. Paginación real de más de 20 pedidos, segundo reintento con la API todavía detenida, TalkBack y texto ampliado no tienen aceptación física específica. No se incluyen rutas o servidores temporales de QA en la implementación final.

## Revisión e integración

- [x] Se comprobaron los criterios 1–8; **Revisar el código** (9) sigue pendiente.
- [x] Se respetó la separación de arquitectura y se revisaron los contratos afectados.
- [x] No se incluyen secretos, dependencias instaladas ni archivos generados; la QA temporal se retiró.
- [x] TypeScript, lint, 618 pruebas, Doctor y exportación Android pasaron de nuevo al preparar la publicación.
- [ ] Backend CI y Mobile CI pasan sobre el HEAD publicado.
- [ ] El otro integrante revisó y aprobó desde su propia cuenta: ZenaidaGR para este PR de David567rs.
- [x] El destino coincide con el flujo acordado: `develop`; la integración prevista utilizará merge commit.
- [ ] Integrar después de la revisión real y la indicación correspondiente; actualizar ambas copias y cerrar Trello tras el merge.

Mantener la actividad **8/9** y la tarjeta **En progreso** hasta recibir la revisión real de ZenaidaGR. La solicitud de apertura no autoriza fusionar el PR ni iniciar Seguimiento del pedido o Avisos.
