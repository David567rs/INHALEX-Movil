# Diseño de Favoritos

> Documento histórico de la etapa visual. El usuario aceptó este diseño en Expo Go el 19 de octubre de 2026 y autorizó la [conexión a la API](CONEXION-FAVORITOS.md), en la misma rama. Los ejemplos y controles de preview se retiraron del código de ejecución; las capturas y verificaciones siguientes conservan el alcance que tuvieron en su momento. La aceptación funcional posterior llegó a 8/9; su [evidencia actual](evidencias/favoritos/expo-go-aceptacion.json) distingue la revisión real pendiente.

Etapa visual en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/favoritos`, creada desde `develop` en `852614afd801cfa67a5025ac6128e1803e69f32f`. ZenaidaGR es responsable y David567rs revisará el futuro PR hacia `develop`. Búsqueda quedó integrada con el [PR #9](https://github.com/David567rs/INHALEX-Movil/pull/9), 8/8; su [evidencia de integración](evidencias/busqueda-productos/integracion-pr9.json) conserva revisión y CI reales.

## Alcance visual

La pestaña existente de Favoritos presenta el rótulo **Vista previa**, tres productos de muestra con imagen y precio, y un selector **Con productos / Sin favoritos** para revisar ambas composiciones. El selector cambia exclusivamente ejemplos de diseño. Los corazones son decorativos y la opción visual de quitar permanece deshabilitada. **Explorar catálogo** abre la ruta existente de Catálogo; las muestras no abren Detalle ni utilizan sus identificadores como productos de la API.

Se conservan las cinco pestañas, la identidad INHALEX y la sesión actual. Esta etapa no guarda ni elimina favoritos, no persiste datos, no consulta la API y no introduce requisitos de autenticación. La colección de muestra y su estado vacío no acreditan una lista personal ni un vacío recibido del servidor.

## MVVM y Repository

`View → useFavoritesPreviewViewModel → readFavoritesPreview → FavoritesPreviewRepository → LocalFavoritesPreviewRepository`

El contrato de solo lectura y el caso de uso están en `favorites/domain`; `favorites/data` aporta tres ejemplos sintéticos. Bootstrap compone las dependencias. El ViewModel mantiene el modo de presentación y prepara los textos de las muestras; la vista representa ese estado y permite cambiar de composición. El Repository local se limita al diseño y no establece el contrato definitivo de sincronización con la API.

## Criterios de Trello: 0/9

La captura del usuario contiene exactamente estos nueve criterios, todos sin marcar. No incluye un criterio independiente de diseño:

- [ ] Agregar opción para marcar un producto como favorito
- [ ] Guardar el producto en favoritos
- [ ] Mostrar la lista de productos favoritos
- [ ] Permitir eliminar productos de favoritos
- [ ] Sincronizar favoritos con la API
- [ ] Mostrar mensaje cuando no haya favoritos
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

El diseño aún espera aceptación en Expo Go. Revisar las muestras o el vacío sintético no completa los criterios funcionales 3 y 6. La conexión, el guardado, la eliminación, los errores, la aceptación funcional nativa y la revisión real se abordarán después de aceptar el diseño. El agente no ha leído ni modificado Trello.

## Revisión visual prevista

Desde la copia de Zenaida, reutilizar Metro `8083` y su QR. Si no está activo:

```sh
npm --prefix Mobile run start -- --port 8083
```

1. Abrir **Favoritos** en Expo Go y comprobar el rótulo **Vista previa**.
2. Revisar las tres muestras, sus imágenes, precios y distribución; los corazones y la opción de quitar no guardan ni eliminan datos.
3. Cambiar a **Sin favoritos** y revisar el mensaje y **Explorar catálogo**. Volver a Favoritos y a **Con productos** para comparar ambas composiciones.
4. Comprobar que siguen disponibles las cinco pestañas y que Cuenta conserva su estado anterior.

La [verificación del diseño](evidencias/favoritos/verificacion-diseno.json) registra TypeScript y lint aprobados, 280/280 pruebas existentes, Doctor 21/21 y exportaciones finales Android (1440 módulos) y web (988 módulos) aprobadas. No se añadieron pruebas que reproduzcan los ejemplos estáticos. La QA web comprobó colección y vacío a 320 y 397 píxeles CSS, imágenes empaquetadas cargadas, tarjetas apiladas en pantalla pequeña, cinco pestañas, controles de quitar deshabilitados y navegación a Catálogo/regreso. No hubo desbordamiento horizontal y se restauró el tamaño habitual del navegador.

La revisión técnica detectó iconos decorativos que podían exponerse sin etiqueta; se ocultaron sus grupos de accesibilidad y se comprobó el resultado en AX web. TalkBack y texto ampliado en Android todavía no se probaron físicamente. El acceso a Catálogo abre su ruta; su carga web conserva la limitación CORS existente para el origen 8083, sin cambios en backend. Esta comprobación no atribuye datos reales de Catálogo ni guardado de favoritos al navegador. La QA web y los ejemplos sintéticos no sustituyen la aceptación del diseño en Expo Go ni prueban sincronización o almacenamiento nativo.

Los cambios permanecen locales, sin commit ni PR. Se conserva el orden: diseño → aceptación del usuario → conexión y comportamiento real → pruebas → PR a `develop` → revisión del compañero → integración.
