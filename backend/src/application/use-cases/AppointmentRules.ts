/**
 * **************************************************************************
 * REGLAS DE CITAS
 * Estados con un solo nombre en todo Activa, validación de lo que manda el
 * panel del fisio y textos en español para los avisos al paciente.
 * **************************************************************************
 */

import { z } from "zod";

export const APPOINTMENT_STATUSES = ["pending", "confirmed", "completed", "no_show", "cancelled"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Programada",
  confirmed: "Confirmada",
  completed: "Asistió",
  no_show: "No asistió",
  cancelled: "Cancelada",
};

/** Acepta el nombre interno o el que se ve en pantalla (programada, cancelada, asistió...) */
const ALIASES: Record<string, AppointmentStatus> = {
  programada: "pending",
  pendiente: "pending",
  confirmada: "confirmed",
  completada: "completed",
  asistio: "completed",
  "no asistio": "no_show",
  no_asistio: "no_show",
  noshow: "no_show",
  cancelada: "cancelled",
  canceled: "cancelled",
};

export function normalizeStatus(value: unknown): AppointmentStatus | null {
  const key = String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
  if ((APPOINTMENT_STATUSES as readonly string[]).includes(key)) return key as AppointmentStatus;
  return ALIASES[key] ?? null;
}

const time = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, "La hora debe ser HH:MM")
  .transform((v) => (v.length === 5 ? `${v}:00` : v));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe ser AAAA-MM-DD");
const status = z
  .unknown()
  .transform((v, ctx) => {
    const s = normalizeStatus(v);
    if (!s) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Estado de cita no válido." });
    return s as AppointmentStatus;
  });

export const CreateAppointmentSchema = z
  .object({
    id_patient: z.coerce.number().int().positive("Elige un paciente"),
    date,
    start_time: time,
    end_time: time,
    status: status.optional(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine((d) => d.end_time > d.start_time, { message: "La hora de fin debe ser después de la de inicio.", path: ["end_time"] });

export const UpdateAppointmentSchema = z
  .object({
    date: date.optional(),
    start_time: time.optional(),
    end_time: time.optional(),
    status: status.optional(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .strip();

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** "martes 4 de noviembre a las 10:30" */
export function describeWhen(dateStr: string, startTime: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${day} ${d} de ${MONTHS[m - 1]} a las ${String(startTime).slice(0, 5)}`;
}

/** ¿Se cruzan dos horarios del mismo día? */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}
