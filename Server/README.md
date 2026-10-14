# API de INHALEX

Backend NestJS y MongoDB recuperado del proyecto anterior. Se conserva la API de autenticación, productos, usuarios, favoritos, bolsa, direcciones, pedidos y avisos, junto con los módulos de soporte existentes.

El [registro de recuperación](../docs/RECUPERACION-BACKEND.md) identifica su origen, ajustes y alcance de validación. La importación se integra mediante `feature/backend-base` y un PR hacia `develop`.

## Configuración y ejecución

Desde `Server/`:

```powershell
npm ci
Copy-Item .env.example .env
```

Configura `MONGODB_URI`, `JWT_SECRET`, `PORT` y `CORS_ORIGIN` en el `.env` local. Las opciones de respaldos, almacenamiento externo y observabilidad están documentadas en `.env.example`. La configuración privada permanece fuera de Git.

Después de configurar una base de desarrollo, ejecuta:

```bash
npm start
```

La API utiliza el prefijo `/api` y el puerto configurado, 3200 por defecto. Si el backend anterior sigue ejecutándose, usa otro puerto en este entorno. `npm run start:dev` incorpora un limpiador del puerto heredado; reserva ese comando para el entorno de desarrollo que quieras reiniciar.

El arranque completo inicializa servicios y configuración de respaldos en MongoDB. Para comprobar la recuperación sin una base real, utiliza las pruebas siguientes.

## Verificación

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run lint:check
```

Las pruebas existentes utilizan modelos y servicios simulados. La suite E2E comprueba `/health` con una conexión Mongoose simulada; los recorridos completos de registro, compra y pedidos se verifican posteriormente contra una base de desarrollo.

`lint:check` revisa sin modificar archivos. El script heredado `lint` conserva su opción `--fix`.

La revisión de lint de esta importación encontró 1861 errores y 37 advertencias existentes en el código recuperado. La compilación y las pruebas pasaron; la limpieza de lint se abordará en un cambio de infraestructura separado.

## Scripts operativos y datos externos

Los scripts de seed, sincronización, migración y reconstrucción modifican datos y se ejecutan solo como operaciones de mantenimiento del entorno configurado.

`seed:synthetic` y `sync:synthetic-review-copy` necesitan `../ml/exports/operational-seed.json`, que pertenece al proyecto anterior. Esa exportación no se incorpora en este traslado. Los artefactos que usa la API de inteligencia ya se incluyen en `src/modules/intelligence/artifacts/`.
