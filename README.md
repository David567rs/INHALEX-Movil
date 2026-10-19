# INHALEX Movil

Reinicio de la aplicación móvil de INHALEX con un repositorio independiente, arquitectura MVVM y Repository, y colaboración entre David y Zenaida mediante ramas y pull requests.

El backend, la base móvil, Registro, Inicio de sesión y Persistencia están integrados en `develop` mediante los PR #1 a #5. Persistencia completó 9/9 criterios: ZenaidaGR aprobó y fusionó el [PR #5](https://github.com/David567rs/INHALEX-Movil/pull/5), con ambas CI correctas, el 17 de octubre de 2026 en `d5171b2`. El usuario confirmó su tarjeta «Terminado». La [evidencia de integración](docs/evidencias/persistencia-sesion/integracion-pr5.json) conserva la revisión, el HEAD y los padres del merge.

Catálogo también quedó integrado mediante el [PR #6](https://github.com/David567rs/INHALEX-Movil/pull/6), aprobado y fusionado por ZenaidaGR el 17 de octubre de 2026, con ambas CI correctas, en `fc13bbf`. La [evidencia de integración](docs/evidencias/catalogo-productos/integracion-pr6.json) conserva el HEAD final y los padres. Queda **7/9**: siguen pendientes navegación al detalle y prueba de funcionalidad completa; no se declara terminada la tarjeta.

David continúa en `feature/lineas-categorias` desde ese merge; la copia de Zenaida permanece en `develop`, con sus `.env` y stash conservados. El usuario [aceptó el diseño y seis criterios en Expo Go](docs/evidencias/lineas-categorias/expo-go-aceptacion.json): consulta y presentación de categorías, selección, filtrado, vacío con datos sintéticos y navegación con «Ver todos». La [conexión a la API](docs/CONEXION-LINEAS-CATEGORIAS.md) mantiene MVVM y Repository. Pasaron 206/206 pruebas móviles, TypeScript, lint sin advertencias, Doctor 21/21 y exportaciones Android (1415 módulos) y web (963 módulos). La [QA web](docs/evidencias/lineas-categorias/api-verificacion.json) comprobó filtros, paginación, vacíos, errores y cancelación; las pruebas aisladas usan modelos Mongo simulados. La [vista previa](docs/DISENO-LINEAS-CATEGORIAS.md) y [su evidencia](docs/evidencias/lineas-categorias/verificacion-diseno.json) se conservan como historial. La tarjeta sigue En progreso, **6/8 aceptados**; solo faltan prueba completa y revisión. El usuario había marcado cinco puntos y ya puede marcar el de vacío; el agente no modificó Trello. Informó que restauró el backend real tras usar el helper sintético. Error/reintento de Líneas es el siguiente recorrido pendiente, sin PR ni push. Consulta [el plan](docs/PLAN-DE-TRABAJO.md), [la arquitectura](docs/ARCHITECTURE.md) y [el versionamiento](docs/VERSIONAMIENTO.md).

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
