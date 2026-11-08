# Más y acceso superior a Cuenta

## Etapa de diseño — 8 de noviembre de 2026

Trabajo de David en `INHALEX-Movil`, rama local `codex/diseno-mas-cuenta`, desde `develop` `6e4cd77`. El usuario pidió solamente el diseño, manteniendo MVVM, Repository y commits por etapa. El usuario controla Expo y backend: no se inició, reinició ni detuvo ningún servicio. La copia de Zenaida no se modificó. No se publicó la rama ni se abrió un PR.

## Navegación y presentación

- Los cinco tabs son Inicio, Catálogo, Favoritos, Bolsa y Más. Cuenta pasa de `/(tabs)/cuenta` a `/cuenta`, fuera de la barra inferior.
- Los cinco tabs tienen un botón superior derecho de Cuenta, con área táctil de 48 × 48, etiqueta accesible y el mismo estilo. Más también incluye un acceso alternativo «Mi cuenta».
- Cuenta conserva su sesión y menú de Perfil, Direcciones, Historial, Seguimiento, Avisos, Reseñas y Recepción. Volver regresa a la pantalla de origen; si no hay historial, abre Más. Login, registro e Historial descartan las pantallas intermedias al regresar a Cuenta para evitar duplicarla.
- Más agrupa Ayuda, Conoce INHALEX y Legal. Sus páginas públicas permiten consultar preguntas frecuentes, contacto, empresa, privacidad y términos sin iniciar sesión.
- Preguntas frecuentes presenta un acordeón con una respuesta abierta a la vez. Contacto permite seleccionar los datos y abrir correo o teléfono mediante una acción explícita del usuario; no envía mensajes ni realiza llamadas automáticamente.
- Se reutilizan colores, iconos, animaciones de pulsación/aparición y preferencia de movimiento reducido existentes. Los textos largos se ajustan al ancho; el contenido y los controles comparten un desplazamiento, con zonas seguras.

## Fuentes del contenido

Las seis preguntas frecuentes se recuperaron del sistema web original, leyendo `C:\Users\David\Documents\Proyecto-INHALEX\Server\src\modules\company-content\data\default-company-content.ts` (también presentes en `Client/lib/company/default-company-content.ts`). Cubren elección de línea, imágenes, atención médica, políticas, contacto antes de comprar y consultas adicionales. Se adaptaron las referencias del pie web a Más y se usó el correo confirmado por el usuario. No se copió el contacto genérico antiguo ni se modificó la base del sistema web.

Se incorporaron los borradores revisados `01_Politica_de_privacidad_INHALEX_revisada.docx` y `02_Terminos_y_condiciones_INHALEX_revisados.docx`, de la carpeta `Documentos INHALEX/Revision movil 2026-11-08`, organizados por secciones. Los originales permanecen intactos. En la app se identifican como **Texto en revisión**, con fecha 8 de noviembre de 2026: son el contenido de esta vista de diseño, no una declaración de preparación para publicar en Google Play.

Empresa y Contacto usan la información revisada y confirmada: INHALEX S.A.S. de C.V., correo `danielcruzhernandezinhalex@gmail.com`, teléfono `+52 771 203 4573` y domicilio en Palo de Rosa núm. 20, colonia Fovissste, Huejutla de Reyes, Hidalgo, C. P. 43000. La redacción corporativa describe productos aromáticos sin promesas terapéuticas.

### Ampliación de Empresa solicitada por el usuario

El 8 de noviembre de 2026, el usuario volvió a proporcionar la imagen **Misión y Visión — INHALEX SAS DE CV** y pidió adaptar la información, explicar a qué se dedica la empresa y añadir innovación tecnológica. La pantalla ahora incluye presentación, **A qué nos dedicamos**, misión, visión, innovación tecnológica y los cuatro valores de la imagen: **Innovación**, **Calidad**, **Salud y bienestar**, y **Confianza y credibilidad**.

La actividad de desarrollo y comercialización de inhaladores aromáticos de uso personal se apoya en el contenido original del sistema web (`about` y descripción del responsable). La sede en Huejutla de Reyes procede del domicilio confirmado por el usuario. La innovación se explica con las funciones existentes: catálogo y búsqueda, favoritos, bolsa y direcciones, historial y seguimiento, avisos, reseñas y recepción. La misión y visión expresan propósitos; se adaptó la promesa de tratamiento seguro y eficaz de problemas de salud a bienestar cotidiano y elección informada, sin atribuir eficacia clínica, certificaciones ni fabricación propia. Tampoco se presenta Mercado Pago como integrado.

Los textos y los nuevos campos siguen en el Repository local y el modelo de dominio; la vista solo los presenta en tarjetas. No se cambiaron los documentos legales originales, la copia de Zenaida ni la web. TypeScript, lint y `git diff --check` se verificaron para esta ampliación; su lectura final en Expo Go queda pendiente del usuario. El agente no arrancó Expo.

## MVVM y Repository

`MoreContent` y `MoreRepository` definen el contrato de dominio. `LocalMoreRepository` entrega el contenido incluido en la app mediante `loadMoreContent`, compuesto en `createMoreAction`. Las rutas inyectan el caso de uso. `useMoreViewModel` administra carga, recuperación y acordeón; las vistas presentan el estado. El dominio no importa React Native ni HTTP.

`useMoreContactViewModel` controla la apertura de aplicaciones del dispositivo, bloquea pulsaciones concurrentes y presenta un mensaje si no hay aplicación disponible. Los datos siguen visibles y seleccionables. Ningún enlace abre una aplicación externa al cargar la pantalla.

Esta etapa no conecta Más con la API, no cambia autenticación o datos de clientes, no integra pagos, no implementa eliminación de cuenta y no modifica las reglas comerciales del backend. Las tareas pendientes de publicación siguen documentadas en los borradores revisados.

## Comprobaciones realizadas

- `npm run typecheck`: correcto.
- `npm run lint`: correcto.
- `npm test`: 861 aprobadas, 0 fallidas y 0 omitidas. Son las pruebas existentes; no equivalen a aceptación nativa de este diseño.
- `git diff --check`: correcto.
- Revisión web con el servidor que el usuario ya tenía abierto: Más y sus cinco destinos; acordeón; correo largo a 320 px; textos legales y empresa a 390 px; Cuenta sin sesión, acceso al login y regresos; Favoritos → Cuenta → Favoritos. No se introdujeron credenciales ni se enviaron mensajes o llamadas.
- Revisión independiente de arquitectura, accesibilidad estática y rutas. Se corrigió el regreso que podía acumular otra pantalla de Cuenta. TypeScript y lint se repitieron después de esa corrección.

## Siguiente prueba en Expo Go — pendiente del usuario

1. Recargar su propia instancia de Expo en la copia de David. Comprobar que el quinto tab dice Más.
2. Abrir Cuenta desde el icono superior en cada tab y volver. Debe regresar al tab de origen, conservando sus datos y filtros.
3. Dentro de Cuenta, abrir Perfil, Direcciones e Historial y regresar. Comprobar que no se repite Cuenta al pulsar Atrás.
4. En Más, abrir y cerrar distintas preguntas; abrir Contacto, Empresa, Privacidad y Términos; alcanzar el final y volver sin que se tape contenido.
5. En Contacto, comprobar que el correo y teléfono se leen completos y que sus botones abren la aplicación correspondiente. Cancelar allí; no es necesario enviar ni llamar.
6. Revisar con sesión y sin sesión: el contenido de Más debe seguir disponible; los datos personales continúan protegidos en Cuenta. Comprobar también login/registro → Cuenta → regreso y el botón Atrás de Android.

No marcar integración API, cumplimiento de Google Play, publicación ni revisión de PR con esta etapa. La aceptación del diseño en Expo Go todavía está pendiente.
