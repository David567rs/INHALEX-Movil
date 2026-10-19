# Diseño de Catálogo

Documento histórico del diseño de Catálogo, aceptado en Expo Go y después conectado a la API. El [PR #6](https://github.com/David567rs/INHALEX-Movil/pull/6) quedó integrado el 17 de octubre de 2026 en `fc13bbf`, con aprobación de ZenaidaGR y ambas CI correctas. El PR #6 dejó 7/9 (histórico). El estado vigente es 9/9 aceptados en la rama de Detalle, con integración de la navegación en `develop` todavía pendiente; la tarjeta sigue abierta hasta el merge. La [evidencia de integración](evidencias/catalogo-productos/integracion-pr6.json) complementa las evidencias previas. El siguiente paso es preparar el PR de Detalle con dependencias explícitas, sin crearlo ni publicarlo todavía.

## Origen y recursos

Se conserva como referencia el proyecto `C:\Users\David\Documents\Proyecto-INHALEX\Mobile\inhalex-app`, revisión `526a21e11da1cd1e3f6edea350c7731f90e205bf`:

- `src/features/catalog/presentation/screens/CatalogScreen.tsx`: encabezado, composición y distribución de la colección.
- `src/features/catalog/presentation/components/ProductCard.tsx`: tratamiento de imagen, forma de las tarjetas, tipografía, espaciado y precio.
- Tema INHALEX y componentes de movimiento ya recuperados en el nuevo proyecto.

Los seis recursos seleccionados se copiaron sin modificar desde `assets/aromas/` a `Mobile/assets/catalog/`. En la QA web cargaron los seis JPEG originales de 1024×1536:

| Archivo | Ejemplo visual |
| --- | --- |
| `eucalipto.jpeg` | Eucalipto |
| `lavanda.jpeg` | Lavanda |
| `menta.jpeg` | Menta |
| `manzanilla.jpeg` | Manzanilla |
| `canela.jpeg` | Canela |
| `rosas.jpeg` | Rosas |

Las imágenes son recursos visuales recuperados; los textos y precios del repositorio de vista previa son ejemplos locales de demostración. No proceden de una consulta al inventario ni garantizan disponibilidad, promociones o precios comerciales. El código y los assets del proyecto anterior se conservan.

## Alcance visual

La pestaña Catálogo muestra la colección con identidad INHALEX, tarjetas e imágenes de frascos. La elección entre cuadrícula y lista solo cambia la presentación local. La composición se adapta al ancho, manteniendo la navegación de cinco pestañas. El código utiliza una columna cuando `fontScale > 1.25` y conserva la política de movimiento reducido; esas políticas no se presentan como pruebas realizadas de escalado de fuente nativo o movimiento reducido en dispositivo.

Se recupera la presentación necesaria de la fuente sin importar sus dependencias funcionales de autenticación, productos remotos, búsquedas o compra. Las tarjetas no habilitan detalle, favoritos ni bolsa en esta etapa. Tampoco se añaden búsqueda, filtros o categorías: corresponden a la implementación y actividades posteriores del plan. Los controles visibles deben describir únicamente acciones disponibles en la vista previa.

## MVVM, Repository e inyección

El dominio define el contrato y los datos mínimos de la vista previa. Una implementación local del Repository entrega los ejemplos estáticos y sus referencias a imágenes incluidas en la app. El ViewModel recibe la operación del dominio, administra los datos de presentación y la elección cuadrícula/lista. La View muestra ese estado y comunica acciones; `bootstrap` compone e inyecta las dependencias concretas.

El catálogo de diseño no utilizó HTTP, el backend ni MongoDB y no se conectó a Repositories de productos de la app anterior. La restauración de sesión integrada conservó su propio recorrido; su tráfico no se atribuye a esta vista previa. La conexión a la API ya se implementó en esta misma actividad conservando View, ViewModel, dominio, Repository y composición de dependencias. El Repository local de vista previa fue sustituido; este documento y sus capturas conservan el alcance histórico de diseño. El contrato y las nuevas comprobaciones se documentan por separado en [CONEXION-CATALOGO.md](CONEXION-CATALOGO.md).

## Comprobaciones históricas de la vista previa

Pasaron TypeScript, lint global sin advertencias, las 146 pruebas existentes, Expo Doctor 21/21 y las exportaciones finales Android (1391 módulos) y web (939 módulos). No se añadieron pruebas nuevas para esta etapa de presentación estática. La exportación no sustituye la aceptación del diseño en un teléfono.

La QA web en 393×852 y 320×568 verificó cuadrícula y lista, con anchos de documento de 393 y 320 respectivamente, sin desbordamiento horizontal. Cargaron los seis frascos y se comprobó el desplazamiento hasta el último, Rosas. También se verificaron Inicio → «Descubrir aromas» → Catálogo y Cuenta → Inicio. El selector de vista tiene áreas de 44×44, rol radio y estado `aria-checked` que cambia con la selección.

La evidencia está en [verificacion-diseno.json](evidencias/catalogo-productos/verificacion-diseno.json) y estas capturas, todas web:

- [Cuadrícula a 393 px](evidencias/catalogo-productos/diseno-cuadricula-393-web.jpg).
- [Lista a 393 px](evidencias/catalogo-productos/diseno-lista-393-web.jpg).
- [Cuadrícula a 320 px](evidencias/catalogo-productos/diseno-cuadricula-320-web.jpg).
- [Lista a 320 px](evidencias/catalogo-productos/diseno-lista-320-web.jpg).
- [Final de la colección](evidencias/catalogo-productos/coleccion-final-web.jpg).

La QA del catálogo se realizó con la API de 3200 apagada, sin consultas del catálogo. No se ejercitaron escalado de fuente nativo, TalkBack ni movimiento reducido en dispositivo. El uso de una columna con texto ampliado es una política del código, no evidencia de una prueba física.

## Aceptación e integración

El usuario aceptó el diseño y después productos, fotografías, precios, actualización, error/reintento, carga y vacío mediante confirmaciones del chat. Esas respuestas y sus límites permanecen en [expo-go-aceptacion.json](evidencias/catalogo-productos/expo-go-aceptacion.json); no constituyen capturas nativas ni observación directa del dispositivo por el agente.

La aprobación real de ZenaidaGR y el merge del PR #6 completaron la revisión de código y dejaron 7/9 en esa etapa histórica. La [evidencia de integración](evidencias/catalogo-productos/integracion-pr6.json) registra el HEAD final y CI. Las confirmaciones posteriores y pruebas acumuladas completan ahora 9/9 aceptados en rama; queda pendiente integrar la navegación con el PR de Detalle hacia `develop`, manteniendo la tarjeta abierta hasta el merge. El contrato y las comprobaciones históricas están en [CONEXION-CATALOGO.md](CONEXION-CATALOGO.md).

La siguiente etapa prepara solo el diseño local de Líneas o categorías en `feature/lineas-categorias`; no se declara aceptación ni conexión a la API. El [plan](PLAN-DE-TRABAJO.md) conserva el orden y los pendientes.
