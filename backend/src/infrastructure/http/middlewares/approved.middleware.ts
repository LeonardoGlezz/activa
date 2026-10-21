import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware"; // Importamos la interfaz del otro archivo
import { PhysiotherapistModel } from "../../persistence/sequelize/client";

export const requireApproval = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Verificamos que el usuario exista en la petición (esto lo pone el authMiddleware)
  if (!req.user) {
    res.status(401).json({ success: false, message: "No autorizado." });
    return;
  }

  // ✅ Los pacientes pasan directo — el campo 'status' es exclusivo de fisioterapeutas
  if (req.user.role === 'patient') {
    next();
    return;
  }

  // 🛡️ EL CANDADO DE TITANIO: Si el fisio no está aprobado, lo rebotamos.
  // El estado se lee de la base (no del token) para que "Quitar acceso" en el admin aplique de inmediato.
  let status = req.user.status;
  if (req.user.role === 'physio') {
    const fisio: any = await PhysiotherapistModel.findOne({ where: { id_user: req.user.id }, attributes: ['status'] });
    status = fisio?.getDataValue('status');
  }
  if (status !== 'approved') {
    res.status(403).json({ 
      success: false, 
      message: "Acceso denegado. Tu cuenta está en revisión por un administrador. Aún no puedes gestionar pacientes ni citas." 
    });
    return;
  }

  // Si su estatus es 'approved', le abrimos la puerta para que siga
  next();
};
