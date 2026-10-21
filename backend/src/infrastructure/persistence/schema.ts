/**
 * **************************************************************************
 * MÓDULO: schema
 * DESCRIPCIÓN: Deja la base de datos lista para la API. Se usa al arrancar el
 *              servidor (producción) y desde el script db:setup (local).
 *   - Crea solo las tablas que faltan; no modifica ni borra las que ya hay.
 *   - Agrega las columnas del plan/suscripción que usa el código pero que no
 *     están en los modelos.
 *   - Borra los documentos sensibles que Activa ya no guarda (INE, cédula,
 *     título y documentos médicos de pacientes).
 *   - Crea la cuenta de administrador si se le pasan correo y contraseña.
 * **************************************************************************
 */

import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { DataTypes, Op } from "sequelize";
import { sequelize, UserModel, AdminModel, StoredFileModel } from "./sequelize/client";

// Columnas que el código consulta en `physiotherapist` (Stripe / plan activo)
const PHYSIO_EXTRA_COLUMNS = {
  plan_activo: { type: DataTypes.STRING(20), allowNull: true, defaultValue: "inactivo" },
  plan_type: { type: DataTypes.STRING(50), allowNull: true },
  plan_expires_at: { type: DataTypes.DATE, allowNull: true },
  plan_status: { type: DataTypes.STRING(20), allowNull: true, defaultValue: "inactive" },
  stripe_customer_id: { type: DataTypes.STRING, allowNull: true },
  stripe_subscription_id: { type: DataTypes.STRING, allowNull: true },
};

/** Carpetas de uploads/ que ya no se usan: tenían INE, cédulas, títulos y documentos médicos */
const SENSITIVE_UPLOAD_DIRS = ["documents", "patient-medical"];

/**
 * Activa dejó de pedir y guardar documentos de identidad y médicos. Borra los
 * que se subieron antes (en disco y en la tabla stored_file) y la CURP de los
 * fisios. Solo quedan las imágenes y videos de ejercicios. Se puede correr
 * en cada arranque: si ya no hay nada que borrar, no hace nada.
 */
async function purgeSensitiveData(): Promise<void> {
  const qi = sequelize.getQueryInterface();

  const removedFiles = await StoredFileModel.destroy({
    where: { file_path: { [Op.notLike]: "uploads/exercise-media/%" } },
  });
  for (const dir of SENSITIVE_UPLOAD_DIRS) {
    await fs.promises.rm(path.join(process.cwd(), "uploads", dir), { recursive: true, force: true });
  }

  const tables = (await qi.showAllTables()).map((t: any) => (typeof t === "string" ? t : t.tableName));
  if (tables.includes("patient_medical_document")) {
    await qi.dropTable("patient_medical_document");
    console.log("   - tabla patient_medical_document eliminada");
  }

  const [, meta]: any = await sequelize.query(
    "UPDATE physiotherapist SET ine_doc_url = NULL, license_doc_url = NULL, curp = NULL " +
      "WHERE ine_doc_url IS NOT NULL OR license_doc_url IS NOT NULL OR curp IS NOT NULL"
  );
  // Ya no hay paso de documentos: quien se quedó ahí pasa directo a revisión
  await sequelize.query("UPDATE physiotherapist SET status = 'pending_approval' WHERE status = 'pending_profile'");

  const cleared = Number(meta?.affectedRows ?? meta ?? 0);
  if (removedFiles || cleared) {
    console.log(`   - datos sensibles borrados: ${removedFiles} archivo(s), ${cleared} fisio(s) sin documentos ni CURP`);
  }
}

// Columnas que se agregaron a los modelos después de crear las tablas.
// sequelize.sync() no las agrega a una tabla que ya existe.
const ADDED_MODEL_COLUMNS: Record<string, Record<string, any>> = {
  physiotherapist: {
    phone: { type: DataTypes.STRING(20), allowNull: true },
    show_whatsapp: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    license_verified_at: { type: DataTypes.DATE, allowNull: true },
    license_verified_by: { type: DataTypes.STRING, allowNull: true },
  },
  patient: {
    phone: { type: DataTypes.STRING(20), allowNull: true },
  },
  appointment: {
    reminder_sent_at: { type: DataTypes.DATE, allowNull: true },
  },
};

export async function ensureSchema(): Promise<void> {
  await sequelize.sync();

  const qi = sequelize.getQueryInterface();
  const columnsByTable: Record<string, Record<string, any>> = {
    ...ADDED_MODEL_COLUMNS,
    physiotherapist: { ...PHYSIO_EXTRA_COLUMNS, ...ADDED_MODEL_COLUMNS.physiotherapist },
  };
  for (const [table, columns] of Object.entries(columnsByTable)) {
    const existing = await qi.describeTable(table);
    for (const [name, definition] of Object.entries(columns)) {
      if (!existing[name]) {
        await qi.addColumn(table, name, definition);
        console.log(`   + columna ${table}.${name}`);
      }
    }
  }

  // Estado "No asistió" en citas creadas antes de que existiera
  const appointment = await qi.describeTable("appointment");
  if (!String(appointment.status?.type ?? "").includes("no_show")) {
    await qi.changeColumn("appointment", "status", {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed", "no_show"),
      defaultValue: "pending",
    });
    console.log("   + estado de cita no_show");
  }

  await purgeSensitiveData();
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
