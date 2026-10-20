import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Routine } from '../domain/models/routine.model';
import { RoutineRepository } from '../domain/repositories/routine.repository';

@Injectable({ providedIn: 'root' })
export class GetRoutinesUseCase {
  constructor(private routineRepository: RoutineRepository) {}

  execute(): Observable<Routine[]> {
    return this.routineRepository.getRoutines();
  }
}