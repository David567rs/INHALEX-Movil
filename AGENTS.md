# INHALEX Movil

## Proyecto y contexto

La raíz de este nuevo proyecto es `C:\Users\David\Documents\INHALEX-Movil`. Usa esta ubicación explícitamente como directorio de trabajo al ejecutar comandos sobre el proyecto. Comprueba la raíz de Git antes de modificar ramas o crear commits.

Lee `docs/PLAN-DE-TRABAJO.md` para conocer el reparto y las dependencias acordadas con el usuario. El proyecto anterior en `C:\Users\David\Documents\Proyecto-INHALEX` es una referencia para recuperar código; conserva sus archivos e historial salvo que el usuario solicite cambios allí.

## Orden de trabajo

El usuario organizó el plan antes de la implementación y ya autorizó iniciar la recuperación del código y los diseños existentes. La fase actual es preparación del repositorio e incorporación del backend. Reutiliza los recursos por actividad siguiendo las ramas y PR del plan.

El flujo acordado para la ejecución es documentación inicial en `main`, creación de `develop`, PR de base del backend, PR de base móvil y PR por actividad funcional. El nuevo historial debe mostrar ese flujo desde el inicio. Recupera el código mediante importaciones y adaptaciones declaradas en sus PR; inicia Git en esta raíz sin copiar la carpeta `.git` del proyecto anterior.

Las ramas funcionales parten de `develop` y sus PR apuntan a `develop`. David y Zenaida revisan los PR del otro desde sus cuentas. Las ramas y responsables detallados están en el plan; no reasignes actividades por conveniencia técnica.

## Arquitectura

La aplicación prevista es Android con Expo, React Native y TypeScript. Consume la API NestJS; MongoDB permanece detrás del backend.

- `presentation`: pantallas, componentes y ViewModels; las vistas muestran estado y ejecutan acciones.
- `domain`: entidades, contratos de repositorios, casos de uso y errores independientes del transporte y de React Native.
- `data`: implementaciones de Repository, API, almacenamiento, DTO y mapeadores.
- `bootstrap`: composición e inyección de dependencias concretas.
- `core`: configuración y servicios técnicos compartidos.

Las pantallas no realizan peticiones HTTP. El dominio no importa implementaciones de `data` ni errores del cliente HTTP. Los ViewModels utilizan las operaciones del dominio; `bootstrap` conecta las implementaciones.

Avisos pertenece a Zenaida y consiste en una bandeja dentro de la app con consulta de avisos y estado leído.

## Validación y entrega

Al incorporar código, define comprobaciones reales para su alcance. Los PR de funcionalidades incluyen evidencia del comportamiento, validaciones pertinentes y revisión del compañero. Conserva los checklists de las actividades y vuelve a verificarlos en el nuevo proyecto.

La release parte de `develop`, pasa por QA, se integra en `main` y devuelve sus correcciones a `develop`. El tag de versión apunta al commit aprobado de `main` y dispara el build Android firmado. Firma, EAS y publicación se configuran en su etapa correspondiente.
