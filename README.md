# ACTIVA

Plataforma para fisioterapeutas y sus pacientes: el fisio arma rutinas de ejercicios para cada paciente y el paciente las consulta desde la app.

## Estructura

| Carpeta | Qué es | Stack |
|---|---|---|
| `backend/` | API REST | Node.js, Express 5, TypeScript, Sequelize, MySQL, JWT |
| `web-fisio/` | Panel web del fisioterapeuta (pacientes, banco de ejercicios, rutinas, citas) | Angular 18, PrimeNG |
| `app-paciente/` | App del paciente (rutinas, reporte de dolor, progreso) | Ionic 8, Angular 20, Capacitor (Android) |
| `admin/` | Panel del administrador de la plataforma (aprobar fisioterapeutas) | Angular |

Cada carpeta tiene su propio `package.json` y README con instrucciones para correrla.

## Origen

Basado en el proyecto integrador "ACTIVA" (Universidad Tecnológica de Tehuacán, 2026), desarrollado por el equipo Web & Code Studio. Código copiado de los repositorios originales:

- `backend/` ← [MiguelAngelGG19/Web-Code-Studio-App-Backend](https://github.com/MiguelAngelGG19/Web-Code-Studio-App-Backend) (`master` @ 6a1eac7)
- `web-fisio/` ← [MiguelAngelGG19/Web-Code-Studio-Web-Fronted](https://github.com/MiguelAngelGG19/Web-Code-Studio-Web-Fronted) (`master` @ 0e637ff)
- `app-paciente/` ← [MiguelAngelGG19/Web-Code-Studio-App-Mobile](https://github.com/MiguelAngelGG19/Web-Code-Studio-App-Mobile) (`master` @ 2a77eea)
- `admin/` ← [MiguelAngelGG19/Web-Code-Studio-Admin](https://github.com/MiguelAngelGG19/Web-Code-Studio-Admin) (`main` @ 7ef5247)

Los PDFs que había en `backend/uploads/documents` (documentos de usuarios) no se copiaron.
