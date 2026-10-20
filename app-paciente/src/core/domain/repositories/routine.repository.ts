import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Routine } from '../models/routine.model';

@Injectable({
  providedIn: 'root'
})
export abstract class RoutineRepository {
  abstract getRoutines(): Observable<Routine[]>;
  abstract getRoutinesByPatient(patientId: number): Observable<Routine[]>;
  abstract getRoutineById(id: number): Observable<Routine>;
}