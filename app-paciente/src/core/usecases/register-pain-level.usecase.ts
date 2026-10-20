import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tracking } from '../domain/models/tracking.model';
import { TrackingRepository } from '../domain/repositories/tracking.repository';

@Injectable({ providedIn: 'root' })
export class RegisterPainLevelUseCase {
  constructor(private trackingRepository: TrackingRepository) {}

  execute(tracking: Tracking): Observable<void> {
    return this.trackingRepository.registerPainLevel(tracking);
  }
}