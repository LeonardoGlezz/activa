import { RoutineRepository } from "../ports/out/RoutineRepository";

export class DeleteRoutineUseCase {
  constructor(private readonly routineRepository: RoutineRepository) {}

  /**
   * Elimina una rutina solo si el paciente aún no registró avances en ella.
   * Si ya tiene avances, se debe finalizar (cambiar fecha fin) para no perder el historial.
   */
  async execute(id: number) {
    const trackingCount = await this.routineRepository.countTracking(id);
    if (trackingCount > 0) {
      const error: any = new Error("Esta rutina ya tiene avances del paciente. Finalízala en lugar de eliminarla para conservar su historial.");
      error.code = "ROUTINE_HAS_TRACKING";
      throw error;
    }
    await this.routineRepository.deleteById(id);
  }
}
