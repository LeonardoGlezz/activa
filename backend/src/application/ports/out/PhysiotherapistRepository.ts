import { Physiotherapist } from "../../../domain/entities/Physiotherapist";
import { CreatePhysiotherapistDTO } from "../../dtos/physiotherapist.dto";

export interface PhysiotherapistRepository {
  create(data: CreatePhysiotherapistDTO): Promise<Physiotherapist>;
  findById(id: number): Promise<Physiotherapist | null>;
  /** Al aprobar guarda cuándo y quién revisó la cédula en el registro de la SEP */
  updateStatus(id: number, status: "pending_profile" | "pending_approval" | "approved" | "rejected", verifiedBy?: string): Promise<void>;

findByStatus(status: string): Promise<any[]>;
}