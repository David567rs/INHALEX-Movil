# Recuperación del inicio de sesión — 5 de noviembre de 2026

## Causa confirmada

El usuario pudo abrir la aplicación después de la corrección de arranque, pero reportó el mensaje «No pudimos confirmar el inicio de sesión». Este mensaje corresponde a una respuesta que no satisface el contrato del adaptador, diferente del error de conexión.

Una consulta local de solo lectura confirmó una cuenta activa con identificador, correo y nombre completo (`name`), pero sin `firstName`, `lastName` ni `phone`. No se consultaron contraseñas ni tokens. Los adaptadores móviles exigían esos tres campos para aceptar login, restauración y perfil. La aplicación original ya contemplaba campos personales ausentes en cuentas antiguas.

## Corrección local en ambas copias

- Un mapeador compartido admite el formato anterior solamente si conserva un identificador ObjectId válido, correo no vacío y nombre completo no vacío. Los campos presentes con tipos inválidos o valores vacíos siguen rechazándose.
- El nombre completo se conserva como `displayName`, solo para presentación. Los campos ausentes quedan vacíos en el formulario: no se inventan apellidos, nombres separados ni teléfono.
- Login, restauración de sesión y consulta de Perfil aplican la misma compatibilidad. El coordinador de sesión conserva únicamente los campos públicos autorizados.
- Perfil informa qué datos faltan y permite completarlos. Las validaciones de registro, guardado de perfil y contacto del pedido siguen vigentes. Tras guardar un perfil completo se utiliza el nombre actualizado, sin conservar un nombre anterior.
- La generación de claves de pedidos usa `uuid.v4()` de `expo` en lugar de importar `expo-crypto` al arrancar. Se mantiene la generación nativa de UUID y la protección contra pedidos duplicados. El usuario confirmó que la app volvió a abrir; todavía falta probar la creación de un pedido con este generador en el teléfono.

No se modificaron documentos de la base de datos ni el backend. Se conservaron ramas, identidades y el trabajo de Reseñas. No se crearon PR ni se publicaron estos cambios. Durante esta corrección el usuario conservó el control de los procesos Expo y del QR.

## Verificación

- David: TypeScript, lint y 741 pruebas aprobadas.
- Zenaida: TypeScript, lint y 788 pruebas aprobadas, incluidas las de Reseñas.
- Seis regresiones nuevas cubren login con cuenta antigua, restauración, perfil, validaciones, actualización de datos públicos y cierre de sesión. El almacenamiento nativo y el transporte de estas pruebas están simulados; no sustituyen la prueba en Expo Go.
- Los adaptadores de sesión y perfil aceptaron también la forma pública de la cuenta local real mediante una comprobación de solo lectura, sin imprimir sus valores personales. Esto no constituye un intento de autenticación con contraseña.

## Aceptación en Expo Go

El usuario confirmó en el chat: «ya accedió, ya pude loguearme, ahora que hacemos?». Después confirmó: «Amigo, Perfil guardó mis datos, se conservaron al actualizar y la sesión volvió al reabrir.». Quedan aceptados entrada, guardado y actualización de Perfil y reapertura de sesión en la copia de David.

En la prueba independiente de Zenaida confirmó: «Amigo, en la copia de Zenaida pude entrar, aparecen mis datos y la sesión volvió al reabrir.». Quedan aceptados también el acceso, la consulta de sus datos y la restauración de sesión en esa copia. La evidencia procede de sus respuestas; el agente no observó directamente el dispositivo ni probó otra cuenta.

El usuario conserva el control del QR y de Expo en sus terminales. Ambas aplicaciones utilizan un solo backend compartido en 3200. Esta etapa se registra con commits locales separados de arranque, compatibilidad de cuenta y aceptación, sin crear ni actualizar PR.

## Siguiente etapa

Recuperar visualmente Inicio, Cuenta y Login desde Proyecto-INHALEX, conservando los servicios y las validaciones reparados. Empezar por Inicio y verificarlo con el usuario antes de continuar. Reseñas sigue a cargo de Zenaida, con David como futuro revisor; su conexión nativa a la API y Confirmación de recepción siguen pendientes. La generación nativa de la clave de un pedido requiere su prueba explícita y no queda aceptada por el inicio de sesión.
