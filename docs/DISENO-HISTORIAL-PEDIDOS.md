# Diseño de Historial de pedidos

> **Snapshot histórico del diseño, aceptado por el usuario en Expo Go.** La etapa vigente continúa en [Conexión de Historial de pedidos](CONEXION-HISTORIAL-PEDIDOS.md), con **1/9** aceptado: Crear pantalla de historial. El resto de este documento conserva las muestras y comprobaciones de la etapa visual; sus pendientes describen aquel hito, no la aceptación posterior. La funcionalidad real conectada sigue pendiente de aceptación.

Etapa visual en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/historial-pedidos`, desde `develop` en `77b9ab5aa8ca4171669ddda8b42adee028cefc59`. David567rs es responsable y ZenaidaGR revisará el futuro PR hacia `develop`. El alcance autorizado es únicamente el diseño; la aceptación visual en Expo Go está pendiente.

## Alcance visual

La ruta `/historial-pedidos` se abre desde **Cuenta → Historial de pedidos**, con etiqueta accesible **Mostrar diseño de historial** y ayuda **Vista previa de tus pedidos**. El acceso a las muestras también está disponible sin iniciar sesión para revisar esta etapa. La pantalla identifica **Vista previa** y datos de ejemplo; no representa los pedidos de la cuenta.

La composición **Con pedidos** presenta tres referencias sintéticas, de la fecha más reciente a la más antigua:

| Referencia | Fecha | Estado de ejemplo | Subtotal de productos |
| --- | --- | --- | --- |
| EJEMPLO-001 | 19 de octubre de 2026 | En revisión | $547.00 MXN |
| EJEMPLO-002 | 16 de octubre de 2026 | Confirmado | $348.00 MXN |
| EJEMPLO-003 | 10 de octubre de 2026 | Completado | $507.00 MXN |

Los importes se calculan desde las cantidades y precios de las muestras. Se rotulan como **Subtotal de productos**; no se inventa un envío cobrado, envío gratuito, pago o total final de una compra real. Las fechas y estados son parte del diseño, sin consulta ni seguimiento de pedidos reales.

**Todos / En curso / Completados** filtran únicamente estas muestras en memoria. Seleccionar un pedido abre su resumen local con referencia, fecha, estado, productos, cantidades e importes. El resumen utiliza **Pedido recibido**, **Confirmado por INHALEX** o **Pedido completado**, sin promesas de envío o entrega. Cambiar el filtro o la composición descarta la selección visual. **Sin pedidos** muestra **Aún no tienes pedidos** y **Cuando hagas tu primer pedido, su historia comenzará aquí.**; **Explorar catálogo** abre la ruta real `/catalogo`. Volver a **Con pedidos** restaura la composición inicial. Reentrar inicia otra vez las muestras, sin persistencia.

Se conservan la identidad visual INHALEX y las cinco pestañas. Esta etapa no consulta la API de historial, no modifica autenticación, sesión, bolsa, direcciones o pedidos, ni añade almacenamiento. Seguimiento, repetir compra y las operaciones de pedido real quedan fuera de este diseño. No se crean pedidos ni confirmaciones reales.

## MVVM y Repository

`OrderHistoryPreviewScreen → useOrderHistoryPreviewViewModel → LoadOrderHistoryPreview → OrderHistoryPreviewRepository → LocalOrderHistoryPreviewRepository`

El dominio define los modelos sintéticos, el contrato de lectura y el caso de uso construido por `createLoadOrderHistoryPreview`. El Repository local aporta tres muestras inmutables o el estado vacío. El ViewModel administra composición, filtro y pedido seleccionado; la vista representa ese estado y comunica las acciones. Bootstrap compone el Repository con el caso de uso mediante `createOrderHistoryPreviewAction()` y la ruta inyecta `loadPreview` en la pantalla. Los filtros del modelo son `all`, `in-progress` y `completed`; los resúmenes se describen con `summaryLabel`, sin asociarlos a seguimiento de envío.

El contrato se limita a la vista previa y no fija el de la futura API de historial. No se introduce un Repository HTTP ni se proporciona la sesión autenticada a este flujo visual.

## Criterios de Trello: 0/9

La captura aportada por el usuario contiene exactamente estos nueve criterios, todos sin marcar:

- [ ] Crear pantalla de historial
- [ ] Obtener pedidos desde la API
- [ ] Mostrar fecha, total y estado
- [ ] Ordenar los pedidos de forma clara
- [ ] Permitir seleccionar un pedido
- [ ] Mostrar mensaje si no existen pedidos
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Historial permanece **0/9**. La revisión visual en Expo Go está pendiente; después de que el usuario apruebe el diseño podrá aceptarse **Crear pantalla de historial** (1). Las referencias, fechas, subtotales, filtros, selección y vacío sintéticos no completan los criterios funcionales restantes. El agente no leyó ni modificó Trello; la captura del usuario es la fuente del checklist.

## Revisión visual en Expo Go

Reutilizar el QR de Metro de David en **8082**, conservando activos la API y ambos Metro. Si ese Metro no estuviera activo, desde `C:\Users\David\Documents\INHALEX-Movil`:

```sh
npm --prefix Mobile run start -- --port 8082
```

1. Recargar el proyecto de David en Expo Go y abrir **Cuenta → Historial de pedidos**. Comprobar que se identifica la vista previa y que los datos son ejemplos, incluso sin sesión.
2. En **Con pedidos**, revisar tres referencias, fechas, estados y subtotales. Comprobar la distribución de la más reciente a la más antigua.
3. Probar **En curso**, **Completados** y **Todos**: deben aparecer dos, uno y tres ejemplos, respectivamente.
4. Seleccionar un ejemplo, revisar su resumen local y regresar a la lista; abrir otro y comprobar que cambia la muestra. Esta acción no consulta un pedido de la cuenta.
5. Revisar **Sin pedidos** con **Aún no tienes pedidos**; comprobar **Explorar catálogo**, regresar al diseño y revisar de nuevo **Con pedidos**. Volver a Cuenta y comprobar desplazamiento, textos sin recorte y las cinco pestañas.

La aceptación se registrará en [expo-go-aceptacion.json](evidencias/historial-pedidos/expo-go-aceptacion.json) después de la confirmación del usuario. La [verificación técnica del diseño](evidencias/historial-pedidos/verificacion-diseno.json) registra TypeScript y lint correctos tras el último ajuste de accesibilidad, **558/558 pruebas existentes**, Expo Doctor 1.21.5 **21/21**, y exportaciones Android (**1504 módulos**) y web (**1053 módulos**) aprobados. No se añadieron pruebas que dupliquen el diseño estático.

La QA web a **397×1000** y **320×820** píxeles CSS comprobó orden EJEMPLO-001/002/003, filtros Todos (3), En curso (2) y Completados (1), selección de 001/002 con resumen correcto y restablecimiento de la selección al cambiar filtro o composición. Se comprobaron los estados accesibles `checked`, `aria-pressed` y `aria-expanded`, el vacío exacto, **Explorar catálogo** hacia `/catalogo`, regreso a Cuenta y reentrada con tres muestras, cinco pestañas y acceso al registro alcanzable a 320 px. No hubo desbordamiento horizontal ni errores de consola. Se conservaron tres advertencias web preexistentes sobre sombras, fallback de `useNativeDriver` y `pointerEvents`, fuera del alcance de este diseño. Navegar a Catálogo verifica la ruta, sin constituir aceptación nueva de su carga existente desde la API.

Las capturas web son [lista a 397 px](evidencias/historial-pedidos/diseno-web-397.png), [lista a 320 px](evidencias/historial-pedidos/diseno-web-320.png), [resumen de ejemplo](evidencias/historial-pedidos/resumen-ejemplo-web-397.png), [vacío](evidencias/historial-pedidos/vacio-web-320.png) y [acceso desde Cuenta](evidencias/historial-pedidos/acceso-cuenta-web-320.png). Estas comprobaciones corresponden a esta etapa, no a una aceptación de pedidos reales. Ninguna comprobación web sustituye la revisión física pendiente de Expo Go, TalkBack, texto ampliado o teclado nativo; Historial continúa **0/9**.

Los cambios permanecen locales, sin commit, publicación, PR o integración. Se conserva el orden: diseño → aceptación del usuario → conexión a la API y comportamiento real en la misma rama → pruebas → PR a `develop` → revisión de ZenaidaGR → integración.
