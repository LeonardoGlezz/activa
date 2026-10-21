/**
 * **************************************************************************
 * MÓDULO: schema
 * DESCRIPCIÓN: Deja la base de datos lista para la API. Se usa al arrancar el
 *              servidor (producción) y desde el script db:setup (local).
 *   - Crea solo las tablas que faltan; no modifica ni borra las que ya hay.
 *   - Agrega las columnas del plan/suscripción que usa el código pero que no
 *     están en los modelos.
 *   - Crea la cuenta de administrador si se le pasan correo y contraseña.
 * **************************************************************************
 */

import bcrypt from "bcrypt";
import { DataTypes } from "sequelize";
import { sequelize, UserModel, AdminModel } from "./sequelize/client";

// Columnas que el código consulta en `physiotherapist` (Stripe / plan activo)
const PHYSIO_EXTRA_COLUMNS = {
  plan_activo: { type: DataTypes.STRING(20), allowNull: true, defaultValue: "inactivo" },
  plan_type: { type: DataTypes.STRING(50), allowNull: true },
  plan_expires_at: { type: DataTypes.DATE, allowNull: true },
  plan_status: { type: DataTypes.STRING(20), allowNull: true, defaultValue: "inactive" },
  stripe_customer_id: { type: DataTypes.STRING, allowNull: true },
  stripe_subscription_id: { type: DataTypes.STRING, allowNull: true },
};

export async function ensureSchema(): Promise<void> {
  await sequelize.sync();

  const qi = sequelize.getQueryInterface();
  const existing = await qi.describeTable("physiotherapist");
  for (const [name, definition] of Object.entries(PHYSIO_EXTRA_COLUMNS)) {
    if (!existing[name]) {
      await qi.addColumn("physiotherapist", name, definition);
      console.log(`   + columna physiotherapist.${name}`);
    }
  }
}

export async function findOrCreateUser(email: string, role: string, password: string | null) {
  const found: any = await UserModel.findOne({ where: { email } });
  if (found) return found;
  const hash = password ? await bcrypt.hash(password, 10) : null;
  return (await UserModel.create({ email, role, password: hash })) as any;
}

/**
 * Crea el administrador si todavía no existe. Si el correo ya existe no toca
 * su contraseña, así cambiar ADMIN_PASSWORD después no tiene efecto, salvo
 * con resetPassword (ADMIN_RESET_PASSWORD=true): así recupera el acceso si la olvida.
 */
export async function ensureAdmin(email: string, password: string, resetPassword = false): Promise<void> {
  const user = await findOrCreateUser(email.trim().toLowerCase(), "admin", password);
  if (resetPassword && user.getDataValue("role") === "admin") {
    await user.update({ password: await bcrypt.hash(password, 10) });
  }
  await AdminModel.findOrCreate({
    where: { id_user: user.id_user },
    defaults: { name: "Administrador", id_user: user.id_user },
  });
}
