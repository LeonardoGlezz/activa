import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import { AppointmentModel, NotificationModel, PatientModel, RoutineModel, RoutineTemplateModel } from "../../persistence/sequelize/client";
import { exercisesNotUsableBy } from "../controllers/exercise.controller";

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

/** Solo pacientes (p. ej. para ver el contacto de su propio fisio) */
export const requirePatient = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "patient") {
    res.status(403).json({ success: false, message: "Solo para pacientes." });
    return;
  }
  next();
};

/** Responde 404/403 según el resultado; si hay acceso, sigue */
async function gateBy(req: AuthRequest, res: Response, next: NextFunction, row: any, notFound: string) {
  if (!row) {
    res.status(404).json({ success: false, message: notFound });
    return;
  }
  const idPatient = row.getDataValue("id_patient");
  if (idPatient == null) {
    // Sin paciente (por ejemplo, un aviso solo para el fisio): solo su fisio
    if (req.user?.role === "physio" && row.getDataValue("id_physio") === req.user.id_physio) return next();
    res.status(403).json({ success: false, message: "No tienes permiso para esto." });
    return;
  }
  const gate = await assertPatientAccess(req, Number(idPatient));
  if (!gate.ok) {
    res.status(gate.status).json({ success: false, message: gate.message });
    return;
  }
  next();
}

/** Exige acceso al paciente de la cita en req.params.id */
export const requireAppointmentAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const row = await AppointmentModel.findByPk(Number(req.params.id) || 0);
  await gateBy(req, res, next, row, "Cita no encontrada.");
};

/** Exige acceso al paciente (o fisio) de la notificación en req.params.id */
export const requireNotificationAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const row = await NotificationModel.findByPk(Number(req.params.id) || 0);
  await gateBy(req, res, next, row, "Notificación no encontrada.");
};

/** Perfil de fisio: el admin ve cualquiera; un fisio, solo el suyo */
export const requireOwnPhysioOrAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const u = req.user;
  if (u?.role === "admin" || (u?.role === "physio" && Number(req.params.id) === u.id_physio)) return next();
  res.status(403).json({ success: false, message: "No tienes permiso para ver este perfil." });
};

/** Plantilla de rutina en req.params.id: solo el fisio que la creó */
export const requireTemplateAccess = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const row: any = await RoutineTemplateModel.findByPk(Number(req.params.id) || 0, { attributes: ["id_physio"] });
  if (!row || req.user?.role !== "physio" || row.id_physio !== req.user.id_physio) {
    res.status(404).json({ success: false, message: "Plantilla no encontrada." });
    return;
  }
  next();
};

/**
 * Los ejercicios del cuerpo (exerciseIds / exerciseItems) deben ser del banco
 * base o de "Mis ejercicios" del fisio, no de otro fisio.
 */
export const requireUsableExercises = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const ids = [
    ...(Array.isArray(req.body?.exerciseIds) ? req.body.exerciseIds : []),
    ...(Array.isArray(req.body?.exerciseItems) ? req.body.exerciseItems.map((i: any) => i?.exerciseId) : []),
  ].map(Number);
  const blocked = await exercisesNotUsableBy(Number(req.user?.id_physio ?? 0), ids);
  if (blocked.length) {
    res.status(404).json({ success: false, message: "Uno de los ejercicios no existe en tu banco." });
    return;
  }
  next();
};
