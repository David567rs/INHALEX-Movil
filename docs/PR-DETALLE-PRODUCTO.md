# PR #8: Implementar Detalle de producto con API y accesos a Favoritos y Bolsa

Descripción del [PR #8](https://github.com/David567rs/INHALEX-Movil/pull/8), abierto por David567rs desde `feature/detalle-producto` hacia `develop`. La rama está publicada y la revisión está solicitada a ZenaidaGR; no hay aprobación ni merge. El HEAD al abrir fue `6b9658887b5432ff7b9ca36ed43fe0bdfb810b1f`; los checks finales se consultan sobre el HEAD vigente del PR.

## Actividad y alcance

Las tarjetas del Catálogo abrían una vista previa con el listado en memoria. Este cambio consulta el producto seleccionado mediante GET público `/products/:idOrSlug` y muestra nombre, imagen, descripción, precio, disponibilidad e información adicional disponible. Incluye carga, producto no disponible, actualización y reintento; un fallo recuperable conserva el último detalle válido y un 404 retira los datos anteriores.

El alcance incluye los iconos y accesos «Ver favoritos» y «Ver bolsa» hacia las pestañas existentes en preparación. No guardan favoritos ni agregan el producto a la bolsa: esas funciones corresponden a las actividades posteriores de Zenaida. La QA web de ambos accesos pasó; su confirmación en Expo Go sigue pendiente.

La navegación al volver conserva la categoría; «Ver todos los productos» restaura la colección sin filtro. El usuario confirmó en Expo Go datos completos, cambio entre productos, aviso con datos conservados, recuperación tras reiniciar el backend y ambos recorridos de regreso.

Detalle tiene 5/9 criterios aceptados: pantalla, consulta seleccionada, datos principales, adicionales y manejo de errores. Catálogo reúne 9/9 por sus comprobaciones acumuladas y la navegación recién aceptada en esta rama; la tarjeta continúa abierta hasta integrar este PR.

## Código y recursos recuperados

El diseño adapta `ProductDetails.tsx` de la app móvil original, revisión `526a21e11da1cd1e3f6edea350c7731f90e205bf`, y conserva sus recursos de marca y producto. La conexión usa el Repository, caso de uso, controlador y composición del nuevo proyecto. La vista previa en memoria se sustituyó por la consulta pública; el mapper de Catálogo se comparte para precio, promoción e imagen.

## Dependencias y contratos

Depende de backend, base móvil, Catálogo y Líneas ya integrados. Mantiene `Screen → ViewModel/controller → GetProductDetail → ProductDetailRepository → ApiProductDetailRepository → HttpClient`, con inyección en `bootstrap`, DTO validado, identidad de respuesta y modelo público explícito.

El usuario aclaró que los criterios 5 y 6 requieren únicamente los accesos de navegación. La funcionalidad completa de Favoritos y Bolsa no bloquea esos dos criterios. Permanecen pendientes su comprobación nativa, el recorrido completo de Detalle (criterio 8) y la revisión real de Zenaida (criterio 9); no se simula un favorito guardado ni una adición a la bolsa.

## Verificación

| Comprobación o escenario | Procedimiento | Resultado observado |
| --- | --- | --- |
| TypeScript y lint | `npm --prefix Mobile run typecheck` y `npm --prefix Mobile run lint` | Aprobados; lint sin advertencias en la implementación. |
| Pruebas móviles | `npm --prefix Mobile test` | 236/236; 30 nuevas de Detalle. |
| Expo Doctor | `npm --prefix Mobile run doctor` | 21/21. |
| Exportación JavaScript | Android y web | Aprobadas: 1426 y 974 módulos. |
| HTTP local de lectura | Cliente/Repository/caso de uso contra 3200 | ID y slug correctos, 404, ruta inválida, campos públicos y sin Bearer/cookies. |
| QA web | Componentes reales con HTTP temporal y datos públicos | Carga, datos adicionales, error/reintento, 404, 393 y 320 px. |
| Accesos a Favoritos y Bolsa | Iconos y navegación a las pestañas existentes | QA web aprobada en 393 y 320 px; aceptación nativa pendiente. |
| Expo Go | Confirmaciones del usuario en chat | Datos, cambio de producto, error/recuperación y regreso con/sin filtro aceptados. |
| CI del PR | Backend CI y Mobile CI | Consultar los checks del HEAD vigente en el PR; CI final todavía sin acreditar. |
| Revisión de ZenaidaGR | Desde su propia cuenta | Solicitada; aprobación pendiente. |

Los checks técnicos indicados se repitieron después del ajuste de accesos y de retirar la ruta QA. La [verificación de accesos](evidencias/detalle-producto/verificacion-accesos.json) usó un snapshot público inyectado solo para UI y comprobó las pestañas de destino seleccionadas, las cinco pestañas presentes, acciones de al menos 72 px y ausencia de desbordamiento. La ruta temporal se retiró y no quedó en los bundles. Las [evidencias API](evidencias/detalle-producto/verificacion-api.json) separan HTTP real de QA web aislada por CORS. La [aceptación de Expo Go](evidencias/detalle-producto/expo-go-aceptacion.json) procede del usuario; el agente no observó el dispositivo ni acredita TalkBack, fuente ampliada o movimiento reducido físicos.

## Revisión e integración

- [x] Se comprobaron los cinco criterios de Detalle aceptados; las dependencias pendientes se identifican arriba.
- [x] Se respetó MVVM y Repository y se revisaron los contratos públicos.
- [x] Se conservan configuración y secretos fuera del cambio; los temporales QA se retiraron.
- [x] Las comprobaciones técnicas pertinentes pasaron tras el ajuste de accesos.
- [x] Se verificó en web el ajuste de accesos a Favoritos y Bolsa.
- [ ] El usuario confirma los accesos y el recorrido completo de Detalle en Expo Go.
- [ ] Backend CI y Mobile CI pasan sobre el HEAD publicado.
- [ ] ZenaidaGR revisa y aprueba desde su cuenta.
- [ ] Integrar en `develop` mediante merge commit y actualizar ambas copias.

Después del merge se puede cerrar la dependencia de navegación en la tarjeta de Catálogo. Detalle mantiene 5/9 aceptados por el usuario hasta comprobar los accesos y el recorrido completo; la revisión se marcará tras la aprobación real. Guardar favoritos y agregar productos siguen fuera de esta actividad.
