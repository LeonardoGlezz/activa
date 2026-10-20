import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Exercise, CreateExerciseDTO } from '../domain/exercise.model';
import { ExerciseMediaUpload, ExerciseRepository } from '../domain/exercise.repository';
import { BancoEjerciciosComponent } from '../../../components/banco-ejercicios/banco-ejercicios';
import { ExerciseHttpRepository } from '../infraestructure/exercise-http.repository';

@Injectable({ providedIn: 'root' })
export class ExerciseUseCase {
    constructor(private repository: ExerciseRepository) {}

  listExercises(page: number, limit: number): Observable<{ rows: Exercise[], count: number }> {
    return this.repository.getAll(page, limit); // Ejemplo: 10 por página
  }

  getExercise(id: number | string): Observable<any> {
    return this.repository.getById(id);
  }

  addExercise(data: CreateExerciseDTO): Observable<any> {
    return this.repository.create(data);
  }

  updateExercise(id: number | string, data: Partial<Exercise>): Observable<any> {
    return this.repository.update(id, data);
  }

  uploadMedia(file: File): Observable<ExerciseMediaUpload> {
    return this.repository.uploadMedia(file);
  }
}