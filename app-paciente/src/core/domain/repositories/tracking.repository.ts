import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tracking } from '../models/tracking.model';

@Injectable({
  providedIn: 'root'
})
export abstract class TrackingRepository {
  abstract registerPainLevel(tracking: Tracking): Observable<void>;
  abstract getTrackingByRoutine(routineId: number): Observable<Tracking[]>;
}