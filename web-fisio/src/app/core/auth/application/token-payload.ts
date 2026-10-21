/**
 * Lee los datos que trae el token de sesión. Decodifica en UTF-8 para que los
 * nombres con acentos y ñ se vean bien ("María José", no "Marã­a Josã©").
 */
export function readTokenPayload(token: string | null = localStorage.getItem('token')): any | null {
  try {
    const part = (token || '').split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}
