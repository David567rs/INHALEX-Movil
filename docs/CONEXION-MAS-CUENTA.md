# Más: contenido público, contacto y solicitudes de eliminación

8 de noviembre de 2026. Copia de David, rama `codex/diseno-mas-cuenta`. El usuario aceptó el diseño de Más y sus apartados en Expo Go y autorizó completar la sección. Esta entrega conserva el diseño, MVVM, Repository y commits por etapa. La aceptación de diseño no equivale a aceptar los nuevos recorridos de red o solicitudes.

## Alcance implementado

- Más consulta la información de la empresa, preguntas frecuentes, contacto y documentos mediante `GET /api/company-content/mobile`, sin sesión ni token.
- Actualizar y Reintentar conservan el contenido visible. Si falla la primera consulta, se presenta la versión incluida en la app y un aviso; después de una consulta correcta se conserva la última versión válida en memoria. No se guardan datos personales en esa copia de contenido.
- Privacidad y términos disponen de páginas HTML públicas, legibles sin JavaScript, en `/api/company-content/privacy` y `/api/company-content/terms`. Son rutas preparadas en el backend local, todavía no URLs publicadas.
- Cuenta y Más → Legal permiten abrir Eliminar cuenta. También se ofrece el acceso desde Privacidad. La pantalla permite consultar y registrar una solicitud propia mediante contraseña actual y la palabra ELIMINAR.
- El formulario público `/api/account-deletion` permite solicitarla sin instalar la app ni disponer de una sesión previa. Se verifica correo y contraseña y se ofrece el contacto confirmado como alternativa cuando no sea posible ingresar.
- El recibo indica **Solicitud recibida / Pendiente de atención**. Una solicitud repetida conserva la referencia. No se anuncia ni se ejecuta una eliminación inmediata.
- Las reseñas públicas muestran solamente el primer nombre o «Cliente INHALEX»; ya no se usa el prefijo del correo como nombre alternativo. La normalización al leer también cubre nombres antiguos almacenados, sin migrar registros reales.

Correo y teléfono siguen abriendo la aplicación correspondiente solo por acción del usuario; no se envían mensajes ni se realizan llamadas automáticamente. Si no hay aplicación disponible, los datos permanecen seleccionables. El domicilio se puede copiar; no se incorporó apertura de mapas.

## Contrato y arquitectura

La fuente editorial incluida en `Mobile/src/features/more/data/content` genera un snapshot mediante `node scripts/sync-mobile-company-content.cjs`. `node scripts/sync-mobile-company-content.cjs --check` detecta desajustes. El contrato tiene `schemaVersion: 1`, `revision: 2026-11-08.2` y `content`. Las vistas solo reciben contenido validado del caso de uso; el Repository valida campos, límites y revisión, rechaza retrocesos, agrupa lecturas simultáneas y conserva la última respuesta correcta.

El snapshot móvil está separado del documento web antiguo de MongoDB. No se sobrescribe la información existente del sistema original. El formulario administrativo antiguo **no edita este snapshot**: para actualizarlo se cambia la fuente revisada, se incrementa la revisión, se regenera y se despliega el backend por el flujo habitual. No existe aquí un nuevo editor de contenido.

`createMoreAction` compone el caso de uso con el Repository de API. El ViewModel administra carga, avisos, actualización y acordeón; la vista no conoce HTTP. Las páginas HTML usan el mismo snapshot y escapan su texto.

El módulo de eliminación tiene contrato de dominio, Repository HTTP, controlador de estado independiente de React, Provider y pantalla. La composición usa la sesión de autorización existente, sin exponer el JWT a las vistas. Al cerrar o cambiar sesión se cancela la operación y se ocultan los datos anteriores; las respuestas tardías no se aplican a otra sesión. La contraseña no se conserva en snapshots ni almacenamiento y el formulario la limpia al enviar o perder el foco.

Si falla una escritura, **Verificar solicitud** consulta primero el resultado. Verificar no reenvía la solicitud automáticamente. Solo si no hay solicitud registrada se permite un nuevo envío explícito. La reautenticación y el bloqueo de operaciones también se verifican en backend.

Contrato, cola administrativa y responsabilidades: [Operación de solicitudes de eliminación](OPERACION-SOLICITUDES-ELIMINACION.md).

## Información confirmada y límites

Responsable: INHALEX S.A.S. de C.V. Contacto: `danielcruzhernandezinhalex@gmail.com`, `+52 771 203 4573`, Palo de Rosa núm. 20, colonia Fovissste, Huejutla de Reyes, Hidalgo, C. P. 43000. El usuario confirmó que el responsable de INHALEX atenderá las solicitudes por ese correo.

Los documentos siguen identificados **Texto en revisión**. Las solicitudes se registran y se consultan, pero no hay borrado, anonimización, desactivación, correo automático, pantalla operativa ni endpoint de cierre. El responsable debe revisar la cola mediante el acceso administrativo descrito en la guía. Falta definir conservación y ejecutar un proceso revisado de atención y cierre. Guardar una solicitud no prueba que alguien la haya atendido.

Los originales DOCX, documentos de la web, pedidos, cuentas y datos de clientes no se modificaron. Mercado Pago y el cálculo comercial del envío no se implementan en esta etapa. La copia de Zenaida, los servicios abiertos y los archivos de dependencias se conservan.

## Verificación técnica

Registro estructurado: [evidencia de comprobaciones locales](evidencias/mas-cuenta/verificacion-conexion.json). No incluye aceptación nativa ni publicación.

| Comprobación | Resultado local |
| --- | --- |
| `npm run test:mobile` | 886/886 aprobadas, 0 fallidas, 0 omitidas |
| `npm run typecheck:mobile` | Correcto |
| `npm run lint:mobile` | Correcto |
| `npm run build:server` | Correcto |
| `npm run test:server` | 22 suites, 234/234 aprobadas |
| `npm run test:e2e:server` | 1 prueba de salud, base simulada, aprobada |
| ESLint sobre todos los archivos TypeScript nuevos/modificados del backend | Correcto |
| `npm run lint:server` | No pasa: 408 errores y 36 avisos en 48 archivos no modificados por esta etapa |
| Snapshot de contenido y `git diff --check` | Correctos |

El lint general se diagnosticó con salida JSON: ninguno de los archivos nuevos/modificados figura entre los archivos con hallazgos. No se corrigieron ni ocultaron problemas anteriores ajenos a esta entrega. La CI remota no se ejecutó porque no se publicó la rama.

Las pruebas de las nuevas rutas HTTP, autenticación, cola, formulario público y clientes usan dependencias simuladas. No se creó una solicitud real, no se modificó MongoDB, no se borró una cuenta y no se inició Expo o un servidor persistente. Los tests HTTP usan instancias de Nest aisladas que se cierran al terminar. La revisión de arquitectura y contenido fue independiente; no sustituye ver la interfaz nueva en el teléfono.

## Aceptación en Expo Go y recorrido restante

El 8 de noviembre de 2026 el usuario informó: «Más actualizó sin errores y pude abrir Empresa, Preguntas frecuentes, Contacto, Privacidad y Términos». Se acepta la actualización visible y la apertura de esos cinco apartados según su reporte. No equivale a inspección HTTP ni confirma todavía acordeones, enlaces externos, copia de datos, errores de conexión o eliminación. Registro: [aceptación de carga y apartados](evidencias/mas-cuenta/aceptacion-carga-expo-go.json). El siguiente paso es Contacto.

1. El usuario actualiza o reinicia su backend cuando decida cargar las rutas nuevas y recarga su propia sesión de Expo. Abrir Más y pulsar Actualizar información. Revisar Empresa, FAQ, Contacto, Privacidad y Términos; las FAQ deben abrir/cerrar y los textos deben coincidir con los aprobados.
2. Desde Contacto, comprobar correo y teléfono abriendo el compositor/marcador y regresar sin enviar ni llamar. El correo y domicilio completos deben poder seleccionarse. Probar Cuenta desde la cabecera de los cinco tabs y regresar al origen.
3. Con el backend detenido por el usuario, actualizar Más: debe conservar información y mostrar aviso. Recuperar el backend y reintentar: el aviso debe desaparecer. Verificar también una apertura fría sin API: aparece contenido incluido con aviso.
4. Sin sesión, abrir Más → Eliminar cuenta: debe mostrar información pública y acceso a Cuenta, sin datos de otra persona. Con sesión, comprobar carga, teclado, regreso y contraseña vacía. No registrar una solicitud con una cuenta personal para probar.
5. Con una cuenta de prueba expresamente destinada a esta operación, comprobar contraseña incorrecta, solicitud válida, recibo pendiente, doble toque, actualización, cierre y reapertura de sesión. El responsable debe verificar su aparición en la cola. La eliminación real no es parte de esta prueba.
6. Probar errores y respuesta perdida en entorno aislado: Verificar consulta el estado, conserva un recibo previo y nunca reenvía solo. Revisar formulario web y cabeceras en el despliegue de pruebas cuando exista.
7. Probar movimiento reducido, lector de pantalla, tamaños de texto y teclado en el teléfono. Registrar lo observado sin anticipar resultados.

## Antes de preparar una publicación pública

- Acordar los plazos y fundamentos reales de conservación, atención de solicitudes, devoluciones y proveedores; cerrar la revisión de privacidad y términos.
- Implementar y comprobar el procesamiento y cierre de eliminación, incluyendo datos vinculados y sistemas externos. El registro pendiente no completa ese proceso.
- Publicar y verificar las páginas en HTTPS estable y accesible; completar las URLs de Play Console y la declaración de seguridad de datos según el comportamiento real.
- Completar las obligaciones aplicables a reseñas públicas: aceptación de reglas, reporte, bloqueo y moderación. Reducir el nombre público no sustituye esos controles.
- Integrar y validar pagos, importes y condiciones comerciales antes de aceptar pedidos de pago reales.
- Completar la aceptación nativa y revisión por Zenaida antes de preparar el PR. Mantener los commits; no publicar ni fusionar por este documento.

Referencias oficiales consultadas: [eliminación de cuentas en Google Play](https://support.google.com/googleplay/android-developer/answer/13327111?hl=es), [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/). Estas referencias orientan las comprobaciones; no certifican aceptación en la tienda.
