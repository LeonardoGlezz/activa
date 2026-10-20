import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.activa.fisioterapia',
  appName: 'ACTIVA',
  webDir: 'www',
  // 📱 PRUEBAS EN DISPOSITIVO FÍSICO
  // Comenta este bloque 'server' cuando vayas a subir a producción / Play Store
  server: {
    androidScheme: 'http',
    cleartext: true  // Permite HTTP (no HTTPS) en Android para pruebas locales
  }
};

export default config;
