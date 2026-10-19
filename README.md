# INHALEX Movil

Reinicio de la aplicación móvil de INHALEX con un repositorio independiente, arquitectura MVVM y Repository, y colaboración entre David y Zenaida mediante ramas y pull requests.

El backend, la base móvil, Registro, Inicio de sesión y Persistencia están integrados en `develop` mediante los PR #1 a #5. Persistencia completó 9/9 criterios: ZenaidaGR aprobó y fusionó el [PR #5](https://github.com/David567rs/INHALEX-Movil/pull/5), con ambas CI correctas, el 17 de octubre de 2026 en `d5171b2`. El usuario confirmó su tarjeta «Terminado». La [evidencia de integración](docs/evidencias/persistencia-sesion/integracion-pr5.json) conserva la revisión, el HEAD y los padres del merge.

Catálogo también quedó integrado mediante el [PR #6](https://github.com/David567rs/INHALEX-Movil/pull/6), aprobado y fusionado por ZenaidaGR el 17 de octubre de 2026, con ambas CI correctas, en `fc13bbf`. La [evidencia de integración](docs/evidencias/catalogo-productos/integracion-pr6.json) conserva el HEAD final y los padres. Aquel merge dejó **7/9** (histórico). Ahora Catálogo tiene **9/9 aceptados en la rama de Detalle**, con integración de la navegación hacia `develop` pendiente del PR de Detalle; el usuario informó que actualizó Trello y la tarjeta sigue abierta hasta el merge, sin cambios del agente en el tablero.

Líneas o categorías completó **8/8** y quedó integrada mediante el [PR #7](https://github.com/David567rs/INHALEX-Movil/pull/7), aprobado y fusionado por ZenaidaGR en `b0b9856` tras pasar Backend CI y Mobile CI sobre el HEAD final. El usuario confirmó Trello actualizado/cerrado; el agente no modificó el tablero. La [evidencia de integración](docs/evidencias/lineas-categorias/integracion-pr7.json) conserva revisión, checks y padres del merge, y las [confirmaciones de Expo Go](docs/evidencias/lineas-categorias/expo-go-aceptacion.json) mantienen sus límites.

Ambas copias están actualizadas a ese merge. David continúa en `feature/detalle-producto`; Zenaida permanece en `develop`, con su stash y `Server/.env` conservados. El usuario [aceptó el diseño y los datos de Detalle en Expo Go](docs/evidencias/detalle-producto/expo-go-aceptacion.json): **5/9**, criterios 1, 2, 3, 4 y 7. Confirmó datos completos, cambio de producto y error/recuperación conservando datos, sin observación directa del teléfono ni cambios del agente en Trello.

La [conexión de Detalle a la API](docs/CONEXION-DETALLE-PRODUCTO.md) está implementada y verificada técnicamente, con MVVM y Repository, GET público por ID/slug y campos adicionales disponibles. Pasaron 236 pruebas, TypeScript, lint sin advertencias, Doctor 21/21 y exportaciones Android 1426/web 974, repetidos tras el ajuste de accesos y retirar la ruta QA. [La evidencia API](docs/evidencias/detalle-producto/verificacion-api.json) separa HTTP real en 3200 de QA web con servidor temporal por CORS, sin cambios al backend, configuración o autenticación. El usuario aclaró que los criterios 5/6 son accesos a las pestañas Favoritos/Bolsa, no guardar o agregar productos. Ambos accesos están habilitados y [verificados en web a 393 y 320 px](docs/evidencias/detalle-producto/verificacion-accesos.json); su aceptación nativa aún está pendiente. Las funciones completas siguen en las actividades posteriores de Zenaida. Detalle mantiene **5/9 aceptados en Expo Go**; faltan comprobar los accesos nativos, el recorrido completo y la revisión. La [navegación fue aceptada](docs/CONEXION-DETALLE-PRODUCTO.md#navegación-aceptada): conserva categoría al volver y «Nuestra colección» sin filtro. La apertura del PR hacia `develop` está autorizada; su URL y checks se registrarán cuando se confirmen. El [diseño previo](docs/DISENO-DETALLE-PRODUCTO.md) y [su verificación](docs/evidencias/detalle-producto/verificacion-diseno.json) son evidencia histórica. Catálogo tiene **9/9 aceptados en rama**, pendiente de integrar la navegación en `develop`; la tarjeta continúa abierta hasta el merge. Consulta [el plan](docs/PLAN-DE-TRABAJO.md).

## Carpeta de trabajo

La raíz del nuevo proyecto es `C:\Users\David\Documents\INHALEX-Movil`.

El proyecto anterior en `C:\Users\David\Documents\Proyecto-INHALEX` se conserva como referencia para recuperar código y recursos por etapas.

## Estructura prevista

```text
INHALEX-Movil/
├── Server/             # API NestJS recuperada y validada
├── Mobile/             # Aplicación Android con Expo y TypeScript
├── docs/               # Plan, arquitectura y evidencia
└── .github/            # Plantillas de PR y GitHub Actions
```

## Primer bloque de ejecución

1. Completar la documentación inicial y las reglas de colaboración.
2. Inicializar un historial nuevo con `main` y crear `develop`.
3. Incorporar el backend mediante `feature/backend-base` y un PR hacia `develop`.
4. Incorporar la base móvil mediante `feature/mobile-bootstrap` y un PR hacia `develop`.
5. Comenzar las actividades funcionales con Registro de usuario.

## Backend recuperado

Instala sus dependencias con `npm ci --prefix Server`. Consulta [Server/README.md](Server/README.md) para configurar el entorno y ejecutar la API.

Desde la raíz puedes verificarlo con:

```bash
npm run build:server
npm run test:server
npm run test:e2e:server
```

El CI del backend ejecuta esos controles con Node.js 24 y una base simulada en las pruebas. Los escenarios reales contra MongoDB se comprueban en la etapa de integración.

## Base móvil

El proyecto Expo ejecutable está directamente en `Mobile/`. Conserva la identidad visual y la navegación de cinco pestañas; las actividades se incorporan por etapas mediante sus ramas y PR.

```bash
npm ci --prefix Mobile
npm run dev:mobile
```

El segundo comando abre Expo en el puerto 8082 para poder probar la app en Expo Go. Consulta [Mobile/README.md](Mobile/README.md) para los comandos de Git Bash y CMD, la configuración pública de la API y los controles del PR. El origen y las adaptaciones están en [la recuperación móvil](docs/RECUPERACION-MOVIL.md).
