import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Exercise } from '../../../domain/models/exercise.model';
import { ExerciseRepository } from '../../../domain/repositories/exercise.repository';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExerciseApiService implements ExerciseRepository {
  private readonly baseUrl = `${environment.apiUrl}/exercises`;

  constructor(private http: HttpClient) {}

  getExercises(): Observable<Exercise[]> {
    return this.http.get<{ success: boolean; rows?: any[] }>(this.baseUrl).pipe(
      map((res) => {
        const rows = res.rows ?? [];
        return rows.map((e: any) => ({
          id: e.id ?? e.idEjercicio,
          name: e.name,
          bodyZone: e.bodyZone ?? e.body_zone,
          description: e.description,
          videoUrl: e.videoUrl ?? e.video_url
        }));
      }),
      catchError(err => throwError(() => new Error(err.message ?? 'Error fetching exercises')))
    );
  }
}