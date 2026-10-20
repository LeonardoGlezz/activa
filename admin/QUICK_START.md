## 🎯 Resumen: Descarga, Instala y Ejecuta

### 1️⃣ **Descarga e Instala Node.js**
- Ve a: https://nodejs.org/ (versión LTS recomendada)
- Descarga e instala
- Reinicia tu computadora

### 2️⃣ **Verifica la Instalación**
Abre una terminal/PowerShell y ejecuta:
```powershell
node --version    # Debería mostrar: v18.x.x o mayor
npm --version     # Debería mostrar: 9.x.x o mayor
```

### 3️⃣ **Entra al Directorio**
```powershell
cd C:\Users\TuUsuario\Desktop\Web-Code\Web-Code-Studio-Admin
```

### 4️⃣ **Descarga las Dependencias**
```powershell
npm install
```
(Tarda 2-5 minutos la primera vez)

### 5️⃣ **Inicia el Servidor**
```powershell
npm start
```

### 6️⃣ **¡Listo!** 🚀
Se abrirá automáticamente:
📱 http://localhost:4200

---

## 📋 Comandos Rápidos

| Comando | Qué Hace |
|---------|----------|
| `npm start` | Inicia servidor + abre navegador |
| `npm run dev` | Inicia servidor (sin abrir navegador) |
| `npm run build` | Compila para producción |
| `npm test` | Ejecuta tests |
| `npm run lint` | Revisa el código |

---

## ⚠️ Si Algo Falla

**Error: "npm command not found"**
→ Reinstala Node.js desde https://nodejs.org/

**Error: "Port 4200 already in use"**
→ Ejecuta: `npm run dev -- --port 4201`

**No funciona después de cambios**
→ Detén el servidor (Ctrl+C) y ejecuta:
```powershell
npm start
```

---

## 📁 Archivos Importantes

- `package.json` - Todas las dependencias y scripts
- `src/app/` - Código de la aplicación
- `src/styles.scss` - Estilos globales
- `angular.json` - Configuración de Angular

---

¡Que disfrutes desarrollando! 🎉
