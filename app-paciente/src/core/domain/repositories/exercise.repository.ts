import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Exercise } from '../models/exercise.model';

@Injectable({
  providedIn: 'root'
})
export abstract class ExerciseRepository {
  abstract getExercises(): Observable<Exercise[]>;
}