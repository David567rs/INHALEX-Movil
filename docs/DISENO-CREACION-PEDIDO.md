# Diseño de Creación de pedido

> **Snapshot histórico del diseño, aceptado por el usuario en Expo Go.** El usuario autorizó continuar con la API en la misma rama. La etapa vigente está en [Conexión de Creación de pedido](CONEXION-CREACION-PEDIDO.md); este documento conserva las muestras, acciones deshabilitadas y comprobaciones de la etapa visual. El diseño aceptado no completa criterios funcionales: la tarjeta continúa **0/11**.

Etapa visual en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/creacion-pedido`, creada desde `develop` en `1808ba1cbcd8940c84759395c6818ee950aa140d`. David567rs es responsable y ZenaidaGR revisará el futuro PR hacia `develop`. Direcciones quedó integrada y completa, **10/10**, con el [PR #13](https://github.com/David567rs/INHALEX-Movil/pull/13); su [evidencia de integración](evidencias/direcciones-envio/integracion-pr13.json) registra la aprobación real y las dos CI correctas. El agente no leyó ni modificó Trello y el marcado final de esa tarjeta no fue confirmado por el usuario.

## Alcance visual

La pantalla `/creacion-pedido` se abre desde **Bolsa → Mostrar diseño de pedido**. Este acceso provisional aparece también sin sesión o con bolsa vacía para permitir la revisión del diseño. Con la bolsa real cargada y con productos, el acceso inferior se identifica como **Ver diseño de pedido**. Ambos abren la misma vista previa: sus datos son sintéticos y no se copian desde la cuenta ni desde la bolsa actual.

La pantalla identifica **Vista previa**, presenta el resumen de dos productos de ejemplo, cantidades e importes, dirección de envío y desglose. Las muestras usan **2 × $129.00 + 1 × $119.00 = $377.00 MXN**. El importe corresponde únicamente a productos; el envío permanece por definir y no se presenta como envío gratuito ni como un total final cobrado.

Las composiciones **Con productos / Sin dirección / Bolsa vacía** permiten revisar la distribución. **Con productos** ofrece **Casa** y **Trabajo**, direcciones ficticias que pueden seleccionarse solo en memoria. Esa selección no cambia la principal real de la cuenta ni prepara un envío. **Sin dirección** muestra la composición sin selección; **Bolsa vacía** presenta el estado sin productos. Se puede regresar a Bolsa y a los accesos existentes sin alterar sus datos.

**Confirmar pedido** permanece deshabilitado y sin envío asociado. No se crea un pedido, no se muestra una confirmación de éxito, no se vacía la bolsa y no se persisten productos, selección o borradores. Backend, autenticación, bolsa real, direcciones reales y dependencias permanecen dentro de su alcance anterior. Se conservan identidad INHALEX y las cinco pestañas.

## MVVM y Repository

El recorrido es **OrderPreviewScreen → useOrderPreviewViewModel → GetOrderPreview → OrderPreviewRepository → PreviewOrderRepository**. `createOrderPreviewAction` compone las dependencias en `bootstrap` y la ruta las inyecta a la pantalla. Las fotos locales de Lavanda y Menta se resuelven solo en presentación; el dominio contiene claves de imagen independientes de React Native.

El dominio define los datos de resumen visual, productos y direcciones de ejemplo, junto con el contrato de lectura independiente de React Native y del transporte. La implementación local aporta datos sintéticos en memoria. El ViewModel administra la composición y selección visual temporal; la vista muestra estado y comunica esas acciones. No se inyecta un Repository HTTP ni la sesión autenticada en esta vista previa. Este contrato del diseño no fija las operaciones de creación reales que se acordarán al conectar la API.

## Criterios de Trello: 0/11

La captura del usuario contiene exactamente estos once criterios, todos pendientes:

- [ ] Verificar productos de la bolsa
- [ ] Verificar cantidades y total
- [ ] Seleccionar dirección de envío
- [ ] Mostrar resumen del pedido
- [ ] Enviar solicitud de creación de pedido a la API
- [ ] Evitar la creación duplicada del pedido
- [ ] Mostrar confirmación cuando el pedido se cree correctamente
- [ ] Manejar errores durante la creación
- [ ] Limpiar o actualizar la bolsa después de confirmar
- [ ] Probar la funcionalidad
- [ ] Revisar el código

La etapa visual quedó aceptada mediante el mensaje: «Amigo, ya revisé el diseño de Creación de pedido en Expo Go y me gustó. Sigamos con la conexión a la API en la misma rama feature/creacion-pedido, manteniendo MVVM y Repository.». El checklist no contiene un criterio separado de diseño y permanece **0/11**. Aprobar esta vista no acredita los productos o importes de la bolsa real, selección de dirección registrada ni resumen de un pedido real; esos criterios se comprobarán con las dependencias y la API en la etapa funcional. Deshabilitar **Confirmar pedido** tampoco acredita evitar pedidos duplicados. El agente no marca Trello.

## Revisión visual en Expo Go

Reutilizar el QR de Metro de David en **8082**, sin detener la API ni los Metro de ambas copias. Si ese Metro no estuviera activo, desde `C:\Users\David\Documents\INHALEX-Movil`:

```sh
npm --prefix Mobile run start -- --port 8082
```

1. Recargar Expo Go en la copia de David y abrir **Bolsa → Mostrar diseño de pedido**. Revisar los rótulos de vista previa y datos de ejemplo, incluidos sin sesión.
2. En **Con productos**, revisar los dos productos, cantidades, desglose y **$377.00 MXN** en productos; comprobar que envío permanece por definir.
3. Seleccionar **Trabajo** y volver a **Casa**; comprobar que solo cambia el indicador visual de la dirección de ejemplo y **Confirmar pedido** sigue deshabilitado.
4. Revisar **Sin dirección** y **Bolsa vacía**, con textos legibles y acciones coherentes; volver a **Con productos**.
5. Regresar a Bolsa y comprobar que conserva sus productos e importes reales y siguen las cinco pestañas. Revisar en dispositivo pequeño que pueda desplazarse hasta el final y que no se recorten acciones.

La [verificación del diseño](evidencias/creacion-pedido/verificacion-diseno.json) registra TypeScript, lint, las 485 pruebas existentes, Doctor 21/21 y exportaciones Android (1485 módulos) y web (1033 módulos) aprobados. La QA web a 320/397 píxeles CSS comprobó distribución sin desbordamiento horizontal, muestras con imágenes locales, selección temporal y resumen, modos sin dirección y bolsa vacía, confirmación inactiva y retorno a Bolsa anónima con cinco pestañas. La selección expone `aria-checked` además del estado nativo. Reentrar reinicia las muestras; una recarga completa permite tomar su versión más reciente. No se agregaron pruebas que dupliquen el diseño estático.

La [aceptación de Expo Go](evidencias/creacion-pedido/expo-go-aceptacion.json) registra la revisión visual textual del usuario. El agente no observó el teléfono ni comprobó una bolsa autenticada en esta QA. Las capturas son web; teclado, TalkBack y texto ampliado en Android no tienen aceptación física nueva. Configuración, servicios, identidades y stash se conservaron en aquel hito; Zenaida permanecía limpia en `develop` en `1808ba1`.

Esta etapa histórica terminó en diseño revisable, sin commit, publicación, PR ni conexión de creación de pedido. Tras la aceptación visual, el orden continúa con conexión y comportamiento real en la misma rama → pruebas → PR a `develop` → revisión de ZenaidaGR → integración. Consulta la guía de conexión para el estado vigente.
