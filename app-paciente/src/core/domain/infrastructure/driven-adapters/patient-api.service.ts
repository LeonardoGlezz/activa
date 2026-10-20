import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { from } from 'rxjs';
import { Patient } from '../../../domain/models/patient.model';
import { PatientRepository } from '../../../domain/repositories/patient.repository';
import { environment } from '../../../../environments/environment';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class PatientApiService implements PatientRepository {
  private readonly baseUrl = `${environment.apiUrl}/patients`;
  private readonly authUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private storage: Storage) {}

  getPatientByEmail(email: string): Observable<Patient | null> {
    return this.http.post<{ success: boolean; patient?: any; token?: string }>(
      `${this.authUrl}/login-patient`,
      { email: email.trim() }
    ).pipe(
      switchMap((res) => {
        if (!res?.patient) return from(Promise.resolve(null as Patient | null));
        const patient = this.mapPatient(res.patient);
        if (res.token) {
          // Guardar en Ionic Storage (funciona en Android nativo, no depende de localStorage)
          return from(
            this.storage.create().then(() => this.storage.set('patient_token', res.token))
          ).pipe(map(() => patient));
        }
        return from(Promise.resolve(patient));
      }),
      catchError((err) => {
        return throwError(() => err);
      })
    );
  }

  getPatients(): Observable<Patient[]> {
    return this.http.get<{ success: boolean; rows?: any[] }>(this.baseUrl).pipe(
      map((res) => {
        const rows = res.rows ?? [];
        return rows.map((p: any) => this.mapPatient(p));
      }),
      catchError(err => throwError(() => new Error(err.message ?? 'Error fetching patients')))
    );
  }

  getPatientById(id: number): Observable<Patient> {
    return this.http.get<{ success: boolean; data?: any }>(`${this.baseUrl}/${id}`).pipe(
      map((res) => {
        const p = res.data;
        if (!p) throw new Error('Paciente no encontrado');
        return this.mapPatient(p);
      }),
      catchError(err => throwError(() => new Error(err.message ?? 'Error fetching patient')))
    );
  }

  private mapPatient(p: any): Patient {
    const birthDate = p.birthDate ?? p.birth_date;
    const birthYear = p.birthYear ?? p.birth_year ?? (birthDate ? new Date(birthDate).getFullYear() : null);
    return {
      id: p.id ?? p.id_patient ?? p.idPaciente,
      firstName: p.firstName ?? p.first_name,
      lastNameP: p.lastNameP ?? p.last_name_paternal ?? p.last_name_p,
      lastNameM: p.lastNameM ?? p.last_name_maternal ?? p.last_name_m,
      birthYear,
      sex: p.sex ?? p.gender,
      height: p.height,
      weight: p.weight,
      createdAt: p.createdAt ? new Date(p.createdAt) : (p.created_at ? new Date(p.created_at) : new Date()),
      physiotherapistId: p.physioId ?? p.physiotherapistId ?? p.id_physio ?? p.physiotherapist_id ?? 0,
      email: p.email
    };
  }
}
