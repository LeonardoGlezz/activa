import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Patient } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export abstract class PatientRepository {
  abstract getPatients(): Observable<Patient[]>;
  abstract getPatientById(id: number): Observable<Patient>;
  abstract login(email: string, password: string): Observable<Patient | null>;
}