# Preparación: corregir arranque y acceso tras migrar a Expo SDK 58

Estado al 5 de noviembre de 2026: preparación local, sin publicación ni nuevo PR. No se realizó ninguna fusión en esta etapa. El PR #18 ya está cerrado y fusionado; este documento prepara una revisión posterior hacia `develop`.

## Actividad y alcance

- Tarea de infraestructura: recuperación del arranque y del acceso tras la migración.
- Responsable: David567rs. Revisión prevista: ZenaidaGR desde su cuenta.
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
| UUID al confirmar pedido en Android | Crear un pedido de prueba explícitamente acordado, desde Expo Go | **Pendiente.** Abrir la app e iniciar sesión no ejecuta este generador. |
| CI y revisión de la corrección | Requieren publicar y abrir un nuevo PR | Pendientes; no se reutiliza la aprobación del PR #18. |

Los reportes nativos están registrados en [Recuperación del inicio de sesión](RECUPERACION-INICIO-SESION.md). El agente no observó directamente el teléfono. Las pruebas de sesión usan almacenamiento y transporte simulados y no sustituyen SecureStore ni la confirmación de pedido en el dispositivo. Durante esta preparación no se arrancó ni detuvo Expo, Metro o el backend.

## Revisión e integración

- [ ] Criterios de aceptación completos: falta la creación de pedido con UUID nativo.
- [x] Separación de arquitectura y contratos revisados.
- [x] Sin secretos, dependencias instaladas ni archivos generados en el cambio.
- [x] TypeScript, lint y pruebas móviles aprobados en la preparación aislada.
- [ ] CI del nuevo PR aprobada sobre su HEAD vigente.
- [ ] Revisión y aprobación nueva de ZenaidaGR sobre las correcciones.
- [ ] Integración autorizada hacia `develop` mediante merge commit.

El siguiente paso es completar la prueba nativa pendiente y registrar su resultado por separado. La publicación, la apertura de un PR posterior y su integración se identificarán con sus propios enlaces y commits cuando ocurran. El PR #18 y las ramas originales se conservan.
