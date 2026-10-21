/**
 * **************************************************************************
 * CASO DE USO: AdminManagement
 * DESCRIPCIÓN: Lo que el administrador gestiona desde su panel: fisios
 *              (alta, corrección de datos, contraseña), pacientes (lista y
 *              detalle) y la actividad reciente de la plataforma.
 * **************************************************************************
 */

import bcrypt from "bcrypt";
import { Op, fn, col } from "sequelize";
import { z } from "zod";
import {
  sequelize,
  UserModel,
  PhysiotherapistModel,
  PatientModel,
  RoutineModel,
  TrackingModel,
  AppointmentModel,
} from "../../infrastructure/persistence/sequelize/client";

/** Error con código HTTP para que el controlador responda sin adivinar */
export class AdminError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

const optionalText = z.string().trim().optional().transform((v) => (v ? v : null));
const optionalPhone = z
  .string()
  .optional()
  .transform((v) => (v ? v.replace(/\D/g, "") : ""))
  .refine((v) => !v || v.length === 10, "El celular debe tener 10 números")
  .transform((v) => (v ? v : null));

const PhysioDataSchema = z.object({
  firstName: z.string().trim().min(2, "Escribe el nombre"),
  lastNameP: z.string().trim().min(2, "Escribe el apellido paterno"),
  lastNameM: optionalText,
  email: z.string().trim().toLowerCase().email("El correo no es válido"),
  professionalLicense: optionalText,
  phone: optionalPhone,
});

const PasswordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

export const CreatePhysioByAdminSchema = PhysioDataSchema.extend({ password: PasswordSchema });
export const UpdatePhysioByAdminSchema = PhysioDataSchema;

type PhysioData = z.infer<typeof PhysioDataSchema>;

function fullName(row: any): string {
  return [row?.first_name, row?.last_name_paternal, row?.last_name_maternal].filter(Boolean).join(" ");
}

/** Día AAAA-MM-DD en la zona del consultorio, igual que las sesiones guardadas */
function dateOnly(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: process.env.APP_TIMEZONE || "America/Mexico_City" }).format(d);
}

function daysAgo(n: number): string {
  return dateOnly(new Date(Date.now() - n * 86400000));
}

/** Traduce los choques de datos únicos a un mensaje que el admin entienda */
function friendlyUniqueError(error: any): never {
  if (error?.name === "SequelizeUniqueConstraintError") {
    const field = String(error.errors?.[0]?.path ?? "");
    if (field.includes("email")) throw new AdminError(409, "Ese correo ya está en uso por otra cuenta.");
    if (field.includes("license")) throw new AdminError(409, "Esa cédula profesional ya está registrada.");
    throw new AdminError(409, "Uno de los datos ya está registrado en otra cuenta.");
  }
  throw error;
}

/** Cuenta filas agrupadas por una columna: { valor: total } */
async function countBy(model: any, column: string, where: any = {}): Promise<Map<number, number>> {
  const rows = (await model.findAll({
    attributes: [column, [fn("COUNT", col("*")), "total"]],
    where,
    group: [column],
    raw: true,
  })) as any[];
  return new Map(rows.map((r) => [Number(r[column]), Number(r.total)]));
}

export class AdminManagementUseCase {
  // ============================================================
  // FISIOTERAPEUTAS
  // ============================================================

  async listPhysios() {
    const [physios, patientCounts] = await Promise.all([
      PhysiotherapistModel.findAll({
        include: [{ model: UserModel, attributes: ["email"] }],
        order: [["created_at", "DESC"]],
      }),
      countBy(PatientModel, "id_physio"),
    ]);
    return physios.map((f) => {
      const { User, ...plain } = f.get({ plain: true }) as any;
      return {
        ...plain,
        email: User?.email ?? null,
        patients: patientCounts.get(plain.id_physio) ?? 0,
      };
    });
  }

  /** El admin da de alta al fisio ya validado: entra de inmediato con la contraseña que le pase. */
  async createPhysio(input: unknown) {
    const data = CreatePhysioByAdminSchema.parse(input);
    if (await UserModel.findOne({ where: { email: data.email } })) {
      throw new AdminError(409, "Ese correo ya está en uso por otra cuenta.");
    }
    const t = await sequelize.transaction();
    try {
      const user: any = await UserModel.create(
        { email: data.email, password: await bcrypt.hash(data.password, 10), role: "physio" },
        { transaction: t }
      );
      const physio: any = await PhysiotherapistModel.create(
        { ...this.physioColumns(data), status: "approved", license_verified_at: new Date(), id_user: user.getDataValue("id_user") },
        { transaction: t }
      );
      await t.commit();
      return { id_physio: physio.getDataValue("id_physio"), message: `${fullName(physio.get({ plain: true }))} ya puede entrar al panel.` };
    } catch (error) {
      await t.rollback();
      friendlyUniqueError(error);
    }
  }

  async updatePhysio(id: number, input: unknown) {
    const data = UpdatePhysioByAdminSchema.parse(input);
    const physio: any = await PhysiotherapistModel.findByPk(id);
    if (!physio) throw new AdminError(404, "Fisioterapeuta no encontrado.");
    const idUser = physio.getDataValue("id_user");
    const other: any = await UserModel.findOne({ where: { email: data.email } });
    if (other && other.getDataValue("id_user") !== idUser) {
      throw new AdminError(409, "Ese correo ya está en uso por otra cuenta.");
    }
    const t = await sequelize.transaction();
    try {
      await physio.update(this.physioColumns(data), { transaction: t });
      await UserModel.update({ email: data.email }, { where: { id_user: idUser }, transaction: t });
      await t.commit();
      return { message: "Datos actualizados." };
    } catch (error) {
      await t.rollback();
      friendlyUniqueError(error);
    }
  }

  async setPhysioPassword(id: number, password: unknown) {
    const physio: any = await PhysiotherapistModel.findByPk(id);
    if (!physio) throw new AdminError(404, "Fisioterapeuta no encontrado.");
    await this.setUserPassword(physio.getDataValue("id_user"), password);
    return { message: "Contraseña nueva guardada. Compártela con el fisio por un medio privado." };
  }

  private physioColumns(data: PhysioData) {
    return {
      first_name: data.firstName,
      last_name_paternal: data.lastNameP,
      last_name_maternal: data.lastNameM,
      professional_license: data.professionalLicense,
      phone: data.phone,
    };
  }

  private async setUserPassword(idUser: number, password: unknown) {
    const plain = PasswordSchema.parse(password);
    await UserModel.update({ password: await bcrypt.hash(plain, 10) }, { where: { id_user: idUser } });
  }

  // ============================================================
  // PACIENTES
  // ============================================================

  async listPatients() {
    const today = dateOnly(new Date());
    const [patients, physios, sessions, lastSessions, activeRoutines] = await Promise.all([
      PatientModel.findAll({
        include: [{ model: UserModel, attributes: ["email", "password"] }],
        order: [["created_at", "DESC"]],
      }),
      PhysiotherapistModel.findAll({ attributes: ["id_physio", "first_name", "last_name_paternal", "last_name_maternal"] }),
      countBy(TrackingModel, "id_patient"),
      TrackingModel.findAll({
        attributes: ["id_patient", [fn("MAX", col("date")), "last"]],
        group: ["id_patient"],
        raw: true,
      }) as Promise<any[]>,
      countBy(RoutineModel, "id_patient", {
        start_date: { [Op.lte]: today },
        [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }],
      }),
    ]);
    const physioNames = new Map(physios.map((p: any) => [p.getDataValue("id_physio"), fullName(p.get({ plain: true }))]));
    const last = new Map(lastSessions.map((r) => [Number(r.id_patient), r.last]));

    return patients.map((p) => {
      const { User, ...plain } = p.get({ plain: true }) as any;
      return {
        id_patient: plain.id_patient,
        name: fullName(plain),
        email: User?.email ?? null,
        can_login: Boolean(User?.password && String(User.password).startsWith("$2")),
        id_physio: plain.id_physio,
        physio_name: physioNames.get(plain.id_physio) ?? "—",
        created_at: plain.created_at,
        active_routines: activeRoutines.get(plain.id_patient) ?? 0,
        sessions: sessions.get(plain.id_patient) ?? 0,
        last_session: last.get(plain.id_patient) ?? null,
      };
    });
  }

  /**
   * Detalle para soporte: cuenta, fisio y cuánto usa la app. Como encargado,
   * el operador no ve datos clínicos: ni nombres de rutinas, ni ejercicios,
   * ni dolor, notas o citas. Esos solo los ve el fisio del paciente.
   */
  async getPatient(id: number) {
    const patient: any = await PatientModel.findByPk(id, {
      include: [{ model: UserModel, attributes: ["email", "password"] }],
    });
    if (!patient) throw new AdminError(404, "Paciente no encontrado.");
    const { User, ...plain } = patient.get({ plain: true });
    const today = dateOnly(new Date());
    const [physio, routines, activeRoutines, sessions, lastSession] = await Promise.all([
      PhysiotherapistModel.findByPk(plain.id_physio),
      RoutineModel.count({ where: { id_patient: id } }),
      RoutineModel.count({
        where: {
          id_patient: id,
          start_date: { [Op.lte]: today },
          [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }],
        },
      }),
      TrackingModel.count({ where: { id_patient: id } }),
      TrackingModel.max("date", { where: { id_patient: id } }),
    ]);
    return {
      id_patient: plain.id_patient,
      name: fullName(plain),
      email: User?.email ?? null,
      can_login: Boolean(User?.password && String(User.password).startsWith("$2")),
      created_at: plain.created_at,
      id_physio: plain.id_physio,
      physio_name: physio ? fullName(physio.get({ plain: true })) : "—",
      routines,
      active_routines: activeRoutines,
      sessions,
      last_session: lastSession ?? null,
    };
  }

  async setPatientPassword(id: number, password: unknown) {
    const patient: any = await PatientModel.findByPk(id);
    if (!patient) throw new AdminError(404, "Paciente no encontrado.");
    await this.setUserPassword(patient.getDataValue("id_user"), password);
    return { message: "Contraseña nueva guardada. Compártela con el paciente por un medio privado." };
  }

  // ============================================================
  // ACTIVIDAD Y MÉTRICAS
  // ============================================================

  /** Eventos recientes de la plataforma, del más nuevo al más viejo */
  async activity(days = 30, limit = 100) {
    const since = new Date(Date.now() - days * 86400000);
    const [physios, patients, sessions, appointments, allPhysios] = await Promise.all([
      PhysiotherapistModel.findAll({ where: { created_at: { [Op.gte]: since } } }),
      PatientModel.findAll({ where: { created_at: { [Op.gte]: since } } }),
      TrackingModel.findAll({
        where: { date: { [Op.gte]: dateOnly(since) } },
        attributes: ["id_tracking", "date", "id_patient"],
        order: [["date", "DESC"], ["id_tracking", "DESC"]],
        limit,
      }),
      AppointmentModel.findAll({ where: { created_at: { [Op.gte]: since } } }),
      PhysiotherapistModel.findAll({ attributes: ["id_physio", "first_name", "last_name_paternal", "last_name_maternal"] }),
    ]);
    const physioNames = new Map(allPhysios.map((p: any) => [p.getDataValue("id_physio"), fullName(p.get({ plain: true }))]));
    const patientIds = [...new Set([...sessions, ...appointments].map((r: any) => r.getDataValue("id_patient")))];
    const sessionPatients = patientIds.length
      ? await PatientModel.findAll({ where: { id_patient: patientIds } })
      : [];
    const patientNames = new Map(
      [...patients, ...sessionPatients].map((p: any) => [p.getDataValue("id_patient"), fullName(p.get({ plain: true }))])
    );

    const events = [
      ...physios.map((p: any) => ({
        type: "physio",
        date: p.getDataValue("created_at"),
        text: `${fullName(p.get({ plain: true }))} creó su cuenta de fisioterapeuta`,
        link: "/fisioterapeuta",
      })),
      ...patients.map((p: any) => ({
        type: "patient",
        date: p.getDataValue("created_at"),
        text: `${physioNames.get(p.getDataValue("id_physio")) ?? "Un fisio"} dio de alta a ${fullName(p.get({ plain: true }))}`,
        link: `/pacientes/${p.getDataValue("id_patient")}`,
      })),
      ...sessions.map((s: any) => ({
        type: "session",
        date: s.getDataValue("date"),
        text: `${patientNames.get(s.getDataValue("id_patient")) ?? "Un paciente"} terminó una sesión de ejercicios`,
        link: `/pacientes/${s.getDataValue("id_patient")}`,
      })),
      ...appointments.map((a: any) => ({
        type: "appointment",
        date: a.getDataValue("created_at"),
        text: `Nueva cita de ${patientNames.get(a.getDataValue("id_patient")) ?? "un paciente"} con ${physioNames.get(a.getDataValue("id_physio")) ?? "su fisio"} para el ${a.getDataValue("date")}`,
        link: `/pacientes/${a.getDataValue("id_patient")}`,
      })),
    ];
    // Las sesiones solo guardan el día: van al mediodía para ordenarlas junto a lo demás
    const time = (d: any) => (typeof d === "string" && d.length === 10 ? new Date(`${d}T12:00:00`) : new Date(d)).getTime();
    return events
      .map((e) => ({ ...e, date: typeof e.date === "string" && e.date.length === 10 ? e.date : new Date(e.date).toISOString() }))
      .sort((a, b) => time(b.date) - time(a.date))
      .slice(0, limit);
  }

  /** Uso de la app por pacientes: sesiones por día (últimos 14 días) y pacientes activos */
  async usage() {
    const from = daysAgo(13);
    const [perDay, active7, sessions7, sessions30, newPatients30] = await Promise.all([
      TrackingModel.findAll({
        attributes: ["date", [fn("COUNT", col("*")), "total"]],
        where: { date: { [Op.gte]: from } },
        group: ["date"],
        raw: true,
      }) as Promise<any[]>,
      TrackingModel.count({ where: { date: { [Op.gte]: daysAgo(6) } }, distinct: true, col: "id_patient" }),
      TrackingModel.count({ where: { date: { [Op.gte]: daysAgo(6) } } }),
      TrackingModel.count({ where: { date: { [Op.gte]: daysAgo(29) } } }),
      PatientModel.count({ where: { created_at: { [Op.gte]: new Date(Date.now() - 30 * 86400000) } } }),
    ]);
    const byDate = new Map(perDay.map((r) => [String(r.date).slice(0, 10), Number(r.total)]));
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = daysAgo(13 - i);
      return { date: d, sessions: byDate.get(d) ?? 0 };
    });
    return {
      sessions_per_day: days,
      active_patients_7d: active7,
      sessions_7d: sessions7,
      sessions_30d: sessions30,
      new_patients_30d: newPatients30,
    };
  }
}
