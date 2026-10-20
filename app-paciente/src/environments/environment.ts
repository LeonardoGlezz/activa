// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
// Navegador: localhost está bien.
// Emulador Android: usa apiUrl: 'http://10.0.2.2:3000/api'
// Teléfono físico: usa la IP de tu PC en la misma Wi‑Fi, ej. 'http://192.168.1.100:3000/api'

export const environment = {
  production: false,
  apiUrl: 'https://impartial-art-production.up.railway.app/api',
  backendUrl: 'https://impartial-art-production.up.railway.app',
  clinicName: 'ACTIVA Health Center',
  clinicAddress: 'Av. Principal 123, Ciudad',
  clinicMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Clínica+Fisioterapia'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.\n *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
