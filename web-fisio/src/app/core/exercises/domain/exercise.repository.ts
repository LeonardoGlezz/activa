import { Observable } from 'rxjs';
import { Exercise } from './exercise.model';

export interface ExerciseResponse {
  success: boolean;
  rows: Exercise[];
  count: number;
  page?: number;
  limit?: number;
}

export abstract class ExerciseRepository {
  abstract getAll(page: number, limit: number): Observable<ExerciseResponse>;
  abstract create(exercise: Exercise): Observable<any>;
}