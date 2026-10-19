# Diseño de Perfil del usuario

> Etapa histórica de diseño. El usuario ya la aceptó; el estado actual es la [conexión a la API](CONEXION-PERFIL-USUARIO.md), 1/10 pendiente de aceptación funcional. Las muestras y los resultados siguientes conservan el contexto de la etapa visual.

Etapa visual en `C:\Users\David\Documents\INHALEX-Movil`, rama `feature/perfil-usuario`, creada desde `develop` en `559a15464e7cd778b2956b6e217855e5d26a77b0`. David567rs es responsable y ZenaidaGR revisará el futuro PR a `develop`. Bolsa quedó integrada y completa, 10/10, con el [PR #11](https://github.com/David567rs/INHALEX-Movil/pull/11); su [evidencia de integración](evidencias/bolsa-compras/integracion-pr11.json) conserva revisión y CI reales.

## Alcance visual

La ruta `/perfil-usuario`, accesible desde **Perfil del usuario** en Cuenta, presenta `ProfilePreviewScreen` con **Vista previa** y **Datos de ejemplo para revisar el diseño.** El acceso tiene la etiqueta accesible **Ver diseño de perfil**. El resumen organiza **Información personal** y **Datos de contacto**, con avatar **VF**, Valeria Flores, `valeria@example.test` y teléfono `5512345678`. Son datos sintéticos y no el perfil de la sesión actual. En esta etapa, el acceso al ejemplo también está disponible desde Cuenta sin iniciar sesión.

**Editar datos de ejemplo**, con etiqueta accesible **Revisar diseño de edición de perfil**, abre el formulario **Editar tus datos**. Nombres, Apellidos y Teléfono permiten escribir únicamente en un borrador en memoria. El correo es de solo lectura. **Cancelar** descarta ese borrador, restaura los datos de ejemplo y vuelve al resumen. **Guardar cambios** permanece deshabilitado, sin acción asociada. Escribir en la muestra no valida campos ni edita datos de un usuario real.

Se conservan las cinco pestañas, la identidad INHALEX y la sesión actual. Esta etapa no consulta ni modifica perfiles en la API, no guarda ni persiste el borrador, no añade validación funcional y no cambia autenticación, backend ni dependencias.

## MVVM y Repository

`ProfilePreviewScreen → useProfilePreviewViewModel → ReadProfilePreview → ProfilePreviewRepository → LocalProfilePreviewRepository`

El dominio define el modelo, el contrato de solo lectura y el caso de uso. El Repository local aporta la muestra y bootstrap compone las dependencias. El ViewModel mantiene el modo resumen/edición y el borrador temporal; la vista representa ese estado y comunica las acciones. El contrato se limita al diseño y no establece el de la futura conexión al perfil real.

## Criterios de Trello: 0/10

La captura del usuario contiene exactamente estos diez criterios, todos pendientes:

- [ ] Crear pantalla de perfil
- [ ] Obtener datos del usuario desde la API
- [ ] Mostrar información personal
- [ ] Permitir editar datos autorizados
- [ ] Validar campos modificados
- [ ] Guardar cambios mediante la API
- [ ] Mostrar confirmación de actualización
- [ ] Manejar errores de conexión
- [ ] Probar la funcionalidad
- [ ] Revisar el código

Perfil permanece **0/10**, con aceptación del diseño en Expo Go pendiente. Solo después de que el usuario apruebe el diseño podrá aceptarse el criterio 1, **Crear pantalla de perfil**. Los datos sintéticos y el borrador no completan los criterios de información personal, edición autorizada, validación o guardado. El agente no ha leído ni modificado Trello.

## Revisión visual prevista

Reutilizar Metro de David en `8082` y su QR. Si no está activo, desde la raíz de esa copia:

```sh
npm --prefix Mobile run start -- --port 8082
```

1. Abrir Cuenta → **Perfil del usuario**; comprobar **Vista previa**, **Datos de ejemplo para revisar el diseño.**, las secciones **Información personal** / **Datos de contacto** y los datos de Valeria Flores.
2. Pulsar **Editar datos de ejemplo**, revisar el encabezado **Editar tus datos** y escribir en Nombres, Apellidos y Teléfono. Comprobar que el correo es de solo lectura y **Guardar cambios** está deshabilitado.
3. Pulsar **Cancelar**, comprobar el resumen original y volver a editar para verificar que el borrador anterior se descartó.
4. Volver a Cuenta y comprobar que las cinco pestañas y el estado previo de sesión siguen disponibles.

La [verificación propia](evidencias/perfil-usuario/verificacion-diseno.json) registra TypeScript, lint, 369/369 pruebas existentes, Doctor 21/21 y exportaciones Android (1463 módulos) / web (1011 módulos) correctos sobre este diseño. No se agregaron pruebas que reflejen únicamente la implementación visual. La QA web a 320×850 y 397×900 comprobó resumen, escritura del borrador, correo de solo lectura, Guardar deshabilitado, Cancelar con restauración y regreso a Cuenta con cinco pestañas, sin desbordamiento horizontal. Se corrigió la distribución del nombre en la composición compacta. Las capturas están en la misma carpeta de evidencia.

Esta verificación corresponde a Perfil y no reutiliza resultados históricos. La QA web y la muestra no sustituyen la aceptación visual en Expo Go ni prueban consulta, autorización, validación, actualización o persistencia de un perfil real. El teclado nativo, TalkBack y texto ampliado no se comprobaron físicamente. Ambas configuraciones de servidor, los servicios, las identidades y el stash de Zenaida se conservaron; su copia permanece limpia en `develop`.

Los cambios de Perfil permanecen locales, sin commit, publicación de rama ni PR. Se conserva el orden: diseño → aceptación del usuario → conexión y comportamiento real → pruebas → PR a `develop` → revisión del compañero → integración.
