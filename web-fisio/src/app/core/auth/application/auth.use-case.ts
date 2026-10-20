import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RegisterPhysioDTO } from '../domain/auth.model';
import { AuthRepository } from '../domain/auth.repository';

@Injectable({ providedIn: 'root' })
export class AuthUseCase {
  constructor(private repository: AuthRepository) {}

  registerPhysio(data: RegisterPhysioDTO): Observable<any> {
    return this.repository.registerPhysiotherapist(data);
  }

  login(credentials: any): Observable<any> {
    return this.repository.login(credentials);
  }
}