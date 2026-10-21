import { SequelizeAppointmentRepository } from "../../infrastructure/persistence/repositories/SequelizeAppointmentRepository";
import { NotificationModel } from "../../infrastructure/persistence/sequelize/client";
import { CreateAppointmentSchema, describeWhen, overlaps } from "./AppointmentRules";

export class CreateAppointmentUseCase {
  constructor(private repo: SequelizeAppointmentRepository) {}

  async execute(input: unknown, idPhysio: number): Promise<any> {
    const data = CreateAppointmentSchema.parse(input);

    const sameDay = (await this.repo.findByPhysio(idPhysio)).filter(
      (a) => a.date === data.date && a.status !== "cancelled"
    );
    for (const app of sameDay) {
      if (overlaps(data.start_time, data.end_time, app.start_time, app.end_time)) {
        throw new Error(
          `Ese horario se cruza con otra cita de ${app.start_time.slice(0, 5)} a ${app.end_time.slice(0, 5)}.`
        );
      }
    }

    const appointment = await this.repo.create({ ...data, status: data.status ?? "pending", id_physio: idPhysio });

    try {
      await NotificationModel.create({
        type: "cita",
        message: `Tu fisioterapeuta te agendó una cita el ${describeWhen(data.date, data.start_time)}.`,
        id_patient: data.id_patient,
        id_physio: idPhysio,
        origin: "physio",
      });
    } catch (error) {
      console.error("Error al crear la notificación de cita:", error);
    }

    return appointment;
  }
}
