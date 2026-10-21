import { Request, Response } from "express";
import { ZodError } from "zod";
import { GetAdminOverviewUseCase } from "../../../application/use-cases/GetAdminOverview.uc";
import { AdminError, AdminManagementUseCase } from "../../../application/use-cases/AdminManagement.uc";

export class AdminController {
  constructor(
    private readonly getAdminOverview: GetAdminOverviewUseCase,
    private readonly management: AdminManagementUseCase
  ) {}

  getOverview = async (_req: Request, res: Response): Promise<void> => {
    try {
      const [data, usage] = await Promise.all([this.getAdminOverview.execute(), this.management.usage()]);
      res.status(200).json({ success: true, ...data, usage });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || "Error al obtener el resumen administrativo.",
      });
    }
  };

  listPhysios = this.handle((_req) => this.management.listPhysios());
  createPhysio = this.handle((req) => this.management.createPhysio(req.body), 201);
  updatePhysio = this.handle((req) => this.management.updatePhysio(this.id(req), req.body));
  setPhysioPassword = this.handle((req) => this.management.setPhysioPassword(this.id(req), req.body?.password));
  listPatients = this.handle((_req) => this.management.listPatients());
  getPatient = this.handle((req) => this.management.getPatient(this.id(req)));
  setPatientPassword = this.handle((req) => this.management.setPatientPassword(this.id(req), req.body?.password));
  activity = this.handle((req) => this.management.activity(Math.min(Number(req.query.days) || 30, 365)));

  private id(req: Request): number {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) throw new AdminError(400, "Identificador inválido.");
    return id;
  }

  /** Responde el resultado como JSON y traduce los errores a mensajes para el admin */
  private handle(fn: (req: Request) => Promise<unknown>, okStatus = 200) {
    return async (req: Request, res: Response): Promise<void> => {
      try {
        res.status(okStatus).json(await fn(req));
      } catch (error: any) {
        if (error instanceof ZodError) {
          res.status(400).json({ message: error.issues[0]?.message || "Datos inválidos." });
        } else if (error instanceof AdminError) {
          res.status(error.status).json({ message: error.message });
        } else {
          console.error("Error en panel de administración:", error);
          res.status(500).json({ message: "Ocurrió un error. Intenta de nuevo." });
        }
      }
    };
  }
}
