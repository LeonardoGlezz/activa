# ACTIVA

Plataforma para fisioterapeutas y sus pacientes: el fisio arma rutinas de ejercicios para cada paciente y el paciente las consulta desde la app.

## Estructura

| Carpeta | Qué es | Stack |
|---|---|---|
| `backend/` | API REST | Node.js, Express 5, TypeScript, Sequelize, MySQL, JWT |
| `web-fisio/` | Panel web del fisioterapeuta (pacientes, banco de ejercicios, rutinas, citas) | Angular 18, PrimeNG |
| `app-paciente/` | App del paciente (rutinas, reporte de dolor, progreso) | Ionic 8, Angular 20, Capacitor (Android) |
| `admin/` | Panel del administrador de la plataforma (aprobar fisioterapeutas) | Angular |

Cada carpeta tiene su propio `package.json`, pero todo se puede arrancar desde la raíz con un solo comando (ver abajo). Abre en VS Code la carpeta raíz `activa/`, no cada subcarpeta.

## Correr todo en local (Windows)

### Lo que necesitas instalar una sola vez

1. [Node.js 22 LTS](https://nodejs.org/) (incluye `npm`).
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/) para la base de datos MySQL. Ábrelo y espera a que diga *Engine running*.
3. [Git](https://git-scm.com/download/win) y [VS Code](https://code.visualstudio.com/).

### Primera vez

En VS Code: *File → Open Folder* → elige la carpeta `activa`. Luego abre la terminal (`Ctrl + ñ` o *Terminal → New Terminal*) y corre:

```bash
npm install          # instala la herramienta que arranca todo junto
npm run setup        # instala dependencias de las 4 carpetas y crea backend/.env
npm run db:up        # levanta MySQL en Docker
npm run db:setup     # crea las tablas y usuarios de prueba
npm run dev          # arranca backend + panel del fisio + app del paciente + admin
```

### Los demás días

Abre Docker Desktop y luego:

```bash
npm run db:up
npm run dev
```

Para detener todo: `Ctrl + C` en la terminal. Para apagar MySQL: `npm run db:down` (los datos se conservan).

### Dónde ver cada parte

| Qué | URL |
|---|---|
| Panel del fisioterapeuta | http://localhost:4200 |
| App del paciente | http://localhost:8100 |
| Panel de administrador | http://localhost:4300 |
| API (backend) | http://localhost:3000/api |

### Usuarios de prueba (solo existen en tu base local)

| Rol | Correo | Contraseña |
|---|---|---|
| Fisioterapeuta (aprobado, con plan activo) | `fisio@activa.local` | `fisio123` |
| Paciente (ya tiene una rutina asignada) | `paciente@activa.local` | `paciente123` |
| Administrador | `admin@activa.local` | `admin123` |

### Si algo falla

- **`ECONNREFUSED 127.0.0.1:3306`**: MySQL no está arriba. Abre Docker Desktop y corre `npm run db:up`.
- **El puerto 3306 ya está en uso**: tienes otro MySQL (XAMPP, MySQL Installer) corriendo. Apágalo, o úsalo en lugar de Docker: crea una base `activa` y pon su usuario y contraseña en `backend/.env` (`DB_USER`, `DB_PASS`), luego `npm run db:setup`.
- **Pagos (Stripe) y login con Google** no funcionan en local hasta que pongas tus claves en `backend/.env`. Todo lo demás sí.
- `backend/.env` es solo tuyo: nunca lo subas al repo (ya está en `.gitignore`).

## Aviso de privacidad y términos de uso

Los textos están en `backend/legal/` y el backend los publica en `/legal` (por ejemplo `http://localhost:3000/legal/`). Pacientes y fisios los aceptan la primera vez que entran. Son un borrador: lo que falta llenar y revisar está en [docs/avisos-legales.md](docs/avisos-legales.md).

## Origen

Basado en el proyecto integrador "ACTIVA" (Universidad Tecnológica de Tehuacán, 2026), desarrollado por el equipo Web & Code Studio. Código copiado de los repositorios originales:

- `backend/` ← [MiguelAngelGG19/Web-Code-Studio-App-Backend](https://github.com/MiguelAngelGG19/Web-Code-Studio-App-Backend) (`master` @ 6a1eac7)
- `web-fisio/` ← [MiguelAngelGG19/Web-Code-Studio-Web-Fronted](https://github.com/MiguelAngelGG19/Web-Code-Studio-Web-Fronted) (`master` @ 0e637ff)
- `app-paciente/` ← [MiguelAngelGG19/Web-Code-Studio-App-Mobile](https://github.com/MiguelAngelGG19/Web-Code-Studio-App-Mobile) (`master` @ 2a77eea)
- `admin/` ← [MiguelAngelGG19/Web-Code-Studio-Admin](https://github.com/MiguelAngelGG19/Web-Code-Studio-Admin) (`main` @ 7ef5247)

Los PDFs que había en `backend/uploads/documents` (documentos de usuarios) no se copiaron.
