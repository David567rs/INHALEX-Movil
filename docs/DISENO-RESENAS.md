# Diseño de Reseñas

> Registro histórico de la etapa de diseño. El estado actual, los PR técnicos ya integrados y las pruebas aceptadas se consultan en [Conexión de Reseñas](CONEXION-RESENAS.md) y [Preparación del PR](PR-RESENAS.md).

Zenaida prepara la pantalla móvil en `feature/resenas` a partir de `develop` (`6b38ba8`). El primer commit (`0d8dca5`) conserva los seis documentos del cierre de Avisos. David revisará el futuro PR hacia `develop`. Su actividad posterior es **Confirmación de recepción**.

## Recorrido en Expo Go

Esta copia ya usa Expo SDK 58 y conserva la rama `feature/resenas`. El servidor preparado usa el puerto **8083**. Para reiniciarlo desde `INHALEX-Movil-Zenaida/Mobile`, ejecuta `npm run start -- --go --lan --port 8083`. Si el servidor ya está activo, usa su QR existente para evitar instancias duplicadas. La revisión nativa permanece pendiente del usuario.

1. En la app de Zenaida, abre **Cuenta**, recorre los accesos y toca **Reseñas**.
2. Comprueba que el formulario identifica el producto como ejemplo. Selecciona dos estrellas y luego cinco, escribe y borra un comentario.
3. Confirma que se distingue la calificación elegida, que el contador refleja el texto y que el teclado permite terminar la edición. Publicar permanece deshabilitado durante esta etapa.
4. Vuelve a Cuenta. Al abrir de nuevo el formulario se inicia un borrador local vacío.

## Arquitectura y límite de esta etapa

La ruta `/resenas` compone el Repository local y pasa el caso de uso a la vista. El ViewModel carga el nombre de muestra y conserva en memoria la calificación y el texto. La pantalla representa ese estado. El ejemplo es independiente de la sesión y de los pedidos del usuario.

En la próxima etapa, el backend ya ofrece `GET /api/reviews/me/eligible` y `POST /api/reviews`. La regla existente de compra admite productos de un pedido completado de la cuenta; el servicio considera por separado la confirmación de recepción del cliente. La calificación va de 1 a 5 y el comentario de 4 a 700 caracteres. La recepción se trabaja en la copia de David. El diseño actual no consulta esos endpoints ni publica reseñas.

## Criterios de la tarjeta

El usuario aceptó el formulario y la captura local en Expo Go el 4 de noviembre de 2026. La conexión y sus pruebas siguen en su propia etapa; no se ha accedido a Trello.

- [x] Crear formulario de reseña.
- [ ] Validar que el usuario pueda publicar la reseña.
- [x] Capturar calificación y comentario.
- [ ] Validar campos requeridos.
- [ ] Enviar la reseña a la API.
- [ ] Mostrar confirmación de publicación.
- [ ] Evitar reseñas cuando no corresponda.
- [ ] Manejar errores.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

## Verificación del diseño

Aceptación posterior de Expo Go 58: «Amigo, ya abrió Reseñas en Expo Go y funcionan las estrellas y el comentario. Sigamos con la API en feature/resenas, manteniendo MVVM, Repository y commits por etapa.». Este reporte acepta los criterios 1 y 3 (2/10), sin atribuir observación directa del teléfono al agente. También informó que no puede iniciar sesión: se diagnosticará la conexión antes de la aceptación de la API. La confirmación del diseño no acredita acceso, publicación ni continuidad de sesión.

TypeScript, lint y exportación Android de Expo finalizaron correctamente (1 540 módulos exportados). En Expo web se abrió la ruta desde Cuenta, se cambió de dos a cinco estrellas y el contador reflejó 20 caracteres al escribir. Publicar siguió deshabilitado. Después de volver y entrar de nuevo, aparecieron cero estrellas y el comentario vacío. La [captura del formulario](evidencias/resenas/formulario-web.png) corresponde a la versión web con tamaño de teléfono; la revisión en Expo Go la realizará el equipo.

## Compatibilidad con Expo 58, 4 de noviembre de 2026

El usuario autorizó resolver la incompatibilidad directamente en la copia de Zenaida. El merge local `a4f09b0` incorpora la rama técnica `chore/expo-sdk-58` hasta `4bf34a2`, preservando ambos historiales y sus autores. El commit separado `a7dcd2d` adapta la referencia del comentario a `TextInputInstance`. No cambian el Repository local, el caso de uso ni el ViewModel. Reseñas sigue a cargo de Zenaida y David revisará su PR.

Se instalaron las versiones del lockfile mediante `npm ci`: Expo 58.0.23, React 19.3.0 y React Native 0.88.1. TypeScript y lint aprobaron; pasaron 735/735 pruebas y Doctor 20/20. Las exportaciones aprobaron con 1 450 módulos Android y 1 100 web. El servidor de Zenaida en 8083 anuncia `sdkVersion: 58.0.0` y entregó el bundle Android por HTTP 200. Solo quedó ese Metro activo; el backend en 3200 se conservó.

En web se verificaron dos y cinco estrellas, el comentario de muestra de 29 caracteres, el contador, desenfoque con Cerrar teclado, Publicar deshabilitado y regreso desde Cuenta → Reseñas a Cuenta. Reabrir deja cero estrellas y texto vacío. Se conservan las cinco pestañas y no aparecieron errores de consola en ese recorrido. La [captura de SDK 58](evidencias/resenas/formulario-expo58-web.png) es evidencia web, no una observación del teléfono.

El [PR #18](https://github.com/David567rs/INHALEX-Movil/pull/18) continúa abierto, pendiente de revisión real de Zenaida e integración a `develop`. Esta incorporación local permite probar Reseñas sin esperar ese merge; no aprueba el PR ni integra cambios en `develop`. Antes de abrir el futuro PR de Reseñas, integrar la actualización técnica revisada y sincronizar con `develop`. Los criterios de Trello siguen pendientes de la aceptación correspondiente. La API y publicación de Reseñas pertenecen a la etapa siguiente.
