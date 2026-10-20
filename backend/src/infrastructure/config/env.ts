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

/**
 * Stripe es opcional. Sin una clave real (sk_live_ / sk_test_ con valor) la API
 * arranca igual, los pagos no se ofrecen y los fisios aprobados no necesitan plan.
 */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return /^sk_(live|test)_/.test(key) && key !== "sk_test_sin_configurar";
}
