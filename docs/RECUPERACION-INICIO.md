# Recuperación de Inicio desde la aplicación original

Etapa local del 5 de noviembre de 2026. Copia de David: `INHALEX-Movil`, rama `codex/recuperar-inicio`, creada después de registrar la recuperación de autenticación. Zenaida continúa en `feature/resenas`; esta recuperación visual todavía no se transfirió allí.

**Revisión posterior del usuario:** revisó Inicio en Expo Go y reportó diferencias en la búsqueda del Catálogo, las tarjetas de Favoritos/Bolsa y las imágenes y presentación de Detalle. Esa revisión no acepta todas las pantallas. Las correcciones y sus nuevas comprobaciones están en [Recuperación de Catálogo, Favoritos, Bolsa y Detalle](RECUPERACION-CATALOGO-Y-DETALLE.md); la evidencia y pendientes de esta etapa se conservan abajo como registro histórico.

## Fuente y alcance

La referencia se leyó en `C:\Users\David\Documents\Proyecto-INHALEX\Mobile\inhalex-app`, sin modificar sus archivos. Se recuperaron la composición de `HomeScreen.tsx`, controles y tarjetas originales, carrusel, panel de experiencia y vídeo. Las imágenes de marca y del hero ya existían en la copia móvil.

- SHA-256 del `HomeScreen.tsx` de referencia: `BE3667DB3EB4317029A917132EB4C4D081E17B06489240A964F89BE7A97DB130`.
- `assets/home/Aplicar.mp4`: 2,345,305 bytes, SHA-256 `A4065FB9412B35BC0A766FF0C38F88FA6D969B73AC0059F2C149071BA2458E67`, idéntico al original.
- Se recuperan saludo personal, buscador, categorías, seis productos iniciales, precios, acceso al detalle, corazones de Favoritos, «Ver todos» y experiencia con vídeo.
- Cuenta y Login conservan su presentación actual; su recuperación visual será otra etapa. Reseñas y Confirmación de recepción mantienen el reparto acordado.

## Adaptación a la arquitectura actual

La vista consume `useHomeViewModel`, que observa un controlador con casos de uso inyectados. Bootstrap compone `ListCatalog` y `ListProductLines` con sus Repository actuales. No hay HTTP en la vista ni un segundo almacenamiento de sesión.

El catálogo admite búsqueda opcional junto con categoría y paginación. Se recorta el texto y se limita a 100 caracteres; los metacaracteres se envían como texto literal porque el backend interpreta una expresión regular. El total pertenece a la consulta del servidor, no a un filtro local de los primeros seis productos. Se conservan las validaciones del DTO; categoría y presentación son metadatos opcionales.

El borrador se aplica al pulsar Buscar. Cambiar un filtro limpia los resultados anteriores y cancela la petición obsoleta. Actualizar el mismo filtro conserva su última respuesta si falla, con aviso y reintento. Un fallo de categorías no impide mostrar productos. Si la API elimina la categoría seleccionada, se vuelve a todas conservando la búsqueda. «Ver todos» limpia los parámetros previos de Catálogo.

El corazón reutiliza el coordinador de Favoritos existente. Su variante compacta conserva las guardas de sesión, bloqueo y errores, mostrados una vez bajo el carrusel. El detalle abre `/producto/[id]`. El vídeo solo se monta con el panel visible y la pantalla enfocada; pausa al pasar a segundo plano. Se conserva la ruta independiente `/experiencia` para enlaces existentes.

Se adaptaron los refs de ScrollView al SDK actual y se descontaron los márgenes seguros laterales. Se conserva el ajuste de la franja de características para texto grande.

Documentación consultada: [Expo Video SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/video/) y [Expo Router SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/router/). No se añadieron dependencias ni se modificó el backend.

## Commits por etapa

1. Recuperación de arranque: David `a35d643`, equivalente en Zenaida `47c9836`.
2. Compatibilidad de cuentas anteriores: David `ca009a8`, Zenaida `60cceeb`.
3. Aceptación de acceso, datos y reapertura: David `bd5bd28`, Zenaida `cd96b21`. El reporte y sus límites están en [Recuperación de inicio de sesión](RECUPERACION-INICIO-SESION.md).
4. Datos y controlador de Inicio: `23b60d2`.
5. Vista original adaptada: `401ae35`.
6. Este registro se guarda aparte. La aceptación nativa de Inicio todavía está pendiente.

Las correcciones comunes conservan a David como autor al trasladarlas a Zenaida. Los commits de Reseñas conservan su autoría anterior. No se reescribió historial ni se publicaron commits o PR en esta etapa.

## Verificación técnica

- 759/759 pruebas móviles aprobadas, incluidas 18 nuevas sobre búsqueda combinada, cancelación, respuestas tardías, filtros, vacío, errores y categorías eliminadas.
- TypeScript y lint completos: aprobados.
- Exportación Android: aprobada; incluye `Aplicar.mp4`. Es una compilación del bundle, no una instalación ni prueba de reproducción nativa.
- API local real, solo lectura: 6 productos iniciales de un total de 16 y 5 categorías; búsqueda combinada de un producto conocido devolvió 1/1; actualización, término sin coincidencias y reinicio de filtros correctos. Son cifras del momento de la comprobación.
- Revisión independiente de estado, navegación y ciclo de vida; los hallazgos de categoría eliminada y márgenes laterales se corrigieron.
- No se inició un servidor Expo para generar QR ni se detuvieron los servicios del usuario. La exportación usa Metro como compilador y finaliza al producir el bundle.
- No hay comprobación visual o de TalkBack en teléfono por el agente. El reporte de autenticación no acepta esta nueva presentación.

## Revisión pendiente en Expo Go

Mantener un solo backend compartido en 3200. Para revisar Inicio, el usuario puede detener únicamente Expo de Zenaida y generar el QR desde `C:\Users\David\Documents\INHALEX-Movil\Mobile`, con `npx expo start --clear --port 8082`. Si ya está ejecutando esa copia, puede recargarla.

1. Abrir Inicio y comparar saludo, buscador, hero y composición con la aplicación original.
2. Elegir una categoría, buscar un producto conocido y abrir su detalle. Volver conserva la selección de Inicio.
3. Borrar el texto y pulsar Buscar; elegir Todos. Deslizar las tarjetas y revisar fotos, precios y corazones.
4. Pulsar «Ver todos»: debe abrir «Nuestra colección» sin el filtro anterior de Catálogo.
5. Abrir «Conocer más», comprobar el vídeo, pausar/reanudar y cerrar el panel. Debe dejar de reproducirse al salir.

Registrar el resultado nativo en otro commit cuando el usuario lo reporte. Después se revisa Cuenta/Login con la misma referencia y se retoma la aceptación de API de Reseñas en Zenaida, con David567rs como revisor futuro.
