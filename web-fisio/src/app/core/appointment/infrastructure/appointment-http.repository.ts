import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppointmentRepository } from '../domain/appointment.repository';
import { API_ROOT } from '../../api-url';

@Injectable({
  providedIn: 'root'
})
export class AppointmentHttpRepository extends AppointmentRepository {
  
  private apiUrl = `${API_ROOT}/appointments`;

  constructor(private http: HttpClient) {
    super();
  }

  // Helper para meter el gafete en cada petición
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // 1. Obtener TODAS las citas del fisio logueado (Para el calendario general)
  getAllMyApiAppointments(): Observable<any> {
    return this.http.get(`${this.apiUrl}`, { headers: this.getHeaders() });
  }

  // 2. Obtener citas de un paciente en específico (Para su expediente)
  getAppointmentsByPatient(patientId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/patient/${patientId}`, { headers: this.getHeaders() });
  }

  // 3. Crear una cita nueva
  createAppointment(appointmentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}`, appointmentData, { headers: this.getHeaders() });
  }

  // 4. Actualizar o cambiar el estado de una cita
  updateAppointment(id: number, appointmentData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, appointmentData, { headers: this.getHeaders() });
  }
}