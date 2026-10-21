/**
 * **************************************************************************
 * CONTROLADOR DE EJERCICIOS - INTERFACE ADAPTER
 * PROYECTO: ACTIVA
 * DESCRIPCIÓN: Banco de ejercicios en dos partes:
 *   - Banco base (id_physio = null): lo ven todos los fisios y solo lo edita el admin.
 *   - "Mis ejercicios" (id_physio = el fisio): solo los ve y edita quien los creó.
 * **************************************************************************
 */

import { Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { ExerciseSchema, ExerciseUpdateSchema } from "../../../application/dtos/schemas";
import { EXERCISE_MEDIA_DIR } from "../middlewares/upload-exercise-media.middleware";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  ExerciseModel,
  RoutineExerciseModel,
  RoutineModel,
  RoutineTemplateExerciseModel,
} from "../../persistence/sequelize/client";
import { BODY_ZONES } from "../../persistence/seed/base-exercises";

const RIGHTS_MESSAGE =
  "Confirma que la foto o el video es tuyo o que tienes permiso de usarlo.";

type Scope = "base" | "mine";

function toView(row: any, idPhysio: number | null) {
  const e = row.toJSON ? row.toJSON() : row;
  const scope: Scope = e.id_physio == null ? "base" : "mine";
  return {
    id_exercise: e.id_exercise,
    name: e.name,
    body_zone: e.body_zone,
    description: e.description,
    video_url: e.video_url,
    scope,
    // El fisio solo edita lo suyo; el admin solo el banco base
    editable: idPhysio == null ? scope === "base" : e.id_physio === idPhysio,
  };
}

function badRequest(res: Response, error: any): void {
  if (error instanceof ZodError) {
    res.status(400).json({ success: false, message: error.issues[0]?.message || "Revisa los datos del ejercicio." });
    return;
  }
  res.status(400).json({ success: false, message: error?.message || "No se pudo guardar el ejercicio." });
}

/** Quién pide: fisio (con su id) o admin (banco base) */
function requester(req: AuthRequest): { role: "physio" | "admin"; idPhysio: number | null } | null {
  if (req.user?.role === "physio" && req.user.id_physio) return { role: "physio", idPhysio: Number(req.user.id_physio) };
  if (req.user?.role === "admin") return { role: "admin", idPhysio: null };
  return null;
}

/** ¿Puede este usuario ver el ejercicio? (los pacientes, solo si está en su rutina) */
async function canRead(req: AuthRequest, exercise: any): Promise<boolean> {
  const who = requester(req);
  if (who?.role === "admin") return true;
  if (who?.role === "physio") return exercise.id_physio == null || exercise.id_physio === who.idPhysio;
  if (req.user?.role === "patient") {
    const routines: any[] = await RoutineModel.findAll({ where: { id_patient: req.user.id }, attributes: ["id_routine"] });
    if (!routines.length) return false;
    const used = await RoutineExerciseModel.count({
      where: { id_exercise: exercise.id_exercise, id_routine: routines.map((r) => r.id_routine) },
    });
    return used > 0;
  }
  return false;
}

/**
 * Ejercicios que un fisio puede poner en sus rutinas: los del banco base y los suyos.
 * Devuelve los ids que NO puede usar.
 */
export async function exercisesNotUsableBy(idPhysio: number, ids: number[]): Promise<number[]> {
  const unique = [...new Set(ids.map(Number).filter((n) => Number.isFinite(n) && n > 0))];
  if (!unique.length) return [];
  const allowed: any[] = await ExerciseModel.findAll({
    where: { id_exercise: unique, [Op.or]: [{ id_physio: null }, { id_physio: idPhysio }] },
    attributes: ["id_exercise"],
  });
  const ok = new Set(allowed.map((e) => e.id_exercise));
  return unique.filter((id) => !ok.has(id));
}

export class ExerciseController {
  /**
   * Banco base + "Mis ejercicios" del fisio (o solo el base para el admin).
   * @endpoint GET /api/exercises?scope=base|mine&q=texto&zone=Rodilla
   */
  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const who = requester(req);
    if (!who) {
      res.status(403).json({ success: false, message: "Solo fisioterapeutas o administradores." });
      return;
    }
    try {
      const scope = String(req.query.scope ?? "");
      const owner =
        who.role === "admin" || scope === "base"
          ? { id_physio: null }
          : scope === "mine"
            ? { id_physio: who.idPhysio }
            : { [Op.or]: [{ id_physio: null }, { id_physio: who.idPhysio }] };

      const where: any = { [Op.and]: [owner] };
      const zone = String(req.query.zone ?? "").trim();
      if (zone) where[Op.and].push({ body_zone: zone });
      const q = String(req.query.q ?? "").trim();
      if (q) {
        where[Op.and].push({
          [Op.or]: [
            { name: { [Op.like]: `%${q}%` } },
            { body_zone: { [Op.like]: `%${q}%` } },
            { description: { [Op.like]: `%${q}%` } },
          ],
        });
      }

      const limit = Math.min(Math.max(Number(req.query.limit ?? 500), 1), 500);
      const page = Math.max(Number(req.query.page ?? 1), 1);
      const result = await ExerciseModel.findAndCountAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order: [["name", "ASC"]],
      });

      res.status(200).json({
        success: true,
        page,
        limit,
        total: result.count,
        zones: BODY_ZONES,
        rows: result.rows.map((r) => toView(r, who.idPhysio)),
      });
    } catch {
      res.status(500).json({ success: false, message: "Error al recuperar el banco de ejercicios." });
    }
  };

  /** @endpoint GET /api/exercises/:id */
  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const exercise: any = await ExerciseModel.findByPk(Number(req.params.id) || 0);
    if (!exercise || !(await canRead(req, exercise))) {
      res.status(404).json({ success: false, message: "El ejercicio solicitado no existe." });
      return;
    }
    res.status(200).json({ success: true, data: toView(exercise, requester(req)?.idPhysio ?? null) });
  };

  /**
   * Fisio: crea uno en "Mis ejercicios". Admin: lo agrega al banco base.
   * @endpoint POST /api/exercises
   */
  create = async (req: AuthRequest, res: Response): Promise<void> => {
    const who = requester(req);
    if (!who) {
      res.status(403).json({ success: false, message: "Solo fisioterapeutas o administradores." });
      return;
    }
    try {
      const data = ExerciseSchema.parse(req.body);
      const hasMedia = Boolean(data.videoUrl);
      if (who.role === "physio" && hasMedia && req.body?.rightsConfirmed !== true) {
        throw new Error(RIGHTS_MESSAGE);
      }
      const created = await ExerciseModel.create({
        name: data.name.trim(),
        body_zone: data.bodyZone.trim(),
        description: data.description.trim(),
        video_url: data.videoUrl || null,
        id_physio: who.idPhysio,
        rights_confirmed: who.role === "physio" && hasMedia,
      });
      res.status(201).json({ success: true, message: "Ejercicio guardado.", data: toView(created, who.idPhysio) });
    } catch (error: any) {
      badRequest(res, error);
    }
  };

  /**
   * Copia un ejercicio del banco base a "Mis ejercicios" para poder cambiarlo.
   * @endpoint POST /api/exercises/:id/copy
   */
  copyToMine = async (req: AuthRequest, res: Response): Promise<void> => {
    const who = requester(req);
    const source: any = await ExerciseModel.findByPk(Number(req.params.id) || 0);
    if (who?.role !== "physio" || !source || !(await canRead(req, source))) {
      res.status(404).json({ success: false, message: "El ejercicio solicitado no existe." });
      return;
    }
    const copy = await ExerciseModel.create({
      name: source.name,
      body_zone: source.body_zone,
      description: source.description,
      video_url: source.video_url,
      id_physio: who.idPhysio,
      rights_confirmed: false,
    });
    res.status(201).json({ success: true, message: "Copiado a Mis ejercicios.", data: toView(copy, who.idPhysio) });
  };

  /** @endpoint PUT /api/exercises/:id */
  update = async (req: AuthRequest, res: Response): Promise<void> => {
    const who = requester(req);
    const exercise: any = await ExerciseModel.findByPk(Number(req.params.id) || 0);
    if (!who || !exercise || !(await canRead(req, exercise))) {
      res.status(404).json({ success: false, message: "El ejercicio solicitado no existe." });
      return;
    }
    if (!toView(exercise, who.idPhysio).editable) {
      res.status(403).json({
        success: false,
        message: "Este ejercicio es del banco base. Cópialo a Mis ejercicios para cambiarlo.",
      });
      return;
    }
    try {
      const data = ExerciseUpdateSchema.parse(req.body);
      const changes: Record<string, unknown> = {};
      if (data.name !== undefined) changes.name = data.name.trim();
      if (data.bodyZone !== undefined) changes.body_zone = data.bodyZone.trim();
      if (data.description !== undefined) changes.description = data.description.trim();
      if (data.videoUrl !== undefined) {
        const newMedia = data.videoUrl || null;
        if (who.role === "physio" && newMedia && newMedia !== exercise.video_url && req.body?.rightsConfirmed !== true) {
          throw new Error(RIGHTS_MESSAGE);
        }
        changes.video_url = newMedia;
        if (who.role === "physio" && newMedia !== exercise.video_url) changes.rights_confirmed = Boolean(newMedia);
      }
      await exercise.update(changes);
      res.status(200).json({ success: true, message: "Ejercicio actualizado.", data: toView(exercise, who.idPhysio) });
    } catch (error: any) {
      badRequest(res, error);
    }
  };

  /**
   * Borra un ejercicio propio (o del banco base, si es el admin) que no esté en ninguna rutina.
   * @endpoint DELETE /api/exercises/:id
   */
  remove = async (req: AuthRequest, res: Response): Promise<void> => {
    const who = requester(req);
    const exercise: any = await ExerciseModel.findByPk(Number(req.params.id) || 0);
    if (!who || !exercise || !toView(exercise, who.idPhysio).editable) {
      res.status(404).json({ success: false, message: "El ejercicio solicitado no existe." });
      return;
    }
    const inRoutines = await RoutineExerciseModel.count({ where: { id_exercise: exercise.id_exercise } });
    const inTemplates = await RoutineTemplateExerciseModel.count({ where: { id_exercise: exercise.id_exercise } });
    if (inRoutines + inTemplates > 0) {
      res.status(409).json({
        success: false,
        message: "Este ejercicio está en rutinas o plantillas. Quítalo de ellas antes de borrarlo.",
      });
      return;
    }
    await exercise.destroy();
    res.status(200).json({ success: true, message: "Ejercicio borrado." });
  };

  /**
   * Recibe el video/GIF/imagen de demostración (campo "file") y devuelve su ruta,
   * que después se guarda como videoUrl del ejercicio.
   * @endpoint POST /api/exercises/media
   */
  uploadMedia = async (req: AuthRequest, res: Response): Promise<void> => {
    const file = (req as any).file;
    if (!file) {
      res.status(400).json({ success: false, message: "No se recibió ningún archivo." });
      return;
    }
    res.status(201).json({
      success: true,
      url: `/${EXERCISE_MEDIA_DIR}/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    });
  };
}
