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
}

export type PhysioStatus = 'pending_profile' | 'pending_approval' | 'approved' | 'rejected';

export interface PhysioRow {
  id_physio: number;
  first_name: string;
  last_name_paternal?: string | null;
  last_name_maternal?: string | null;
  professional_license?: string | null;
  curp?: string | null;
  ine_doc_url?: string | null;
  license_doc_url?: string | null;
  status: PhysioStatus;
  created_at?: string;
  email: string | null;
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

  /** URL pública de un documento subido por el fisio (se guarda solo el nombre del archivo) */
  documentUrl(fileName: string): string {
    return `${this.baseUrl.replace(/\/api\/?$/, '')}/uploads/documents/${encodeURIComponent(fileName)}`;
  }
}
