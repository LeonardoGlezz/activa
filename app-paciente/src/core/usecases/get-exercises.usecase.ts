import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Exercise } from '../domain/models/exercise.model';
import { ExerciseRepository } from '../domain/repositories/exercise.repository';

@Injectable({ providedIn: 'root' })
export class GetExercisesUseCase {
  constructor(private exerciseRepository: ExerciseRepository) {}

  execute(): Observable<Exercise[]> {
    return this.exerciseRepository.getExercises();
  }
}