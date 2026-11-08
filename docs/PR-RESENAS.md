# Implementar Reseñas con MVVM y Repository

**Publicado:** [PR #21](https://github.com/David567rs/INHALEX-Movil/pull/21), autor ZenaidaGR, revisión solicitada y verificada a David567rs. Abierto, sin draft y sin fusionar. Este enlace se registra en un commit documental separado. La aprobación y la CI del último HEAD se comprueban por separado.

## Actividad y alcance

Desde Cuenta, el usuario autenticado puede elegir un producto de un pedido Completado, calificarlo de 1 a 5 estrellas y publicar un comentario de 4 a 700 caracteres. La reseña pasa a Enviadas y el producto deja de ofrecerse en Por reseñar. La pantalla permite actualizar, conserva los datos ante errores recuperables y verifica la colección antes de habilitar un nuevo intento de publicación.

- Responsable y autora: ZenaidaGR. Revisor solicitado: David567rs.
- Origen: `feature/resenas`. Destino: `develop`.
- Checklist funcional: **9/10**, criterios 1 a 9 aceptados por reportes del usuario en Expo Go. Falta **Revisar el código**, a cargo de David.
- Se conservan ramas y commits de diseño, API, integración y aceptación. Este PR se abre para revisión, **sin fusionarlo**.

## Código y recursos recuperados

Se reutilizan el tema, la navegación de Cuenta, el cliente HTTP autenticado, la sesión y el contrato de Reseñas existentes en este repositorio. Las capas específicas de Reseñas y sus pruebas se incorporan con esta actividad. No se realiza una nueva importación desde Proyecto-INHALEX. Las mejoras visuales ya integradas por el PR #20 se conservan mediante el merge de integración de la rama.

El diff incluye la documentación de cierre de Avisos conservada en el commit previo `0d8dca5`. No añade cambios funcionales de Avisos, backend, dependencias ni configuración respecto de develop.

## Dependencias y contratos

Base verificada: `develop` en `199603a2fbda9e2e5e967fe0d0aefe2792752e6c`, incorporada como ancestro de la rama. Los PR #18, #19 y #20 ya están integrados.

- GET autenticado `/api/reviews/me/eligible`: productos elegibles y reseñas enviadas.
- POST autenticado `/api/reviews`: `productId`, `orderId`, `rating` y `comment`.
- El dominio define contratos y validaciones; Repository y mapper adaptan la API; controlador y ViewModel gestionan la presentación; bootstrap inyecta las dependencias. La vista no realiza HTTP.
- Una escritura fallida conserva estrellas y comentario. Verificar reseñas consulta por GET y no vuelve a publicar automáticamente.
- Cerrar o cambiar sesión cancela operaciones, descarta respuestas tardías y limpia información personal.

La API existente consulta los últimos 30 pedidos completados. La elegibilidad no requiere la futura actividad Confirmación de recepción. No se incluyen edición o eliminación de reseñas ni cambios del estado de pedidos.

## Verificación

Comprobaciones ejecutadas el 8 de noviembre de 2026 en la copia de Zenaida sobre `cf2ccaca310924ed4617831abeb935703716f9e4`; los commits posteriores de preparación solo documentan resultados.

| Comprobación o escenario | Comando o procedimiento | Resultado observado |
| --- | --- | --- |
| Tipos | `npm --prefix Mobile run typecheck` | Exit 0 |
| Lint | `npm --prefix Mobile run lint` | Exit 0 |
| Pruebas móviles | `npm --prefix Mobile test` | 813 correctas, 0 fallidas, 0 omitidas |
| Dependencias y configuración | `npm --prefix Mobile run doctor` | 20/20 correctas |
| Bundle Android | `npm --prefix Mobile run export:android` | Exportación correcta, 1488 módulos |
| Revisión técnica independiente | Inspección del diff respecto de develop | Sin hallazgos bloqueantes; no sustituye la aprobación de David |
| Aceptación en Expo Go | Reportes del usuario: validación, publicación, elegibilidad, errores y sesión | Criterios funcionales 1 a 9 aceptados |

La exportación generó el bundle y terminó; no inició un servidor para Expo Go ni generó QR. No representa una nueva instalación o prueba física. No se modificaron servicios ni la copia de David.

Evidencia: [checklist y contrato](CONEXION-RESENAS.md), [aceptación reportada](evidencias/resenas/expo-go-aceptacion.json) y [comprobaciones de esta preparación](evidencias/resenas/verificacion-pr.json). Las pruebas HTTP utilizan fixtures aisladas; no se publicaron reseñas reales por el agente. Otra cuenta, sesión caducada y respuesta perdida después de guardar no tienen aceptación nativa específica. La CI remota del último HEAD y la revisión humana se comprobarán por separado.

## Revisión e integración

- [x] Se comprobaron los criterios funcionales de aceptación de esta actividad; queda la revisión humana.
- [x] Se respetó la separación de arquitectura y se revisaron los contratos afectados.
- [x] No se incluyen secretos, dependencias instaladas ni archivos generados.
- [x] Las comprobaciones locales pertinentes pasaron en el nuevo proyecto.
- [ ] David567rs revisó y aprobó desde su propia cuenta.
- [x] El destino es develop y se conserva el historial; cualquier integración posterior usará merge commit y requiere otra instrucción.

La apertura y la solicitud de revisión están verificadas en [el registro del PR #21](evidencias/resenas/preparacion-pr21.json). La revisión humana sigue pendiente.
