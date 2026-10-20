import { Observable } from 'rxjs';
import { RegisterPhysioDTO } from './auth.model';

export abstract class AuthRepository {
  abstract registerPhysiotherapist(data: RegisterPhysioDTO): Observable<any>;
  abstract login(credentials: any): Observable<any>;
}