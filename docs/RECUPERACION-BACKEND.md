# Recuperación del backend de INHALEX

La API se recupera en `Server/` para utilizarla desde la nueva app y mantener backend y móvil en un solo repositorio. La importación se realiza en `feature/backend-base`, creada desde el `develop` documental inicial.

## Origen

- Repositorio de origen: [Proyecto INHALEX](https://github.com/David567rs/Proyecto-INHALEX).
- Revisión de referencia: `526a21e11da1cd1e3f6edea350c7731f90e205bf`.
- Carpeta de origen: `C:\Users\David\Documents\Proyecto-INHALEX\Server`.
- Archivos recuperados: 170 archivos de código, pruebas, configuración pública y dependencias declaradas.

Se utilizó el contenido actual de la carpeta de trabajo. También se recuperaron juntos el cambio local de `src/main.ts` y los archivos nuevos `src/config/cors.ts` y `src/config/cors.spec.ts`, necesarios para la política de CORS de desarrollo móvil.

Antes de adaptar documentación y scripts de comprobación se compararon los 170 archivos con su origen mediante SHA256; todos coincidieron. El proyecto anterior se conserva para referencia.

## Ajustes de incorporación

- Documentación de instalación, configuración y pruebas adaptada al nuevo repositorio.
- Script `lint:check` añadido para revisar sin aplicar cambios automáticos.
- Líneas vacías adicionales al final de 17 archivos normalizadas para la comprobación de Git, sin cambiar su lógica.
- Comandos raíz para compilar y comprobar el backend.
- Workflow de GitHub Actions con instalación reproducible, compilación, pruebas unitarias y prueba E2E de salud.

El traslado incluye los módulos de soporte de la API para conservar sus dependencias. Su presencia no modifica el reparto de las quince actividades móviles.

## Configuración y datos

Se recuperó `.env.example`. Archivos de configuración privada, dependencias instaladas, builds, logs y respaldos del proyecto anterior quedan fuera del material publicado.

Dos scripts operativos utilizan `../ml/exports/operational-seed.json`. Esa exportación es una dependencia de mantenimiento, no del arranque habitual. Los artefactos de inteligencia que consume la API están incluidos dentro de `Server/src/modules/intelligence/artifacts/`.

## Validación

Resultados locales del 14 de octubre de 2026 con Node.js 24.14.0:

| Comprobación | Resultado |
| --- | --- |
| `npm ci --no-audit --no-fund` | Instalación reproducible completada. |
| `npm run build` | Compilación correcta. |
| `npm test -- --runInBand` | 17 suites y 161 pruebas unitarias aprobadas. |
| `npm run test:e2e -- --runInBand` | Una suite y una prueba de `/health` aprobadas con conexión simulada. |
| `npm run lint:check` | 1861 errores y 37 advertencias heredados; requiere una tarea de limpieza aparte. |

La compilación, las pruebas unitarias y la E2E son los controles obligatorios de este PR. Lint se registra como diagnóstico pendiente y no forma parte del check obligatorio de importación. La normalización de finales de archivo conserva el contenido funcional TypeScript; la limpieza general de lint se abordará aparte.

Estas verificaciones no sustituyen los recorridos reales contra MongoDB ni ejecutan los scripts operativos de seed, migración o sincronización.
