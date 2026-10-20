import { Observable } from 'rxjs';
import { Physiotherapist, CreatePhysiotherapistDTO } from './physiotherapist.model';

export abstract class PhysiotherapistRepository {
  abstract create(data: CreatePhysiotherapistDTO): Observable<any>;
  abstract getById(id: number): Observable<Physiotherapist>;
}