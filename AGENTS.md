# INHALEX Movil

## Proyecto y contexto

Este repositorio tiene copias locales independientes para David y Zenaida. Obtén la raíz de la copia en la que estás trabajando con `git rev-parse --show-toplevel` y úsala explícitamente como directorio de trabajo. La copia de David está en `C:\Users\David\Documents\INHALEX-Movil` y la de Zenaida en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`. Conserva cada operación dentro de la copia indicada por el usuario y comprueba su raíz antes de modificar ramas o crear commits.

Lee `docs/PLAN-DE-TRABAJO.md` para conocer el reparto y las dependencias acordadas con el usuario. El proyecto anterior en `C:\Users\David\Documents\Proyecto-INHALEX` es una referencia para recuperar código; conserva sus archivos e historial salvo que el usuario solicite cambios allí.

## Orden de trabajo

El usuario organizó el plan antes de la implementación y autorizó la recuperación del código y los diseños existentes. El backend y la base móvil ya se integraron mediante los PR #1 y #2. La fase actual es únicamente el diseño de Registro de usuario en `feature/registro-usuario`: formulario, controles visuales y navegación desde Cuenta. Las validaciones, el ViewModel, la conexión con la API y la sesión se incorporarán en pasos posteriores según el checklist; mantén esos límites hasta que el usuario indique avanzar. El nuevo proyecto Expo se ejecuta desde Mobile/, mientras que la app fuente se conserva en Mobile/inhalex-app/. Reutiliza los recursos por actividad siguiendo las ramas y PR del plan.

El flujo acordado para la ejecución es documentación inicial en `main`, creación de `develop`, PR de base del backend, PR de base móvil y PR por actividad funcional. El nuevo historial debe mostrar ese flujo desde el inicio. Recupera el código mediante importaciones y adaptaciones declaradas en sus PR; inicia Git en esta raíz sin copiar la carpeta `.git` del proyecto anterior.

Las ramas funcionales parten de `develop` y sus PR apuntan a `develop`. David y Zenaida revisan los PR del otro desde sus cuentas. Las ramas y responsables detallados están en el plan; no reasignes actividades por conveniencia técnica.

David567rs es el propietario y administrador. ZenaidaGR aceptó la invitación y tiene escritura, sin administración. La regla activa de `main` permite integraciones solo a David mediante PR y mantiene las comprobaciones y revisión obligatorias. Zenaida puede revisar PR hacia `main`, pero no actualizar ni fusionar esa rama. Consulta `docs/CUENTAS-Y-PERMISOS.md` para preparar la identidad Git y la autenticación de cada copia; no cambies la configuración global ni crees commits o revisiones en nombre del otro integrante.

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
