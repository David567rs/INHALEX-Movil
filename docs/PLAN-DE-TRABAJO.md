# Plan de trabajo de INHALEX Movil

Acuerdos del 14 de octubre de 2026 para reiniciar la aplicación móvil con un repositorio independiente, aprovechar el backend y el código anterior, y documentar el flujo de trabajo del profesor desde el inicio.

El esquema de versiones y el flujo acordado están en [VERSIONAMIENTO.md](VERSIONAMIENTO.md).

David tiene once actividades funcionales y Zenaida cuatro. Cada actividad tendrá su propia rama, PR y evidencia de funcionamiento. Avisos será una bandeja dentro de la app.

## Ubicación y estructura

La carpeta de trabajo es `C:\Users\David\Documents\INHALEX-Movil`, al lado de `Proyecto-INHALEX`. La conversación conserva los acuerdos y este plan permite retomarlos desde otra conversación si hace falta.

La estructura prevista incluye `Server/`, `Mobile/`, `docs/` y `.github/`. El backend se recuperará como API compartida; la app Android utilizará Expo, React Native y TypeScript. El proyecto anterior se conserva como referencia.

## Preparación del repositorio

1. Preparar el README, `.gitignore`, documentación de arquitectura, reparto y reglas de colaboración.
2. Crear el commit inicial en `main` y crear `develop` desde ese estado.
3. Configurar las revisiones y comprobaciones de los PR en `main` y `develop` según las capacidades del repositorio.
4. Abrir `feature/backend-base` desde `develop`. Recuperar la API, documentar configuración y contratos, verificar compilación y pruebas existentes, y añadir su CI. Integrar mediante PR hacia `develop`.
5. Abrir `feature/mobile-bootstrap` desde `develop`. Incorporar la estructura, navegación, tema, configuración de API, cliente HTTP y composición de dependencias. Añadir CI móvil con comprobaciones reales e integrar mediante PR hacia `develop`.

David coordinará los PR de preparación y Zenaida los revisará. Son tareas de infraestructura adicionales a las quince actividades funcionales.

## Actividades y ramas

Cada fila corresponde a una rama creada desde el `develop` actualizado y un PR hacia `develop`. El título del PR identificará la misma actividad de la tarjeta.

| Etapa | Responsable | Actividad | Rama |
| --- | --- | --- | --- |
| 1 | David | Registro de usuario | `feature/registro-usuario` |
| 1 | David | Inicio de sesión | `feature/inicio-sesion` |
| 1 | David | Persistencia de sesión | `feature/persistencia-sesion` |
| 2 | David | Catálogo de productos | `feature/catalogo-productos` |
| 2 | David | Líneas o categorías | `feature/lineas-categorias` |
| 2 | David | Detalle de producto | `feature/detalle-producto` |
| 3 | David | Perfil del usuario | `feature/perfil-usuario` |
| 3 | David | Direcciones de envío | `feature/direcciones-envio` |
| 3 | Zenaida | Búsqueda de productos | `feature/busqueda-productos` |
| 3 | Zenaida | Favoritos | `feature/favoritos` |
| 3 | Zenaida | Bolsa de compras | `feature/bolsa-compras` |
| 4 | David | Creación de pedido | `feature/creacion-pedido` |
| 4 | David | Historial de pedidos | `feature/historial-pedidos` |
| 4 | David | Seguimiento del pedido | `feature/seguimiento-pedido` |
| 4 | Zenaida | Avisos | `feature/avisos` |

## Dependencias e integración

En la etapa 1 se integran registro, inicio de sesión y persistencia en ese orden. Comparten contratos y estado de autenticación, por lo que cada PR se integra antes de abrir el siguiente.

En la etapa 2 se integra catálogo, después categorías y finalmente detalle. Los identificadores, tipos de producto, filtros y puntos de composición deben quedar estables para incorporar búsqueda, favoritos y bolsa.

En la etapa 3 David desarrolla perfil y direcciones mientras Zenaida incorpora búsqueda, favoritos y bolsa. Favoritos y bolsa requieren sesión e identificación del producto. Catálogo y búsqueda comparten sus tipos y operaciones públicas; el acceso entre módulos se realiza por contratos. Coordinar las modificaciones de pantallas y navegación evita cambios simultáneos en los mismos archivos.

En la etapa 4 la creación de pedido requiere sesión, direcciones y bolsa integradas. Después se incorporan historial y seguimiento. Zenaida puede desarrollar Avisos en paralelo y verificar su integración con eventos del pedido.

Zenaida puede preparar criterios y diseños de sus actividades durante las primeras etapas. La aceptación funcional requiere integración con la API y verificación de las dependencias.

## Separación de MVVM y Repository

| Parte | Responsabilidad |
| --- | --- |
| View | Mostrar estado y comunicar acciones del usuario. |
| ViewModel | Administrar estado de pantalla y ejecutar operaciones del dominio. |
| Dominio | Definir entidades, contratos de repositorios, casos de uso y errores propios. |
| Repository de datos | Implementar contratos utilizando API o almacenamiento y transformar DTO en entidades. |
| Bootstrap | Construir las implementaciones e inyectarlas en los consumidores. |

Las pantallas no hacen peticiones HTTP. El dominio es independiente de React Native, del transporte y de implementaciones de datos. La composición de dependencias concretas permanece en `bootstrap`.

Antes de dividir la implementación se acordarán los contratos de sesión, producto, bolsa y pedido: identificadores, entradas, resultados, operaciones y errores. Cada responsable implementará las capas necesarias de sus propias funcionalidades.

## Avisos

Zenaida implementará una bandeja dentro de la app para consultar avisos del usuario, mostrar el estado leído y actualizarlo. El backend anterior cuenta con operaciones de listado, marcado individual y marcado de todos como leídos. Los criterios específicos se completarán con el checklist de la tarjeta antes de implementar esta actividad.

## Procedimiento de cada PR

1. Actualizar `develop` y crear la rama de la actividad desde ese estado.
2. Implementar la actividad y comprobar los criterios de su tarjeta.
3. Abrir el PR hacia `develop` con alcance, origen del código recuperado, dependencias y evidencia de funcionamiento.
4. Ejecutar TypeScript, lint y las pruebas pertinentes mediante CI.
5. Recibir revisión del compañero: Zenaida revisa los PR de David y David los de Zenaida, desde sus propias cuentas.
6. Resolver observaciones e integrar con un merge commit para conservar visibles las ramas y sus revisiones.

La actividad queda terminada cuando funciona integrada con la API, satisface su checklist y tiene el PR aprobado. Las verificaciones del proyecto anterior se repetirán en el nuevo proyecto.

## Release y entrega Android

1. Crear `release/v1.0.0` desde `develop` cuando las quince actividades estén integradas.
2. Realizar pruebas de integración y QA, incluyendo dispositivo Android y el recorrido de registro, acceso, catálogo, bolsa, pedido y consulta posterior.
3. Corregir los problemas de la release y abrir el PR hacia `main`.
4. Devolver las correcciones a `develop` mediante PR.
5. Crear el tag `v1.0.0` sobre el commit aprobado de `main`.
6. Usar ese tag para disparar GitHub Actions y generar el AAB firmado mediante EAS.

La vinculación de EAS, credenciales de firma y configuración de Google Play se realizará antes de la entrega correspondiente. Compilar el AAB y publicarlo son operaciones distintas.

## Siguiente bloque de trabajo

El repositorio y el backend ya están integrados y verificados. El siguiente bloque incorpora la base móvil mediante feature/mobile-bootstrap y un PR hacia develop. La primera actividad funcional será Registro de usuario.
