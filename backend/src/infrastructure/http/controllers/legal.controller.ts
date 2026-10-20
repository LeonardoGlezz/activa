import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import { LegalConsentModel } from "../../persistence/sequelize/client";
import { requiredLegalDocuments } from "../../legal/legal-documents";

export class LegalController {
  /** Qué avisos debe aceptar el usuario actual y cuáles ya aceptó en su versión vigente. */
  getStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { role, id } = req.user!;
      const documents = await this.withAcceptance(role, id);
      res.status(200).json({
        success: true,
        accepted: documents.every((d) => d.accepted),
        documents,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error?.message || "Error al consultar los avisos legales." });
    }
  };

  /** Registra la aceptación de todos los avisos vigentes del rol del usuario. */
  accept = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { role, id } = req.user!;
      if (req.body?.acceptAll !== true) {
        res.status(400).json({ success: false, message: "Debes aceptar el aviso de privacidad y los términos de uso." });
        return;
      }

      const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim().slice(0, 64);
      const userAgent = String(req.headers["user-agent"] || "").slice(0, 255);

      for (const doc of requiredLegalDocuments(role)) {
        await LegalConsentModel.findOrCreate({
          where: { role, subject_id: id, document: doc.id, version: doc.version },
          defaults: { role, subject_id: id, document: doc.id, version: doc.version, ip, user_agent: userAgent },
        });
      }

      res.status(201).json({ success: true, accepted: true, documents: await this.withAcceptance(role, id) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error?.message || "Error al registrar la aceptación." });
    }
  };

  private async withAcceptance(role: string, subjectId: number) {
    const rows: any[] = await LegalConsentModel.findAll({ where: { role, subject_id: subjectId } });
    return requiredLegalDocuments(role).map((doc) => {
      const row = rows.find((r) => r.document === doc.id && r.version === doc.version);
      return { ...doc, accepted: !!row, acceptedAt: row?.accepted_at ?? null };
    });
  }
}
