/**
 * **************************************************************************
 * CONTROLADOR: PhysioContactController
 * DESCRIPCIÓN: Celular del fisio para el botón "Contactar a mi fisio" de la
 *              app del paciente. El fisio decide si lo muestra.
 * **************************************************************************
 */

import { Response } from "express";
import { z, ZodError } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { PatientModel, PhysiotherapistModel } from "../../persistence/sequelize/client";

const ContactSchema = z.object({
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || /^\d{10}$/.test(v), "El celular debe tener 10 números"),
  showWhatsapp: z.boolean(),
});

function fullName(p: any): string {
  return [p.first_name, p.last_name_paternal, p.last_name_maternal].filter(Boolean).join(" ");
}

export class PhysioContactController {
  /** El fisio ve su celular y si lo muestra a sus pacientes */
  getMine = async (req: AuthRequest, res: Response): Promise<void> => {
    const physio: any = await PhysiotherapistModel.findByPk(req.user?.id_physio ?? 0);
    if (!physio) {
      res.status(404).json({ message: "Perfil no encontrado." });
      return;
    }
    res.json({ phone: physio.phone ?? "", showWhatsapp: Boolean(physio.show_whatsapp) });
  };

  updateMine = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const data = ContactSchema.parse(req.body);
      await PhysiotherapistModel.update(
        { phone: data.phone || null, show_whatsapp: data.showWhatsapp },
        { where: { id_physio: req.user?.id_physio ?? 0 } }
      );
      res.json({ message: "Datos de contacto guardados." });
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.issues[0]?.message || "Datos inválidos." });
        return;
      }
      res.status(500).json({ message: "No se pudo guardar. Intenta de nuevo." });
    }
  };

  /** El paciente ve el nombre de su fisio y su WhatsApp, si el fisio lo permite */
  getForPatient = async (req: AuthRequest, res: Response): Promise<void> => {
    const patient: any = await PatientModel.findByPk(req.user?.id ?? 0);
    const physio: any = patient ? await PhysiotherapistModel.findByPk(patient.id_physio) : null;
    if (!physio) {
      res.status(404).json({ message: "No encontramos a tu fisioterapeuta." });
      return;
    }
    const phone = physio.show_whatsapp && physio.phone ? String(physio.phone) : null;
    res.json({
      name: fullName(physio),
      firstName: physio.first_name,
      professionalLicense: physio.professional_license ?? null,
      whatsapp: phone ? `52${phone}` : null,
      phone,
    });
  };
}
