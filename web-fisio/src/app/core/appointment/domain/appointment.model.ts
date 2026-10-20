export interface Appointment {
  id_appointment?: number;
  id_patient: number;
  id_physio?: number;
  date: string;       // Ej. '2026-04-15'
  time: string;       // Ej. '14:30'
  reason?: string;    // Motivo de la consulta
  status?: string;    // Ej. 'scheduled', 'completed', 'cancelled'
  notes?: string;
}