import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Routine } from '../../../domain/models/routine.model';
import { RoutineRepository } from '../../../domain/repositories/routine.repository';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RoutineApiService implements RoutineRepository {
  private readonly baseUrl = `${environment.apiUrl}/routines`;

  constructor(private http: HttpClient) {}

  getRoutines(): Observable<Routine[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(apiRoutines => apiRoutines.map(apiRoutine => ({
        id: apiRoutine.idRutina,
        name: apiRoutine.name,
        startDate: new Date(apiRoutine.start_date),
        endDate: new Date(apiRoutine.end_date),
        physiotherapistId: apiRoutine.physiotherapist_id,
        patientId: apiRoutine.patient_id
      }))),
      catchError(err => throwError(() => new Error(err.message ?? 'Error fetching routines')))
    );
  }

  getRoutinesByPatient(patientId: number): Observable<Routine[]> {
    return this.http.get<any[]>(`${this.baseUrl}?patientId=${patientId}`).pipe(
      map(apiRoutines => apiRoutines.map(apiRoutine => ({
        id: apiRoutine.idRutina,
        name: apiRoutine.name,
        startDate: new Date(apiRoutine.start_date),
        endDate: new Date(apiRoutine.end_date),
        physiotherapistId: apiRoutine.physiotherapist_id,
        patientId: apiRoutine.patient_id
      }))),
      catchError(err => throwError(() => new Error(err.message ?? 'Error fetching routines by patient')))
    );
  }

  getRoutineById(id: number): Observable<Routine> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(apiRoutine => ({
        id: apiRoutine.idRutina,
        name: apiRoutine.name,
        startDate: new Date(apiRoutine.start_date),
        endDate: new Date(apiRoutine.end_date),
        physiotherapistId: apiRoutine.physiotherapist_id,
        patientId: apiRoutine.patient_id
      })),
      catchError(err => throwError(() => new Error(err.message ?? 'Error fetching routine')))
    );
  }
}