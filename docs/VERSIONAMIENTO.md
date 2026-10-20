# Versionamiento de INHALEX Movil

El esquema acordado utiliza versiones semánticas, el contador de compilaciones Android y el flujo del diagrama del profesor. El apartado 6.3 del documento de entrega debe describir este flujo basado en GitFlow: `develop`, ramas de trabajo, `release` y `main`.

## Versiones de la aplicación

Durante el desarrollo se usan versiones `0.y.z`. La base móvil comienza en `0.1.0`; la primera versión pública estable será `1.0.0`. Después de la primera estable, MAJOR indica cambios incompatibles, MINOR funcionalidades compatibles y PATCH correcciones compatibles. Los prelanzamientos pueden utilizar sufijos como `-beta.1` o `-rc.1`.

Los ejemplos del documento (`0.3.0`, `0.8.0-beta.1`, `1.0.0-rc.1`) representan posibles hitos; los números concretos de cada entrega se fijan al preparar su release. Una nueva funcionalidad integrada mediante PR no obliga a publicar inmediatamente una versión.

## Android

`expo.version` produce el `versionName` visible; `expo.android.versionCode` es un entero interno independiente de la versión semántica. Cada nueva compilación enviada a Google Play debe utilizar un código mayor que los usados previamente. El contador se conserva entre pruebas cerradas, candidatas y versiones estables; no se deduce del número MINOR ni se reinicia en `1.0.0`.

La base tiene `version: 0.1.0` y `versionCode: 1`. El paquete npm de `Mobile/` comparte la versión de la aplicación. La API en `Server/` conserva su propio paquete y sus versiones.

## Ramas, commits y entrega

Cada actividad parte del `develop` actualizado y se integra mediante PR, CI y revisión del compañero. Los commits siguen la convención `tipo(alcance): descripción`, con tipos como `feat`, `fix`, `test`, `docs` y `chore`; el alcance puede omitirse cuando el cambio sea general.

Desde el acuerdo del 20 de octubre de 2026 se conservan los hitos de cada actividad en commits separados: diseño verificado, conexión a la API autorizada y validaciones o aceptaciones posteriores. El cierre documental de la actividad anterior también se guarda por separado. No se exige una cantidad fija de commits; cada uno debe reflejar un cambio concreto y comprobado, sin reunir todas las etapas al abrir el PR. La aceptación en Expo Go se registra después del reporte real del usuario. Se conserva el historial ya publicado.

La release parte de `develop`, pasa QA y se integra en `main` mediante PR. David conserva la administración y la integración exclusiva de `main`; las correcciones vuelven a `develop`. Un tag como `v1.0.0` identifica el commit aprobado de la entrega y activará el build firmado cuando se configure esa etapa. Las fechas de publicación se ajustan al cronograma acordado.

## Referencias

- [Semantic Versioning](https://semver.org/lang/es/).
- [Versionamiento Android](https://developer.android.com/studio/publish/versioning).
- [Configuración Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/config/app/).
