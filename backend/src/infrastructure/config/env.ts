/**
 * Clave para firmar y verificar los JWT. No tiene valor por defecto: si falta,
 * cualquiera podría firmar tokens válidos con una clave conocida.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET no está configurado o tiene menos de 32 caracteres.");
  }
  return secret;
}
