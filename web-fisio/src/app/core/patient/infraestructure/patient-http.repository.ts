import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../domain/patient.model';
import { PatientRepository } from '../domain/patient.repository';
// Importamos el environment
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PatientHttpRepository implements PatientRepository {
  // Construimos la URL uniendo el baseUrl del environment y la ruta de patients
  private readonly apiUrl = `${environment.webservice.baseUrl}/api/patients`; 

  constructor(private http: HttpClient) {}

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.apiUrl);
  }

  createPatient(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.apiUrl, patient);
  }
  updatePatient(id: number, patient: any): Observable<Patient> {
    return this.http.put<Patient>(`${this.apiUrl}/${id}`, patient);
  }
}