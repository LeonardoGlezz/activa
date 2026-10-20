import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { PatientModel, RoutineModel } from "../../persistence/sequelize/client";

type AccessResult = { ok: true } | { ok: false; status: number; message: string };

/**
 * Un paciente solo accede a lo suyo; un fisio solo a sus propios pacientes.
 */
export async function assertPatientAccess(req: AuthRequest, patientId: number): Promise<AccessResult> {
  const u = req.user;
  if (!u) {
    return { ok: false, status: 401, message: "No autorizado." };
  }

  if (u.role === "patient") {
    if (Number(u.id) !== patientId) {
      return { ok: false, status: 403, message: "No puedes acceder a expedientes de otros pacientes." };
    }
    return { ok: true };
  }

  if (u.role === "physio") {
    const row = await PatientModel.findByPk(patientId);
    if (!row) {
      return { ok: false, status: 404, message: "Paciente no encontrado." };
    }
    const idPhysio = u.id_physio;
    if (idPhysio == null || row.getDataValue("id_physio") !== idPhysio) {
      return { ok: false, status: 403, message: "No tienes permiso para este paciente." };
    }
    return { ok: true };
  }

  return { ok: false, status: 403, message: "Rol no autorizado." };
}

/**
 * Exige acceso al paciente cuyo ID se obtiene de la petición (params o body).
 */
export const requirePatientAccess = (getPatientId: (req: AuthRequest) => unknown) =>
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const patientId = Number(getPatientId(req));
    if (!Number.isInteger(patientId) || patientId <= 0) {
      res.status(400).json({ success: false, message: "ID de paciente inválido." });
      return;
    }
    const gate = await assertPatientAccess(req, patientId);
    if (!gate.ok) {
      res.status(gate.status).json({ success: false, message: gate.message });
      return;
    }
    next();
  };

/**
 * Exige acceso al paciente dueño de la rutina en req.params.id.
 */
export const requireRoutineAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const routineId = Number(req.params.id);
  if (!Number.isInteger(routineId) || routineId <= 0) {
    res.status(400).json({ success: false, message: "El identificador de rutina no es válido." });
    return;
  }
  const routine = await RoutineModel.findByPk(routineId);
  if (!routine) {
    res.status(404).json({ success: false, message: "Rutina no encontrada." });
    return;
  }
  const gate = await assertPatientAccess(req, Number(routine.getDataValue("id_patient")));
  if (!gate.ok) {
    res.status(gate.status).json({ success: false, message: gate.message });
    return;
  }
  next();
};

/**
 * Solo fisioterapeutas (por ejemplo, para crear o editar rutinas).
 */
export const requirePhysio = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "physio") {
    res.status(403).json({ success: false, message: "Solo el fisioterapeuta puede hacer esto." });
    return;
  }
  next();
};
