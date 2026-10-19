# Diseño de Búsqueda de productos

## Diseño histórico aceptado, 19 de octubre de 2026

Este documento conserva el alcance y las comprobaciones de la etapa visual. El usuario ya aceptó escritura y borrado en Expo Go y autorizó la [conexión a la API](CONEXION-BUSQUEDA-PRODUCTOS.md) en la misma rama. El código de ejemplos descrito abajo se retiró al implementar esa conexión; las capturas y `verificacion-diseno.json` permanecen como evidencia histórica, sin validar la nueva búsqueda real.

La actividad se prepara en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/busqueda-productos`, creada desde `develop` en `50d2152`. La responsable es ZenaidaGR y David567rs revisará su futuro PR hacia `develop`.

Esta etapa agrega la vista `/busqueda-productos` y un acceso desde Catálogo. Conserva las cinco pestañas existentes y la identidad visual de INHALEX. La pantalla permite escribir y borrar texto; las sugerencias solo rellenan el campo. Las tarjetas son ejemplos pasivos rotulados como vista previa. El texto escrito no modifica esas tarjetas ni representa una consulta ejecutada.

La consulta o filtrado, resultados reales, estado sin coincidencias, errores de búsqueda y pruebas funcionales con distintos términos corresponden a la siguiente etapa. Este diseño no consulta la API, no utiliza debounce ni agrega una búsqueda local que se presente como búsqueda real. Los productos de ejemplo no navegan al detalle.

## MVVM y Repository

El recorrido de esta etapa es:

`View → ViewModel → getSearchPreview → SearchPreviewRepository → ejemplos locales`

- `productSearch/domain` define un modelo `SearchPreview` de solo lectura, el contrato `SearchPreviewRepository` y el caso de uso `getSearchPreview`.
- `productSearch/data` aporta los ejemplos locales de presentación mediante ese contrato.
- `bootstrap` compone las dependencias; la vista no construye el Repository ni realiza peticiones HTTP.
- El ViewModel mantiene el texto exacto ingresado, permite limpiarlo y aplica una sugerencia al campo. No normaliza, consulta ni filtra productos en esta etapa.
- La vista presenta ese estado y comunica las acciones del usuario. El acceso desde Catálogo utiliza la navegación existente.

El contrato local se limita a la vista previa; no se declara como contrato definitivo de la futura API de búsqueda. La sesión, los Repositories de Catálogo y Detalle y el backend conservan sus responsabilidades actuales.

## Criterios de Trello

La captura facilitada por el usuario contiene exactamente estos ocho criterios. La aceptación posterior del diseño completa los dos primeros:

- [x] Agregar campo de búsqueda.
- [x] Capturar texto ingresado.
- [ ] Consultar o filtrar productos.
- [ ] Mostrar resultados coincidentes.
- [ ] Mostrar mensaje cuando no existan resultados.
- [ ] Manejar errores de búsqueda.
- [ ] Probar diferentes términos.
- [ ] Revisar el código.

El usuario confirmó exactamente: «Ya revisé el diseño de Búsqueda en Expo Go, amigo. Puedo escribir y borrar, y ya marqué esos puntos en Trello. Sigamos con la conexión a la API en la misma rama, manteniendo MVVM y Repository.». La [evidencia textual](evidencias/busqueda-productos/expo-go-aceptacion.json) deja **2/8** aceptados. Los otros seis permanecen pendientes; las sugerencias y los ejemplos estáticos de esta etapa no acreditan búsqueda funcional. No se ha leído ni modificado Trello desde el agente.

## Recorrido histórico de diseño en Expo Go

La vista nueva se ejecuta desde la copia de Zenaida. Se utiliza el puerto `8083` para distinguirla de la copia de David en `8082`; el backend habitual permanece en `3200`. Si Metro de Zenaida ya está activo en `8083`, se reutiliza su terminal y su QR.

Desde la raíz de Zenaida, en Git Bash o CMD, el comando de arranque es:

```sh
npm --prefix Mobile run start -- --port 8083
```

1. Abrir en Expo Go el QR correspondiente a la copia de Zenaida.
2. Entrar en Catálogo y abrir el acceso a Búsqueda de productos.
3. Revisar el diseño y escribir un término, incluidos espacios y acentos.
4. Comprobar que borrar limpia el campo y que cada sugerencia únicamente rellena el texto.
5. Verificar que las tarjetas siguen identificadas como ejemplos de vista previa y no cambian al escribir.
6. Volver a Catálogo y comprobar que las cinco pestañas siguen disponibles.

El usuario aceptó el diseño, escritura y borrado mediante su confirmación en el chat. No hubo observación directa del dispositivo por el agente ni capturas nativas. Los pasos de tarjetas estáticas corresponden al diseño histórico; para la etapa vigente se utiliza la [guía de conexión](CONEXION-BUSQUEDA-PRODUCTOS.md).

## Verificación y entrega

- TypeScript global y lint sin advertencias: aprobados.
- Las 236 pruebas móviles existentes pasaron; no se añadieron pruebas que solo reproduzcan los enlaces o estilos de esta etapa visual.
- Expo Doctor: 21/21. Exportaciones Android (1432 módulos) y web aprobadas. Android generó `entry-60b06072a1c7cdb4a379c454d3c9eebb.hbc`; web generó `entry-b1f628ffd17c9f5d70b3e59f783019dd.js`.
- QA web aprobada: campo conserva `  té de limón  ` exactamente, borrar lo vacía, una sugerencia escribe `Menta`, Buscar permanece deshabilitado y las tarjetas siguen siendo ejemplos pasivos. Catálogo → Búsqueda → Catálogo funciona y conserva las cinco pestañas.
- Se revisaron anchos CSS de 291, 321 y 392 px; no hubo desbordamiento horizontal en las mediciones. El navegador tenía zoom 110 %, por lo que los tamaños físicos solicitados y los anchos CSS difieren. Las capturas no representan un dispositivo físico.
- En web el Catálogo no obtuvo productos: la API devuelve 200 al health, pero no habilita `Access-Control-Allow-Origin` para `http://localhost:8083`. No se modificó CORS; esta etapa no verifica la búsqueda contra API. La pantalla de Búsqueda solo consume sus ejemplos locales.
- Se conservaron la API 3200, Metro de David 8082, los `.env`, la identidad Git local y el stash de Zenaida. Metro de Zenaida queda activo en LAN en `exp://192.168.1.77:8083`.
- [Evidencia técnica y capturas web](evidencias/busqueda-productos/verificacion-diseno.json).
- Expo Go: diseño, escritura y borrado aceptados por el usuario mediante chat; la aceptación funcional de la conexión sigue pendiente.
- PR: no abierto en esta etapa de diseño. La revisión futura corresponde a David567rs desde su cuenta.

Los cambios permanecen locales y sin commit en la rama solicitada. No se crearon commits en nombre de Zenaida ni se publicó la rama.

Se conserva el orden acordado: diseño → aceptación del usuario → conexión y comportamiento real → pruebas → PR hacia `develop` → revisión del compañero → integración.
