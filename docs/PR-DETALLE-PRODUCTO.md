# Borrador de PR: Implementar Detalle de producto con MVVM y Repository

Preparado para `feature/detalle-producto` → `develop`, responsable David567rs. Este archivo es la descripción local; el PR y la solicitud de revisión a ZenaidaGR se crearán en el siguiente paso.

## Actividad y alcance

Las tarjetas del Catálogo abrían una vista previa con el listado en memoria. Este cambio consulta el producto seleccionado mediante GET público `/products/:idOrSlug` y muestra nombre, imagen, descripción, precio, disponibilidad e información adicional disponible. Incluye carga, producto no disponible, actualización y reintento; un fallo recuperable conserva el último detalle válido y un 404 retira los datos anteriores.

La navegación al volver conserva la categoría; «Ver todos los productos» restaura la colección sin filtro. El usuario confirmó en Expo Go datos completos, cambio entre productos, aviso con datos conservados, recuperación tras reiniciar el backend y ambos recorridos de regreso.

Detalle tiene 5/9 criterios aceptados: pantalla, consulta seleccionada, datos principales, adicionales y manejo de errores. Catálogo reúne 9/9 por sus comprobaciones acumuladas y la navegación recién aceptada en esta rama; la tarjeta continúa abierta hasta integrar este PR.

## Código y recursos recuperados

El diseño adapta `ProductDetails.tsx` de la app móvil original, revisión `526a21e11da1cd1e3f6edea350c7731f90e205bf`, y conserva sus recursos de marca y producto. La conexión usa el Repository, caso de uso, controlador y composición del nuevo proyecto. La vista previa en memoria se sustituyó por la consulta pública; el mapper de Catálogo se comparte para precio, promoción e imagen.

## Dependencias y contratos

Depende de backend, base móvil, Catálogo y Líneas ya integrados. Mantiene `Screen → ViewModel/controller → GetProductDetail → ProductDetailRepository → ApiProductDetailRepository → HttpClient`, con inyección en `bootstrap`, DTO validado, identidad de respuesta y modelo público explícito.

Favoritos y Bolsa de compras dependen de actividades posteriores de Zenaida. Sus botones continúan deshabilitados, «Próximamente»; los criterios de acceso y prueba completa de Detalle siguen pendientes. La revisión humana también está pendiente.

## Verificación

| Comprobación o escenario | Procedimiento | Resultado observado |
| --- | --- | --- |
| TypeScript y lint | `npm --prefix Mobile run typecheck` y `npm --prefix Mobile run lint` | Aprobados; lint sin advertencias en la implementación. |
| Pruebas móviles | `npm --prefix Mobile test` | 236/236; 30 nuevas de Detalle. |
| Expo Doctor | `npm --prefix Mobile run doctor` | 21/21. |
| Exportación JavaScript | Android y web | Aprobadas: 1426 y 974 módulos. |
| HTTP local de lectura | Cliente/Repository/caso de uso contra 3200 | ID y slug correctos, 404, ruta inválida, campos públicos y sin Bearer/cookies. |
| QA web | Componentes reales con HTTP temporal y datos públicos | Carga, datos adicionales, error/reintento, 404, 393 y 320 px. |
| Expo Go | Confirmaciones del usuario en chat | Datos, cambio de producto, error/recuperación y regreso con/sin filtro aceptados. |
| CI del nuevo PR | Backend CI y Mobile CI | Pendiente de publicación del PR. |
| Revisión de ZenaidaGR | Desde su propia cuenta | Pendiente. |

Los checks técnicos pertenecen a la implementación; los cambios posteriores registran aceptación y documentación. Las [evidencias técnicas](evidencias/detalle-producto/verificacion-api.json) separan HTTP real de QA web aislada por CORS. La [aceptación de Expo Go](evidencias/detalle-producto/expo-go-aceptacion.json) procede del usuario; el agente no observó el dispositivo ni acredita TalkBack, fuente ampliada o movimiento reducido físicos.

## Revisión e integración

- [x] Se comprobaron los cinco criterios de Detalle aceptados; las dependencias pendientes se identifican arriba.
- [x] Se respetó MVVM y Repository y se revisaron los contratos públicos.
- [x] Se conservan configuración y secretos fuera del cambio; los temporales QA se retiraron.
- [x] Las comprobaciones técnicas pertinentes pasaron sobre la implementación.
- [ ] Backend CI y Mobile CI pasan sobre el HEAD publicado.
- [ ] ZenaidaGR revisa y aprueba desde su cuenta.
- [ ] Integrar en `develop` mediante merge commit y actualizar ambas copias.

Después del merge se puede cerrar la dependencia de navegación en la tarjeta de Catálogo. Detalle conservará los criterios de Favoritos, Bolsa y prueba completa pendientes; la revisión se marcará tras la aprobación real.
