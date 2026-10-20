// En producción el backend vive en el mismo dominio que este panel
// (https://tu-dominio/api), por eso la base va vacía.
export const environment = {
  production: true,
  version: 'prod.0.0.1',
  webservice: {
    baseUrl: '',
  }
};
