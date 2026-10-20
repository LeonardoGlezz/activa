# 🚀 Guía de Instalación y Ejecución

## ⚙️ Requisitos Sistema

Asegúrate de tener instalados:

- **Node.js v18 o superior** - [Descargar](https://nodejs.org/)
- **npm v9 o superior** - Se instala con Node.js
- **Git** - [Descargar](https://git-scm.com/)

Verifica las versiones:
```bash
node --version       # v18.x.x o superior
npm --version        # v9.x.x o superior
git --version        # git version x.x.x
```

## 📥 Pasos de Instalación

### 1. **Entra al directorio del proyecto**
```bash
cd Web-Code-Studio-Admin
```

### 2. **Instala todas las dependencias**
```bash
npm install
```

Esto descargará ~400-500 MB en `node_modules/` la primera vez.

### 3. **Inicia el servidor de desarrollo**
```bash
npm start
```

O si prefieres sin abrir automáticamente en navegador:
```bash
npm run dev
```

### 4. **¡Listo! 🎉**
El sitio estará disponible en:
- 🌐 **http://localhost:4200**

## 🔍 Verifica que está corriendo

Si ves en la terminal algo como:
```
✔ Compiled successfully.
* Local: http://localhost:4200/
```

¡Entonces está listo para usar! 🚀

## 💻 Usando la Aplicación

### En la Pantalla de Inicio
1. Verás el logo y nombre de **Activa**
2. Dos botones principales:
   - **🚀 Iniciar Sesión** - Ir al login
   - **📝 Registrarse** - Ir al registro

### Formulario de Login
- **Email:** admin@ejemplo.com
- **Contraseña:** cualquier contraseña (mínimo 6 caracteres)
- **Recuérdame:** checkbox opcional

### Formulario de Registro
- **Nombre Completo:** mínimo 3 caracteres
- **Email:** debe ser válido
- **Contraseña:** mínimo 8 caracteres
- **Confirmar Contraseña:** debe coincidir
- **Términos:** acepta T&C
- Validaciones en tiempo real ✨

## 📦 Comandos Útiles

```bash
# Desarrollo
npm start              # Dev server con auto-reload (http://localhost:4200)
npm run dev            # Dev server sin abrir navegador

# Build
npm run build          # Compilar para producción
npm run build:prod     # Build optimizado
npm run watch          # Modo watch (rebuild automático)

# Testing & Linting
npm test               # Ejecutar tests
npm run lint           # Analizar código

# Limpieza
rm -rf node_modules package-lock.json
npm install            # Reinstalar toda dependencias
```

## 🐛 Solución de Problemas

### Error: "ng command not found"
```bash
npm install -g @angular/cli
npm start
```

### Puerto 4200 ya está en uso
```bash
ng serve --port 4201
```

### Problemas con node_modules
```bash
# Limpia y reinstala
rm -rf node_modules package-lock.json
npm install
npm start
```

### Cambios no se reflejan
```bash
# Limpia la caché de Angular
rm -rf .angular
npm start
```

## 🚢 Despliegue a Producción

### Compilar para producción
```bash
npm run build:prod
```

Genera la carpeta `dist/web-code-studio-admin` con los archivos listos para servir.

### Servir localmente la build
```bash
# Instala un servidor web simple
npm install -g http-server

# Ve al directorio dist
cd dist/web-code-studio-admin

# Inicia el servidor
http-server
```

Será accesible en `http://localhost:8080`

## 📊 Estructura de Carpetas Importante

- `src/app/pages/` - Páginas principales (home, login, register)
- `src/app/components/` - Componentes reutilizables (navbar)
- `src/app/app.routes.ts` - Definición de rutas
- `src/styles.scss` - Estilos globales
- `src/environments/` - Configuración por entorno

## 🔗 Recursos Útiles

- [Angular Docs](https://angular.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [SCSS Documentation](https://sass-lang.com/documentation)
- [RxJS Guide](https://rxjs.dev/)

## ✨ Tips para Desarrollo

1. **Auto-reload**: Angular CLI recarga automáticamente cuando cambias archivos
2. **DevTools**: Abre F12 para debug en el navegador
3. **Componentes**: Todos son standalone (importa solo lo necesario)
4. **Estilos**: Usa SCSS con nesting y mixins para código más limpio
5. **Validación**: Usa Reactive Forms para validación avanzada

## 🤝 Soporte

Si tienes problemas, verifica:
1. Node.js versión correcta: `node --version`
2. npm versión correcta: `npm --version`
3. Elimina node_modules y reinstala: `npm install`
4. Revisa que el puerto 4200 esté libre
5. Limpia caché: `rm -rf .angular && npm start`

---

¡Feliz desarrollo! 🚀
