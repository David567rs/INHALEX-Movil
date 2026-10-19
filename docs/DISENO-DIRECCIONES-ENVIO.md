# Diseño de Direcciones de envío

Etapa visual en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/direcciones-envio`, creada desde `develop` en `27d2495301bd52aa32749220c77f9dca24d0dde5`. David567rs es responsable y ZenaidaGR revisará el futuro PR a `develop`. Perfil quedó integrado y completo, 10/10, con el [PR #12](https://github.com/David567rs/INHALEX-Movil/pull/12); su [evidencia de integración](evidencias/perfil-usuario/integracion-pr12.json) conserva revisión y CI reales.

## Alcance visual

Cuenta ofrece **Direcciones de envío**, con etiqueta accesible **Ver diseño de direcciones**, hacia `/direcciones-envio`. La pantalla presenta **Vista previa**, **Direcciones de ejemplo para revisar el diseño** y las composiciones **Con direcciones / Sin direcciones**. La primera muestra dos tarjetas sintéticas, **Casa** y **Trabajo**; la segunda permite revisar la composición vacía. Ninguna representa direcciones registradas de la sesión actual.

**Nueva dirección** abre un formulario vacío y **Editar** abre el formulario con una muestra. Se puede escribir únicamente en un borrador en memoria. **Cancelar** descarta el borrador y vuelve a la lista sin modificar las muestras. **Guardar dirección** permanece deshabilitado y sin acción asociada; eliminar, seleccionar y **Dirección principal** también están deshabilitados. Abrir el formulario de ejemplo no acredita edición de una dirección real.

El formulario contempla etiqueta, destinatario, teléfono, calle, números exterior e interior, colonia, municipio, estado, código postal y referencias. **Número interior (opcional)** y **Referencias (opcional)** siguen el DTO existente consultado; las ubicaciones usan los rótulos neutrales **Estado** y **Municipio o alcaldía**. Esta etapa no valida campos ni utiliza esos datos para envíos.

Se conservan las cinco pestañas, identidad INHALEX y sesión actual. No hay consulta o escritura de direcciones en la API, selección para pedidos, persistencia del borrador ni cambios de backend, autenticación o dependencias.

## MVVM y Repository

`Vista → useAddressesPreviewViewModel → ReadAddressesPreview → AddressPreviewRepository → LocalAddressPreviewRepository`

`shippingAddresses/domain` contiene el modelo, contrato de solo lectura y caso de uso. El Repository local aporta las muestras y `createAddressesPreviewAction` compone las dependencias en bootstrap. El ViewModel mantiene la composición, el modo lista/alta/edición y el borrador temporal; la vista comunica acciones de presentación. Este contrato se limita al diseño y no fija el de la futura conexión a la API.

## Criterios de Trello: 0/10

La captura del usuario contiene exactamente estos diez criterios, todos pendientes:

- [ ] Agregar formulario para registrar dirección
- [ ] Crear pantalla de direcciones
- [ ] Validar campos obligatorios
- [ ] Guardar dirección mediante la API
- [ ] Mostrar direcciones registradas
- [ ] Permitir seleccionar una dirección
- [ ] Permitir editar o eliminar una dirección
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Direcciones permanece **0/10**, con aceptación visual en Expo Go pendiente. Solo después de que el usuario apruebe el diseño podrán aceptarse los criterios 1 y 2. Las muestras y el borrador no completan mostrar direcciones registradas, selección ni edición/eliminación reales (5, 6 y 7), ni los demás criterios funcionales. El agente no ha leído ni modificado Trello.

## Revisión visual prevista

Reutilizar Metro de David en `8082` y su QR. Si no está activo, desde la raíz de esa copia:

```sh
npm --prefix Mobile run start -- --port 8082
```

1. Abrir Cuenta → **Direcciones de envío** y revisar los rótulos de vista previa, las tarjetas Casa/Trabajo y **Con direcciones / Sin direcciones**.
2. Pulsar **Nueva dirección**, revisar la distribución y escribir datos de ejemplo en el borrador; comprobar **Número interior (opcional)**, **Referencias (opcional)** y **Guardar dirección** deshabilitado.
3. Pulsar **Cancelar** y comprobar que no aparece una nueva tarjeta. Abrir **Editar** en una muestra, cambiar el borrador y cancelar: la tarjeta original debe conservarse.
4. Revisar la composición **Sin direcciones** y comprobar que selección, predeterminada y eliminación no realizan acciones.
5. Volver a Cuenta y comprobar que las cinco pestañas y el estado previo de sesión siguen disponibles.

La [verificación del diseño](evidencias/direcciones-envio/verificacion-diseno.json) registra TypeScript, lint, las 424 pruebas existentes, Doctor 21/21 y exportaciones Android/web aprobados. La QA web a 320 y 397 px comprobó lista, composición vacía, formulario, escritura local, descarte con Cancelar, controles inactivos y navegación Cuenta/Direcciones con cinco pestañas. No se añadió una prueba que replique el diseño estático. La QA web y las muestras no sustituyen la aceptación visual en Expo Go ni prueban registro, validación, selección o mutaciones reales. Teclado, TalkBack y texto ampliado nativos siguen pendientes de dispositivo.

Los cambios de Direcciones permanecen locales, sin commit, publicación ni PR. Se conserva el orden: diseño → aceptación del usuario → conexión y comportamiento real → pruebas → PR a `develop` → revisión del compañero → integración.
