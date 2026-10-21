import { Observable } from 'rxjs';
import { Exercise } from './exercise.model';

export interface ExerciseResponse {
  success: boolean;
  rows: Exercise[];
  count?: number;
  total?: number;
  zones?: string[];
  page?: number;
  limit?: number;
}

export interface ExerciseMediaUpload {
  success: boolean;
  url: string;
  mimeType: string;
  size: number;
}

export abstract class ExerciseRepository {
  abstract getAll(page: number, limit: number): Observable<ExerciseResponse>;
  abstract getById(id: number | string): Observable<any>;
  abstract create(exercise: Exercise): Observable<any>;
  abstract update(id: number | string, exercise: Partial<Exercise>): Observable<any>;
  abstract uploadMedia(file: File): Observable<ExerciseMediaUpload>;
  abstract copyToMine(id: number | string): Observable<any>;
  abstract remove(id: number | string): Observable<any>;
}
