import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Tracking {
  id: number;
  routineId: number;
  painLevel: number;
  startTime?: string;
  endTime?: string;
  postObservations?: string;
  date?: string;
  routineName?: string;
}

@Injectable({ providedIn: 'root' })
export class TrackingApiService {
  private baseUrl = `${environment.apiUrl}/tracking`;

  constructor(private http: HttpClient) {}

  /** Sesiones registradas por el paciente, de la más reciente a la más antigua. */
  getByPatientId(patientId: number, limit = 50): Observable<Tracking[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(`${this.baseUrl}/patient/${patientId}`)
      .pipe(
        map((res) => (res.data || []).slice(0, limit).map((r) => ({
          id: r.id,
          routineId: r.routineId,
          painLevel: Number(r.painLevel) || 0,
          postObservations: r.feedback || '',
          date: r.date,
          routineName: r.routineName || '',
        }))),
        catchError(() => of([]))
      );
  }

  create(data: {
    routineId: number;
    patientId: number;
    painLevel: number;
    startTime?: string;
    endTime?: string;
    postObservations?: string;
  }): Observable<boolean> {
    return this.http
      .post<{ success: boolean }>(this.baseUrl, data)
      .pipe(
        map((res) => res.success),
        catchError(() => of(false))
      );
  }
}
