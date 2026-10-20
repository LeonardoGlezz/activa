// Instala dependencias de todas las carpetas y crea backend/.env si no existe.
// Uso: npm run setup   (funciona igual en Windows, macOS y Linux)
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const folders = ["backend", "web-fisio", "app-paciente", "admin"];

for (const folder of folders) {
  console.log(`\n📦 Instalando dependencias de ${folder}...`);
  execSync("npm install", { cwd: path.join(root, folder), stdio: "inherit" });
}

const envFile = path.join(root, "backend", ".env");
if (!fs.existsSync(envFile)) {
  fs.copyFileSync(path.join(root, "backend", ".env.example"), envFile);
  console.log("\n📝 Creado backend/.env a partir de backend/.env.example");
}

console.log("\n✅ Listo. Siguiente paso: npm run db:up && npm run db:setup && npm run dev");
