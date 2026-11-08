# Confirmación de recepción: diseño

David trabaja en `feature/confirmacion-recepcion`, desde `develop` `0f619021b4de5d5436b0f43c122d9cba6b306da3`. La referencia visual es la app INHALEX recuperada y pulida. Reseñas de Zenaida está integrada mediante el PR #21; no se cambia su implementación.

## Alcance autorizado

Preparar la opción desde Cuenta y una vista previa con pedido de ejemplo, resumen de productos y diálogo de confirmación. Los ejemplos son ficticios y las interacciones viven solo en memoria. No se consultan pedidos reales, no se cambia su recepción y no se envían escrituras a la API. La conexión, validaciones del servidor, duplicados y recuperación se trabajan después de la aceptación del diseño en Expo Go.

Conservar View → ViewModel → caso de uso → contrato Repository → implementación local, con composición en bootstrap. Reutilizar colores, encabezado, navegación y componentes de la app. Un solo desplazamiento y acciones dentro del contenido; los controles deben seguir alcanzables en pantallas pequeñas.

El usuario ya arrancó Expo y el backend. El agente no inicia, reinicia ni detiene esos servicios. No se publica esta rama ni se abre PR todavía.

## Criterios exactos de Trello

Todos pendientes de su aceptación correspondiente; una vista previa no acredita funcionamiento con pedidos reales.

- [ ] Mostrar opción de confirmar recepción
- [ ] Validar que el pedido pueda ser confirmado
- [ ] Enviar confirmación a la API
- [ ] Evitar confirmaciones duplicadas
- [ ] Actualizar el estado del pedido
- [ ] Mostrar mensaje de confirmación
- [ ] Manejar errores
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Tras aceptar el diseño en Expo Go puede marcarse únicamente **Mostrar opción de confirmar recepción**. La revisión real de Zenaida se realizará sobre el futuro PR.

## Verificación

Pendiente de implementar y comprobar. El reporte del usuario en Expo Go se registrará por separado de la comprobación técnica y web.
