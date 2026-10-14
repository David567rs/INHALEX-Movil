# Cuentas y permisos de INHALEX Movil

David y Zenaida trabajan en copias independientes del mismo repositorio GitHub. Cada copia conserva sus archivos, ramas e identidad Git local; la autenticación remota corresponde a la cuenta de su responsable.

## Carpetas y cuentas

| Responsable | Carpeta local | Cuenta GitHub |
| --- | --- | --- |
| David | `C:\Users\David\Documents\INHALEX-Movil` | `David567rs` |
| Zenaida | `C:\Users\David\Documents\INHALEX-Movil-Zenaida` | `ZenaidaGR` |

David usa su carpeta en Devin o Codex. Zenaida abre su carpeta en VS Code. La sesión del editor no sustituye la configuración de autoría ni la autenticación de Git.

## Permisos del repositorio

David567rs es el propietario y administrador. ZenaidaGR aceptó la invitación y tiene permiso de escritura, sin administración.

La regla activa [Main solo David mediante PR](https://github.com/David567rs/INHALEX-Movil/rules/25061419) restringe la actualización de `main`. Solo David puede integrar un PR hacia esa rama; Zenaida puede revisar el PR, pero no fusionarlo ni actualizar `main`. Las protecciones existentes siguen exigiendo CI y revisión también a David. El repositorio público permite leer `main`.

Zenaida trabaja en las ramas de búsqueda, favoritos, bolsa y avisos. Sus PR apuntan a `develop`. La administración del repositorio y de sus reglas permanece en David.

## Autoría y autenticación

La configuración de nombre y correo se guarda en `.git/config` de cada copia. La de Zenaida utiliza `ZenaidaGR` y el correo noreply de GitHub `171315816+ZenaidaGR@users.noreply.github.com`, derivado de su identificador público. La de David conserva su identidad existente. Se utiliza `user.useConfigOnly=true` para que Git requiera la identidad configurada.

El usuario de credenciales para `https://github.com` queda fijado localmente a la cuenta del responsable. El remoto de Zenaida incluye su nombre de usuario para que el gestor de credenciales distinga las cuentas. Los tokens y contraseñas permanecen fuera de Git.

Comprueba la identidad desde la carpeta correspondiente:

```bash
git rev-parse --show-toplevel
git config --show-origin --get user.name
git config --show-origin --get user.email
git config --local --get credential.https://github.com.username
git remote -v
```

Zenaida ya aceptó la invitación y debe completar su propia autenticación cuando Git Credential Manager solicite iniciar sesión. Tener una sesión de navegador o de VS Code abierta no confirma que el gestor de credenciales del sistema ya tenga acceso con esa cuenta.

## Revisión inicial y comienzo de actividades

El [PR del backend](https://github.com/David567rs/INHALEX-Movil/pull/1) ya se integró con la aprobación de Zenaida y CI satisfactorio. Ambos clones tienen su propio Server/.env local, ignorado por Git, y sus dependencias instaladas. El siguiente PR prepara la base móvil en feature/mobile-bootstrap; la revisión funcional de cada PR corresponde al compañero.

Después de integrar la base del backend en `develop`, Zenaida cambia a esa rama y actualiza su copia:

```bash
git switch develop
git pull --ff-only origin develop
```

Las ramas de sus actividades se crean desde el `develop` actualizado cuando sus dependencias estén disponibles, conforme al plan. Cada persona crea y confirma sus cambios, abre sus PR y revisa los del compañero desde su cuenta.
