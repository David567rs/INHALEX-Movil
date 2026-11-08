# Prueba controlada de error al confirmar recepción

## Resultado posterior: aceptado por el usuario

8 de noviembre de 2026. «Amigo, Confirmar y Verificar fallaron sin perder el pedido ficticio. Restablecer y verificar habilitaron Confirmar sin envío automático. Confirmé: quedaron 2 intentos y 1 recepción, se conservó al actualizar y salí. ¿Qué sigue?» Se acepta el comportamiento visible del caso ficticio en Expo Go, junto con la lectura real previa: **Manejar errores (7)**, avance **7/9**. La evidencia es el reporte del usuario; no hubo observación directa del teléfono por el agente ni escritura real en este caso. [Registro estructurado](evidencias/confirmacion-recepcion/aceptacion-error-confirmacion-controlada-expo-go.json). La aceptación quedó en `cc6be76`; el helper y su acceso ya se retiraron en una etapa separada. La guía siguiente es histórica y ya no ofrece un acceso disponible.

## Preparación y guía históricas

Lo siguiente conserva las instrucciones y comprobaciones de la preparación; los pendientes de aceptación nativa de ese snapshot quedan resueltos por el reporte anterior. El acceso temporal ya no está disponible.

8 de noviembre de 2026. David, `INHALEX-Movil`, rama `feature/confirmacion-recepcion`. El usuario eligió esta alternativa porque no dispone de otro pedido Completado pendiente de recepción, de prueba o realmente recibido. El caso de lectura real y su recuperación ya fueron aceptados por su reporte en `39ce307`. Esta preparación no añade aceptación de Expo Go: el checklist permanece **6/9**, criterios 1 a 6; están pendientes Manejar errores (7), Probar la funcionalidad (8) y Revisar el código (9).

## Acceso y alcance

En el Expo de David que ya está abierto, entrar en **Cuenta → Confirmación de recepción**. El panel **Prueba de desarrollo** ofrece **Probar fallo de confirmación**. Si no aparece, recargar únicamente ese Expo existente; no iniciar otro Metro ni generar otro QR. El backend y Expo pueden permanecer encendidos.

El botón abre un caso marcado **Prueba controlada · Pedido ficticio**. Usa una sesión ficticia independiente y un Repository en memoria con el controlador, ViewModel, casos de uso y pantalla reales. No inicia sesión en el backend, consulta pedidos reales, envía HTTP ni guarda en almacenamiento desde el caso ficticio. La app exterior conserva su sesión y puede realizar sus consultas normales al entrar o salir.

La muestra es **DEMO-RECEPCION-01**, **Lavanda de demostración**, presentación **10 ml**, **2 unidades** de $60.00 MXN y **Subtotal de productos: $120.00 MXN**. Sus fechas y el estado Completado también son ficticios. El primer intento de confirmar falla antes de guardar. Los contadores **Intentos de confirmar** y **Recepciones guardadas** describen solo esta memoria temporal, nunca peticiones HTTP, escrituras, notas o notificaciones de la cuenta real.

## Recorrido en Expo Go

1. Pulsar **Probar fallo de confirmación**. Comprobar el rótulo de pedido ficticio y los contadores iniciales **0 / 0**.
2. Abrir **DEMO-RECEPCION-01**. Revisar la referencia, las 2 unidades y el subtotal de $120.00 MXN.
3. Pulsar **Confirmar recepción** y luego **Sí, recibí mi pedido**. Debe aparecer **Conexión interrumpida en la prueba. Restablece la conexión y verifica la recepción.** El pedido y su resumen deben conservarse, sin Recepción confirmada. Los contadores deben quedar **1 / 0** y Confirmar recepción debe estar bloqueado.
4. Pulsar **Verificar recepción**, sin restablecer todavía la conexión simulada. Debe fallar de nuevo y conservar el mismo pedido, pendiente y con contadores **1 / 0**.
5. Pulsar **Restablecer conexión simulada**. Debe aparecer **Conexión simulada restablecida**. Este botón solo cambia la conexión del ejemplo: no consulta ni confirma por sí mismo. Los contadores siguen **1 / 0** y aún hace falta verificar.
6. Pulsar **Verificar recepción**. Debe quitarse el aviso y habilitarse **Confirmar recepción**, conservando el pedido pendiente. Comprobar que los contadores siguen **1 / 0**: no se envió una confirmación automática.
7. Pulsar de nuevo **Confirmar recepción → Sí, recibí mi pedido**. Debe aparecer **Recepción confirmada**, desaparecer la acción de repetir y quedar **2 intentos / 1 recepción guardada**, exclusivamente dentro del ejemplo.
8. Pulsar **Actualizar recepciones**. Deben conservarse **DEMO-RECEPCION-01**, su confirmación y los contadores **2 / 1**, sin nueva confirmación.
9. Pulsar **Salir de la prueba**. Debe desaparecer el caso ficticio y regresar la pantalla normal de recepción, con la sesión real que corresponda. Si no hay sesión real, se muestra el acceso para iniciar sesión. No es necesario cerrar sesión para terminar esta prueba.

Salir de la ruta también descarta el ejemplo. Volver a pulsar Probar fallo de confirmación crea un caso nuevo pendiente, con sus contadores reiniciados; eso no modifica la recepción real ya confirmada. Si una comprobación no coincide, informar el paso y el texto visible, sin atribuir a la base de datos lo que muestran los contadores ficticios.

Respuesta sugerida, solo después de completar el recorrido: «Amigo, el fallo y Verificar recepción conservaron el pedido ficticio. Restablecer y verificar habilitaron Confirmar sin enviarlo automáticamente. Después confirmé, se conservó al actualizar y Salir de la prueba me devolvió a Recepción normal.»

## Evidencia de preparación

| Comprobación | Resultado registrado |
| --- | --- |
| Suite móvil | 866/866 aprobadas, incluidas 5 nuevas del caso controlado. |
| TypeScript móvil | Correcto. |
| Lint móvil | Correcto: 0 errores y 0 advertencias. |
| `git diff --check` | Correcto. |
| Revisión técnica del caso aislado | Sin bloqueadores detectados. |
| QA web de 390 × 844 en el Metro `8081` existente | Entrada real anónima; caso ficticio; fallo de confirmación y verificación; conservación; restablecimiento sin operación automática; verificación que habilita confirmar; confirmación explícita. |
| QA web: Actualizar recepciones y Salir de la prueba | Actualizar conservó confirmación y 2/1; Salir devolvió la pantalla real anónima. Reentrar inició otro caso pendiente desde 0/0, que también se cerró. |
| Recorrido nativo en Expo Go | Pendiente del reporte del usuario. |

En la QA web, el fallo terminó con **1 intento / 0 recepciones guardadas**; restablecer y verificar conservaron **1 / 0**, y confirmar expresamente terminó en **2 / 1**. Actualizar mantuvo ese resultado. Salir retiró la sesión ficticia, y una nueva entrada empezó de nuevo en 0/0. Esas cifras son del Repository en memoria. La consola no registró errores; mostró una advertencia web de Animated por el fallback JavaScript de `useNativeDriver`. El montaje no valida transporte HTTP, almacenamiento físico, una escritura fallida del backend o notificaciones reales. La respuesta perdida después de guardar es un escenario distinto, cubierto por pruebas técnicas previas y no por este recorrido manual.

La evidencia estructurada está en [prueba-error-confirmacion-controlada.json](evidencias/confirmacion-recepcion/prueba-error-confirmacion-controlada.json). La [captura web revisada](evidencias/confirmacion-recepcion/prueba-controlada-confirmada-web.png) muestra el pedido ficticio confirmado. Las comprobaciones de la conexión real anteriores, incluidas las 861 pruebas móviles y 21 del backend, permanecen en [CONEXION-CONFIRMACION-RECEPCION.md](CONEXION-CONFIRMACION-RECEPCION.md) y no se presentan como resultados nuevos del servidor. No se generó una exportación nativa ni se hicieron cambios nuevos en el backend durante esta preparación.

## Implementación temporal y retirada

`OrderReceiptEntryScreen` carga el componente de desarrollo solo bajo `__DEV__`; producción sigue usando la pantalla y el provider de API. `ReceiptDevelopmentScreen` compone los providers locales y el panel de controles. `createReceiptFailureScenario` mantiene el pedido y los contadores en memoria. La salida y pérdida de foco llaman a la limpieza del caso; una instancia descartada no puede reiniciar operaciones. Las pruebas específicas comprueban aislamiento, fallo, ausencia de envío automático, confirmación explícita y cancelación al descartar.

El commit de aceptación previa es `39ce307`; el commit separado de implementación controlada es `9b6f9f5`. No se inició Expo, un backend u otro servicio, ni se modificaron pedidos reales, credenciales, dependencias, la copia de Zenaida o Trello por esta preparación. La comprobación final conservó el Metro `8081` con PID `33804` y el backend `3200` con PID `12968`; son un snapshot de esta verificación, no valores que deban reutilizarse sin inspección.

Después del reporte nativo, registrar su alcance exacto sin convertir el caso ficticio en evidencia del backend. Luego retirar el helper, su acceso y sus adaptaciones temporales en un commit separado, conservando los commits y evidencias previas. Comprobar la pantalla normal y los controles técnicos que correspondan tras retirarlo, antes de publicar o abrir el PR para revisión real de Zenaida. La preparación, sus pruebas y la revisión técnica del agente no completan Revisar el código (9).

## Retirada verificada, 8 de noviembre de 2026

Después de la aceptación `cc6be76`, se retiraron los tres componentes/helpers temporales y sus cinco pruebas específicas. Se restauraron la ruta directa a `OrderReceiptScreen`, sus props normales y las listas del runner/loader de pruebas. Los ocho archivos afectados coinciden exactamente con su contenido anterior al commit controlado `9b6f9f5`; no se reescribió el historial. Los controladores, Repository, casos de uso y pruebas permanentes de recepción permanecen intactos.

Pasaron `npm test` (861/861, 0 fallos), `npm run typecheck`, `npm run lint` y `git diff --check`. Las cinco pruebas retiradas explican la diferencia frente a las 866 de la preparación. No quedan referencias al helper en `Mobile/src` ni `Mobile/tests`.

La comprobación de la ruta normal en `http://localhost:8081/confirmacion-recepcion`, usando el Metro existente, mostró **Confirmar recepción**, **Tus pedidos, contigo** e **Iniciar sesión**, sin panel ni pedido ficticio. No se observaron errores de consola; solo la advertencia web de Animated sobre su fallback JavaScript. Esto verifica la entrada anónima web, no sustituye la prueba nativa de sesión que sigue pendiente. No se iniciaron ni reiniciaron servicios, se modificaron pedidos reales, se publicó la rama o se abrió PR.
