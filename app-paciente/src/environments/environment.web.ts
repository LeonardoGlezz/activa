/**
 * Configuración de la versión web publicada junto al backend
 * (https://tu-dominio/paciente/). La API vive en el mismo dominio,
 * por eso las rutas son relativas. La app de Android sigue usando
 * environment.prod.ts.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  backendUrl: '',
  clinicName: 'ACTIVA Health Center',
  clinicAddress: 'Av. Principal 123, Ciudad',
  clinicMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Clínica+Fisioterapia'
};
