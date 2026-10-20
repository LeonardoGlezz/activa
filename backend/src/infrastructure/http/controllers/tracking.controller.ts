/**
 * **************************************************************************
 * CONTROLADOR DE SEGUIMIENTO (TRACKING) - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * **************************************************************************
 */

import { Request, Response } from "express";
import { TrackingSchema } from "../../../application/dtos/schemas";
import { AuthRequest } from "../middlewares/auth.middleware";

export class TrackingController {
  constructor(
    private readonly registerPainLevel: any,
    private readonly listPatientTracking?: any,
  ) {}

  /**
   * GET /api/tracking/patient/:patientId — El paciente ve lo suyo; el fisio, lo de sus pacientes.
   */
  listByPatient = async (req: Request<{ patientId: string }>, res: Response): Promise<void> => {
    try {
      const patientId = parseInt(req.params.patientId, 10);
      if (isNaN(patientId)) {
        res.status(400).json({ success: false, message: "ID de paciente inválido." });
        return;
      }
      const data = await this.listPatientTracking.execute(patientId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: "No se pudo obtener el historial de sesiones." });
    }
  };

  /**
   * POST /api/tracking — Solo pacientes (JWT con id = id_patient).
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = req as AuthRequest;
      const user = auth.user;
      if (!user || user.role !== "patient") {
        res.status(403).json({
          success: false,
          message: "Solo los pacientes pueden registrar seguimiento de sesión.",
        });
        return;
      }

      const validatedData = TrackingSchema.parse(req.body);
      const tracking = await this.registerPainLevel.execute(validatedData, user.id);

      res.status(201).json({
        success: true,
        message: "Reporte de molestias registrado exitosamente.",
        data: tracking,
      });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        res.status(400).json({
          success: false,
          message: "Los datos del reporte de dolor no cumplen con el formato requerido.",
          errors: error.issues ?? error.errors,
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: error?.message || "No se pudo procesar el registro de seguimiento.",
      });
    }
  };
}
