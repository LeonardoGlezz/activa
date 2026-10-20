import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppointmentHttpRepository } from '../infrastructure/appointment-http.repository';

@Injectable({
  providedIn: 'root'
  // 🪄 ELIMINÉ EL 'useClass' QUE CAUSABA EL ERROR
})
export class AppointmentUseCase {

  // 🪄 AHORA INYECTAMOS EL HTTP REPOSITORY DIRECTAMENTE
  constructor(private appointmentRepository: AppointmentHttpRepository) {}

  getAllAppointments(): Observable<any> {
    return this.appointmentRepository.getAllMyApiAppointments();
  }

  getPatientAppointments(patientId: number): Observable<any> {
    return this.appointmentRepository.getAppointmentsByPatient(patientId);
  }

  executeCreate(appointment: any): Observable<any> { 
    return this.appointmentRepository.createAppointment(appointment);
  }

  executeUpdate(id: number, appointment: any): Observable<any> {
    return this.appointmentRepository.updateAppointment(id, appointment);
  }
}