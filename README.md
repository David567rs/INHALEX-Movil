# INHALEX Movil

Reinicio de la aplicación móvil de INHALEX con un repositorio independiente, arquitectura MVVM y Repository, y colaboración entre David y Zenaida mediante ramas y pull requests.

El backend ya está integrado en `develop` mediante el [PR #1](https://github.com/David567rs/INHALEX-Movil/pull/1), aprobado por Zenaida y con CI satisfactorio. Esta rama incorpora la base móvil en `feature/mobile-bootstrap` para su propia revisión hacia `develop`. Los acuerdos están en [el plan](docs/PLAN-DE-TRABAJO.md), [la arquitectura](docs/ARCHITECTURE.md) y [el versionamiento](docs/VERSIONAMIENTO.md).

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

El proyecto Expo ejecutable está directamente en `Mobile/`. Recupera la identidad visual y la navegación de cinco pestañas; las quince actividades funcionales se incorporarán después, cada una mediante su rama y PR.

```bash
npm ci --prefix Mobile
npm run dev:mobile
```

El segundo comando abre Expo en el puerto 8082 para poder probar la app en Expo Go. Consulta [Mobile/README.md](Mobile/README.md) para los comandos de Git Bash y CMD, la configuración pública de la API y los controles del PR. El origen y las adaptaciones están en [la recuperación móvil](docs/RECUPERACION-MOVIL.md).
