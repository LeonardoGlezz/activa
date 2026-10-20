import { Observable } from 'rxjs';
import { Appointment } from './appointment.model';

export abstract class AppointmentRepository {
  abstract getAllMyApiAppointments(): Observable<any>; // Para el calendario principal
  abstract getAppointmentsByPatient(patientId: number): Observable<any>; // Para el expediente
  abstract createAppointment(appointment: any): Observable<any>;
  abstract updateAppointment(id: number, appointment: any): Observable<any>;
}