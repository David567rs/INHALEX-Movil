# Confirmación de recepción: prueba del estado vacío

**Estado vigente:** aceptada por el usuario y helper retirado. El recorrido siguiente queda como evidencia histórica; sus botones temporales ya no están disponibles. Checklist **8/9**, pendiente solo la revisión de Zenaida.

Preparación del 8 de noviembre de 2026 en la copia de David, rama `feature/confirmacion-recepcion`. El usuario eligió «Preparemos un caso vacío aislado». La aceptación previa de reapertura y sesión está en `7307e28`; la preparación del caso está en `46555c9`.

## Alcance

El acceso temporal **Probar recepciones vacías** solo se carga en desarrollo. Compone la pantalla, ViewModel, acciones y controlador reales con un Repository vacío en memoria y una sesión ficticia limitada a ese árbol. No usa HTTP ni almacenamiento, ni altera pedidos o credenciales reales. Otros componentes de la app pueden realizar sus lecturas normales.

La simulación se descarta al salir o perder foco. **Ver mis pedidos** conserva su navegación normal hacia el Historial real; no usa la sesión ficticia. Reentrar en la prueba crea un caso nuevo. La aplicación de producción conserva los proveedores reales.

## Recorrido en Expo Go

Usar los servicios que el usuario ya tiene abiertos. No se requiere detener el backend, generar otro QR ni cambiar de cuenta. Si falta el acceso, recargar el proyecto existente en Expo Go.

1. Entrar en **Cuenta → Confirmación de recepción** y pulsar **Probar recepciones vacías**.
2. Comprobar **No hay recepciones disponibles** y la ausencia de una opción de confirmar pedidos.
3. Pulsar **Actualizar recepciones**. Debe mantenerse el mensaje vacío, sin aviso de error.
4. Pulsar **Ver mis pedidos**. Debe abrir el Historial real y finalizar la simulación.
5. Volver a **Cuenta → Confirmación de recepción**. Las recepciones reales y sus confirmaciones deben seguir como antes.
6. Entrar de nuevo en **Probar recepciones vacías** y pulsar **Salir de la prueba**. Deben recuperarse los datos reales sin cambios.

Respuesta sugerida:

> Amigo, apareció «No hay recepciones disponibles», se mantuvo al actualizar y «Ver mis pedidos» abrió Historial. Al volver y al salir de la prueba reaparecieron mis recepciones reales sin cambios.

## Comprobaciones técnicas y sus límites

- 864/864 pruebas móviles correctas, sin fallos ni omisiones. Tres pruebas nuevas cubren carga y actualización vacías, bloqueo de confirmaciones inexistentes y descarte de respuestas pendientes al salir.
- TypeScript, lint y `git diff --check` correctos.
- Revisión técnica sin bloqueadores en el aislamiento, descarte y navegación.
- QA web usando el Metro existente en `:8081`, a 1280 × 720: entrada, mensaje vacío, actualización, navegación a Historial y salida explícita correctas. La sesión del navegador era anónima; al volver se comprobó la protección real sin sesión. No se afirma haber observado allí las recepciones personales del teléfono.
- Sin errores de consola; una advertencia web conocida de Animated sobre el fallback JavaScript de `useNativeDriver`.

[Evidencia estructurada](evidencias/confirmacion-recepcion/prueba-vacio-controlada.json) y [captura web](evidencias/confirmacion-recepcion/prueba-vacio-web.png).

Estas comprobaciones no sustituyen la aceptación nativa. El checklist sigue **7/9**; **Probar la funcionalidad (8)** queda pendiente del reporte del usuario y **Revisar el código (9)** de Zenaida. Después de aceptar el vacío se retirará el helper en un commit separado antes de preparar el PR, conservando esta guía y sus evidencias.

No se cambiaron servicios, Trello, la copia de Zenaida ni pedidos reales. No se publicó la rama ni se abrió PR.

## Aceptación nativa — 8 de noviembre de 2026

El usuario reportó: «Amigo, apareció “No hay recepciones disponibles”, se mantuvo al actualizar y “Ver mis pedidos” abrió Historial. Al volver y al salir de la prueba regresaron mis recepciones reales sin cambios. ¿Qué marco en Trello y qué sigue?»

Se acepta el recorrido vacío aislado y **Probar la funcionalidad (8)** junto con los casos previos: **8/9**, pendiente solo la revisión real de Zenaida. La fuente es el reporte del usuario sobre Expo Go; no se afirma observación directa del teléfono ni vacío real de la API. El texto exacto queda en [la evidencia de aceptación](evidencias/confirmacion-recepcion/aceptacion-vacio-expo-go.json). Las instrucciones de preparación anteriores pasan a ser referencia histórica. La retirada del acceso temporal se registra por separado, conservando esta guía, sus evidencias y el historial.

## Retirada verificada — 8 de noviembre de 2026

La aceptación quedó en `855746b`. Se retiraron los tres archivos runtime temporales, la prueba de escenario con sus tres casos y sus registros en el runner y loader; la ruta vuelve a renderizar OrderReceiptScreen directamente, sin prop ni panel de desarrollo. Los contratos, Repository HTTP, acciones, controlador, ViewModel y pruebas permanentes siguen intactos. `Mobile/src` y `Mobile/tests` coinciden con `7307e28`, antes de preparar el vacío.

Pasaron **861/861 pruebas móviles**, TypeScript, lint y `git diff --check`. La revisión técnica no encontró bloqueadores y la búsqueda de referencias temporales en código y pruebas quedó vacía. Las tres pruebas retiradas pertenecían exclusivamente al helper ficticio; se conserva la cobertura permanente del estado vacío y de los demás comportamientos. No se observó nuevamente el dispositivo ni se hizo una nueva QA web en esta retirada.

Los procesos existentes de backend y Metro se conservaron. No se modificaron pedidos, Trello, la copia de Zenaida ni dependencias; no se publicó la rama ni se abrió PR. [Registro de retirada](evidencias/confirmacion-recepcion/retirada-vacio-controlado.json). El siguiente paso es preparar el PR de David hacia develop para Zenaida cuando el usuario lo solicite, conservando todos los commits y sin anticipar su revisión.
