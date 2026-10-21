import { SequelizeAppointmentRepository } from "../../infrastructure/persistence/repositories/SequelizeAppointmentRepository";
import { NotificationModel } from "../../infrastructure/persistence/sequelize/client";
import { UpdateAppointmentSchema, describeWhen, overlaps } from "./AppointmentRules";

export class UpdateAppointmentUseCase {
  constructor(private repo: SequelizeAppointmentRepository) {}

  /** Solo cambia fecha, horario, estado y notas; nunca el paciente ni el fisio */
  async execute(id: number, input: unknown): Promise<any> {
    const changes: any = UpdateAppointmentSchema.parse(input);
    const current = await this.repo.findById(id);
    if (!current) throw new Error("Cita no encontrada.");

    const next = { ...current, ...changes };
    if (next.end_time <= next.start_time) throw new Error("La hora de fin debe ser después de la de inicio.");

    const rescheduled =
      next.date !== current.date || next.start_time !== current.start_time || next.end_time !== current.end_time;
    if (rescheduled && next.status !== "cancelled") {
      const sameDay = (await this.repo.findByPhysio(current.id_physio)).filter(
        (a) => a.id_appointment !== id && a.date === next.date && a.status !== "cancelled"
      );
      const clash = sameDay.find((a) => overlaps(next.start_time, next.end_time, a.start_time, a.end_time));
      if (clash) {
        throw new Error(`Ese horario se cruza con otra cita de ${clash.start_time.slice(0, 5)} a ${clash.end_time.slice(0, 5)}.`);
      }
      // Hay que volver a avisar un día antes del nuevo horario
      changes.reminder_sent_at = null;
    }

    const updated = await this.repo.update(id, changes);

    const message =
      changes.status === "cancelled" && current.status !== "cancelled"
        ? `Tu cita del ${describeWhen(current.date, current.start_time)} fue cancelada.`
        : rescheduled && next.status !== "cancelled"
          ? `Tu cita cambió: ahora es el ${describeWhen(next.date, next.start_time)}.`
          : null;
    if (message) {
      await NotificationModel.create({
        type: "cita",
        message,
        id_patient: current.id_patient,
        id_physio: current.id_physio,
        origin: "physio",
      }).catch((error) => console.error("Error al avisar del cambio de cita:", error));
    }

    return updated;
  }
}
