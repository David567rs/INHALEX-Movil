# Arquitectura de INHALEX Movil

Este documento define la estructura para recuperar y adaptar el sistema en el nuevo repositorio. El [plan de trabajo](PLAN-DE-TRABAJO.md) contiene el reparto de actividades y las [reglas de colaboración](../CONTRIBUTING.md) describen ramas, PR y validación. La incorporación de cada módulo debe demostrar su cumplimiento; la documentación no certifica que toda la estructura ya esté implementada.

## Sistema y organización

La aplicación Android utiliza Expo, React Native y TypeScript. Consume la API REST NestJS. El backend concentra autorización, reglas de negocio y acceso a MongoDB; la móvil recibe los datos mediante la API.

```text
INHALEX-Movil/
├── Server/                 API NestJS recuperada y validada
├── Mobile/                 Proyecto ejecutable Expo
├── docs/                   Plan, contratos, arquitectura y evidencia
└── .github/                Plantilla de PR y workflows por incorporar
```

`Server/` y `Mobile/` comparten repositorio, pero mantienen sus dependencias, configuración y procesos de ejecución. La importación conserva el proyecto anterior como referencia, registra el origen de código y diseños, y adapta cada actividad mediante su propio PR. Backend y móvil tienen entregas distintas: servicio API y aplicación Android.

## Backend

Se recupera el backend existente en `Server/` mediante `feature/backend-base`. Los módulos de autenticación, usuarios, productos, pedidos y avisos proporcionan los contratos necesarios para la móvil. Los módulos adicionales recuperados se documentan con su alcance; su presencia no añade actividades funcionales al reparto acordado.

Los controllers reciben solicitudes y aplican el contrato HTTP; los servicios coordinan las reglas de negocio; los componentes de persistencia acceden a MongoDB. Los DTO y las validaciones delimitan entradas y salidas. La autorización y la propiedad de recursos se comprueban en el servidor para cada operación protegida.

La recuperación debe documentar cómo configurar, ejecutar y comprobar la API. Antes de consumir un endpoint se revisan sus entradas, respuestas, errores y requisitos de autenticación. Se conserva el comportamiento existente que haya sido validado; cualquier cambio de contrato se declara en el PR y se verifica en la móvil.

## Arquitectura móvil

La organización es por funcionalidad, con MVVM en presentación y Repository para el acceso a datos. La estructura objetivo del proyecto ejecutable es:

```text
Mobile/
├── assets/                         Recursos de identidad y diseño
├── src/
│   ├── app/                        Rutas y composición de navegación
│   ├── bootstrap/                  Composición e inyección de dependencias
│   ├── core/                       Configuración, HTTP, almacenamiento y tema
│   ├── shared/                     Contratos y componentes compartidos
│   └── features/
│       └── <modulo>/
│           ├── presentation/       Views y ViewModels
│           ├── domain/             Entidades, contratos, casos de uso y errores
│           └── data/               Repository, API, almacenamiento y mappers
└── docs/                           Checklists y evidencia de la app
```

Los nombres de módulos se acuerdan al incorporar la base para aprovechar el código existente. Una actividad puede abarcar varias capas y compartir módulo con otra, pero conserva su propia rama, PR y criterios de aceptación.

| Parte | Responsabilidad |
| --- | --- |
| View | Representar el estado de pantalla y comunicar acciones del usuario. |
| ViewModel | Administrar estado de interfaz y ejecutar operaciones del dominio. |
| Dominio | Definir entidades, contratos de repositorios, casos de uso y errores propios. |
| Repository de datos | Implementar contratos mediante API o almacenamiento, validar y transformar DTO, y normalizar errores. |
| Bootstrap | Construir implementaciones concretas e inyectarlas en sus consumidores. |
| Core | Proporcionar servicios técnicos y configuración compartidos. |

Una acción recorre View → ViewModel → operación de dominio → contrato Repository → implementación de datos → API o almacenamiento. Las respuestas se transforman en entidades o resultados de dominio antes de llegar a la presentación.

## Dependencias

1. Las Views no realizan peticiones HTTP ni construyen repositorios concretos.
2. Los ViewModels consumen operaciones y tipos del dominio. Las decisiones de transporte y persistencia quedan en datos.
3. El dominio no importa React Native, Expo, implementaciones de `data` ni errores del cliente HTTP.
4. `data` implementa los contratos del dominio y depende de los servicios técnicos necesarios de `core`.
5. `bootstrap` conecta las implementaciones concretas; las rutas pueden utilizar los providers ya compuestos sin asumir responsabilidades de negocio.
6. Los módulos se comunican mediante contratos públicos acordados. No acceden directamente a archivos internos de otras funcionalidades.
7. `shared` contiene elementos realmente compartidos; la lógica específica permanece en su módulo.

## Contratos de integración

Antes de dividir la implementación se fijan los contratos de sesión, producto, bolsa y pedido: identificadores, entradas, resultados, operaciones y errores. Se añaden después los contratos necesarios para direcciones y avisos. `docs/` registra las decisiones y cada PR declara los cambios que afecten a otros módulos.

La móvil no considera confirmado un pedido, cambio de cuenta o actualización de datos hasta recibir la respuesta válida de la API. Precios, disponibilidad, permisos y pertenencia de recursos se validan de nuevo en el backend.

La sesión Android utiliza almacenamiento seguro. Al iniciar la aplicación se valida su estado contra la API según el contrato de autenticación. Una credencial rechazada debe producir un estado de sesión inválida; un fallo temporal de red debe distinguirse del rechazo de autenticación para ofrecer una recuperación adecuada.

## Reparto y recuperación de diseños

David implementa registro, inicio de sesión, persistencia, catálogo, categorías, detalle, perfil, direcciones, creación de pedido, historial y seguimiento. Zenaida implementa búsqueda, favoritos, bolsa y Avisos. Cada responsable adapta presentación, dominio y datos de sus propias actividades; la revisión del PR corresponde al compañero.

Se recuperan los recursos y diseños existentes de INHALEX en la base y en las actividades que los utilicen. Las animaciones, estilos y navegación se conservan o adaptan cuando respeten la estructura y los criterios de la actividad. Su aceptación se vuelve a verificar en Android y queda asociada al PR correspondiente.

Avisos es una **bandeja interna**: consulta los avisos del usuario, representa el estado leído y permite actualizarlo. El contrato debe comprobar la identidad del usuario y definir el marcado individual y conjunto que ofrezca la API. El alcance de esta actividad no incluye implementar notificaciones push; su aceptación se basa en la bandeja acordada y su checklist.

## Estados, seguridad y verificación

Las operaciones muestran estados de carga, resultado, vacío y error según corresponda. Los mensajes se obtienen de errores de dominio, con reintento cuando sea pertinente. La interfaz permite completar los recorridos críticos y verifica su comportamiento en Android.

La API se consume por HTTPS en distribución. MongoDB, credenciales de servicio y secretos permanecen en el servidor o en la configuración protegida del entorno. Los valores `EXPO_PUBLIC_*` son públicos. Tokens y llaves privadas no se incluyen en recursos, código ni ejemplos versionados.

Cada PR ejecuta comprobaciones reales para su alcance: compilación y pruebas pertinentes del backend; TypeScript, lint y pruebas pertinentes de la móvil; y evidencia de comportamiento e integración. Los checklists recuperados deben repetirse en el nuevo proyecto. Los comandos y workflows se documentan al incorporarlos y solo se declaran exitosos después de ejecutarlos.

## Entrega

`feature/backend-base` incorpora la API y su CI. `feature/mobile-bootstrap` incorpora la base móvil y su CI. Las quince actividades se integran en `develop` mediante PR con revisión cruzada y merge commit.

La rama `release/vX.Y.Z` parte de `develop`, recibe QA y correcciones, se integra en `main` y devuelve sus correcciones a `develop`. El tag de versión apunta al commit aprobado de `main` y activará el workflow Android que se configure para producir el AAB firmado mediante EAS. La vinculación de EAS, firma y configuración de Google Play se verifica en su etapa de entrega; generar el AAB y publicarlo son acciones distintas.
