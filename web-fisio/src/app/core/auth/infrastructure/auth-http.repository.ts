import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterPhysioDTO } from '../domain/auth.model';
import { AuthRepository } from '../domain/auth.repository';
import { environment } from '../../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthHttpRepository implements AuthRepository {
  // Apuntamos al controlador Auth que me mostraste del backend
  private readonly apiUrl = `${environment.webservice.baseUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  registerPhysiotherapist(data: RegisterPhysioDTO): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials);
  }
}