# INHALEX Movil

Reinicio de la aplicación móvil de INHALEX con un repositorio independiente, arquitectura MVVM y Repository, y colaboración entre David y Zenaida mediante ramas y pull requests.

El backend, la base móvil, Registro, Inicio de sesión y Persistencia están integrados en `develop` mediante los PR #1 a #5. Persistencia completó 9/9 criterios: ZenaidaGR aprobó y fusionó el [PR #5](https://github.com/David567rs/INHALEX-Movil/pull/5), con ambas CI correctas, el 17 de octubre de 2026 en `d5171b2`. El usuario confirmó su tarjeta «Terminado». La [evidencia de integración](docs/evidencias/persistencia-sesion/integracion-pr5.json) conserva la revisión, el HEAD y los padres del merge.

El usuario aceptó el [diseño de Catálogo](docs/DISENO-CATALOGO.md) en Expo Go el 17 de octubre de 2026 y autorizó conectar la API en la misma `feature/catalogo-productos`, manteniendo MVVM y Repository. La [aceptación](docs/evidencias/catalogo-productos/expo-go-aceptacion.json) procede del chat y registra 3/9 criterios: diseño, obtención desde la API y nombre/imagen/precio/datos principales; también se confirmó la actualización correcta. La vista previa local conserva su evidencia histórica, con imágenes y precios de demostración. La [conexión a la API](docs/CONEXION-CATALOGO.md) ya está implementada con paginación, actualización y reintento, y tiene comprobaciones técnicas aprobadas. Faltan los seis criterios restantes, incluida la prueba de error/reintento en Expo Go y la revisión por PR; aún no hay PR ni push de esta etapa. El trabajo de Catálogo está en progreso; la tarjeta capturada está en «Por hacer» y el usuario puede moverla a «En progreso». La copia de Zenaida sigue en `develop` en `d5171b2`. Los acuerdos están en [el plan](docs/PLAN-DE-TRABAJO.md), [la arquitectura](docs/ARCHITECTURE.md) y [el versionamiento](docs/VERSIONAMIENTO.md).

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
