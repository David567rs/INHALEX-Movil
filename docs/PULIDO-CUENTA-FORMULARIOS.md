# Cuenta, teclado y mensajes — 5 de noviembre de 2026

Trabajo local en la copia de David, rama `codex/recuperar-inicio`. El usuario aceptó el desplazamiento anterior: «Cuenta y Detalle ya se desplazan bien». Esta aceptación corresponde al desplazamiento; no acredita todavía las tres mejoras nuevas de este documento.

## Cambios por etapa

| Commit | Cambio |
| --- | --- |
| `05503bc` | Simplificar Cuenta sin sesión y priorizar Iniciar sesión. |
| `2e17cb8` | Facilitar formularios con teclado abierto y agregar una salida explícita del teclado. |
| `ff6669d` | Unificar encabezados, carga, estados vacíos y avisos con reintento. |

### Cuenta sin sesión

La tarjeta «Tu espacio INHALEX» presenta Iniciar sesión como acción principal, Crear cuenta como alternativa y Explorar catálogo como acceso secundario. Se conserva el aviso y reintento de eliminación de la sesión local cuando corresponda. Las rutas y el coordinador de sesión no cambian.

### Formularios y teclado

`FormKeyboardLayout` comparte el ajuste del espacio disponible y una barra «Ocultar teclado», visible mientras el teclado nativo está abierto. Se aplica en autenticación, Perfil, Direcciones y Creación de pedido. Los formularios conservan su desplazamiento y permiten llegar a sus botones; ocultar el teclado no guarda ni descarta el borrador.

En Creación de pedido, los campos de contacto permiten avanzar al siguiente campo. La nota conserva su entrada multilínea y no confirma el pedido al pulsar Enter. Guardar/confirmar y volver ocultan el teclado sin sustituir los bloqueos y validaciones existentes.

### Encabezados y mensajes

`ScreenHeader` y `BackButton` comparten tamaños, espacios y navegación visible. Los títulos largos pueden crecer en altura. `ScreenFeedback` reúne avisos de error/información/éxito, carga inicial y estados vacíos. Los mensajes se envuelven sin altura fija; Reintentar queda bloqueado cuando la operación está ocupada.

Se integran en Cuenta, Catálogo, Líneas, Búsqueda, Favoritos, Bolsa, Detalle, Perfil, Direcciones, Creación, Historial, Seguimiento y Avisos, según los estados que ya presenta cada pantalla. No se añaden reintentos automáticos ni se cambian los callbacks de los ViewModels. Se conservan datos y borradores ante error, sesión, confirmación incierta y limpieza pendiente del pedido.

## Verificación realizada

- `npm run typecheck`, `npm run lint` y `git diff --check`: correctos después de retirar la ruta temporal de revisión.
- Revisión independiente del diff y de las etapas de Cuenta/teclado: sin hallazgos bloqueantes en sesión, borradores o controles ocupados/deshabilitados.
- Cuenta real, sin sesión, en web a 390 × 844 y 320 × 568: acciones legibles y alcanzables. Se verificaron Iniciar sesión, Crear cuenta y Explorar catálogo mediante sus pantallas de destino. Perfil sin sesión también mostró el nuevo encabezado y su acceso a Login.
- Perfil y Direcciones a 320 × 568: formularios reales con datos ficticios Demo y controladores aislados en memoria. Guardar conservó el texto; Cancelar de Perfil restauró los datos Demo iniciales. La dirección admitió referencias en varias líneas. Esta prueba no escribió en la API.
- Mensajes extensos, carga y recuperación simulada: envolvieron el texto sin desbordamiento horizontal. Reintentar mostró actividad y quedó deshabilitado; finalizar la recuperación simulada mostró éxito. La recuperación de Cuenta conservó su acción específica «Reintentar eliminación» y su estado «Eliminando…».
- La ruta temporal `Mobile/src/app/pulido-qa.tsx` fue eliminada antes de los checks finales y no forma parte de los commits.
- La consulta web de Catálogo presentó un error de conexión durante la revisión. El límite CORS ya documentado en la recuperación no se investigó de nuevo aquí. Esta etapa no acredita nuevamente login, API o persistencia nativa.

Capturas locales, no recursos de la app: `C:\Users\David\.codex\visualizations\2026\11\05\pulido-cuenta-formularios\cuenta-390.png`, `cuenta-320.png`, `perfil-demo-320.png`, `direccion-demo-320.png` y `feedback-demo-390.png`.

## Próxima comprobación en Expo Go

Recargar la instancia existente de David que controla el usuario.

1. Sin sesión, abrir Cuenta y probar sus tres accesos.
2. En Perfil y Direcciones, enfocar campos inferiores y campos numéricos; comprobar que se puede desplazar el formulario, ocultar el teclado, conservar el borrador y alcanzar Guardar/Cancelar.
3. En Creación de pedido, comprobar avance de foco en contacto y salto de línea en la nota. Esta revisión de teclado no necesita confirmar un pedido real.
4. Revisar encabezados y mensajes en pantalla estrecha y con texto grande. Durante una carga o un reintento, comprobar que el botón correspondiente permanece bloqueado.

El teclado Android/iOS, TalkBack y el tamaño de texto nativo requieren validación en dispositivo. Las comprobaciones web no la sustituyen. No se repitieron las pruebas funcionales de API o exportaciones de etapas anteriores.

Se conservan MVVM y Repository, el historial, la copia de Zenaida y el proyecto original. No se añadieron dependencias ni se modificaron servicios, configuración o credenciales. No se inició ni detuvo Expo/Metro o el backend. No se hizo push ni se abrió un PR.
