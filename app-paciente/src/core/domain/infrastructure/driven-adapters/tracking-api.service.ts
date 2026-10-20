import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Tracking } from '../../../domain/models/tracking.model';
import { TrackingRepository } from '../../../domain/repositories/tracking.repository';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrackingApiService implements TrackingRepository {
  // 🔥 CORRECCIÓN: Se quitó el /api extra porque ya viene en environment.apiUrl
  private readonly baseUrl = `${environment.apiUrl}/tracking`;

  constructor(private http: HttpClient) {}

  registerPainLevel(tracking: Tracking): Observable<void> {
    console.debug('tracking-api: sending', tracking, 'to', this.baseUrl);
    return this.http.post<void>(this.baseUrl, {
      startTime: tracking.startTime,
      endTime: tracking.endTime,
      // 🔥 CORRECCIÓN: Forzamos a que sean números reales para que el backend no lo rechace
      painLevel: Number(tracking.painLevel),
      postObservations: tracking.postObservations,
      intraObservations: tracking.intraObservations,
      // Manejamos 'alert' por si viene vacío/undefined
      alert: tracking.alert !== undefined && tracking.alert !== null ? Number(tracking.alert) : undefined,
      routineId: Number(tracking.routineId)
    }).pipe(
      catchError(err => {
        console.error('tracking-api error', err);
        const body = err?.error;
        const msg = body?.details || body?.message || err?.message || 'Error al registrar';
        const status = err?.status || err?.statusCode;
        const e = new Error(`${msg} (status ${status})`) as any;
        e.error = body;
        return throwError(() => e);
      })
    );
  }

  getTrackingByRoutine(routineId: number): Observable<Tracking[]> {
    return this.http.get<any[]>(`${this.baseUrl}?routineId=${routineId}`).pipe(
      map(apiTrackings => apiTrackings.map(apiTracking => ({
        id: apiTracking.id,
        startTime: apiTracking.start_time,
        endTime: apiTracking.end_time,
        painLevel: apiTracking.pain_level,
        postObservations: apiTracking.post_observations,
        intraObservations: apiTracking.intra_observations,
        alert: apiTracking.alert,
        routineId: apiTracking.routine_id
      }))),
      catchError(err => throwError(() => new Error(err.message ?? 'Error fetching tracking')))
    );
  }
}