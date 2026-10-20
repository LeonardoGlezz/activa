# Publicar ACTIVA en internet (gratis)

ACTIVA se publica como **un solo servicio** que sirve todo desde la misma dirección:

| Dirección | Qué es |
|---|---|
| `https://tu-dominio/` | Página principal con los accesos |
| `https://tu-dominio/paciente/` | App del paciente |
| `https://tu-dominio/fisio/` | Panel del fisioterapeuta |
| `https://tu-dominio/admin/` | Panel de administración (tú) |
| `https://tu-dominio/api` | Backend |

Se usan tres servicios con plan gratuito:

| Servicio | Para qué | Plan gratis (revisa que siga igual) |
|---|---|---|
| [Render](https://render.com) | Corre ACTIVA | Se duerme tras 15 min sin visitas; la siguiente visita tarda cerca de 1 minuto. 750 horas al mes. |
| [TiDB Cloud Starter](https://tidbcloud.com) | Base de datos (compatible con MySQL) | Varios GB de datos y una cuota mensual de uso; de sobra para una clínica. |
| [Cloudflare R2](https://dash.cloudflare.com) | Fotos, PDFs y videos de ejercicios | 10 GB, sin costo por descargas. |

Render borra su disco cada vez que el servicio se duerme, por eso los archivos van a R2 y los datos a TiDB.

Cada vez que se une un cambio a `main` en GitHub, Render vuelve a publicar solo.

## 1. Base de datos en TiDB Cloud

1. Crea tu cuenta en tidbcloud.com y crea un cluster **Starter** (gratis). Elige la región más cercana a Render (por ejemplo `us-east-1` u `Oregon`).
2. En el cluster → **Connect**: genera una contraseña y anota **Host**, **Port** (4000), **User** (algo como `xxxx.root`) y la contraseña.
3. En **SQL Editor** corre: `CREATE DATABASE activa;`

## 2. Archivos en Cloudflare R2

1. Crea tu cuenta en dash.cloudflare.com → **R2**. Cloudflare puede pedirte una tarjeta para activar R2 aunque no cobre dentro del plan gratis.
2. **Create bucket** con nombre `activa`.
3. **Manage R2 API Tokens → Create API token** con permiso **Object Read & Write** solo para ese bucket. Anota el **Access Key ID**, el **Secret Access Key** y el endpoint `https://<ID-de-cuenta>.r2.cloudflarestorage.com`.

## 3. ACTIVA en Render

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
| `S3_ENDPOINT` | `https://<ID-de-cuenta>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | `activa` |
| `S3_ACCESS_KEY_ID` | Access Key ID de R2 |
| `S3_SECRET_ACCESS_KEY` | Secret Access Key de R2 |

`JWT_SECRET`, `DB_PORT` y `DB_SSL` ya vienen puestos. La primera construcción tarda varios minutos.

3. Al terminar, Render te da una dirección tipo `https://activa-xxxx.onrender.com`. Ábrela: debes ver la página principal.

Dominio propio (opcional, 10 a 15 USD al año): en Render → servicio → **Settings → Custom Domains**, y copia el registro que te indica en tu proveedor de dominio. HTTPS es automático.

### Que no se duerma (opcional)

Con una sola app, las 750 horas gratis alcanzan para el mes completo. Si no quieres que el primer paciente del día espere, crea un monitor gratis en [UptimeRobot](https://uptimerobot.com) que visite tu dirección cada 10 minutos.

## 4. Primer uso

1. Entra a `/admin/` con tu `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
2. Tu amigo fisioterapeuta se registra en `/fisio/` y tú lo apruebas desde `/admin/`.
3. Él da de alta a sus pacientes con correo y contraseña y les comparte la dirección principal. Ellos entran con **Soy paciente**.

Sin claves de Stripe no se cobra nada: los fisios aprobados usan todo. Si algún día vendes ACTIVA, agrega las variables `STRIPE_*` de `backend/.env.example`.

## Si algo falla

- Render → servicio → **Logs**. `JWT_SECRET no está configurado`: falta la variable. Errores con `ECONNREFUSED`, `ENOTFOUND` o `Access denied`: revisa las variables `DB_*`. `No se pudo guardar el archivo`: revisa las variables `S3_*` y el permiso del token de R2.
- Respaldos: TiDB Cloud permite exportar la base desde su consola; hazlo de vez en cuando.

## Pasar a un plan de pago más adelante

El mismo `Dockerfile` funciona en Render de pago (sin dormirse) o en Railway (`railway.json`) por unos 5 a 10 USD al mes. Ahí puedes seguir usando TiDB y R2, o la base y el disco del propio hosting.

## La app de Android

La app de Play Store usa `app-paciente/src/environments/environment.prod.ts`, que todavía apunta al servidor viejo del proyecto integrador. Cuando tengas tu dirección definitiva, cambia ahí `apiUrl` y `backendUrl` antes de generar el APK. La versión web (`/paciente/`) no necesita ese cambio.
