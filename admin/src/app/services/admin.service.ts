import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface AdminOverview {
  physiotherapists: {
    pending_profile: number;
    pending_approval: number;
    approved: number;
    rejected: number;
    total: number;
  };
  users: {
    patient_accounts: number;
    physio_accounts: number;
    admin_accounts: number;
  };
  patients_linked: number;
  appointments: {
    total: number;
    by_status: Record<string, number>;
  };
  ganancias: {
    moneda: 'MXN';
    total: number;
    citas_completadas: number;
    tarifa_por_cita: number;
  };
  generated_at: string;
  usage: {
    sessions_per_day: { date: string; sessions: number }[];
    active_patients_7d: number;
    sessions_7d: number;
    sessions_30d: number;
    new_patients_30d: number;
  };
}

export type PhysioStatus = 'pending_profile' | 'pending_approval' | 'approved' | 'rejected';

export interface PhysioRow {
  id_physio: number;
  first_name: string;
  last_name_paternal?: string | null;
  last_name_maternal?: string | null;
  professional_license?: string | null;
  phone?: string | null;
  license_verified_at?: string | null;
  license_verified_by?: string | null;
  status: PhysioStatus;
  created_at?: string;
  email: string | null;
  patients?: number;
}

/** Datos que el admin captura al dar de alta o corregir a un fisio */
export interface PhysioForm {
  firstName: string;
  lastNameP: string;
  lastNameM?: string;
  email: string;
  professionalLicense?: string;
  phone?: string;
  password?: string;
}

export interface PatientRow {
  id_patient: number;
  name: string;
  email: string | null;
  can_login: boolean;
  id_physio: number;
  physio_name: string;
  created_at: string;
  active_routines: number;
  sessions: number;
  last_session: string | null;
}

export interface PatientDetail {
  id_patient: number;
  name: string;
  email: string | null;
  can_login: boolean;
  created_at: string;
  id_physio: number;
  physio_name: string;
  /** Solo conteos: el admin no ve nombres de rutinas, ejercicios, dolor ni notas */
  routines: number;
  active_routines: number;
  sessions: number;
  last_session: string | null;
}

export type ActivityType = 'physio' | 'patient' | 'session' | 'appointment';

export interface ActivityEvent {
  type: ActivityType;
  date: string;
  text: string;
  link: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getOverview(): Observable<AdminOverview> {
    return this.http
      .get<AdminOverview>(`${this.baseUrl}/admin/overview`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error) => {
          const msg = error?.error?.message || 'Error al obtener el resumen.';
          return throwError(() => new Error(msg));
        })
      );
  }

  listPhysios(status: PhysioStatus): Observable<PhysioRow[]> {
    return this.http
      .get<PhysioRow[]>(`${this.baseUrl}/physiotherapists/pending`, {
        headers: this.getHeaders(),
        params: { status },
      })
      .pipe(
        catchError((error) => {
          const msg = error?.error?.message || 'Error al obtener los fisioterapeutas.';
          return throwError(() => new Error(msg));
        })
      );
  }

  setPhysioStatus(id: number, action: 'approved' | 'rejected'): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(`${this.baseUrl}/physiotherapists/${id}/approve`, { action }, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error) => {
          const msg = error?.error?.message || 'No se pudo actualizar al fisioterapeuta.';
          return throwError(() => new Error(msg));
        })
      );
  }

  listAllPhysios(): Observable<PhysioRow[]> {
    return this.request(this.http.get<PhysioRow[]>(`${this.baseUrl}/admin/physiotherapists`, { headers: this.getHeaders() }),
      'No se pudo cargar la lista de fisioterapeutas.');
  }

  createPhysio(data: PhysioForm): Observable<{ id_physio: number; message: string }> {
    return this.request(this.http.post<{ id_physio: number; message: string }>(`${this.baseUrl}/admin/physiotherapists`, data, { headers: this.getHeaders() }),
      'No se pudo dar de alta al fisioterapeuta.');
  }

  updatePhysio(id: number, data: PhysioForm): Observable<{ message: string }> {
    return this.request(this.http.put<{ message: string }>(`${this.baseUrl}/admin/physiotherapists/${id}`, data, { headers: this.getHeaders() }),
      'No se pudieron guardar los datos.');
  }

  setPhysioPassword(id: number, password: string): Observable<{ message: string }> {
    return this.request(this.http.put<{ message: string }>(`${this.baseUrl}/admin/physiotherapists/${id}/password`, { password }, { headers: this.getHeaders() }),
      'No se pudo cambiar la contraseña.');
  }

  listPatients(): Observable<PatientRow[]> {
    return this.request(this.http.get<PatientRow[]>(`${this.baseUrl}/admin/patients`, { headers: this.getHeaders() }),
      'No se pudo cargar la lista de pacientes.');
  }

  getPatient(id: number): Observable<PatientDetail> {
    return this.request(this.http.get<PatientDetail>(`${this.baseUrl}/admin/patients/${id}`, { headers: this.getHeaders() }),
      'No se pudo cargar el paciente.');
  }

  setPatientPassword(id: number, password: string): Observable<{ message: string }> {
    return this.request(this.http.put<{ message: string }>(`${this.baseUrl}/admin/patients/${id}/password`, { password }, { headers: this.getHeaders() }),
      'No se pudo cambiar la contraseña.');
  }

  getActivity(days = 30): Observable<ActivityEvent[]> {
    return this.request(this.http.get<ActivityEvent[]>(`${this.baseUrl}/admin/activity`, { headers: this.getHeaders(), params: { days } }),
      'No se pudo cargar la actividad.');
  }

  updateEmail(email: string): Observable<{ message: string }> {
    return this.request(this.http.patch<{ message: string }>(`${this.baseUrl}/auth/update-email`, { email }, { headers: this.getHeaders() }),
      'No se pudo cambiar el correo.');
  }

  updatePassword(passwordActual: string, passwordNueva: string): Observable<{ message: string }> {
    return this.request(this.http.patch<{ message: string }>(`${this.baseUrl}/auth/update-password`, { passwordActual, passwordNueva }, { headers: this.getHeaders() }),
      'No se pudo cambiar la contraseña.');
  }

  /** Cambia el error HTTP por un Error con el mensaje del servidor (o uno genérico) */
  private request<T>(obs: Observable<T>, fallback: string): Observable<T> {
    return obs.pipe(catchError((error) => throwError(() => new Error(error?.error?.message || fallback))));
  }
}
