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
  notes?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentApiService {
  private baseUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  getNext(patientId: number): Observable<Appointment | null> {
    return this.http
      .get<{ success: boolean; rows?: any[] }>(`${this.baseUrl}/patient/${patientId}`)
      .pipe(
        map((res) => {
          const rows = res.rows ?? [];
          if (rows.length === 0) return null;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          // Mapear, filtrar solo citas de hoy en adelante, ordenar por fecha
          const sorted = rows
            .map((d) => this.mapAppointment(d))
            .filter((a) => {
              if (!a.appointmentDate) return false;
              const d = new Date(a.appointmentDate + 'T12:00:00');
              return d >= today;
            })
            .sort((a, b) => new Date(a.appointmentDate + 'T12:00:00').getTime() - new Date(b.appointmentDate + 'T12:00:00').getTime());
          return sorted[0] ?? null;
        }),
        catchError(() => of(null))
      );
  }

  list(patientId: number, limit = 50): Observable<Appointment[]> {
    return this.http
      .get<{ success: boolean; rows?: any[] }>(`${this.baseUrl}/patient/${patientId}`)
      .pipe(
        map((res) => (res.rows ?? []).map((d) => this.mapAppointment(d))),
        catchError(() => of([]))
      );
  }

  create(data: { patientId: number; physiotherapistId: number; appointmentDate: string; appointmentTime: string; type?: string; notes?: string }): Observable<Appointment | null> {
    return this.http.post<{ success: boolean; data?: any }>(`${this.baseUrl}`, data).pipe(
      map((res) => (res.data ? this.mapAppointment(res.data) : null)),
      catchError(() => of(null))
    );
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
      type:               d.type ?? d.notes ?? 'Consulta',
      notes:              d.notes,
      createdAt:          d.createdAt ?? d.created_at ?? d.createdat ?? '',
    };
  }
}
