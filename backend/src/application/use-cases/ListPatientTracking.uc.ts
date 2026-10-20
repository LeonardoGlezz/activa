import { TrackingRepository } from "../ports/out/TrackingRepository";

/** Historial de sesiones (dolor y comentarios) que registró el paciente. */
export class ListPatientTrackingUseCase {
  constructor(private readonly trackingRepo: TrackingRepository) {}

  async execute(patientId: number) {
    const rows = await this.trackingRepo.findByPatient(patientId);
    return rows.map((r: any) => ({
      id: r.id_tracking,
      date: r.date,
      painLevel: r.pain_level,
      completed: Boolean(r.completed),
      feedback: r.feedback || "",
      routineId: r.id_routine,
      routineName: r.Routine?.name || "",
    }));
  }
}
