# Publicar ACTIVA en internet (gratis)

ACTIVA se publica como **un solo servicio** que sirve todo desde la misma dirección:

| Dirección | Qué es |
|---|---|
| `https://tu-dominio/` | Página principal con los accesos |
| `https://tu-dominio/paciente/` | App del paciente |
| `https://tu-dominio/fisio/` | Panel del fisioterapeuta |
| `https://tu-dominio/admin/` | Panel de administración (tú) |
| `https://tu-dominio/api` | Backend |

Se usan dos servicios con plan gratuito, y ninguno pide tarjeta:

| Servicio | Para qué | Plan gratis (revisa que siga igual) |
|---|---|---|
| [Render](https://render.com) | Corre ACTIVA | Se duerme tras 15 min sin visitas; la siguiente visita tarda cerca de 1 minuto. 750 horas al mes. |
| [TiDB Cloud Starter](https://tidbcloud.com) | Base de datos (compatible con MySQL) y archivos subidos | Varios GB y una cuota mensual de uso. Con el límite de gasto en $0 nunca cobra: si se pasa, solo se pone lento. |

Render borra su disco cada vez que el servicio se duerme, por eso los datos y los archivos subidos (fotos, PDFs, GIFs) se guardan en TiDB. Cada archivo puede pesar hasta 5 MB. Los **videos de ejercicios van como enlace de YouTube "no listado"**: no ocupan espacio y se ven mejor en el celular.

Cada vez que se une un cambio a `main` en GitHub, Render vuelve a publicar solo.

## 1. Base de datos en TiDB Cloud

1. Crea tu cuenta en tidbcloud.com y crea un cluster **Starter** (gratis). Elige la región más cercana a Render (por ejemplo `us-east-1` u `Oregon`).
2. En el cluster → **Connect**: genera una contraseña y anota **Host**, **Port** (4000), **User** (algo como `xxxx.root`) y la contraseña.
3. En **SQL Editor** corre: `CREATE DATABASE activa;`

## 2. ACTIVA en Render

1. Crea tu cuenta en render.com entrando con GitHub.
2. **New → Blueprint** → elige el repo `LeonardoGlezz/activa`. Render lee `render.yaml` y te pide estas variables:

| Variable | Valor |
|---|---|
| `ADMIN_EMAIL` | Tu correo de administrador |
| `ADMIN_PASSWORD` | Una contraseña fuerte (solo se usa la primera vez) |
| `DB_HOST` | Host de TiDB |
| `DB_NAME` | `activa` |
| `DB_USER` | Usuario de TiDB |
| `DB_PASS` | Contraseña de TiDB |

`JWT_SECRET`, `DB_PORT`, `DB_SSL` y `UPLOADS_IN_DB` ya vienen puestos. La primera construcción tarda varios minutos.

3. Al terminar, Render te da una dirección tipo `https://activa-xxxx.onrender.com`. Ábrela: debes ver la página principal.

Dominio propio (opcional, 10 a 15 USD al año): en Render → servicio → **Settings → Custom Domains**, y copia el registro que te indica en tu proveedor de dominio. HTTPS es automático.

### Que no se duerma (opcional)

Con una sola app, las 750 horas gratis alcanzan para el mes completo. Si no quieres que el primer paciente del día espere, crea un monitor gratis en [UptimeRobot](https://uptimerobot.com) que visite tu dirección cada 10 minutos.

## 3. Primer uso

1. Entra a `/admin/` con tu `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
2. Da de alta a tu amigo desde `/admin/` → **Fisioterapeutas → Dar de alta un fisio**. El panel te da un mensaje con su dirección, correo y contraseña para que se lo mandes. (También puede registrarse él mismo en `/fisio/` y tú lo apruebas en la misma pantalla.)
3. Él da de alta a sus pacientes con correo y contraseña y les comparte la dirección principal. Ellos entran con **Soy paciente**.

Sin claves de Stripe no se cobra nada y el panel del fisio no muestra "Membresía": los fisios aprobados usan todo. Si algún día vendes ACTIVA, agrega las variables `STRIPE_*` de `backend/.env.example`.

### Recordatorios de citas por correo (opcional, gratis)

ACTIVA avisa al paciente dentro de la app un día antes de cada cita, sin configurar nada. Si además quieres que le llegue un **correo**, agrega estas variables en Render → servicio → **Environment**:

| Variable | Con Brevo (gratis, 300 correos al día, sin tarjeta) | Con Gmail |
|---|---|---|
| `SMTP_HOST` | `smtp-relay.brevo.com` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` | `587` |
| `SMTP_USER` | el usuario SMTP que te da Brevo en *SMTP & API* | tu correo de Gmail |
| `SMTP_PASS` | la clave SMTP de Brevo | una "contraseña de aplicación" de Google (requiere verificación en dos pasos) |
| `MAIL_FROM` | `Activa <tu-correo@dominio.com>` (un remitente verificado en Brevo) | `Activa <tu-correo@gmail.com>` |

Si no pones `SMTP_HOST`, ACTIVA simplemente no manda correos.

### Qué pasa con los datos viejos al actualizar

Desde octubre de 2026 ACTIVA ya no guarda documentos (INE, PDF de cédula ni documentos médicos de pacientes). Al arrancar la versión nueva, el servidor **borra esos archivos y la CURP** que hubiera en la base. Las fotos y videos de ejercicios no se tocan. También agrega solo el banco base de ejercicios (49 ejercicios de rehabilitación en español).

## Si algo falla

- Render → servicio → **Logs**. `JWT_SECRET no está configurado`: falta la variable. Errores con `ECONNREFUSED`, `ENOTFOUND` o `Access denied`: revisa las variables `DB_*`. `No se pudo guardar el archivo`: revisa que la base de TiDB no esté llena.
- Olvidaste la contraseña del admin: en Render → servicio → **Environment**, pon una nueva en `ADMIN_PASSWORD`, agrega `ADMIN_RESET_PASSWORD` con valor `true` y guarda. Al reiniciar ya entras con la nueva; después borra `ADMIN_RESET_PASSWORD`.
- Respaldos: TiDB Cloud permite exportar la base desde su consola; hazlo de vez en cuando.

## Pasar a un plan de pago más adelante

El mismo `Dockerfile` funciona en Render de pago (sin dormirse) o en Railway (`railway.json`) por unos 5 a 10 USD al mes. Si algún día necesitas subir videos grandes, puedes guardar los archivos en Cloudflare R2 u otro almacenamiento compatible con S3 agregando las variables `S3_*` de `backend/.env.example` (requiere cuenta con tarjeta).

## La app de Android

La app de Play Store usa `app-paciente/src/environments/environment.prod.ts`, que todavía apunta al servidor viejo del proyecto integrador. Cuando tengas tu dirección definitiva, cambia ahí `apiUrl` y `backendUrl` antes de generar el APK. La versión web (`/paciente/`) no necesita ese cambio.
