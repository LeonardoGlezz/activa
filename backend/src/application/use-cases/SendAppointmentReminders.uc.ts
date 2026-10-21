/**
 * **************************************************************************
 * CASO DE USO: SendAppointmentReminders
 * DESCRIPCIÓN: Un día antes de cada cita, avisa al paciente dentro de la app
 *              y, si hay correo configurado, también por correo. Se corre
 *              cada 15 minutos mientras el servidor está despierto; cada cita
 *              se avisa una sola vez (reminder_sent_at).
 * **************************************************************************
 */

import { Op } from "sequelize";
import {
  AppointmentModel,
  NotificationModel,
  PatientModel,
  PhysiotherapistModel,
  UserModel,
} from "../../infrastructure/persistence/sequelize/client";
import { sendMail } from "../../infrastructure/mail/mailer";
import { describeWhen } from "./AppointmentRules";

const HOURS_BEFORE = 24;

/** Fecha y hora actuales en la zona del consultorio, como "AAAA-MM-DD" y minutos desde la época */
function localNow(): { today: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const today = `${get("year")}-${get("month")}-${get("day")}`;
  return { today, minutes: toMinutes(today, `${get("hour")}:${get("minute")}`) };
}

function toMinutes(date: string, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) / 60000;
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export class SendAppointmentRemindersUseCase {
  async execute(): Promise<number> {
    const now = localNow();
    const candidates: any[] = await AppointmentModel.findAll({
      where: {
        status: { [Op.in]: ["pending", "confirmed"] },
        reminder_sent_at: null,
        date: { [Op.between]: [now.today, addDays(now.today, 2)] },
      },
    });

    let sent = 0;
    for (const appt of candidates) {
      const date = String(appt.getDataValue("date")).slice(0, 10);
      const start = String(appt.getDataValue("start_time"));
      const minutesLeft = toMinutes(date, start) - now.minutes;
      if (minutesLeft <= 0 || minutesLeft > HOURS_BEFORE * 60) continue;

      // Se marca primero: si el servidor se reinicia a la mitad, no se repite el aviso
      const [claimed] = await AppointmentModel.update(
        { reminder_sent_at: new Date() },
        { where: { id_appointment: appt.getDataValue("id_appointment"), reminder_sent_at: null } }
      );
      if (!claimed) continue;

      const when = describeWhen(date, start);
      const [patient, physio]: any[] = await Promise.all([
        PatientModel.findByPk(appt.getDataValue("id_patient"), { include: [{ model: UserModel, attributes: ["email"] }] }),
        PhysiotherapistModel.findByPk(appt.getDataValue("id_physio")),
      ]);
      const physioName = physio ? [physio.first_name, physio.last_name_paternal].filter(Boolean).join(" ") : "tu fisioterapeuta";

      await NotificationModel.create({
        type: "recordatorio",
        message: `Recordatorio: tienes cita con ${physioName} el ${when}.`,
        id_patient: appt.getDataValue("id_patient"),
        id_physio: appt.getDataValue("id_physio"),
        origin: "system",
      });

      const email = patient?.User?.email;
      if (email) {
        await sendMail(
          email,
          "Recordatorio de tu cita",
          `Hola ${patient.first_name ?? ""}:\n\nTe recordamos que tienes cita con ${physioName} el ${when}.\n` +
            `Si no puedes asistir, avísale a tu fisioterapeuta lo antes posible.\n\nActiva`
        );
      }
      sent++;
    }
    return sent;
  }
}
