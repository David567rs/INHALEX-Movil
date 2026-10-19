> Hito histórico de diseño. El usuario lo aceptó y después completó las pruebas funcionales: Bolsa está 9/10, pendiente de revisión real. El estado vigente está en [CONEXION-BOLSA-COMPRAS.md](CONEXION-BOLSA-COMPRAS.md) y [expo-go-aceptacion.json](evidencias/bolsa-compras/expo-go-aceptacion.json).

# Diseño de Bolsa de compras

Etapa visual en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/bolsa-compras`, creada desde `develop` en `a943e7d164bce14689eb8373cf689bfb8ff1329b`. ZenaidaGR es responsable y David567rs revisará el futuro PR a `develop`. Favoritos quedó integrado y completo, 9/9, con el [PR #10](https://github.com/David567rs/INHALEX-Movil/pull/10); su [evidencia de integración](evidencias/favoritos/integracion-pr10.json) conserva revisión y CI reales.

## Alcance visual

La pestaña existente de Bolsa presenta `CartPreviewScreen`, **Vista previa** y el selector **Con productos / Bolsa vacía**. La composición con productos contiene dos muestras: Lavanda, cantidad 2 a $149.00 MXN por unidad, y Eucalipto, cantidad 1 a $129.00 MXN. Sus importes son $298.00 y $129.00 MXN; **Subtotal de muestra** y **Total de muestra** suman **$427.00 MXN**. El resumen indica **Envío: Por definir** y el total no incluye envío. Estos importes representan únicamente las muestras del diseño, sin cotización ni pedido real.

Los controles de cantidad, **Quitar** y **Continuar con mi pedido** permanecen deshabilitados. El estado vacío muestra **Tu bolsa aún está vacía** y **Explorar catálogo**, que utiliza la ruta existente de Catálogo. En la composición con productos, el mismo destino se presenta como **Seguir explorando**, con etiqueta accesible **Explorar catálogo**. Las muestras no abren Detalle. Cambiar el selector solo permite comparar las dos composiciones y no agrega, cambia ni elimina productos de una bolsa personal.

Se conservan las cinco pestañas, la identidad INHALEX y la sesión actual. Esta etapa no consulta la API, no persiste datos, no agrega mutaciones ni requisitos de autenticación y no incorpora dependencias. Los favoritos reales integrados mantienen su funcionamiento.

## MVVM y Repository

`CartPreviewScreen → useCartPreviewViewModel → ReadCartPreview → CartPreviewRepository → LocalCartPreviewRepository`

El dominio define las muestras de solo lectura, el contrato `CartPreviewRepository` y `ReadCartPreview`. `LocalCartPreviewRepository` aporta los ejemplos y `createCartPreviewAction` compone las dependencias en bootstrap. El ViewModel prepara importes de presentación y mantiene el modo visual; la vista representa ese estado. Este contrato se limita al diseño y no fija el contrato de la futura API de Bolsa.

## Criterios de Trello: 0/10

La captura del usuario muestra la tarjeta en progreso con estos diez criterios sin marcar. No incluye un criterio independiente de diseño:

- [ ] Agregar productos a la bolsa
- [ ] Mostrar los productos agregados
- [ ] Modificar la cantidad de productos
- [ ] Eliminar productos de la bolsa
- [ ] Calcular el total de la compra
- [ ] Evitar cantidades inválidas
- [ ] Mantener actualizada la información de la bolsa
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Bolsa permanece **0/10**, con diseño pendiente de aceptación en Expo Go. Las muestras, el vacío sintético y la suma ilustrativa no completan criterios funcionales. El agente no ha leído ni modificado Trello. La conexión y las operaciones reales se abordarán después de aceptar el diseño, seguidas de aceptación funcional y revisión real del compañero.

## Revisión visual prevista

Reutilizar Metro de Zenaida en `8083` y su QR. Si no está activo, desde la raíz de esa copia:

```sh
npm --prefix Mobile run start -- --port 8083
```

1. Abrir **Bolsa** en Expo Go y revisar **Vista previa**, las dos muestras, las cantidades y el total ilustrativo de $427.00 MXN.
2. Comprobar que cantidad, **Quitar** y **Continuar con mi pedido** están deshabilitados, y que **Seguir explorando** abre Catálogo.
3. Cambiar a **Bolsa vacía**, revisar **Tu bolsa aún está vacía** y abrir Catálogo con **Explorar catálogo**.
4. Volver a Bolsa y comprobar que las cinco pestañas y el estado previo de Cuenta siguen disponibles.

La [verificación del diseño](evidencias/bolsa-compras/verificacion-diseno.json) registra TypeScript, lint, las 322 pruebas existentes, Doctor 21/21 y exportaciones Android (1450 módulos) y web (998 módulos) aprobadas. No se añadieron pruebas que reproduzcan las muestras estáticas. La QA web comprobó colección, vacío, imágenes, resumen y ausencia de desbordamiento a 320/397 px; siete controles de compra están deshabilitados, los de cantidad/quitar tienen al menos 44 px y los selectores 46 px. Se conservan cinco pestañas, y el enlace a Catálogo abre su ruta y permite regresar. La carga de datos de Catálogo en web mantiene su error de conexión previo, sin cambios de configuración o backend.

Se revisaron la separación de capas y los estados accesibles; los iconos decorativos están ocultos a accesibilidad. No hay prueba física de TalkBack o texto ampliado. La QA web y las muestras no sustituyen la aceptación visual en Expo Go ni prueban una bolsa real, sincronización, validación de cantidades o creación de pedidos. La interfaz usa los componentes existentes con soporte de movimiento reducido; no se afirma una comprobación física de esa preferencia en Android.

Los cambios de Bolsa permanecen locales, sin commit, publicación de rama ni PR. Se conserva el orden: diseño → aceptación del usuario → conexión y comportamiento real → pruebas → PR a `develop` → revisión del compañero → integración.
