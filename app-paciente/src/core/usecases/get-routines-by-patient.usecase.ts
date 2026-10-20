import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Routine } from '../domain/models/routine.model';
import { RoutineRepository } from '../domain/repositories/routine.repository';

@Injectable({ providedIn: 'root' })
export class GetRoutinesByPatientUseCase {
  constructor(private routineRepository: RoutineRepository) {}

  execute(patientId: number): Observable<Routine[]> {
    return this.routineRepository.getRoutinesByPatient(patientId);
  }
}