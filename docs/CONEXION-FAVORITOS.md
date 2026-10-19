# Favoritos: conexión a la API

Actividad de ZenaidaGR en `C:\Users\David\Documents\INHALEX-Movil-Zenaida`, rama `feature/favoritos`, basada en `develop` (`852614a`). El usuario aceptó el diseño en Expo Go el 19 de octubre de 2026 y autorizó conectar la API en la misma rama. Su mensaje exacto está en [la aceptación](evidencias/favoritos/expo-go-aceptacion.json). Las capturas del [diseño anterior](DISENO-FAVORITOS.md) son históricas; sus productos sintéticos no son favoritos personales.

## Recorrido MVVM y Repository

`Favoritos / Detalle → ViewModel y estado compartido → FavoritesActions → FavoritesRepository → ApiFavoritesRepository → HttpClient`.

Bootstrap compone un único runtime con la sesión pública y el controlador de Favoritos. Solo bootstrap/cliente HTTP pueden leer el token privado; ni el contexto React ni el ViewModel reciben credenciales. El provider mantiene activo el controlador aunque se cambie de pestaña. No se cambiaron backend, CORS, almacenamiento de sesión ni dependencias.

La pantalla conserva la identidad aceptada, fotos, precios, tarjetas, colección y vacío. Retira los rótulos y selectores de muestras. El Detalle permite guardar/quitar con un corazón y conserva los accesos de navegación a Favoritos y Bolsa. Las tarjetas reales abren Detalle. Las cinco pestañas continúan disponibles.

La revisión técnica final añadió el fallback de hoja cuando falla una descarga de imagen en una tarjeta, conservando la distribución. Se verificó técnicamente, sin atribuir al usuario una prueba nativa específica de ese fallo. Las [comprobaciones finales del PR](evidencias/favoritos/verificacion-pr.json) registran TypeScript, lint, 322 pruebas, Doctor 21/21 y exportaciones Android 1444/web 992 aprobadas después del ajuste.

## Contrato existente

Todas las rutas son relativas a `/api` y requieren Bearer de la sesión. El servidor identifica la cuenta mediante el JWT, sin enviar un ID de usuario en el cuerpo o la ruta.

| Operación | Ruta | Respuesta esperada |
| --- | --- | --- |
| Consultar | `GET /favorites` | Arreglo directo de productos; `[]` indica vacío real |
| Guardar | `PUT /favorites/:productId` | `{ productId }`, coincidente con el ID enviado |
| Quitar | `DELETE /favorites/:productId` | `{ productId }`, coincidente con el ID enviado |

El adaptador exige IDs canónicos de 24 caracteres hexadecimales y rechaza listas duplicadas o malformadas. Reutiliza `mapCatalogProduct`, que proyecta únicamente campos públicos, valida precios/moneda y aplica las reglas existentes de imágenes y promociones. No utiliza el envelope paginado de Catálogo. El backend conserva el orden de guardado y devuelve solo productos activos, incluidos los agotados. Los inactivos o eliminados no aparecen en esta consulta.

## Confirmación, errores y sesión

- La lista se consulta cuando se autentica la cuenta. Sin sesión no se consulta ni se declara un vacío personal; se muestra acceso al inicio de sesión.
- Guardar y quitar cambian el corazón y la lista después de validar la confirmación del servidor. Mientras se tramitan se impide repetir la misma acción. Una actualización no se solapa con mutaciones.
- Una lectura fallida conserva la última colección. Una escritura fallida conserva el corazón y la fila anteriores, con mensaje y reintento explícito. No hay reintentos automáticos.
- Cerrar sesión o cambiar de autenticación cancela operaciones y limpia inmediatamente los favoritos locales. Se descartan respuestas tardías, incluso de un login anterior a la misma cuenta.
- Un `401` vacía y bloquea Favoritos. La acción explícita para iniciar de nuevo cierra la sesión local y abre el formulario; el aviso de fallo al borrar SecureStore, si lo hubiera, se conserva en Login. No se interpreta un fallo de red, `403`, `429` o `5xx` como expiración.
- Los favoritos se guardan en el backend; no se introdujo caché personal persistente ni almacenamiento del listado en el dispositivo. **Actualizar favoritos** consulta de nuevo la colección remota.

## Prueba inicial en Expo Go

Reutiliza Metro de Zenaida en `8083` y el backend compartido en `3200`.

1. Inicia sesión con una cuenta de prueba en **Cuenta**.
2. Abre **Catálogo → un producto → Guardar en favoritos**. Espera la confirmación del corazón.
3. Abre **Favoritos** y comprueba nombre, imagen y precio del mismo producto.
4. Pulsa **Actualizar favoritos** y verifica que permanece.
5. Abre su Detalle desde la tarjeta y comprueba el corazón; vuelve y pulsa **Quitar**. La fila debe desaparecer al confirmarse la operación.

Después de esta prueba se revisarán por separado el vacío real, error/reintento, reapertura y aislamiento entre cuentas. Las pruebas automatizadas no sustituyen su aceptación en el dispositivo.

El usuario confirmó después exactamente: «ya pude guardar, actualizar y quitar favoritos en Expo Go. Sigamos con la prueba del estado vacío.». Esta respuesta al recorrido guiado acepta contextualmente los criterios 1 a 5 (**5/9**); la [evidencia textual](evidencias/favoritos/expo-go-aceptacion.json) no atribuye al agente observación directa del teléfono. El vacío todavía no está aceptado.

### Vacío autenticado, aceptado

1. Mantener la sesión iniciada en la misma cuenta de prueba y quitar sus favoritos hasta dejar la lista sin productos. Si ya está vacía, continuar.
2. Comprobar **Aún no tienes favoritos** y el botón **Explorar catálogo**.
3. Pulsar **Actualizar favoritos**, esperar que termine sin aviso de error y comprobar que permanece el vacío. Así se verifica la colección vacía recibida de la API y no solo el resultado local de quitar.
4. Pulsar **Explorar catálogo** y comprobar que abre Catálogo.

La pantalla anónima **Tu selección te espera / Iniciar sesión** no representa este vacío. El usuario confirmó exactamente: «apareció «Aún no tienes favoritos», se mantuvo al actualizar y «Explorar catálogo» abrió Catálogo. Sigamos con la prueba de error y reintento.». Su confirmación acepta el criterio 6, **Mostrar mensaje cuando no haya favoritos**: **6/9**, sin observación directa del teléfono por el agente.

### Error y reintento, aceptados

1. Con la misma sesión de prueba, guardar de nuevo un producto y dejarlo visible en Favoritos.
2. En la terminal del backend local, detener solo la API con `Ctrl+C`. Mantener Metro de Zenaida en `8083` y Metro de David en `8082` activos. El agente no detuvo servicios para esta guía; se requiere primero que el usuario prepare el favorito visible.
3. Pulsar **Quitar** y esperar a que termine la solicitud. Debe aparecer un aviso y conservarse el producto, pues el servidor no confirmó la eliminación.
4. Pulsar **Actualizar favoritos** y esperar el error. Deben conservarse los productos y aparecer **Reintentar**.
5. En la misma terminal del backend, desde la raíz de Zenaida, ejecutar `npm run dev:server` y esperar a que la API en `3200` esté lista. En Expo Go pulsar **Reintentar**: debe desaparecer el aviso y reaparecer la colección confirmada, sin pedir nuevas credenciales.

El usuario confirmó exactamente: «Amigo, fallaron Quitar y Actualizar sin perder el producto. Reinicié el backend y Reintentar recuperó la lista sin errores. ¿Qué marco en Trello y qué sigue?». La aceptación textual completa el criterio 7, **Manejar errores de conexión**: **7/9**. El agente no observó el teléfono ni ejecutó las interrupciones descritas por el usuario. No se alteraron `.env`, CORS, cuentas ni datos de MongoDB para simular estos fallos.

### Cierre del recorrido funcional, aceptado

Con la API y Metro activos:

1. Dejar un producto guardado en la cuenta de prueba.
2. Cerrar completamente Expo Go, volver a abrir el proyecto de Zenaida y entrar en Favoritos. Esperar la comprobación de sesión y la consulta: el producto debe permanecer.
3. En Cuenta, cerrar sesión y volver a Favoritos. Debe aparecer **Tu selección te espera / Iniciar sesión**, sin la lista personal anterior.
4. Iniciar sesión con la misma cuenta de prueba y entrar en Favoritos: debe recuperarse el producto guardado en la API.

El usuario confirmó exactamente: «Amigo, el favorito permaneció al reabrir Expo Go, se ocultó al cerrar sesión y volvió al ingresar con la misma cuenta. Abre el PR de Favoritos hacia develop para que David567rs lo revise.». Esta confirmación acepta **Probar la funcionalidad** (8): **8/9**. El cambio entre dos cuentas distintas tiene cobertura automatizada; no se atribuye al usuario una prueba física de ese caso. La autorización actual es publicar la rama y abrir el PR de ZenaidaGR hacia `develop`, solicitando revisión a David567rs. La revisión real (9) y la integración siguen pendientes.

## Trello y entrega

Las confirmaciones aceptan los criterios 1 a 8: opción para marcar, guardar, mostrar lista, eliminar, sincronizar con la API, mensaje sin favoritos, manejo de errores y prueba funcional. Favoritos queda **8/9**. Ya puede marcarse **Probar la funcionalidad**; **Revisar el código** (9) espera la revisión real de David567rs. Mantener la tarjeta en progreso hasta revisión e integración. El agente no leyó ni modificó Trello y el usuario aún no confirmó que haya marcado estos puntos.

La evidencia técnica se registra en [verificacion-api.json](evidencias/favoritos/verificacion-api.json): TypeScript y lint aprobados, 322 pruebas móviles (42 nuevas), cuatro pruebas existentes del servicio backend, Doctor 21/21 y exportaciones Android/web aprobadas. Las pruebas HTTP aisladas emplean un servidor y almacenamiento simulados; no acreditan escrituras en MongoDB real ni SecureStore nativo. La QA visual se identifica como web y comprobó guardar, quitar, vacío, errores, reintento y aislamiento visual de sesión a 320/397 px. La API real respondió saludable y rechazó Favoritos sin Bearer con 401; no se escribieron favoritos de cuentas reales. Ruta QA y servidor aislado se retiraron antes de exportar.

El [PR #10, Implementar Favoritos con MVVM y Repository](https://github.com/David567rs/INHALEX-Movil/pull/10) quedó abierto por ZenaidaGR hacia `develop`, desde `feature/favoritos`, con revisión solicitada a David567rs. El commit de implementación publicado al abrirlo es `8dbd613d3c6b470fb52370c65a4c7d3d54b16a26`. La [evidencia de apertura](evidencias/favoritos/preparacion-pr10.json) conserva autoría, ramas y solicitud real de revisión. La aprobación e integración están pendientes. Consultar checks sobre el HEAD vigente en GitHub; las comprobaciones locales no sustituyen la CI ni la revisión real.
