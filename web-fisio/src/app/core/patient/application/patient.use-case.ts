import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Patient } from '../domain/patient.model';
import { PatientRepository } from '../domain/patient.repository';

@Injectable({
  providedIn: 'root'
})
export class PatientUseCase {
  
  constructor(private patientRepository: PatientRepository) {}

  executeCreate(patient: Patient): Observable<Patient> {
    return this.patientRepository.createPatient(patient);
  }
  getPatients(): Observable<Patient[]> {
    return this.patientRepository.getAllPatients();
  }

  // ¡NUEVO MÉTODO PARA EDITAR!
  executeUpdate(id: number, patient: any): Observable<Patient> {
    return this.patientRepository.updatePatient(id, patient);
  }
}