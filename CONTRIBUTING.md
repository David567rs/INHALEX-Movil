# Colaboración en INHALEX Movil

Este repositorio inicia un historial propio para recuperar el backend y la aplicación móvil por etapas. El proyecto anterior se conserva como referencia. El [plan de trabajo](docs/PLAN-DE-TRABAJO.md) define las quince actividades, sus responsables, ramas y dependencias; la [arquitectura](docs/ARCHITECTURE.md) define la separación del código.

## Responsables

David tiene once actividades funcionales: registro, inicio de sesión, persistencia de sesión, catálogo, líneas o categorías, detalle, perfil, direcciones, creación de pedido, historial y seguimiento.

Zenaida tiene cuatro: búsqueda, favoritos, bolsa y Avisos. Avisos consiste en una bandeja dentro de la app que consulta los avisos del usuario y permite actualizar su estado leído.

David coordina los PR de preparación y Zenaida los revisa. Estas tareas de infraestructura son adicionales a las quince actividades. Cada integrante implementa las capas necesarias de sus actividades; el reparto no se divide entre interfaz y lógica.

## Ramas e incorporación inicial

| Rama | Propósito | Destino del PR |
| --- | --- | --- |
| `main` | Documentación inicial y versiones aprobadas. | Recibe la release. |
| `develop` | Integración de bases y funcionalidades verificadas. | Recibe las ramas de trabajo. |
| `feature/backend-base` | Recuperación, configuración, validación y CI de `Server/`. | `develop` |
| `feature/mobile-bootstrap` | Base Expo, navegación, tema, API, composición y CI de `Mobile/`. | `develop` |
| `feature/<actividad>` | Una actividad con el nombre exacto indicado en el plan. | `develop` |
| `release/vX.Y.Z` | Integración final, QA y correcciones de una versión. | `main` y reintegración en `develop`. |

El commit inicial de `main` contiene documentación y reglas reales del proyecto. `develop` se crea desde ese estado. Después se integra primero la base del backend y luego la base móvil. El código funcional se incorpora por sus PR, sin copiar el `.git` anterior ni presentar código recuperado como desarrollado desde cero.

## Procedimiento por actividad

1. Actualizar `develop` y crear desde allí la rama exacta de la actividad.
2. Revisar el checklist, los contratos y las dependencias antes de modificar archivos compartidos.
3. Implementar o adaptar la actividad y verificar su comportamiento con la API.
4. Abrir el PR hacia `develop`, usando la plantilla, e identificar el código o los recursos recuperados y sus adaptaciones.
5. Ejecutar las comprobaciones pertinentes y adjuntar resultados y evidencia del comportamiento.
6. Recibir la revisión del compañero: Zenaida revisa los PR de David; David revisa los de Zenaida. La aprobación se registra desde la cuenta real del revisor.
7. Resolver observaciones y fusionar mediante **merge commit** para conservar la relación entre rama, PR y revisión.

No se sustituye la revisión del compañero por una aprobación creada con otra identidad. Cada PR corresponde a una actividad; los cambios de preparación o contratos compartidos se identifican como infraestructura y se coordinan antes de que otras ramas dependan de ellos.

## Validación y CI

Los workflows se incorporan en los PR de base. Esta documentación describe el flujo requerido; no demuestra que los checks, las protecciones o las credenciales ya estén configurados en GitHub.

- El backend debe tener comprobaciones reales de compilación y pruebas existentes pertinentes. Se documentan su configuración y cualquier requisito de base de datos o servicios.
- La móvil debe comprobar TypeScript, lint y las pruebas pertinentes que existan. Las comprobaciones deben utilizar scripts disponibles en el proyecto y fallar cuando detecten un problema.
- El CI selecciona los proyectos afectados por el cambio. Una modificación del contrato API requiere comprobar a sus consumidores.
- Las verificaciones realizadas en el proyecto anterior se repiten después de recuperar el código. Un checklist anterior es referencia, no evidencia de aceptación del nuevo PR.
- No se presenta como aprobado un check que no se ejecutó, se omitió o no verificó código. No se silencian fallos para conseguir un estado verde.
- La evidencia funcional describe el escenario y el resultado observado. Para interfaces, puede incluir capturas o una demostración en Android; para contratos, ejemplos de solicitudes y respuestas sin información sensible.

Un PR está listo para fusionar cuando satisface su checklist, funciona con sus dependencias integradas, supera las comprobaciones definidas para su alcance y recibe la aprobación del otro integrante. Al configurar GitHub se solicitarán revisión y checks requeridos en `main` y `develop` según las capacidades disponibles; se verificará la configuración aplicada.

## Recuperación y configuración

El PR de importación identifica la ruta y revisión de origen, los módulos o recursos recuperados y las adaptaciones realizadas. Se conservan los avisos de licencia que correspondan.

Se versionan ejemplos de configuración sin secretos. Archivos `.env`, tokens, credenciales de MongoDB, llaves de firma, contraseñas y cuentas de servicio no se incorporan al repositorio. Los directorios generados y dependencias instaladas también quedan fuera de Git. Las variables `EXPO_PUBLIC_*` son públicas y solo contienen configuración apta para incluirse en la aplicación.

## Release y entrega Android

1. Con las quince actividades integradas, crear `release/v1.0.0` desde el `develop` actualizado. Para versiones posteriores se utiliza la versión correspondiente.
2. Realizar QA e integración, incluyendo Android y el recorrido de registro, acceso, catálogo, bolsa, pedido y consulta posterior. Corregir los defectos en la rama release.
3. Abrir y revisar el PR de la release hacia `main`; fusionarlo mediante merge commit después de superar sus criterios.
4. Reintegrar las correcciones de la release en `develop` mediante PR y merge commit. Si no hay diferencias que integrar, registrar esa comprobación.
5. Crear el tag de versión, por ejemplo `v1.0.0`, en el commit aprobado de `main`.
6. El workflow de entrega que se configure detectará el tag y generará el AAB firmado mediante EAS. Debe comprobar que la versión etiquetada corresponde a `main` y conservar evidencia del artefacto generado.

Antes de activar la entrega se configuran y verifican EAS, credenciales de firma y los secretos necesarios del workflow. La publicación en Google Play se prepara y autoriza por separado de la compilación. Los fallos de build o firma se corrigen y se documentan; el tag por sí solo no certifica una entrega exitosa.
