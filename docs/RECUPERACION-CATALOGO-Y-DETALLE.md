# Recuperación de Catálogo, Favoritos, Bolsa y Detalle

Etapa local del 5 de noviembre de 2026, en la copia de David `C:\Users\David\Documents\INHALEX-Movil`, rama `codex/recuperar-inicio`. Zenaida continúa en `feature/resenas`; su copia no recibió estos cambios. La aplicación de referencia en `C:\Users\David\Documents\Proyecto-INHALEX\Mobile\inhalex-app` se consultó sin modificarla.

## Motivo y alcance

El usuario revisó el Inicio recuperado en Expo Go y reportó diferencias pendientes: buscar desde Catálogo abría otra pantalla, las tarjetas de Favoritos y Bolsa ocupaban una altura excesiva, los corazones tenían fondos circulares y faltaban las imágenes y la presentación del detalle de la primera aplicación. Su reporte no constituye aceptación completa de Inicio ni de estas nuevas correcciones.

Esta etapa recupera las imágenes y la composición del detalle, corrige las proporciones y permite buscar dentro del Catálogo. Se conservan MVVM y Repository, las operaciones actuales con la API y las guardas de sesión. La reducción general de textos queda para la siguiente revisión con el usuario.

## Cambios realizados

### Búsqueda dentro del Catálogo

- El campo permite escribir y enviar con el botón Buscar o con el teclado, sin abandonar la pantalla.
- Se distinguen el borrador escrito y la consulta aplicada. Actualizar y cargar más utilizan la consulta aplicada, aunque el usuario esté preparando otro término.
- La búsqueda respeta la categoría de la ruta. Limpiar o borrar el texto recupera la colección de esa categoría. «Ver todos los productos» elimina expresamente los parámetros de categoría.
- Una consulta nueva cancela la anterior, reinicia la paginación y descarta respuestas tardías. Los productos de dos consultas no se mezclan.
- Un fallo al actualizar conserva la última colección de la misma consulta y permite reintentar. El estado sin coincidencias ofrece limpiar la búsqueda.
- Se mantiene la actualización al deslizar. La última tarjeta de una cuadrícula conserva el ancho de las demás aunque quede sola.

La vista comunica acciones al ViewModel; el controlador administra consultas y paginación mediante el caso de uso `ListCatalog` y el Repository existente. No se añadieron peticiones HTTP a las vistas.

### Favoritos y Bolsa

Las capturas mostraban espacios verticales desproporcionados y fotos desplazadas hacia el fondo de las tarjetas. Las imágenes estaban participando en la medida de contenedores sin límites adecuados. Ahora tienen marcos de tamaño definido y ocupan esos límites sin determinar la altura del resto de la fila.

- Favoritos presenta tarjetas compactas con foto, datos, precio y acciones alineadas.
- Bolsa separa la información del producto, el control de cantidad y el importe. Conserva los límites de 1 a 25 unidades y las operaciones confirmadas por el servidor.
- El total y el acceso para continuar permanecen visibles en una barra propia, fuera del área que se desplaza. En pantallas estrechas o con texto grande, la acción pasa al resumen desplazable.
- Los corazones compactos muestran únicamente el icono, con un área táctil suficiente y sin fondo circular. También se retiró el fondo en forma de cápsula del icono seleccionado en las pestañas.
- Las confirmaciones, errores y bloqueos existentes de Favoritos y Bolsa se conservan. Un cambio visual no representa una nueva aceptación funcional de la API.

### Imágenes y detalle originales

Se recuperaron **16 fotografías de ingredientes/productos** y **15 fotografías de frascos** desde la primera aplicación. Los 31 archivos se compararon mediante SHA-256 y coinciden con sus originales. Las fotos de colección y las fotos de frascos tienen resolutores separados; una imagen remota explícita de la API conserva prioridad.

El detalle vuelve a presentarse como un panel inferior, con fotografía del frasco cuando existe, nombre, precio, disponibilidad, descripción, notas aromáticas y demás datos disponibles. El área de imagen se limita al espacio de la pantalla. El pie contiene Agregar a la bolsa y los accesos a Favoritos y Bolsa.

La ruta sigue siendo `/producto/[id]`; consulta el producto seleccionado a través del caso de uso y Repository actuales. El panel conserva cierre explícito, fondo de cierre, tratamiento de la solicitud de cierre del sistema y reducción de movimiento. Al abrir Inicio de sesión desde sus acciones, el panel deja de estar visible mientras otra ruta tiene el foco.

## Verificación y límites de la evidencia

- **766 pruebas móviles aprobadas** en la ejecución completa previa a la comprobación final; incluyen siete casos nuevos de búsqueda en Catálogo, paginación, cancelación, consulta aplicada, categoría y recuperación.
- Revisión independiente: 63 pruebas de controladores de Catálogo, Detalle, Bolsa y Favoritos aprobadas.
- Tras retirar la ruta temporal de revisión: `npm run typecheck:mobile`, `npm run lint:mobile` y `npm run export:mobile` aprobados desde la raíz del repositorio.
- La exportación Android produjo un bundle de 1,471 módulos y 81 recursos, incluidas las 16 fotografías de colección y las 15 de frascos. Exportar no equivale a instalar ni probar la aplicación en un teléfono.
- Los archivos originales de imágenes permanecen intactos. No se añadieron dependencias.

### Revisión visual en navegador

Se utilizaron las pantallas y controladores reales con datos de prueba en memoria, mediante una ruta temporal aislada, a **390 × 844**. La ruta ya fue eliminada y no forma parte de la aplicación entregada.

Se comprobó lo siguiente:

1. Favoritos y Bolsa muestran fotos dentro de tarjetas compactas.
2. En Bolsa, una cantidad pasó de 1 a 2 y el total de prueba cambió de $180 a $240.
3. En Catálogo, buscar Lavanda devolvió un resultado; `zzzzdemo` mostró el estado sin coincidencias; limpiar recuperó la colección. Funcionó el cambio entre cuadrícula y lista.
4. El detalle de Mirra mostró su frasco y el panel cerró correctamente.

La ruta temporal regresaba a Inicio al cerrar el detalle. Por ello, esta revisión **no demuestra la conservación del historial real de navegación en Android** ni el regreso al catálogo filtrado desde el teléfono.

La API pública respondió HTTP 200 en una lectura real. La conexión desde el navegador en el puerto 8082 quedó bloqueada por la configuración CORS vigente; no se modificó CORS. Las comprobaciones visuales con datos de prueba no se presentan como una prueba integral de conexión con esa API ni de inicio de sesión en el navegador.

## Servicios y Git

El usuario conserva el control de Expo y del QR. En esta etapa no se inició ni detuvo Expo, Metro como servidor o el backend. La exportación ejecutó el compilador y terminó al generar el bundle. Se mantiene el esquema de un backend compartido.

Los cambios se registran localmente por etapa, conservando el historial. No se publicó un PR ni se hizo push. Tampoco se trasladó esta recuperación a la copia de Zenaida ni se adelantó la funcionalidad pendiente de Reseñas o Confirmación de recepción.

| Commit local | Etapa |
| --- | --- |
| `2015636` | Fotografías originales de colección y corazones sin fondo. |
| `be20fa3` | Búsqueda dentro del Catálogo, estados y pruebas de consultas concurrentes. |
| `990d2d4` | Tarjetas compactas de Favoritos y Bolsa, cantidades y resumen adaptable. |
| `6ea97f8` | Detalle como panel inferior y fotografías originales de frascos. |

Este registro documental se guarda aparte de los cuatro commits de implementación.

## Cuatro recorridos pendientes en Expo Go

Usar **la instancia de David que el usuario ya tiene abierta**. En su terminal de Expo, pulsar `r` para recargar; como alternativa, usar Reload desde el menú de Expo Go. No hace falta iniciar otra instancia ni generar un segundo QR para estas comprobaciones.

1. **Catálogo y navegación:** buscar Lavanda desde Catálogo y comprobar que los resultados aparecen allí mismo. Probar un término inexistente, limpiar y actualizar. Elegir una categoría, buscar dentro de ella, abrir un producto y volver con el botón del panel y con Atrás físico de Android. Verificar que la categoría y la búsqueda siguen como estaban.
2. **Favoritos:** abrir una lista con productos, comprobar fotografías, altura de las tarjetas y corazones sin círculo. Abrir el detalle y regresar; actualizar y verificar que siguen los datos esperados. Revisar también con texto grande.
3. **Bolsa:** comprobar fotografías, cantidad, importe y total; modificar una cantidad y actualizar. Verificar que el acceso para continuar no tapa los productos y que con texto grande se puede alcanzar desplazándose hasta el resumen.
4. **Detalle y sesión:** abrir dos productos y revisar que cambian la imagen y los datos. Cerrar y volver a abrir el panel. Sin sesión, pulsar el corazón o Agregar, comprobar que se abre Login, iniciar sesión y regresar al detalle; revisar que el panel vuelve a responder. Probar Atrás físico durante estos recorridos.

Registrar los resultados que el usuario comunique como aceptación nativa en una etapa posterior. Esta documentación no afirma que esos cuatro recorridos ya se hayan completado en el dispositivo.

## Pulido visual posterior solicitado por el usuario — 5 de noviembre de 2026

El usuario indicó que la recuperación visual estaba mejorando y aportó nuevas capturas con ajustes concretos. Ese comentario no confirma individualmente todos los recorridos anteriores. Esta etapa aplica la reducción de textos solicitada y conserva la información completa en Detalle.

### Cambios de presentación

- **Inicio:** el corazón deja de superponerse a la fotografía y aparece junto al precio, sobre el fondo blanco de la tarjeta y sin círculo. Su contraste ya no depende de la imagen. Conserva un área táctil mínima de 44 × 44; la foto, el nombre y el precio mantienen el acceso al detalle. La acción de favorito es independiente de esos accesos.
- **Fotografías:** Inicio y las tarjetas simplificadas de Catálogo incorporan un margen blanco de 8 puntos alrededor de la foto, con esquinas interiores redondeadas. Se ajustan las proporciones y los espacios sin reemplazar los recursos originales.
- **Catálogo:** se retiran de la presentación normal el contador «productos para descubrir», «ESENCIA INHALEX» y las notas aromáticas de las tarjetas. Se conservan nombre, precio, disponibilidad y acceso al detalle, tanto en cuadrícula como en lista. Los recuentos de resultados de búsqueda y la información necesaria durante carga, error o paginación siguen disponibles. La variante simplificada se activa solo desde Catálogo; no cambia la pantalla independiente de Búsqueda ni el contenido de Detalle. Las notas siguen disponibles en la etiqueta de accesibilidad de la tarjeta.
- **Experiencia:** se eliminan la leyenda repetida «Aplica · frota · inhala», las tres instrucciones numeradas y el párrafo posterior. Se mantienen el recurso original, los controles de reproducción, carga/error/reintento y la llamada a explorar el catálogo. El panel de Inicio y la pantalla independiente comparten esta limpieza.

Solo se modificó presentación. MVVM, Repository, autenticación y las operaciones con la API permanecen sin cambios; tampoco se añadieron dependencias.

### Comprobaciones de esta etapa

- TypeScript y lint de Mobile finalizaron correctamente después de todos los cambios y de retirar la ruta temporal de revisión. `git diff --check` también pasó.
- Se revisaron los componentes reales con datos Demo en una vista web de **390 × 844**: tarjetas de Inicio, corazón seleccionado y sin seleccionar, Catálogo en cuadrícula y lista. Los accesos de producto ejecutaron su acción de detalle de prueba. Esta comprobación no utiliza ni modifica favoritos reales.
- En el panel de experiencia de Inicio se verificaron el video original, Pausar/Reproducir y el cierre. Al cerrar se retiró el video del documento. Se confirmó la ausencia de la leyenda, instrucciones y párrafo repetidos.
- La ruta temporal `preview-pulido-local` se eliminó antes de las comprobaciones finales; no forma parte de los commits.
- La limitación CORS del navegador descrita arriba sigue fuera de esta intervención. La revisión con datos Demo no equivale a una nueva aceptación de la API ni a una prueba en Expo Go.
- Las 766 pruebas y la exportación Android descritas en la etapa anterior son evidencia histórica: no se volvieron a ejecutar en este pulido de presentación.

Capturas locales de esta revisión: `C:\Users\David\.codex\visualizations\2026\11\05\pulido-inhalex\inicio-demo.jpg`, `catalogo-demo.jpg`, `catalogo-lista-demo.jpg` y `experiencia-real.jpg`. Las capturas son evidencia local, no recursos versionados de la aplicación.

### Commits locales por etapa

| Commit | Cambio |
| --- | --- |
| `437612f` | Separar el corazón de la foto y enmarcar imágenes de Inicio. |
| `35907d3` | Simplificar tarjetas y espacios de Catálogo. |
| `12f7522` | Quitar instrucciones duplicadas de la experiencia. |

El registro de este pulido se guarda en un commit documental separado. No se hizo push, no se abrió un PR y no se trasladaron cambios a Zenaida. No se inició ni detuvo Expo, Metro o el backend.

### Próxima revisión en Expo Go

Recargar la instancia de David que ya controla el usuario, con `r` o Reload, sin generar otro QR. Revisar el corazón y el acceso al detalle en Inicio; el margen de las fotos; Catálogo en cuadrícula y lista con búsqueda y categorías; y reproducción/cierre del panel de experiencia. Confirmar que Detalle conserva la descripción y el perfil aromático completos. La revisión nativa, incluidos texto grande y pantallas estrechas, queda pendiente del reporte del usuario.

## Cuenta y Detalle: desplazamiento y espacio disponible — 5 de noviembre de 2026

La captura del usuario mostró que el resumen de Cuenta quedaba cortado por cinco accesos fijos. La ruta componía `AccountScreen`, que contiene un `ScrollView`, y después los accesos como hermanos fuera de ese desplazamiento. Las filas reservaban casi toda la altura disponible.

### Corrección de Cuenta

- Perfil, accesos y cierre de sesión comparten ahora el `ScrollView` de `AppScreen`, por encima de las pestañas. La ruta solo compone sesión, pantalla y menú.
- El resumen de perfil es compacto y mantiene nombre, correo y estado de sesión. Los accesos se agrupan en «Tu información» y «Tus pedidos y novedades» con filas que crecen al envolver texto.
- El menú se muestra únicamente junto a una sesión autenticada. Se mantienen los estados de comprobación, recuperación y bienvenida. El aviso de fallo al cerrar sesión queda visible junto al botón; su bloqueo y el ViewModel existente se conservan.
- `AccountMenuItem` concentra la presentación de las filas. Cada componente de acceso conserva su ruta y etiqueta de accesibilidad.

### Corrección de Detalle

- Solo la acción principal de Bolsa permanece en el pie habitual. Los accesos a Favoritos y Bolsa se desplazan con la información y conservan el cierre protegido del panel antes de navegar.
- El pie pasa al contenido desplazable cuando la ventana mide menos de 640 puntos de alto, la escala de texto es al menos 1.3 o la altura medida de las acciones supera el 25 % del espacio útil. Así, un aviso extenso no reduce el producto a una franja pequeña.
- Se conserva el encabezado con cierre, el indicador de desplazamiento, las zonas seguras y todos los datos del producto. El modo adaptable se activa solo en Detalle.
- El ViewModel de la acción de Bolsa reside en `ProductDetailScreen`. `AddToCartAction` es presentacional: cambiar la ubicación del pie no reinicia el bloqueo de apertura de Login. Los demás consumidores siguen utilizando el contenedor `AddToCartButton`.

### Verificación y límites

- TypeScript y lint pasaron después de retirar la ruta temporal. `git diff --check` pasó. Una revisión independiente detectó el riesgo de reiniciar el estado al reubicar el pie; se corrigió y la revisión final no señaló problemas adicionales.
- Se probaron las pantallas reales con datos Demo y controladores aislados en memoria, sin credenciales ni operaciones sobre la API real. La ruta temporal `qa-cuenta-detalle-local.tsx` fue eliminada antes de los commits.
- **Cuenta, 390 × 844 y 320 × 568:** un único desplazamiento, todas las filas y Cerrar sesión alcanzables, sin desbordamiento horizontal. El cierre de la sesión simulada ocultó perfil y accesos; reingresar a Demo los recuperó. La barra inferior de esta prueba era un espacio simulado de 64 puntos, no el navegador real de pestañas.
- **Detalle:** a 390 × 844 se alcanzaron los últimos datos y enlaces con la acción principal reservada abajo. A 320 × 568 la acción pasó al desplazamiento. A 320 × 700, un error simulado de Bolsa movió botón y mensaje al contenido y ambos pudieron leerse completos. Una adición simulada mostró confirmación, conservada al cambiar el tamaño de ventana.
- Se verificó que Cerrar retira el panel. En la ruta de prueba regresó a Inicio por su historial de navegación; esto no acredita la conservación del filtro real de Catálogo. El acceso «Ver favoritos» cerró el panel y abrió `/favoritos`, observado en la URL y la pantalla.
- Esta verificación web no sustituye Expo Go, TalkBack, texto grande nativo ni Atrás físico. Tampoco valida nuevamente el inicio de sesión o la API. Las pruebas automatizadas y exportaciones de las secciones anteriores siguen siendo evidencia histórica; no se repitieron en esta etapa de presentación.

Evidencia local: `C:\Users\David\.codex\visualizations\2026\11\05\cuenta-detalle\cuenta-inicio-demo.png`, `cuenta-final-demo.png`, `cuenta-pequena-demo.png`, `detalle-inicio-demo.png`, `detalle-pequeno-demo.png` y `detalle-aviso-demo.png`.

| Commit local | Etapa |
| --- | --- |
| `2099f16` | Unificar el desplazamiento de Cuenta y agrupar accesos. |
| `34f3a0a` | Adaptar las acciones de Detalle y conservar su ViewModel estable. |

Se mantienen MVVM y Repository. El cambio se realizó en la copia de David, sin modificar API, dependencias, configuración, la copia de Zenaida o los recursos originales. No se inició ni detuvo Expo/Metro o el backend; no se hizo push ni se abrió un PR.

### Siguiente comprobación en Expo Go

Recargar la instancia existente. En Cuenta, recorrer desde el perfil hasta Cerrar sesión y abrir los cinco accesos. En Detalle, llegar al final de la descripción, comprobar Agregar y los enlaces secundarios, cerrar con X y con Atrás, y regresar al catálogo filtrado. Repetir con texto grande y en horizontal, incluidos los mensajes de Bolsa. Registrar la aceptación del usuario por separado.
