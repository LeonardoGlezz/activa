import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Exercise, CreateExerciseDTO } from '../domain/exercise.model';
import { ExerciseMediaUpload, ExerciseRepository } from '../domain/exercise.repository';

@Injectable({ providedIn: 'root' })
export class ExerciseUseCase {
    constructor(private repository: ExerciseRepository) {}

  listExercises(page: number, limit: number): Observable<{ rows: Exercise[]; total?: number; zones?: string[] }> {
    return this.repository.getAll(page, limit);
  }

  getExercise(id: number | string): Observable<any> {
    return this.repository.getById(id);
  }

  addExercise(data: CreateExerciseDTO): Observable<any> {
    return this.repository.create(data);
  }

  updateExercise(id: number | string, data: Partial<CreateExerciseDTO>): Observable<any> {
    return this.repository.update(id, data);
  }

  uploadMedia(file: File): Observable<ExerciseMediaUpload> {
    return this.repository.uploadMedia(file);
  }

  copyToMine(id: number | string): Observable<any> {
    return this.repository.copyToMine(id);
  }

  deleteExercise(id: number | string): Observable<any> {
    return this.repository.remove(id);
  }
}