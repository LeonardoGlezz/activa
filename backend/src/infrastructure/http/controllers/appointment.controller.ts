import { Request, Response } from "express";
import { ZodError } from "zod";
import { CreateAppointmentUseCase } from "../../../application/use-cases/CreateAppointment.uc";
import { GetAppointmentsByPatientUseCase } from "../../../application/use-cases/GetAppointmentsByPatient.uc";
import { UpdateAppointmentUseCase } from "../../../application/use-cases/UpdateAppointment.uc";
import { GetAppointmentsByPhysioUseCase } from "../../../application/use-cases/GetAppointmentsByPhysio.uc";
import { PhysiotherapistModel } from "../../persistence/sequelize/client";

export class AppointmentController {
  constructor(
    private createAppointment: CreateAppointmentUseCase,
    private getAppointmentsByPatient: GetAppointmentsByPatientUseCase,
    private updateAppointment: UpdateAppointmentUseCase,
    private getAppointmentsByPhysio: GetAppointmentsByPhysioUseCase
  ) {
    this.create = this.create.bind(this);
    this.getByPatient = this.getByPatient.bind(this);
    this.update = this.update.bind(this);
    this.getMyPhysioAppointments = this.getMyPhysioAppointments.bind(this);
  }

  private async resolvePhysioId(req: any): Promise<number | null> {
    const tokenPhysioId = Number(req.user?.id_physio);
    if (tokenPhysioId && !Number.isNaN(tokenPhysioId)) {
      return tokenPhysioId;
    }

    const tokenUserId = Number(req.user?.id || req.user?.id_user);
    if (!tokenUserId || Number.isNaN(tokenUserId)) {
      return null;
    }

    const physio: any = await PhysiotherapistModel.findOne({ where: { id_user: tokenUserId } });
    if (!physio) {
      return null;
    }

    return Number(physio.id_physio || physio.getDataValue("id_physio"));
  }

  async create(req: any, res: Response): Promise<void> {
    try {
      const physioId = await this.resolvePhysioId(req);
      if (!physioId) {
        res.status(401).json({ message: "No autorizado. No se pudo resolver el fisioterapeuta autenticado." });
        return;
      }
      const result = await this.createAppointment.execute(req.body, physioId);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ message: errorMessage(err) });
    }
  }

  async getByPatient(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.getAppointmentsByPatient.execute(Number(req.params.patientId));
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.updateAppointment.execute(Number(req.params.id), req.body);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: errorMessage(err) });
    }
  }

  async getMyPhysioAppointments(req: any, res: Response): Promise<void> {
    try {
      const idPhysio = await this.resolvePhysioId(req);
      if (!idPhysio) {
        res.status(401).json({ message: "No autorizado. No se pudo resolver el fisioterapeuta autenticado." });
        return;
      }

      const result = await this.getAppointmentsByPhysio.execute(idPhysio);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }
}

function errorMessage(err: any): string {
  return err instanceof ZodError ? err.issues[0]?.message || "Datos de la cita inválidos." : err?.message || "No se pudo guardar la cita.";
}
