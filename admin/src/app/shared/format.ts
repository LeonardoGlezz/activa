import { ActivityType } from '../services/admin.service';

const ICONS: Record<ActivityType, string> = {
  physio: '🩺',
  patient: '🧑',
  session: '✅',
  appointment: '📅',
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  physio: 'Registros de fisios',
  patient: 'Pacientes nuevos',
  session: 'Sesiones terminadas',
  appointment: 'Citas',
};

export function activityIcon(type: ActivityType): string {
  return ICONS[type] ?? '•';
}

/** Fecha AAAA-MM-DD o ISO como "hoy", "ayer", "hace 3 días" o "12 oct" */
export function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const d = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  if (isNaN(d.getTime())) return value;
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((startOf(new Date()) - startOf(d)) / 86400000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days > 1 && days < 7) return `hace ${days} días`;
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

/** Contraseña temporal fácil de dictar: 3 letras, 4 números y un guion (ej. Mar-4821x) */
export function temporaryPassword(): string {
  const words = ['Sol', 'Mar', 'Rio', 'Paz', 'Luz', 'Pino', 'Lago', 'Nube'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = String(Math.floor(1000 + Math.random() * 9000));
  const letter = 'abcdefghjkmnpqrstuvwxyz'[Math.floor(Math.random() * 23)];
  return `${word}-${num}${letter}`;
}
