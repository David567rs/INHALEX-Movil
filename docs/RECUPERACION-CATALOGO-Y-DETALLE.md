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
