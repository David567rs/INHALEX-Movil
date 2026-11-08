# Revisión de las mejoras visuales

Preparación del 7 de noviembre de 2026. Responsable David567rs; revisora solicitada ZenaidaGR. Rama `codex/recuperar-inicio` hacia `develop`, sin autorización de fusión. La base remota comprobada es `95842a654d576681fa49f7e1363d440a03282792` (PR #19).

**PR publicado:** [#20 — Recuperar diseño de INHALEX y mejorar catálogo, Cuenta y formularios](https://github.com/David567rs/INHALEX-Movil/pull/20), abierto por David567rs con revisión solicitada y verificada a ZenaidaGR. Permanece abierto y sin fusionar. El enlace y la solicitud no equivalen a aprobación humana; consultar la CI del último HEAD publicado. Este registro es un commit documental separado de la aceptación y la preparación.

## Alcance final

Se recuperan Inicio, vídeo e imágenes de la app original; se incorpora búsqueda dentro de Catálogo, tarjetas compactas de Favoritos/Bolsa, Detalle adaptable, Cuenta con desplazamiento único, formularios con manejo de teclado y mensajes compartidos. La implementación conserva MVVM, Repository y sus commits por etapa; no modifica `Server/`, paquetes, locks ni configuración de la app respecto de la base.

La referencia de recuperación y hashes está en [Inicio](RECUPERACION-INICIO.md). Las etapas visuales y sus límites se documentan en [Catálogo y Detalle](RECUPERACION-CATALOGO-Y-DETALLE.md) y [Cuenta y formularios](PULIDO-CUENTA-FORMULARIOS.md). El commit `7b0a62f` registra por separado el reporte nativo de teclado del usuario; no reemplaza la revisión del compañero.

## Comprobaciones locales de esta preparación

Todas se ejecutaron desde la copia de David. El código móvil verificado es el mismo del HEAD `1f473b45b32eb6f398d1c16d796b6c9a9026a295`; los commits posteriores de esta preparación son documentales.

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0 |
| `npm test` | 766 correctas, 0 fallidas y 0 omitidas; exit 0 |
| `npm run doctor` | 20/20 correctas; exit 0 |
| `npm run export:android` | 1476 módulos, 81 assets; exit 0 |
| `git diff --check develop...HEAD` | Sin errores |
| Revisión independiente de Home/Catálogo | Sin hallazgos bloqueantes |
| Revisión independiente de Cuenta/Detalle/formularios | Sin hallazgos bloqueantes |

El export produjo el bundle Android y terminó; no se inició un servidor para Expo Go ni se generó QR. No es una instalación, AAB o prueba física nueva. Los resultados de la CI remota y la revisión humana se verifican aparte del resultado local.

## Aceptación y límites

El usuario aceptó previamente el desplazamiento de Cuenta y Detalle. El 7 de noviembre confirmó en Expo Go que en Perfil y Direcciones alcanza los botones con el teclado abierto, puede ocultarlo y conserva el borrador. La fuente es el chat, sin observación directa del teléfono por el agente.

Siguen pendientes de comprobación específica los recorridos nativos no reportados: teclado de Registro/Login, avance de foco y nota multilínea de Pedido, texto ampliado, TalkBack, iOS y los demás escenarios visuales enumerados en las guías. No se amplía la aceptación a esos casos ni se afirma que toda la tarjeta de Reseñas esté completa.

## Integración posterior

La copia de Zenaida permanece en `feature/resenas`, sin trasladar cambios ni publicar su rama. Al incorporar el diseño después de aprobar e integrar este PR, resolver la composición de Cuenta conservando el acceso a Reseñas en el nuevo menú, `ReviewsProvider`, la ruta `/resenas` y las suites Home/Reviews. No reemplazar carpetas ni archivos completos para elegir un solo lado.

Se conservan historial, identidades, entornos y servicios. Publicar esta rama y pedir revisión está autorizado; fusionar, reescribir commits o abrir el PR de Reseñas no forma parte de esta etapa.
