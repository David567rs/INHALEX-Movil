import type { MoreDocument } from '../../domain/models/MoreContent';

// Text from the reviewed DOCX drafts. Keep publication requirements visible until implemented.
export const legalDrafts: readonly MoreDocument[] = [
  {
    "updatedAt": "8 de noviembre de 2026",
    "sections": [
      {
        "paragraphs": [
          "Este aviso describe los datos utilizados por la app móvil INHALEX y los medios para ejercer tus derechos. El promotor confirmó los datos de contacto y el carácter comercial de la app. Es un borrador para validar las decisiones operativas y las funciones señaladas al final, antes de publicarlo como aviso definitivo."
        ],
        "title": "Antes de continuar"
      },
      {
        "paragraphs": [
          "INHALEX S.A.S. de C.V. es el responsable del tratamiento de los datos personales descritos en este aviso. Domicilio: Palo de Rosa núm. 20, colonia Fovissste, Huejutla de Reyes, Hidalgo, C. P. 43000, México. Contacto de privacidad y atención: danielcruzhernandezinhalex@gmail.com. Teléfono de atención: +52 771 203 4573.",
          "El aviso cubre la cuenta, el catálogo, los favoritos, la bolsa, los pedidos, las direcciones, el perfil, los avisos, las reseñas y la confirmación de recepción en la app. Los servicios externos que abras desde un enlace pueden tener sus propios avisos. La identidad jurídica y los registros corporativos no han sido verificados documentalmente en esta revisión."
        ],
        "title": "Responsable y alcance"
      },
      {
        "paragraphs": [
          "Cuenta y acceso. Nombre, apellidos, correo, teléfono, identificador de cuenta y credenciales de acceso. El servidor conserva un hash de la contraseña. No debes compartir tu contraseña con atención al cliente.",
          "Direcciones. Etiqueta, destinatario, teléfono, calle, números exterior e interior cuando corresponda, colonia, municipio, estado, código postal, referencias y dirección principal. La dirección se escribe en el formulario; no equivale a obtener la ubicación GPS del dispositivo.",
          "Preferencias y pedidos. Productos guardados en favoritos, contenido y cantidades de la bolsa, productos y precios del pedido, subtotal, datos de contacto, dirección seleccionada, nota opcional, referencia, estados y fechas. Una copia de la dirección queda asociada al pedido para identificar el destino utilizado.",
          "Recepción y avisos. Confirmación de recepción y su fecha, incidencias vinculadas cuando existan, avisos de la cuenta y de los pedidos y su estado de lectura.",
          "Reseñas y contacto. Producto, pedido habilitante, estrellas, comentario, autor y fecha de la reseña. Las consultas enviadas al correo de contacto incluyen la dirección del remitente y la información que este decida aportar.",
          "La versión revisada no incorpora un formulario de tarjeta o una pasarela de pago en el flujo de creación de pedido. No incluyas datos bancarios, documentos de identidad, información médica ni información de terceros en reseñas o notas."
        ],
        "title": "Datos que utiliza la app"
      },
      {
        "paragraphs": [
          "Los datos se utilizan para crear y autenticar la cuenta, recuperar la sesión, mostrar y actualizar el perfil, administrar direcciones y preferencias, registrar y consultar pedidos, preparar y gestionar su entrega, atender incidencias, identificar su recepción, entregar avisos y verificar la posibilidad de reseñar un producto. Si faltan datos necesarios para una operación, esa operación puede no completarse; los campos opcionales deben identificarse en el formulario.",
          "El tratamiento se sujetará a la legislación mexicana aplicable y al consentimiento o a la excepción legal que corresponda a cada finalidad. El uso de la app no sustituye los consentimientos específicos que resulten necesarios. Esta propuesta no autoriza campañas de publicidad, venta de datos ni elaboración de perfiles con información de salud. Cualquier finalidad adicional deberá informarse y, cuando proceda, consentirse por separado."
        ],
        "title": "Finalidades y visibilidad de la información"
      },
      {
        "paragraphs": [
          "El nombre del autor, las estrellas, el comentario y la fecha se muestran públicamente junto al producto. Otras personas pueden verlos sin iniciar sesión. La respuesta pública de reseñas no muestra tu correo ni la referencia de tu pedido; esos datos permanecen vinculados internamente para verificar la autoría y la compra.",
          "Actualmente el nombre público se toma del perfil y, si falta, puede derivarse del texto anterior a la arroba del correo. Antes del lanzamiento debe eliminarse esa sustitución y mostrarse al usuario el nombre que se publicará. Esta corrección y el aviso previo a publicar son pendientes de implementación, no funciones ya disponibles."
        ],
        "title": "Qué se publica cuando envías una reseña"
      },
      {
        "paragraphs": [
          "El funcionamiento requiere servicios de servidor y base de datos. La configuración contempla almacenamiento de respaldos y monitoreo técnico opcionales. Deben confirmarse los proveedores activos, los países de tratamiento, los datos que reciben y su función antes de completar esta sección. La presencia de un servicio en el código no acredita que esté activo en producción.",
          "Mercado Pago es el proveedor de cobro previsto, pero aún no está integrado en este flujo. Antes de activarlo se informarán los datos enviados y recibidos y su tratamiento. También deben definirse los datos mínimos que recibirán los prestadores de entrega. Las comunicaciones a autoridades procederán en los supuestos legales. Las remisiones a encargados y las transferencias a terceros deben distinguirse y documentarse; no se presume que toda comunicación esté exenta de consentimiento."
        ],
        "title": "Proveedores y destinatarios"
      },
      {
        "paragraphs": [
          "En el dispositivo se guarda el token de sesión mediante almacenamiento seguro nativo. También puede conservarse información privada de recuperación de un intento de pedido para evitar duplicados. Cerrar sesión y desinstalar la app no equivalen a borrar los registros que conserva el servidor.",
          "El código exige HTTPS para la API de distribución y utiliza contraseñas con hash y solicitudes autenticadas. La configuración desplegada y los respaldos todavía deben verificarse. No se han acreditado certificaciones, auditorías externas ni cifrado integral de toda la base de datos. Los permisos y SDK del archivo Android final se revisarán antes de declarar datos técnicos, analítica, publicidad o ubicación en Google Play."
        ],
        "title": "Dispositivo y seguridad"
      },
      {
        "paragraphs": [
          "Puedes dirigir una solicitud al correo danielcruzhernandezinhalex@gmail.com, con el asunto «Privacidad INHALEX». Indica tu nombre, un medio para recibir la respuesta, el derecho que deseas ejercer y una descripción que permita localizar los datos. Para rectificar información, explica el cambio y aporta el sustento pertinente.",
          "Se verificará tu identidad o representación mediante un procedimiento proporcional. No envíes de inicio una identificación completa ni tu contraseña; el responsable debe indicar qué evidencia mínima necesita y un canal adecuado para recibirla. También puedes solicitar la revocación del consentimiento o la limitación del uso o divulgación, considerando las obligaciones legales que resulten aplicables.",
          "La determinación sobre una solicitud ARCO se comunicará en los plazos del artículo 31 de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares: hasta veinte días desde la recepción; si procede, se hará efectiva dentro de los quince días siguientes a la comunicación. La ley permite una ampliación por una sola vez y por un periodo igual cuando las circunstancias lo justifiquen. Deben atenderse los requisitos y excepciones legales del caso."
        ],
        "title": "Acceso rectificación cancelación y oposición"
      },
      {
        "paragraphs": [
          "La versión auditada no tiene una política general automatizada de eliminación ni una opción específica para eliminar la cuenta. Por tanto, no se anuncia una eliminación inmediata o automática. El correo anterior es el contacto de privacidad confirmado, pero el procedimiento de atención y borrado todavía requiere definición y prueba.",
          "Criterio propuesto para adopción: conservar datos de cuenta mientras sean necesarios para prestar el servicio; al solicitar su eliminación, suprimir o disociar los datos que ya no deban mantenerse. Los registros indispensables para obligaciones legales o reclamaciones se conservarían con acceso restringido durante el plazo aplicable, sin reutilizarlos para otros fines. Deben fijarse los plazos por categoría, el tratamiento de reseñas públicas y la depuración de respaldos antes de publicar esta política."
        ],
        "title": "Conservación y eliminación"
      },
      {
        "paragraphs": [
          "Propuesta de alcance: servicio de compras dirigido a personas adultas. Debe alinearse la declaración de audiencia y el funcionamiento de la app con esta decisión; escribirlo aquí no implementa un control de edad. Los cambios del aviso deben identificarse mediante fecha y versión y comunicarse antes de aplicar nuevas finalidades cuando así corresponda."
        ],
        "title": "Menores y cambios del aviso"
      },
      {
        "paragraphs": [
          "Designar quién atiende privacidad; verificar proveedores, países y tratamiento de Mercado Pago; adoptar plazos de conservación; implementar y probar la solicitud de eliminación en la app y en una página web; definir el nombre público de las reseñas y los controles para menores. Publicar después una versión HTML accesible y coherente con Seguridad de los datos. La guía adjunta contiene la evidencia y fuentes utilizadas."
        ],
        "title": "Pendientes para convertir este borrador en aviso público"
      }
    ],
    "statusLabel": "Texto en revisión",
    "title": "Política de privacidad",
    "id": "privacidad"
  },
  {
    "updatedAt": "8 de noviembre de 2026",
    "sections": [
      {
        "paragraphs": [
          "Estos términos propuestos regulan el uso de la app y la solicitud de pedidos reales de productos INHALEX. La redacción conserva los derechos de las personas consumidoras. Requiere validación del responsable y completar las reglas comerciales pendientes antes de utilizarse para contratar con el público."
        ],
        "title": "Antes de continuar"
      },
      {
        "paragraphs": [
          "El servicio es operado por INHALEX S.A.S. de C.V. Domicilio: Palo de Rosa núm. 20, colonia Fovissste, Huejutla de Reyes, Hidalgo, C. P. 43000, México. Correo de atención: danielcruzhernandezinhalex@gmail.com. Teléfono: +52 771 203 4573. El horario y plazo de respuesta siguen por definir; no se anuncia atención permanente."
        ],
        "title": "Identidad y atención"
      },
      {
        "paragraphs": [
          "La app permite consultar productos, organizar favoritos y bolsa, registrar direcciones, solicitar pedidos, revisar su seguimiento, confirmar la recepción cuando corresponda y publicar reseñas de compras habilitadas. Proponemos reservar la contratación a personas adultas con capacidad para realizarla. El usuario debe proporcionar información correcta y mantener privadas sus credenciales.",
          "La aceptación de estos términos deberá registrarse mediante una acción expresa antes de contratar o publicar una reseña. Ese registro aún debe implementarse. La política de privacidad se informa por separado; aceptar los términos no implica autorizar publicidad ni tratamientos adicionales de datos."
        ],
        "title": "Cuenta y uso del servicio"
      },
      {
        "paragraphs": [
          "Antes de enviar la solicitud, revisa los productos, cantidades, precios mostrados, subtotal, contacto y dirección. La app solicita una dirección y los datos requeridos. Al confirmar, crea una referencia con estado «En revisión» y actualiza la bolsa. Esa referencia acredita el registro de la solicitud en el sistema; no es comprobante de cobro ni factura.",
          "El estado «En revisión» indica que la solicitud está pendiente de revisión. Los cambios posteriores se consultan en Historial y Seguimiento. La disponibilidad definitiva, el importe final y el momento de aceptación comercial deberán informarse de manera clara. No deben atribuirse a un estado funciones de pago o entrega que el sistema no haya comprobado."
        ],
        "title": "Cómo se registra un pedido"
      },
      {
        "paragraphs": [
          "Los importes de la app se presentan en pesos mexicanos. El subtotal mostrado no debe presentarse como total final si faltan costos de envío u otros cargos aplicables. Antes de contratar deberán mostrarse el precio total, impuestos incluidos y cualquier gasto adicional, así como el método de pago autorizado.",
          "El medio de cobro elegido por INHALEX es Mercado Pago. Su integración todavía está pendiente: la versión revisada registra pedidos, pero no procesa ese pago. Solo podrá anunciarse como disponible después de implementar y verificar la operación y su confirmación en el servidor. No se admitirán solicitudes de pago por medios no autorizados. Nunca envíes datos completos de tarjeta o contraseñas por reseñas, notas o correo de soporte."
        ],
        "title": "Precios y pagos"
      },
      {
        "paragraphs": [
          "INHALEX prevé entregas en municipios y localidades cercanos a Huejutla de Reyes, Hidalgo. Dentro de esa cobertura, el envío es gratuito cuando el subtotal de productos sea igual o superior a $600.00 MXN; para un subtotal menor, cuesta $90.00 MXN. No se ofrece cobertura nacional. La lista exacta de localidades o códigos postales y el prestador de entrega deben confirmarse antes del lanzamiento.",
          "El plazo comunicado por INHALEX es de 2 a 5 días hábiles. Se propone contarlo desde la confirmación del pago y del pedido; ese punto de inicio debe aprobarse antes de publicarlo. La app debe validar cobertura y mostrar costo de envío, total y plazo antes de la aceptación. Si necesitas corregir el destino, contacta a atención con la referencia.",
          "En la app, «Confirmar recepción» está disponible para pedidos habilitados por el sistema. Úsalo únicamente cuando hayas recibido el pedido y revisado su contenido. La confirmación registra el hecho y su fecha, y evita volver a confirmar la misma recepción. No elimina los derechos que correspondan por defectos, faltantes u otros incumplimientos."
        ],
        "title": "Entrega y recepción"
      },
      {
        "paragraphs": [
          "Para solicitar una cancelación o comunicar un producto incorrecto, faltante, dañado o defectuoso, escribe a danielcruzhernandezinhalex@gmail.com e indica la referencia y el motivo. No incluyas datos bancarios o información sensible innecesaria. Se debe habilitar un procedimiento de atención y proporcionar instrucciones de devolución y seguimiento cuando correspondan.",
          "Política propuesta para aprobación: si recibes un producto dañado, en mal estado o con un aroma diferente al solicitado, podrás pedir una reposición correcta o un reembolso, conforme a los derechos aplicables. INHALEX asumirá los gastos razonables de recolección, devolución y nuevo envío que resulten de esa incidencia. No se impondrá un cupón como única solución.",
          "Conserva el producto y el empaque si es posible y comparte fotografías que ayuden a identificar el problema; no será obligatorio un video de apertura ni se rechazará automáticamente una reclamación por falta de empaque. No devuelvas a una dirección no confirmada: atención deberá coordinar el procedimiento. No uses un producto si adviertes deterioro.",
          "El reembolso se tramitaría por el medio de pago original una vez habilitado. El plazo de gestión de INHALEX y el de acreditación de Mercado Pago deben verificarse e informarse; no se fija aquí un plazo inventado. Los cambios por preferencia personal, cuando el aroma entregado sea el solicitado, requieren una regla distinta, sin limitar derechos legales. No se establece un límite de cuarenta y ocho horas que extinga reclamaciones.",
          "Cuando proceda la revocación de una compra a distancia, se respetará el artículo 56 de la Ley Federal de Protección al Consumidor y sus condiciones. El procedimiento definitivo debe distinguir esa revocación, las reclamaciones por incumplimiento y los cambios voluntarios ofrecidos por la empresa. No se afirma que exista adhesión a Concilianet ni un convenio con PROFECO sin comprobarlo."
        ],
        "title": "Cancelaciones cambios y devoluciones"
      },
      {
        "paragraphs": [
          "Puedes publicar una reseña por producto y cuenta cuando tengas un pedido Completado que incluya ese producto. Esta habilitación depende del estado del pedido, no de la confirmación de recepción.",
          "El nombre del autor, las estrellas y el comentario son públicos junto al producto. Conservas la autoría de tu texto. Se propone autorizar de forma no exclusiva su almacenamiento, visualización y moderación para operar las reseñas, sin uso publicitario independiente implícito.",
          "Contenido admitido. Experiencias auténticas sobre el producto, redactadas con respeto. Las críticas negativas no deben eliminarse por el solo hecho de ser negativas.",
          "Contenido no admitido. Amenazas, acoso, discriminación, contenido sexual, datos privados de otras personas, suplantación, publicidad no solicitada, reseñas compradas o manipuladas, contenido ilegal y afirmaciones médicas engañosas.",
          "Propuesta de moderación: revisar denuncias, retirar contenido que incumpla estas reglas de forma motivada y aplicar medidas proporcionales a cuentas infractoras, con un canal de aclaración. La app todavía necesita mecanismos de denuncia y bloqueo y un responsable operativo; estas capacidades no se anuncian como disponibles en esta versión de trabajo."
        ],
        "title": "Reseñas y reglas de la comunidad"
      },
      {
        "paragraphs": [
          "Consulta la presentación, composición, indicaciones y precauciones de cada producto. Las fotografías no sustituyen esa información. La app presenta experiencias aromáticas; no ofrece diagnóstico ni atención médica ni respalda promesas de tratar, curar o prevenir enfermedades sin evidencia y autorización aplicables. Las descripciones e imágenes deben ser coherentes con este alcance."
        ],
        "title": "Descripción y uso de los productos"
      },
      {
        "paragraphs": [
          "Los contenidos propios de INHALEX se ofrecen para consultar productos y utilizar el servicio. No debes acceder sin autorización a otras cuentas, alterar pedidos, extraer datos personales, interferir con el sistema o usar contenidos de terceros sin derecho. Esta cláusula no limita los usos permitidos por ley ni atribuye registros de marca no verificados."
        ],
        "title": "Propiedad intelectual y uso responsable"
      },
      {
        "paragraphs": [
          "Una interrupción técnica no confirma ni cancela una compra. Ante una respuesta incierta, consulta Historial o atención antes de repetir el pedido. Los cambios de términos se identificarán por fecha y se comunicarán cuando corresponda, respetando las operaciones anteriores.",
          "Se aplica la legislación mexicana de consumo y privacidad. Estos términos no excluyen responsabilidad irrenunciable ni impiden acudir a las autoridades competentes. No se impone un tribunal exclusivo."
        ],
        "title": "Disponibilidad cambios y controversias"
      },
      {
        "paragraphs": [
          "Concretar localidades y prestador de entrega, inicio del plazo de envío, horario de atención, momento de aceptación, impuestos y facturación. Aprobar y operar la política de incidencias y sus plazos de reembolso, así como la moderación. Implementar Mercado Pago y el cálculo de envío y total antes de ofrecer cobros reales. Los textos, interfaz y backend deben coincidir; la guía adjunta establece el orden de trabajo."
        ],
        "title": "Decisiones pendientes antes de publicar"
      }
    ],
    "statusLabel": "Texto en revisión",
    "title": "Términos y condiciones",
    "id": "terminos"
  }
];
