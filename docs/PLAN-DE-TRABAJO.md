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

## Registro de usuario integrado

El backend y la base móvil se integraron mediante los PR #1 y #2. Registro se completó en `feature/registro-usuario` y se integró mediante el [PR #3](https://github.com/David567rs/INHALEX-Movil/pull/3), con aprobación de ZenaidaGR y merge de David567rs a `develop` en `7d308e351999eb9a1dfb8e36a5f331f050f8ce61`. Backend CI y Mobile CI pasaron. El usuario aprobó el diseño, las validaciones y la conexión de Registro en Expo Go.

Estado de los criterios de la tarjeta de Registro:

- [x] Diseñar pantalla de registro: aprobado en Expo Go.
- [x] Agregar campos requeridos: nombre, apellido, correo, teléfono, contraseña y confirmación.
- [x] Validar campos obligatorios.
- [x] Validar formato de correo.
- [x] Validar contraseña y su confirmación exacta.
- [x] Conectar con la API de INHALEX: POST `/api/auth/register`, probado con componentes Nest y MongoDB reales en entorno aislado.
- [x] Manejar registro correcto: confirmación solo después de respuesta válida y limpieza del formulario.
- [x] Mostrar mensajes de error: validación local, correo duplicado y fallos de API/conexión.
- [x] Probar la funcionalidad de registro: el usuario confirmó en Expo Go creación de cuenta y aviso de correo duplicado.
- [x] Revisar el código mediante el PR y la revisión real de ZenaidaGR; aprobado e integrado.

Las reglas puras permanecen en el dominio y el estado del formulario en el ViewModel. Correo utiliza la misma versión de `validator` que el backend; nombre, teléfono y contraseña siguen las reglas del DTO, sin recortar contraseñas. El caso de uso revalida los datos normalizados antes de enviarlos y excluye la confirmación de contraseña.

El recorrido es `RegisterScreen → useRegisterViewModel → RegisterUser → RegistrationRepository → ApiRegistrationRepository → HttpClient`. `bootstrap` compone las dependencias al primer envío. El mapeador convierte `_id` a `id`, conserva solamente los datos públicos requeridos y descarta el JWT. No se añade sesión ni navegación autenticada. El botón «Crear cuenta» bloquea nuevas pulsaciones y edición durante la petición; al abandonar la vista cancela la espera, sin asumir que el servidor deshizo una operación ya recibida. No hay reintentos automáticos de creación.

Comprobaciones de esta etapa:

- 50 pruebas móviles: URL/transporte, reglas de Registro, normalización, contrato del Repository, DTO, errores HTTP, red, timeout y cancelación.
- TypeScript, lint y exportaciones web y Android aprobados. Expo Doctor ya pasó 21/21 en la etapa de validaciones; esta etapa no añade dependencias.
- Nest con `AuthController`, `AuthService`, `UsersService` y `UserSchema` reales, MongoDB temporal separado de la instancia del usuario: 201, 409, 400, persistencia única y contraseña verificada con bcrypt (coste 12). No se cargó `AppModule` ni el `.env` del usuario.
- Interfaz web a 393 px contra esa API: éxito, carga con campos bloqueados, doble toque con una sola petición, 409 en correo, limpieza del error al corregirlo y salida durante la espera. Los estados y la conexión interrumpida tienen evidencia en `docs/evidencias/registro-usuario/`.
- Expo Go: el usuario confirmó que crea la cuenta y muestra el aviso de correo duplicado. La evidencia es su confirmación en el chat; las capturas del repositorio corresponden a web.

Los diez criterios están satisfechos (10/10). La tarjeta de Registro puede quedar «Terminado»; el estado de Trello lo actualiza el usuario. La evidencia de aprobación humana es la revisión de ZenaidaGR en el PR #3.

Comprobaciones de referencia, desde la copia de David y usando Git Bash o CMD:

1. Arrancar el backend habitual con `npm run dev:server` y la app con `npm run dev:mobile` en otra terminal, desde la raíz del repositorio.
2. Con teléfono y laptop en la misma red, abrir Cuenta → Crear cuenta. Usar un correo de prueba nuevo y confirmar que aparece «Tu cuenta está lista».
3. Repetir con el mismo correo: debe señalar que ya está registrado y permitir corregirlo sin perder el resto del formulario.
4. Probar una interrupción de conexión y verificar el mensaje sin cierre de la app ni reenvío automático. La creación puede haber llegado al servidor aunque se pierda la respuesta.
5. Verificar teclado, desplazamiento y lectura accesible en Android. La comprobación con lector de pantalla y la interrupción de conexión en Android siguen sin evidencia específica.

La revisión humana y la integración de Registro quedaron completadas mediante el PR #3.

Si Expo usa un túnel o el host LAN no se detecta, configurar únicamente `EXPO_PUBLIC_API_URL=http://<IPv4-de-la-laptop>:3200/api` en `Mobile/.env` y reiniciar Metro. Conservar las credenciales en `Server/.env`.

## Inicio de sesión: validaciones locales

El usuario autorizó actualizar ambas copias con `develop` y empezar solo el diseño de Inicio de sesión. La copia de David y la de Zenaida se actualizaron a `7d308e3`. En Zenaida se preservó el archivo local generado `Mobile/.gitignore` en un stash identificado como «respaldo local antes de actualizar develop»; la versión integrada ya contiene ese archivo. Su copia queda en `develop`, con dependencias móviles actualizadas. La copia de David continúa en `feature/inicio-sesion`, creada desde ese mismo commit.

Se adapta la presentación de `Proyecto-INHALEX/Mobile/inhalex-app/src/features/auth/presentation/screens/LoginScreen.tsx`, revisión `526a21e11da1cd1e3f6edea350c7731f90e205bf`: título «Bienvenido», correo, contraseña con mostrar/ocultar, botón «Entrar» y enlace «Crear cuenta». Se reutilizan `AuthScaffold` y `FormField` ya integrados; no se importa el ViewModel original ni su contexto de sesión.

La ruta es `/sign-in`. Cuenta ofrece «Iniciar sesión» y «Crear cuenta»; Registro enlaza a Inicio de sesión. Los enlaces entre los formularios usan `replace` para evitar acumular pantallas. El usuario aprobó el diseño y autorizó continuar con la validación local.

Las reglas de `domain/validation/loginValidation.ts` comprueban correo y contraseña obligatorios, correo válido con la misma biblioteca del backend y longitud de contraseña de 8 a 128 caracteres según `LoginDto`. La longitud se verifica con `validator/isLength`, incluyendo su tratamiento de Unicode; no se limita el input por unidades UTF-16 ni se recorta la contraseña. Una contraseña totalmente blanca se considera obligatoria como prevalidación adicional al DTO; los espacios de cualquier contraseña no blanca se conservan. No se exigen mayúsculas, números o símbolos para iniciar sesión. `useLoginViewModel` administra valores, campos visitados y resultado de validación. La pantalla muestra errores por campo, solicita foco al primero inválido después de renderizar y permite corregirlos. El botón «Validar datos» solo comprueba el formato; no verifica credenciales ni cambia la sesión.

Estado de la tarjeta de Inicio de sesión (el usuario actualiza Trello):

- [x] Diseñar pantalla de inicio de sesión: aprobado por el usuario.
- [x] Agregar campos de usuario/correo y contraseña: correo y contraseña aprobados por el usuario.
- [x] Validar campos obligatorios: implementado junto con formato de correo y longitud de contraseña; pendiente de comprobación en Expo Go.
- [ ] Conectar con la API de INHALEX.
- [ ] Manejar inicio de sesión correcto.
- [ ] Mostrar mensaje cuando las credenciales sean incorrectas.
- [ ] Guardar la sesión de forma segura, coordinado con la actividad propia de Persistencia.
- [ ] Probar la funcionalidad completa.
- [ ] Revisar el código mediante el PR y la revisión del compañero.

Verificación de diseño: TypeScript, lint, las 50 pruebas existentes, Expo Doctor 21/21 y exportaciones web/Android aprobados. Se comprobó en web a 393 y 320 px: edición de campos, máscara y alternancia de contraseña, botón deshabilitado, navegación Cuenta → Inicio de sesión ↔ Registro → Cuenta y desplazamiento sin desbordamiento horizontal. La comprobación visual es web; teclado y lector de pantalla Android requieren revisión en dispositivo. Las capturas están en `docs/evidencias/inicio-sesion/`.

Verificación de validaciones: 61 pruebas aprobadas (11 nuevas de Login), TypeScript, lint, Expo Doctor 21/21 y exportaciones web/Android. La comprobación web cubrió campos vacíos, errores al salir del campo, correo inválido, contraseña corta, corrección progresiva, foco al primer inválido, resultado válido con contraseña sin reglas fuertes y eliminación del resultado anterior al editar. Enter ejecuta la validación y conserva el foco si la contraseña no es válida; el caso web utiliza compatibilidad de `blurOnSubmit` porque React Native Web todavía no aplica `submitBehavior`. En Android se utiliza `submitBehavior` y queda pendiente la prueba del teclado en dispositivo. Se comprobó ausencia de desbordamiento horizontal en los tamaños de teléfono usados, y la navegación a Registro reinicia los valores y errores de Login. La evidencia está en `validacion-verificacion.json` y las capturas de la misma carpeta.

El siguiente paso es comprobar las validaciones en Expo Go: campos vacíos, correo inválido, contraseña corta, corrección y resultado local válido. Después se incorporará la conexión a la API en esta misma rama cuando el usuario indique avanzar. El único PR de Inicio de sesión se abrirá al completar la actividad. La tarjeta permanece «En progreso»; el usuario puede marcar el tercer criterio tras probar las validaciones.
