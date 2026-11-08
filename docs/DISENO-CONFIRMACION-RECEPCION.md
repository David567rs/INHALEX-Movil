# Confirmación de recepción: diseño

David trabaja en `feature/confirmacion-recepcion`, desde `develop` `0f619021b4de5d5436b0f43c122d9cba6b306da3`. La referencia visual es la app INHALEX recuperada y pulida. Reseñas de Zenaida está integrada mediante el PR #21; no se cambia su implementación.

## Alcance histórico de la etapa de diseño

Preparar la opción desde Cuenta y una vista previa con pedido de ejemplo, resumen de productos y diálogo de confirmación. Los ejemplos son ficticios y las interacciones viven solo en memoria. No se consultan pedidos reales, no se cambia su recepción y no se envían escrituras a la API. La conexión, validaciones del servidor, duplicados y recuperación se trabajan después de la aceptación del diseño en Expo Go.

Conservar View → ViewModel → caso de uso → contrato Repository → implementación local, con composición en bootstrap. Reutilizar colores, encabezado, navegación y componentes de la app. Un solo desplazamiento y acciones dentro del contenido; los controles deben seguir alcanzables en pantallas pequeñas.

El usuario ya arrancó Expo y el backend. El agente no inicia, reinicia ni detiene esos servicios. No se publica esta rama ni se abre PR todavía.

## Criterios exactos de Trello

Diseño aceptado por el usuario el 8 de noviembre de 2026. La aceptación visual no acredita funcionamiento con pedidos reales.

- [x] Mostrar opción de confirmar recepción
- [ ] Validar que el pedido pueda ser confirmado
- [ ] Enviar confirmación a la API
- [ ] Evitar confirmaciones duplicadas
- [ ] Actualizar el estado del pedido
- [ ] Mostrar mensaje de confirmación
- [ ] Manejar errores
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Tras aceptar el diseño en Expo Go puede marcarse únicamente **Mostrar opción de confirmar recepción**. La revisión real de Zenaida se realizará sobre el futuro PR.

## Verificación

Implementación local en `12b5aed`, precedida por el commit de preparación `ef8c964`. El 8 de noviembre de 2026 pasaron TypeScript (`npm run typecheck`), lint (`npm run lint`) y `git diff --check`. La revisión de arquitectura no encontró problemas bloqueantes. No se añadieron dependencias ni cambios al backend.

Se comprobó la ruta `/confirmacion-recepcion` usando el Metro que el usuario ya tenía abierto en `8081`, con viewport web de 360 × 800: ejemplos Pendiente, Confirmada, Con incidencia y Sin pedidos; apertura y cancelación del diálogo; confirmación simulada; botón deshabilitado con incidencia; navegación al Historial y reinicio al ejemplo pendiente después de recargar. La consola web no registró errores durante esta comprobación. La captura del diálogo se conserva en `docs/evidencias/confirmacion-recepcion/diseno-dialogo-web.jpg`; no es una captura de Expo Go.

La revisión nativa sigue pendiente. El botón Atrás de Android, el desplazamiento real y la aceptación visual en Expo Go se comprobarán con el usuario. Esta etapa no prueba la API, la autorización real de pedidos, la idempotencia ni los errores de red.

## Estructura implementada

- Ruta delgada: `Mobile/src/app/confirmacion-recepcion.tsx`.
- Composición: `Mobile/src/bootstrap/createReceiptPreview.ts`.
- Módulo: `Mobile/src/features/orderReceipt`, con modelo y contrato de lectura en `domain`, ejemplos fijos en `data` y pantalla/ViewModel en `presentation`.
- Acceso: Cuenta → Confirmación de recepción, mediante `ReceiptEntry` dentro de `AccountMenu`.
- Pedido ficticio `DEMO-008`, Lavanda y Menta con imágenes locales existentes, tres unidades y subtotal de $180.00 MXN. No se utilizan datos de la cuenta.
- El diálogo pide una segunda acción y permite cancelar o cerrar. Confirmar cambia únicamente el estado del ViewModel en memoria. Recargar reinicia el ejemplo.
- La ruta puede abrirse directamente para revisar el diseño; no expone información personal. La protección de sesión se incorpora al conectar datos reales.

Se reutilizan el tema verde, `AppScreen`, encabezado, navegación y recursos de la app ya pulida. La app original no contiene una pantalla de recepción que pueda recuperarse literalmente; esta vista adapta los patrones actuales de Historial y Seguimiento. El contenido y la acción principal comparten un solo desplazamiento. El diálogo dispone de su propio desplazamiento para pantallas pequeñas.

## Contrato observado para la siguiente etapa

Inspección de código únicamente, sin ejecutar confirmaciones:

- `GET /api/orders/me/receipt-confirmations` consulta pedidos completados de la cuenta autenticada (actualmente hasta 12).
- `PATCH /api/orders/:id/receipt/confirm` confirma la recepción de un pedido propio completado; no requiere cuerpo.
- El estado de recepción (`pending`, `confirmed`, `issue_reported`) es independiente de `status: completed`. Confirmar recepción no inventa un nuevo estado general «Entregado».
- El backend devuelve referencia, productos, unidades, subtotal y fechas de recepción. No devuelve dirección en este contrato; el diseño no inventa una.
- La próxima etapa deberá comprobar sesión, pertenencia del pedido, estado válido, repetición, respuesta perdida y recuperación. Revisar especialmente la condición atómica de la escritura: la comprobación previa de recepción confirmada, por sí sola, no garantiza que dos peticiones concurrentes eviten efectos secundarios repetidos.

Nada de este contrato está conectado al nuevo módulo durante la etapa de diseño. No se añade un flujo de reporte de incidencia; solo se representa visualmente el estado existente.

## Revisión del usuario en Expo Go

1. En la copia de David, recargar la app que ya está abierta y entrar en **Cuenta → Confirmación de recepción**.
2. En **Pendiente**, revisar imágenes, referencia, unidades y subtotal. Desplazarse hasta las acciones.
3. Pulsar **Confirmar recepción** y después **Todavía no**: debe conservar el ejemplo pendiente.
4. Reabrir el diálogo y pulsar **Sí, recibí mi pedido**: aparece la confirmación de ejemplo y desaparece la acción de confirmar.
5. Revisar **Con incidencia** (acción deshabilitada) y **Sin pedidos** (mensaje y acceso al Historial).
6. Probar cerrar el diálogo con su X y con Atrás de Android; volver a Cuenta y comprobar que los controles siguen alcanzables.

Solo después de la aceptación visual se registra un commit documental separado y se comienza la conexión a la API, cuando el usuario la solicite. La revisión de Zenaida y el PR pertenecen a una etapa posterior.

## Aceptación y autorización de la siguiente etapa

El 8 de noviembre de 2026 el usuario informó: «Amigo, ya revisé el diseño de Confirmación de recepción en Expo Go y me gustó. Sigamos con la API en feature/confirmacion-recepcion, manteniendo MVVM, Repository y commits por etapa. No arranques Expo.»

Se acepta el criterio 1 por ese reporte. No se atribuyen observación directa del teléfono, pruebas detalladas del diálogo ni resultados de la API. Se registra esta aceptación en un commit documental separado antes de conectar la API. Se conserva la rama y el historial local; no se publica ni abre PR en esta etapa.
