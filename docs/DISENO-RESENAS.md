# Diseño de Reseñas

Zenaida prepara la pantalla móvil en `feature/resenas` a partir de `develop` (`6b38ba8`). El primer commit (`0d8dca5`) conserva los seis documentos del cierre de Avisos. David revisará el futuro PR hacia `develop`. Su actividad posterior es **Confirmación de recepción**.

## Recorrido en Expo Go

1. En la app de Zenaida, abre **Cuenta**, recorre los accesos y toca **Reseñas**.
2. Comprueba que el formulario identifica el producto como ejemplo. Selecciona dos estrellas y luego cinco, escribe y borra un comentario.
3. Confirma que se distingue la calificación elegida, que el contador refleja el texto y que el teclado permite terminar la edición. Publicar permanece deshabilitado durante esta etapa.
4. Vuelve a Cuenta. Al abrir de nuevo el formulario se inicia un borrador local vacío.

## Arquitectura y límite de esta etapa

La ruta `/resenas` compone el Repository local y pasa el caso de uso a la vista. El ViewModel carga el nombre de muestra y conserva en memoria la calificación y el texto. La pantalla representa ese estado. El ejemplo es independiente de la sesión y de los pedidos del usuario.

En la próxima etapa, el backend ya ofrece `GET /api/reviews/me/eligible` y `POST /api/reviews`. La regla existente de compra admite productos de un pedido completado de la cuenta; el servicio considera por separado la confirmación de recepción del cliente. La calificación va de 1 a 5 y el comentario de 4 a 700 caracteres. La recepción se trabaja en la copia de David. El diseño actual no consulta esos endpoints ni publica reseñas.

## Criterios de la tarjeta

Todos quedan pendientes de aceptación en su etapa. La primera revisión en Expo Go corresponde al formulario y a la captura local de calificación y comentario.

- [ ] Crear formulario de reseña.
- [ ] Validar que el usuario pueda publicar la reseña.
- [ ] Capturar calificación y comentario.
- [ ] Validar campos requeridos.
- [ ] Enviar la reseña a la API.
- [ ] Mostrar confirmación de publicación.
- [ ] Evitar reseñas cuando no corresponda.
- [ ] Manejar errores.
- [ ] Probar la funcionalidad.
- [ ] Revisar el código.

## Verificación del diseño

TypeScript, lint y exportación Android de Expo finalizaron correctamente (1 540 módulos exportados). En Expo web se abrió la ruta desde Cuenta, se cambió de dos a cinco estrellas y el contador reflejó 20 caracteres al escribir. Publicar siguió deshabilitado. Después de volver y entrar de nuevo, aparecieron cero estrellas y el comentario vacío. La [captura del formulario](evidencias/resenas/formulario-web.png) corresponde a la versión web con tamaño de teléfono; la revisión en Expo Go la realizará el equipo.
