import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Appointment {
  id: number;
  patientId: number;
  physiotherapistId: number;
  appointmentDate: string;
  appointmentTime: string;
  type: string;
  status: string;
  notes?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
  private baseUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  /** Próxima cita que no esté cancelada ni cerrada (el servidor devuelve una lista) */
  getNext(patientId: number): Observable<Appointment | null> {
    return this.list(patientId).pipe(
      map((rows) => {
        const now = Date.now();
        return rows
          .filter((a) => a.appointmentDate && (a.status === 'pending' || a.status === 'confirmed'))
          .filter((a) => this.startsAt(a) >= now)
          .sort((a, b) => this.startsAt(a) - this.startsAt(b))[0] ?? null;
      })
    );
  }

  list(patientId: number): Observable<Appointment[]> {
    return this.http
      .get<any>(`${this.baseUrl}/patient/${patientId}`)
      .pipe(
        map((res) => (Array.isArray(res) ? res : res?.rows ?? []).map((d: any) => this.mapAppointment(d))),
        catchError(() => of([]))
      );
  }

  private startsAt(a: Appointment): number {
    return new Date(`${a.appointmentDate}T${a.appointmentTime || '00:00:00'}`).getTime();
  }

  private mapAppointment(d: any): Appointment {
    return {
      id:                 d.id ?? d.idappointment ?? d.id_appointment ?? 0,
      patientId:          d.patientId   ?? d.patient_id   ?? d.idpatient   ?? 0,
      physiotherapistId:  d.physiotherapistId ?? d.physiotherapist_id ?? d.idphysio ?? 0,
      // El back puede devolver: appointmentDate, appointment_date, o simplemente date
      appointmentDate:    d.appointmentDate   ?? d.appointment_date   ?? d.date ?? '',
      // El back puede devolver: appointmentTime, appointment_time, starttime, start_time
      appointmentTime:    d.appointmentTime   ?? d.appointment_time   ?? d.starttime ?? d.start_time ?? '',
      // El servicio se guarda al inicio de las notas: "Servicio: Terapia física"
      type:               (String(d.notes ?? '').match(/Servicio:\s*(.+?)(?=\n|$)/)?.[1] ?? 'Consulta').trim(),
      status:             d.status ?? 'pending',
      notes:              d.notes,
      createdAt:          d.createdAt ?? d.created_at ?? d.createdat ?? '',
    };
  }
}
