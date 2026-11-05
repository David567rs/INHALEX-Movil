# PR #19: corregir arranque y acceso tras migrar a Expo SDK 58
> Estado actualizado el 5 de noviembre de 2026: PR #19 aprobado por ZenaidaGR y fusionado en `develop` mediante merge commit `95842a6`, conservando los seis commits. La solicitud previa de dejarlo abierto que se reproduce abajo pertenece a la preparación histórica; el usuario autorizó después su fusión y la sincronización local. Reseñas y las mejoras visuales continúan en sus respectivas ramas.


Estado al 5 de noviembre de 2026: el [PR #19](https://github.com/David567rs/INHALEX-Movil/pull/19) está abierto, sin draft, de David567rs hacia `develop`, con revisión solicitada a ZenaidaGR. HEAD de apertura: `08b05c2efb7ac0f45014551119cf5c04a09014f8`; base consultada: `2aa6d86fd3c247a438b3fc54a20b3c9c3b5e59f5`. Backend CI y Mobile CI aprobaron sobre ese HEAD; la nueva aprobación sigue pendiente. El PR #18 ya está cerrado y fusionado; el PR #19 no está fusionado y su apertura no autoriza integrarlo. Este registro no anticipa los checks del HEAD que incorporará el enlace documental: consultar los resultados actuales en el PR.

## Actividad y alcance

- Tarea de infraestructura: recuperación del arranque y del acceso tras la migración.
- Responsable y autor del PR: David567rs. Revisión solicitada: ZenaidaGR desde su cuenta; aprobación todavía pendiente.
- Rama de origen y destino: `codex/correcciones-expo58` → `develop`.
- Criterios: abrir la app, entrar y restaurar sesión con cuentas antiguas válidas, completar Perfil y comprobar la generación nativa de la clave de pedido.

La importación de `expo-crypto` durante el arranque producía el error de módulo nativo ausente. Además, las cuentas antiguas con nombre completo pero sin los campos personales separados eran rechazadas al interpretar una respuesta válida de la API. Los cambios usan el generador UUID de Expo, comparten el mapeo público de cuenta entre login, restauración y Perfil, y permiten completar los campos ausentes manteniendo las validaciones del formulario.

## Código y recursos recuperados

Se conservan los commits existentes de `chore/expo-sdk-58`, sin rebase, squash ni cambio de autor:

| Commit | Etapa |
| --- | --- |
| `a35d643b55fe921cc72b0fb68e18343d845238ad` | Corregir el arranque y usar UUID nativo de Expo. |
| `ca009a8f0b2fc8dbe2a5af52a48e5195045e9b9d` | Admitir cuentas anteriores válidas y completar Perfil. |
| `bd5bd289df61cc25f1660f0cfa79a343620acce0` | Registrar la aceptación de acceso, Perfil y reapertura. |

El [PR #18](https://github.com/David567rs/INHALEX-Movil/pull/18) integró cuatro commits hasta `4bf34a288cdfe63923ccaa032cf69713755c8db6`. ZenaidaGR lo aprobó el `2026-11-05T11:56:35Z` y lo fusionó a las `11:56:45Z`, con merge `2aa6d86fd3c247a438b3fc54a20b3c9c3b5e59f5`, comprobado mediante GitHub y fetch. Los tres commits anteriores no forman parte de esa fusión. Su aprobación no cubre estas correcciones posteriores.

La preparación se hizo en un worktree independiente. Las ramas de las dos copias de desarrollo permanecieron en su lugar. Reseñas y los ajustes visuales posteriores conservan su trabajo e historial aparte y no se incorporan al alcance de esta revisión.

En la apertura, el merge `2aa6d86` del PR #18 no es ancestro de la rama de correcciones. Su árbol coincide exactamente con el de la base común `4bf34a2`: la diferencia de historial corresponde al commit de fusión, sin código de `develop` omitido. Se mantiene la historia original de las correcciones.

## Dependencias y contratos

Requiere la migración a SDK 58 del PR #18. Mantiene MVVM y Repository, la validación del JWT, el almacenamiento de sesión y la protección contra envíos duplicados. No cambia endpoints ni el backend. El mapeo conserva únicamente datos públicos, acepta el `name` anterior sin inventar apellidos o teléfono y rechaza campos presentes malformados. No hay modificaciones de dependencias o del lockfile respecto del PR #18.

## Verificación

Comprobaciones ejecutadas en el worktree aislado sobre `bd5bd28`, con las dependencias instaladas correspondientes al mismo manifiesto y lockfile:

| Comprobación o escenario | Comando o procedimiento | Resultado observado |
| --- | --- | --- |
| Tipos | `npm run typecheck`, desde `Mobile` | Aprobado, exit 0. |
| Lint | `npm run lint`, desde `Mobile` | Aprobado, exit 0. |
| Regresiones móviles | `npm test`, desde `Mobile` | 741 pruebas aprobadas, 0 fallidas y 0 omitidas. Incluye seis regresiones de cuentas antiguas. |
| Revisión de diferencias | Auditoría de los 17 archivos funcionales/documentales de los tres commits | Sin defecto bloqueante identificado; conservación de validaciones y datos públicos. |
| Acceso y Perfil en David | Reportes del usuario en Expo Go | Entrada, guardado, actualización y restauración al reabrir aceptados. |
| Acceso en Zenaida | Reporte independiente del usuario en Expo Go | Entrada, datos visibles y sesión restaurada al reabrir aceptados. |
| Flujo nativo que utiliza UUID al confirmar pedido | Nueva confirmación en Expo Go de David, según la guía y el reporte posterior del usuario | Aceptado: recibo En revisión, bolsa vacía y mismo pedido en Historial con referencia, cantidades e importes coincidentes. No es una inspección del UUID. |
| CI inicial de la corrección | [Backend CI 42030823131](https://github.com/David567rs/INHALEX-Movil/actions/runs/42030823131) y [Mobile CI 42030823149](https://github.com/David567rs/INHALEX-Movil/actions/runs/42030823149) | Ambas `success` sobre `08b05c2`; no anticipa el resultado del siguiente commit documental. |
| Revisión de la corrección | PR #19 abierto y revisión solicitada a ZenaidaGR | Pendiente; no se reutiliza la aprobación del PR #18. |

Los reportes nativos están registrados en [Recuperación del inicio de sesión](RECUPERACION-INICIO-SESION.md). El agente no observó directamente el teléfono. Las pruebas de sesión usan almacenamiento y transporte simulados y no sustituyen SecureStore ni la confirmación de pedido en el dispositivo. Durante esta preparación no se arrancó ni detuvo Expo, Metro o el backend.

La aceptación posterior de pedido se realizó siguiendo la guía para una confirmación nueva en la copia activa de David, `codex/recuperar-inicio` (`2b74324`). Antes de guiarla se comprobó que contiene `a35d643` y que bootstrap, controlador, dominio, validación, almacenamiento y dependencias del flujo coinciden con la rama de correcciones; la pantalla tiene pulido visual posterior. No se atribuye prueba de doble toque, respuestas perdidas, inspección de base de datos ni ausencia global de duplicados a este reporte.

## Revisión e integración

- [x] Criterios funcionales de la corrección aceptados: acceso, Perfil, restauración y nueva creación de pedido, con el alcance reportado por el usuario.
- [x] Separación de arquitectura y contratos revisados.
- [x] Sin secretos, dependencias instaladas ni archivos generados en el cambio.
- [x] TypeScript, lint y pruebas móviles aprobados en la preparación aislada.
- [x] Backend CI y Mobile CI del PR #19 aprobadas sobre el HEAD de apertura `08b05c2`.
- [ ] Consultar CI del HEAD vigente tras publicar este registro documental.
- [ ] Revisión y aprobación nueva de ZenaidaGR sobre las correcciones.
- [ ] Integración autorizada hacia `develop` mediante merge commit.

La aceptación nativa quedó registrada en `08b05c2`, separada de la preparación `762e844`. Tras la autorización del usuario se publicó la rama y se abrió el [PR #19](https://github.com/David567rs/INHALEX-Movil/pull/19), con revisión solicitada a ZenaidaGR. Sigue comprobar CI del HEAD vigente y obtener su nueva revisión desde su cuenta. No se realizó ninguna fusión; la integración requiere autorización posterior. El PR #18 y las ramas originales se conservan.
