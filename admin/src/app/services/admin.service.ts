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
}
