# Web-Code-Studio-Admin 🏥
Panel de administración para validar fisioterapeutas — Proyecto Activa

## 📋 Descripción
Web moderna construida con Angular para la gestión y validación de fisioterapeutas. Incluye un sistema de autenticación, pantalla de bienvenida informativa y formularios de registro/login.

## ✨ Características
- ✅ Pantalla de inicio informativa con branding
- ✅ Sistema de login completo
- ✅ Formulario de registro con validación
- ✅ Diseño responsivo y moderno
- ✅ Navbar interactivo
- ✅ Estilos SCSS avanzados
- ✅ Componentes standalone (Angular 18+)
- ✅ Validación de formularios reactivos

## 🚀 Inicio Rápido

### Requisitos
- Node.js v18+ 
- npm v9+
- Git

### Instalación

1. **Clona el repositorio** (si aplica):
```bash
cd Web-Code-Studio-Admin
```

2. **Instala las dependencias**:
```bash
npm install
```

3. **Inicia el servidor de desarrollo**:
```bash
npm start
```

El servidor se levantará en `http://localhost:4200` y se abrirá automáticamente en tu navegador.

## 📦 Scripts Disponibles

```bash
# Servidor de desarrollo
npm start              # Inicia dev server y abre en navegador
npm run dev            # Inicia dev server sin abrir navegador

# Compilación
npm run build          # Build para producción (optimizado)
npm run build:prod     # Build con optimizaciones adicionales
npm run watch          # Build en modo watch (desarrollo)

# Testing
npm test               # Ejecuta tests unitarios
npm run lint           # Verifica código (eslint)
```

## 🏗️ Estructura del Proyecto

```
Web-Code-Studio-Admin/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── navbar/              # Barra de navegación
│   │   ├── pages/
│   │   │   ├── home/                # Pantalla de inicio
│   │   │   ├── login/               # Formulario de login
│   │   │   └── register/            # Formulario de registro
│   │   ├── app.config.ts            # Config de Angular
│   │   ├── app.routes.ts            # Rutas de la aplicación
│   │   ├── app.component.ts         # Componente raíz
│   │   ├── app.component.html
│   │   └── app.component.scss
│   ├── index.html                   # HTML principal
│   ├── main.ts                      # Entry point
│   └── styles.scss                  # Estilos globales
├── angular.json                     # Config de Angular CLI
├── tsconfig.json                    # Config de TypeScript
├── package.json                     # Dependencias
└── README.md                        # Este archivo
```

## 🎨 Tecnologías

- **Angular 18** - Framework progressive
- **TypeScript** - Lenguaje tipado
- **SCSS** - Preprocesador CSS
- **RxJS** - Programación reactiva
- **Componentes Standalone** - Arquitectura moderna

## 🔄 Rutas Disponibles

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | HomeComponent | Pantalla de inicio informativa |
| `/login` | LoginComponent | Formulario de login |
| `/register` | RegisterComponent | Formulario de registro |

## 📝 Validaciones de Formularios

### Login
- Email: requerido y email válido
- Contraseña: mínimo 6 caracteres

### Registro
- Nombre: mínimo 3 caracteres
- Email: email válido
- Contraseña: mínimo 8 caracteres con validación de coincidencia
- Confirmar contraseña: debe coincidir con la contraseña
- Términos: debe aceptar los términos y condiciones

## 🚀 Deploy a Producción

Para desplegar a producción:

```bash
npm run build:prod
```

Esto generará la carpeta `dist/web-code-studio-admin` lista para servir en cualquier servidor HTTP.

## 🔧 Configuración de Desarrollo

### Variables de Entorno
Crear archivo `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### Para Producción (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.ejemplo.com/api'
};
```

## 🐛 Debugging

1. Abre las Developer Tools (F12)
2. Ve a la pestaña "Console" para ver logs
3. Usa breakpoints en el código TypeScript
4. Verifica la tab "Network" para las llamadas HTTP

## 📱 Responsividad

El proyecto es completamente responsive:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)
- Small Mobile (< 480px)

## 🤝 Próximas Mejoras

- [ ] Integración real con backend
- [ ] Sistema de autenticación JWT
- [ ] Dashboard de administración
- [ ] Gestión de usuarios
- [ ] Reportes y analytics
- [ ] Email verification
- [ ] Two-factor authentication

## 📄 Licencia

© 2026 Web-Code-Studio. Todos los derechos reservados.
