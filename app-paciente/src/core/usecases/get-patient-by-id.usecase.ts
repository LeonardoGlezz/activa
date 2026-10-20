import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Patient } from '../domain/models/patient.model';
import { PatientRepository } from '../domain/repositories/patient.repository';

@Injectable({ providedIn: 'root' })
export class GetPatientByIdUseCase {
  constructor(private patientRepository: PatientRepository) {}

  execute(id: number): Observable<Patient> {
    return this.patientRepository.getPatientById(id);
  }
}