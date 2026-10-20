# Diseño de Seguimiento del pedido

> **Snapshot de diseño aceptado por el usuario en Expo Go.** La aceptación exacta está en [expo-go-aceptacion.json](evidencias/seguimiento-pedido/expo-go-aceptacion.json). El diseño se guardó en `34b4f83`; el usuario autorizó después la conexión a la API en la misma rama. Los datos y verificaciones descritos abajo pertenecen a la etapa visual. No completan criterios funcionales: **0/8**.

La etapa actual comprende únicamente el diseño en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/seguimiento-pedido`, desde `develop` en `930d2023ecb801ce985acaad8dfad03657a998ae`. David567rs es responsable y ZenaidaGR revisará el futuro PR hacia `develop`. El cierre documental de Historial quedó guardado antes en el commit separado `49df3b3`; Historial continúa **9/9**, integrado mediante el PR #15.

## Alcance visual

La ruta `/seguimiento-pedido` se abre desde **Cuenta** y presenta **Vista previa** con datos locales de ejemplo. Las referencias `EJEMPLO-...` no corresponden a pedidos de la cuenta. Las seis composiciones permiten revisar **En revisión**, **Confirmado**, **Completado**, **Cancelado**, **Pedido no encontrado** y **Error de conexión**, sin realizar consultas o cambios reales.

La vista comunica el estado actual del ejemplo como un hecho del pedido. No lo equipara a enviado o entregado, no promete fechas de envío y no inventa horas o fechas de etapas. **Completado** conserva el significado del estado del backend; no acredita por sí solo una entrega física. **Cancelado** no activa ninguna cancelación. Las composiciones de no encontrado y conexión son escenas visuales seleccionadas en memoria, sin errores reales del servidor.

El Repository local es de solo lectura. Elegir otra composición cambia únicamente la muestra temporal; volver a Cuenta conserva la sesión y las cinco pestañas. No hay HTTP, uso de credenciales, almacenamiento o modificación del backend, historial, pedidos, bolsa o direcciones. El alcance no incluye seguimiento logístico, confirmación de recepción, repetir compra ni escribir un pedido real.

## MVVM y Repository

La separación conserva **OrderTrackingPreviewScreen → useOrderTrackingPreviewViewModel → loadOrderTrackingPreview → OrderTrackingPreviewRepository → LocalOrderTrackingPreviewRepository**, con `createOrderTrackingPreviewAction()` en bootstrap e inyección desde la ruta. El dominio contiene modelos de ejemplo independientes de React Native; la vista representa el estado y comunica acciones visuales. El ViewModel mantiene en memoria la composición elegida. El contrato de esta etapa no fija la futura conexión de seguimiento a la API.

El servidor ya dispone de un contrato de seguimiento autenticado con cuatro estados del pedido y fechas de eventos disponibles. Este diseño no lo consulta ni presenta los valores de una cuenta. La conexión real y su validación se realizarán después de la aceptación del diseño y una solicitud del usuario.

## Criterios de Trello: 0/8

La captura aportada por el usuario contiene exactamente estos ocho criterios, todos sin marcar:

- [ ] Obtener estado del pedido desde la API
- [ ] Mostrar información del pedido
- [ ] Mostrar estado actual
- [ ] Actualizar la información correctamente
- [ ] Manejar pedidos no encontrados
- [ ] Manejar errores de conexión
- [ ] Probar distintos estados del pedido
- [ ] Revisar el código

Seguimiento permanece **0/8** y su aceptación visual en Expo Go está pendiente. No existe un criterio independiente de diseño: incluso después de aprobar las muestras, la tarjeta seguirá **0/8** hasta comprobar el comportamiento real correspondiente. Los estados, información, actualización y errores sintéticos no completan los criterios funcionales. La fuente es la captura del usuario; el agente no leyó ni modificó Trello.

## Commits por fase

El usuario pidió conservar commits separados por fase. El cierre de Historial se guardó primero en `49df3b3`. Tras terminar las verificaciones propias se guarda el commit local exclusivo `feat(orders): diseñar seguimiento del pedido`, siguiendo [VERSIONAMIENTO.md](VERSIONAMIENTO.md). Su identificador se consulta en Git; no se introduce una referencia circular al SHA del propio documento.

La conexión a la API tendrá su propio commit cuando el usuario la autorice. Las aceptaciones y evidencias posteriores se registrarán en un commit separado de la fase que corresponda, después de recibir el reporte real. Este acuerdo no autoriza empezar la API, publicar la rama, abrir un PR, aprobarlo o fusionarlo por anticipado.

## Revisión visual en Expo Go

Reutilizar el QR de Metro de David, **8082**, conservando activos el backend y ambos Metro. Si Metro de David no estuviera activo, desde `C:\Users\David\Documents\INHALEX-Movil`:

```sh
npm --prefix Mobile run start -- --port 8082
```

1. Recargar el proyecto de David en Expo Go y abrir **Cuenta → Seguimiento del pedido**. Comprobar que se identifica **Vista previa** y datos de ejemplo, sin afirmar que pertenece a un pedido real.
2. Revisar **En revisión**, **Confirmado**, **Completado** y **Cancelado**; comprobar referencia, jerarquía visual y texto del estado actual. Ninguna muestra debe prometer envío o entrega, ni inventar fechas de etapas.
3. Revisar **Pedido no encontrado** y **Error de conexión**, comprobando que sus textos y acciones permiten examinar el diseño sin consultar el backend.
4. Volver a Cuenta y comprobar que permanecen las cinco pestañas y el estado anterior de sesión. Revisar desplazamiento y textos en el teléfono, sin recortes de controles.

La [aceptación de Expo Go](evidencias/seguimiento-pedido/expo-go-aceptacion.json) está pendiente del reporte del usuario. La [verificación propia](evidencias/seguimiento-pedido/verificacion-diseno.json) pasó: TypeScript, lint, **618/618 pruebas existentes** ejecutadas en esta etapa, Doctor **1.20.4 21/21**, exportaciones Android **1515** y web **1064** módulos. No se añadieron tests que repliquen estas muestras estáticas.

La QA web a **397×1000** y **320×820** comprobó las seis composiciones, selección accesible, actualización y reintento del ejemplo, cancelación terminal, productos y subtotal **377 MXN**, Cuenta y reentrada con el ejemplo inicial. Permanecen las cinco pestañas; inicio de sesión y registro siguen alcanzables al desplazar el área de Cuenta. No hay desbordamiento horizontal y los controles nuevos miden al menos 44 px. No hubo errores de consola; se conservan dos advertencias web previas de componentes compartidos: sombras y fallback de animación nativa a JavaScript. No se modificaron servicios, configuración, dependencias, autenticación o la copia de Zenaida.

Capturas: [diseño 397 px](evidencias/seguimiento-pedido/diseno-web-397.png), [diseño 320 px](evidencias/seguimiento-pedido/diseno-web-320.png), [cancelado](evidencias/seguimiento-pedido/cancelado-web-397.png), [resumen](evidencias/seguimiento-pedido/resumen-web-320.png), [no encontrado](evidencias/seguimiento-pedido/no-encontrado-web-320.png), [error](evidencias/seguimiento-pedido/error-web-320.png) y [Cuenta](evidencias/seguimiento-pedido/acceso-cuenta-web-320.png). Son capturas web con datos sintéticos. Expo Go, TalkBack y texto ampliado en dispositivo siguen pendientes; ninguna de estas comprobaciones completa los criterios funcionales de Trello.

La etapa termina en diseño revisable y su commit local de fase, sin publicación o PR. El orden posterior se conserva: aceptación visual → autorización de conexión a la API → implementación y pruebas → aceptación funcional → PR a `develop` → revisión real de ZenaidaGR → integración.
