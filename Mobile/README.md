# INHALEX: base móvil

Proyecto Expo SDK 57 con React Native, TypeScript y Expo Router. Esta base recupera la identidad visual, Inicio, Experiencia y las cinco pestañas. Catálogo, Favoritos, Bolsa y Cuenta muestran su estado de preparación: sus actividades se integrarán en los PR del [plan](../docs/PLAN-DE-TRABAJO.md).

## Abrir el proyecto

Git Bash, desde cualquier ubicación:

```bash
cd /c/Users/David/Documents/INHALEX-Movil
npm ci --prefix Mobile
npm run dev:mobile
```

CMD:

```bat
cd /d C:\Users\David\Documents\INHALEX-Movil
npm ci --prefix Mobile
npm run dev:mobile
```

En la copia de Zenaida se sustituye INHALEX-Movil por INHALEX-Movil-Zenaida. Expo abre en el puerto 8082. Ambos equipos deben usar copias independientes; cada persona conserva su identidad Git local.

Escanea el QR con Expo Go en Android. Para LAN, el teléfono y la laptop deben estar en la misma red. El comando `npm run web:mobile` abre la vista web para comprobar navegación y diseño; esa revisión no sustituye la prueba en Android.

## API y configuración

El `.env` del servidor permanece en `Server/`. Para configurar la URL pública de la móvil, copia `Mobile/.env.example` a `Mobile/.env` y adapta `EXPO_PUBLIC_API_URL`. El valor inicial es `http://localhost:3200/api`; en desarrollo Android se sustituye el host de loopback por el host LAN privado de Metro o por `10.0.2.2` para el emulador. Con un teléfono físico y un túnel, usa explícitamente la dirección LAN del servidor o una URL HTTPS accesible.

La URL conserva el puerto de la API y su prefijo `/api`. La distribución exige una URL HTTPS explícita. La navegación se abre sin arrancar el servidor; para crear una cuenta el backend debe estar accesible.

Los valores `EXPO_PUBLIC_*` son visibles en la aplicación compilada. La móvil solo necesita la dirección pública de la API; las credenciales MongoDB, JWT, respaldos y llaves de servicio pertenecen al backend.

## Arquitectura

Las rutas están en `src/app`. `src/shared` contiene componentes reutilizados y movimiento accesible; `core` contiene tema, configuración y transporte HTTP. `bootstrap/createApplicationServices.ts` compone los servicios bajo demanda e inyecta `RegisterUser` en la pantalla de Registro. La app no inicializa sesión ni repositorios de actividades futuras.

Registro contiene entidades, contrato, caso de uso y errores en `domain`, Repository y mapeador en `data`, y View/ViewModel en `presentation`. El dominio es independiente de Expo y HTTP. El POST público `/auth/register` envía cinco campos y descarta el token de la respuesta; Inicio de sesión y Persistencia se implementarán en sus actividades. El [plan de trabajo](../docs/PLAN-DE-TRABAJO.md) registra la evidencia y los pasos de aceptación en Expo Go.

## Comprobaciones

Desde la raíz, en Git Bash o CMD:

```bash
npm run typecheck:mobile
npm run lint:mobile
npm run test:mobile
npm run doctor:mobile
npm run export:mobile
```

Las pruebas usan Node 24, TypeScript ya instalado y transporte simulado. Comprueban URL, destino, errores, timeout, cancelación, JSON, reglas de Registro y Repository; no acceden a MongoDB ni al servidor real. La comprobación HTTP con Nest/MongoDB aislados está documentada por separado en el plan. La exportación Android comprueba el bundle JavaScript y los recursos: el AAB firmado se generará en la etapa de release.

## Versión

La base comienza en `0.1.0`, con `versionCode: 1`. El [esquema de versiones](../docs/VERSIONAMIENTO.md) conserva `0.y.z` durante desarrollo y `1.0.0` para la primera entrega estable. Firma y vinculación EAS se configurarán antes de esa entrega.
