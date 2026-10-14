# Recuperación de la base móvil

Esta importación utiliza la copia de trabajo de `C:\Users\David\Documents\Proyecto-INHALEX\Mobile\inhalex-app`, cuyo repositorio fuente está en `526a21e11da1cd1e3f6edea350c7731f90e205bf`. Al iniciar la recuperación, Git no mostraba cambios locales dentro de esa app. Se conserva la fuente sin modificarla y se incorpora la base mediante `feature/mobile-bootstrap` hacia `develop`.

## Código y diseños recuperados

Se reutilizan el manifiesto y lockfile npm, la configuración TypeScript/ESLint y las instrucciones Expo de la app original. Expo SDK 57 se mantiene; Doctor solicitó actualizar los parches de Expo, Router y SplashScreen y se aplicó `expo install --fix` en el proyecto nuevo.

Se recuperan seis recursos sin alterar su contenido: `inhalex-mark.png`, `NuevoLogo.png`, `favicon.png`, `home/hero-botanical.jpg`, `home/usage-guide.jpg` y `home/brand.png`. Inicio, la paleta, las transiciones y los componentes compartidos se adaptan del diseño original. Las cinco pestañas siguen siendo Inicio, Catálogo, Favoritos, Bolsa y Cuenta.

El layout ya no importa providers de autenticación, catálogo, favoritos, bolsa, direcciones ni pedidos. Las pantallas de las actividades pendientes ofrecen su estado de preparación y rutas válidas hacia Inicio o Experiencia. La guía Experiencia utiliza contenido estático; se conserva el video en la fuente para decidir su recuperación en una etapa posterior.

## Adaptaciones de infraestructura

La app ejecutable queda directamente en `Mobile/`. La versión inicial es `0.1.0`, sin vincular el proyecto EAS anterior. La configuración y el cliente HTTP se adaptan para la API con prefijo `/api`, validación de URL, destino controlado, JSON, timeout, cancelación y proveedor de token inyectable. El transporte no impone tipos de dominio.

`bootstrap` centraliza la composición futura de dependencias. Las actividades agregarán Repository, entidades, casos de uso y ViewModels mediante sus respectivos PR; esta base no presenta esos módulos como terminados. Los recorridos reales contra la API y Android se verificarán al integrar las actividades.

El workflow `Mobile CI` comprueba TypeScript, lint, pruebas de infraestructura, Expo Doctor y exportación Android. `Backend CI` continúa ejecutándose para los PR del repositorio. La revisión del PR corresponde a Zenaida desde su cuenta.

## Referencias técnicas consultadas

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
- [Expo Router 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/) y [pestañas](https://docs.expo.dev/router/advanced/tabs/).
- [Constants 57](https://docs.expo.dev/versions/v57.0.0/sdk/constants/) y [configuración Expo 57](https://docs.expo.dev/versions/v57.0.0/config/app/).
- [Animated 0.86](https://reactnative.dev/docs/0.86/animated) y [AccessibilityInfo 0.86](https://reactnative.dev/docs/0.86/accessibilityinfo).

## Validación

TypeScript y lint pasan. Expo Doctor aprueba sus 21 controles. Las 20 pruebas de infraestructura pasan con transporte simulado. La exportación Android genera su bundle Hermes y recursos; la exportación web permite revisar las pantallas sin iniciar el backend.

Se comprobaron Inicio, Catálogo, Favoritos, Bolsa y Cuenta en la vista web, así como la entrada a Experiencia y el regreso a Inicio. Se revisaron anchos de 393 y 320 píxeles sin desbordamiento horizontal. Las capturas adjuntas corresponden a web a tamaño de teléfono, no a un dispositivo Android. Zenaida comprobará también el arranque y la navegación con Expo Go antes de aprobar el PR.

La guía Experiencia se ajustó para que la altura de su imagen responda al ancho disponible, conservando el recurso original completo.

## Límites y deuda de dependencias

La base no implementa registro, acceso, sesión ni las otras actividades. La conexión real con el backend y los recorridos de Android se verificarán en sus PR.

`npm audit` informa 29 entradas: 11 moderadas y 18 altas, sin críticas. Son propagaciones de cuatro familias (braces, node-forge, uuid y decode-uri-component); Expo Router también tiene una ruta de ejecución potencial afectada. Las correcciones directas propuestas por audit cambian a versiones incompatibles con SDK 57. Esta deuda queda visible para una actualización compatible; se aplicaron únicamente los parches recomendados por Expo Doctor.

La configuración de red y las pruebas aíslan el transporte de los contratos de dominio. El cliente solicita rechazar redirecciones y valida el origen de una URL final cuando está disponible. Expo 57 utiliza su implementación de fetch por defecto; la variante del polyfill de React Native puede comportarse de otra manera. La prueba simulada no sustituye la comprobación de transporte y autenticación en Android.
