import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exercise } from '../domain/exercise.model';
import { ExerciseRepository, ExerciseResponse } from '../domain/exercise.repository';
import { environment } from '../../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ExerciseHttpRepository implements ExerciseRepository {
  // Ajuste según tu estructura de environment.webservice.baseUrl
  private readonly apiUrl = `${environment.webservice.baseUrl}/api/exercises`;

  constructor(private http: HttpClient) {}

  getAll(page: number = 1, limit: number = 10): Observable<ExerciseResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ExerciseResponse>(this.apiUrl, { params });
  }

  create(exercise: Exercise): Observable<any> {
    return this.http.post<any>(this.apiUrl, exercise);
  }
}