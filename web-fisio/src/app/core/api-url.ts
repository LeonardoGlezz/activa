import { environment } from '../../environments/environment.development';

/** Base del backend sin /api (ej. http://localhost:3000) */
export const WS_BASE_URL = environment.webservice.baseUrl;

/** Prefijo REST (/api) */
export const API_ROOT = `${WS_BASE_URL.replace(/\/$/, '')}/api`;
