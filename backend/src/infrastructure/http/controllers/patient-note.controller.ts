/**
 * **************************************************************************
 * CONTROLADOR: PatientNoteController
 * DESCRIPCIÓN: Notas de seguimiento que el fisio escribe en el expediente de
 *              su paciente. Se guardan en la base para verlas desde cualquier
 *              computadora. Las rutas ya exigen que sea el fisio del paciente.
 * **************************************************************************
 */

import { Response } from "express";
import { z, ZodError } from "zod";
import { AuthRequest } from "../middlewares/auth.middleware";
import { PatientNoteModel } from "../../persistence/sequelize/client";

const NoteSchema = z.object({
  title: z.string().trim().min(1, "Escribe un título").max(150, "El título es muy largo"),
  type: z.string().trim().max(40).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe ser AAAA-MM-DD"),
  content: z.string().trim().min(1, "Escribe el contenido de la nota"),
});

/** Varias notas a la vez: para pasar las que el navegador tenía guardadas */
const ImportSchema = z.object({ notes: z.array(NoteSchema).max(500) });

function toDto(row: any) {
  const n = row.get({ plain: true });
  return { id: n.id_note, title: n.title, type: n.note_type ?? "", date: n.note_date, content: n.content };
}

function columns(data: z.infer<typeof NoteSchema>) {
  return { title: data.title, note_type: data.type || null, note_date: data.date, content: data.content };
}

export class PatientNoteController {
  list = this.handle(async (req) => {
    const rows = await PatientNoteModel.findAll({
      where: { id_patient: Number(req.params.patientId) },
      order: [["note_date", "DESC"], ["id_note", "DESC"]],
    });
    return rows.map(toDto);
  });

  create = this.handle(async (req) => {
    const row = await PatientNoteModel.create({
      ...columns(NoteSchema.parse(req.body)),
      id_patient: Number(req.params.patientId),
      id_physio: req.user!.id_physio,
    });
    return toDto(row);
  }, 201);

  importMany = this.handle(async (req) => {
    const { notes } = ImportSchema.parse(req.body);
    const rows = await PatientNoteModel.bulkCreate(
      notes.map((n) => ({ ...columns(n), id_patient: Number(req.params.patientId), id_physio: req.user!.id_physio }))
    );
    return { imported: rows.length };
  }, 201);

  update = this.handle(async (req) => {
    const row = await this.ownNote(req);
    await row.update({ ...columns(NoteSchema.parse(req.body)), updated_at: new Date() });
    return toDto(row);
  });

  remove = this.handle(async (req) => {
    const row = await this.ownNote(req);
    await row.destroy();
    return { success: true };
  });

  /** La nota debe ser de un paciente de este fisio */
  private async ownNote(req: AuthRequest): Promise<any> {
    const row: any = await PatientNoteModel.findByPk(Number(req.params.id));
    if (!row || row.getDataValue("id_physio") !== req.user?.id_physio) {
      throw Object.assign(new Error("Nota no encontrada."), { status: 404 });
    }
    return row;
  }

  private handle(fn: (req: AuthRequest) => Promise<unknown>, okStatus = 200) {
    return async (req: AuthRequest, res: Response): Promise<void> => {
      try {
        res.status(okStatus).json(await fn(req));
      } catch (error: any) {
        if (error instanceof ZodError) {
          res.status(400).json({ message: error.issues[0]?.message || "Datos inválidos." });
        } else if (error?.status) {
          res.status(error.status).json({ message: error.message });
        } else {
          console.error("Error en notas de seguimiento:", error);
          res.status(500).json({ message: "No se pudo guardar la nota. Intenta de nuevo." });
        }
      }
    };
  }
}
