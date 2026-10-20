import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreatePhysiotherapistDTO } from '../domain/physiotherapist.model';
import { PhysiotherapistRepository } from '../domain/physiotherapist.repository';

@Injectable({ providedIn: 'root' })
export class PhysiotherapistUseCase {
  constructor(private repository: PhysiotherapistRepository) {}

  register(data: CreatePhysiotherapistDTO): Observable<any> {
    return this.repository.create(data);
  }
}
