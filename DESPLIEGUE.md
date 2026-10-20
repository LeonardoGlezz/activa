# Publicar ACTIVA en internet

ACTIVA se publica como **un solo servicio** en [Railway](https://railway.com) más una base de datos MySQL. El mismo dominio sirve todo:

| Dirección | Qué es |
|---|---|
| `https://tu-dominio/` | Página principal con los accesos |
| `https://tu-dominio/paciente/` | App del paciente |
| `https://tu-dominio/fisio/` | Panel del fisioterapeuta |
| `https://tu-dominio/admin/` | Panel de administración (tú) |
| `https://tu-dominio/api` | Backend |

Cada vez que se une un cambio a `main` en GitHub, Railway vuelve a construir y publicar solo. Nadie tiene que entrar a un servidor.

## Lo que necesitas (solo tú, una vez)

1. Una cuenta en Railway (entra con tu cuenta de GitHub).
2. El plan **Hobby** de Railway, con tarjeta. Para una clínica pequeña el consumo suele quedar entre 5 y 10 USD al mes; revisa el precio actual en railway.com/pricing.
3. Opcional: un dominio propio (por ejemplo `activafisio.com`, unos 10 a 15 USD al año en Namecheap, Cloudflare o GoDaddy). Sin dominio, Railway te da uno gratis tipo `activa-production.up.railway.app`.

## Paso a paso

### 1. Crear el proyecto y la base de datos

1. En Railway: **New Project → Deploy from GitHub repo → LeonardoGlezz/activa**. Railway detecta el `Dockerfile` y empieza a construir (la primera vez fallará porque faltan las variables; es normal).
2. En el mismo proyecto: **New → Database → MySQL**.

### 2. Variables del servicio

En el servicio `activa` → **Variables → Raw Editor**, pega esto y cambia lo marcado:

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASS=${{MySQL.MYSQLPASSWORD}}

JWT_SECRET=PEGA_AQUI_UNA_CLAVE_LARGA
ADMIN_EMAIL=tu-correo@ejemplo.com
ADMIN_PASSWORD=UNA_CONTRASEÑA_FUERTE

FRONTEND_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/fisio
```

- `JWT_SECRET`: genera una en tu PC con `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Mínimo 32 caracteres. Si la cambias, todos tendrán que volver a iniciar sesión.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: tu cuenta de administrador. Se crea la primera vez que arranca el servidor; cambiar la variable después no cambia la contraseña.
- Stripe (pagos) no hace falta: sin `STRIPE_SECRET_KEY` nadie paga y los fisios aprobados usan todo. Cuando quieras vender ACTIVA a otros fisios, agrega las variables `STRIPE_*` de `backend/.env.example`.

### 3. Guardar los archivos que suben los usuarios

En el servicio `activa` → **Settings → Volumes → Add Volume**, ruta de montaje: `/app/backend/uploads`. Sin esto, las fotos y documentos se borran en cada despliegue.

### 4. Dirección pública

En el servicio `activa` → **Settings → Networking → Generate Domain**. Abre esa dirección: debes ver la página principal.

Para usar tu propio dominio: **Custom Domain**, escribe tu dominio y copia el registro CNAME que te da Railway en el panel de tu proveedor de dominio. El certificado HTTPS es automático.

### 5. Primer uso

1. Entra a `/admin/` con tu `ADMIN_EMAIL` y `ADMIN_PASSWORD`.
2. Tu amigo fisioterapeuta se registra en `/fisio/` (o lo registras tú con él).
3. Tú lo apruebas desde `/admin/`.
4. Él da de alta a sus pacientes con correo y contraseña, y les comparte la dirección principal. Los pacientes entran con el botón **Soy paciente**.

## Si algo falla

- **El servicio no arranca**: en Railway → servicio → **Deployments → View logs**. `JWT_SECRET no está configurado` significa que falta esa variable o tiene menos de 32 caracteres. `ECONNREFUSED` o `ENOTFOUND` es la base de datos: revisa las variables `DB_*`.
- **Respaldos**: Railway guarda la base en un volumen. Para un respaldo manual, en el servicio MySQL → **Data** puedes ver las tablas, o desde tu PC con `mysqldump` usando la URL pública que muestra Railway en **Connect**.

## La app de Android

La app de Play Store usa `app-paciente/src/environments/environment.prod.ts`, que todavía apunta al servidor viejo del proyecto integrador. Cuando tengas tu dirección definitiva, cambia ahí `apiUrl` y `backendUrl` antes de generar el APK. La versión web (`/paciente/`) no necesita ese cambio.
