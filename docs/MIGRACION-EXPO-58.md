# Migración a Expo SDK 58

La versión de Expo Go instalada en el teléfono usa SDK 58 y rechazaba INHALEX SDK 57 antes de abrir la aplicación. El usuario autorizó migrar el proyecto en una rama separada y conservar Reseñas. David prepara `chore/expo-sdk-58` desde `develop` `6b38ba8`. La copia de Zenaida conserva el diseño en `feature/resenas` `30de297` y el cierre anterior de Avisos en `0d8dca5`.

## Cambios de compatibilidad

Se alinean Expo 58.0.23, Router 58.0.30 y los módulos nativos con la matriz publicada para SDK 58, React 19.3.0 y React Native 0.88.1. Doctor queda fijado en 1.21.6. Los tipos de referencias usan las instancias públicas de React Native. RootLayout declara el destino de regreso mediante `unstable_settings.anchor`. Las pestañas pasan sus colores de la paleta al componente de icono con un tipo compatible.

La vista web usa espaciado de área segura CSS y salida `single`. En Android se utiliza SafeAreaProvider. El número de versión de la aplicación sigue siendo 0.1.0, con versionCode 1.

## Verificación

Comprobaciones del 4 de noviembre de 2026, en la copia de David.

- Expo install --fix confirmó dependencias alineadas.
- TypeScript y lint terminaron con exit 0.
- Pasaron las 735 pruebas existentes.
- Expo Doctor aprobó 20/20.
- Exportación Android aprobada con 1 442 módulos.
- Exportación web aprobada con 1 092 módulos.
- Recorrido web comprobado desde Inicio a Cuenta, acceso y Historial. El foco avanza de correo a contraseña. Historial pide iniciar sesión. Regresar a Inicio conserva las cinco pestañas. La captura a 393 px está en [inicio-web.png](evidencias/expo-sdk58/inicio-web.png). No se registraron errores de consola en ese recorrido.

La prueba física en Expo Go 58, sesión persistida y recorrido con pedidos reales están pendientes del usuario. El QR de la copia migrada usa el puerto 8082. La exportación JavaScript no sustituye la prueba del APK/AAB firmado de la etapa de release.

La primera ejecución de la CLI instalada aún pertenecía a SDK 57, por lo que se detuvo ese intento y se instaló primero Expo 58 con el conjunto compatible. Se actualizó la metadata de npm tras un ETARGET de caché. La instalación y verificación finales usan las versiones oficiales de SDK 58 y un lockfile actualizado.

## Siguiente recorrido en Expo Go

1. Abrir el QR de la copia de David con Expo Go 58, en el puerto 8082.
2. Comprobar Inicio y sus cinco pestañas, Catálogo y detalle, Cuenta e inicio de sesión.
3. Comprobar formularios, teclado y regreso, historial y seguimiento de pedidos.
4. Cerrar y reabrir la aplicación y verificar la continuidad de sesión.
5. Con la revisión del PR completada, integrar en develop, actualizar ambas copias e incorporar develop a feature/resenas. Revisar allí el formulario conservado de Reseñas con SDK 58.

## Fuentes

- [Guía de actualización](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [SDK 58](https://expo.dev/changelog/sdk-58)
- [Migración de Expo Router](https://docs.expo.dev/router/migrate/sdk-57-to-58/)
- [API TypeScript estricta de React Native](https://reactnative.dev/docs/strict-typescript-api)
