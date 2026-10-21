/**
 * Un solo nombre en español para cada estado de cita, en todas las pantallas.
 * El backend guarda: pending, confirmed, completed, no_show, cancelled.
 */
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';

export const APPOINTMENT_STATUS_OPTIONS: { label: string; value: AppointmentStatus }[] = [
  { label: 'Programada', value: 'pending' },
  { label: 'Confirmada', value: 'confirmed' },
  { label: 'Asistió', value: 'completed' },
  { label: 'No asistió', value: 'no_show' },
  { label: 'Cancelada', value: 'cancelled' },
];

const LABELS: Record<string, string> = Object.fromEntries(APPOINTMENT_STATUS_OPTIONS.map((o) => [o.value, o.label]));

export function appointmentStatusLabel(status: string | null | undefined): string {
  return LABELS[String(status || 'pending')] ?? 'Programada';
}

/** Ya pasó o ya se cerró: no se puede "marcar asistió" antes de tiempo, ni cancelar algo cerrado */
export function isClosedStatus(status: string | null | undefined): boolean {
  return status === 'completed' || status === 'no_show' || status === 'cancelled';
}

/** Clase de color para la etiqueta de estado */
export function appointmentStatusTone(status: string | null | undefined): 'scheduled' | 'completed' | 'missed' | 'cancelled' {
  if (status === 'completed') return 'completed';
  if (status === 'no_show') return 'missed';
  if (status === 'cancelled') return 'cancelled';
  return 'scheduled';
}

/** El servicio se guarda al inicio de las notas como "Servicio: ..." */
export function appointmentService(notes: string | null | undefined): string {
  const match = String(notes || '').match(/Servicio:\s*(.+?)(?=\n|$)/);
  return match ? match[1].trim() : 'Consulta';
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "martes 4 de noviembre a las 10:30" */
export function describeAppointment(date: string, startTime: string): string {
  const [y, m, d] = String(date).slice(0, 10).split('-').map(Number);
  const day = DAYS[new Date(y, m - 1, d).getDay()];
  return `${day} ${d} de ${MONTHS[m - 1]} a las ${String(startTime || '').slice(0, 5)}`;
}

/**
 * Enlace de WhatsApp con el recordatorio ya escrito. Lo abre el fisio desde su
 * celular o computadora y solo tiene que darle "Enviar".
 */
export function whatsappReminderUrl(phone: string | null | undefined, patientFirstName: string, date: string, startTime: string): string | null {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length !== 10) return null;
  const text = `Hola ${patientFirstName || ''}, te recuerdo tu cita de fisioterapia el ${describeAppointment(date, startTime)}. Si no puedes asistir, avísame por aquí.`;
  return `https://wa.me/52${digits}?text=${encodeURIComponent(text)}`;
}
