import { Observable } from 'rxjs';
import { Patient } from './patient.model';

// Esta clase abstracta funciona como nuestro "Puerto". 
// Define el contrato, pero NO cómo se conecta.
export abstract class PatientRepository {
  abstract getAllPatients(): Observable<Patient[]>;
  abstract createPatient(patient: Patient): Observable<Patient>;
  abstract updatePatient(id: number, patient: any): Observable<Patient>;
}