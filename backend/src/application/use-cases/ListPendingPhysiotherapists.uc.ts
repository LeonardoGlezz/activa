import { PhysiotherapistRepository } from "../ports/out/PhysiotherapistRepository";

export class ListPendingPhysiotherapistsUseCase {
  constructor(private readonly physioRepo: PhysiotherapistRepository) {}

  /** Por defecto, los fisios que ya subieron documentos y esperan validación */
  async execute(status = "pending_approval"): Promise<any[]> {
    return await this.physioRepo.findByStatus(status);
  }
}
