import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Physiotherapist, CreatePhysiotherapistDTO } from '../domain/physiotherapist.model';
import { PhysiotherapistRepository } from '../domain/physiotherapist.repository';
import { environment } from '../../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class PhysiotherapistHttpRepository implements PhysiotherapistRepository {
  // environment defines webservice.baseUrl, not apiUrl
  private readonly apiUrl = `${environment.webservice.baseUrl}/api/physiotherapists`;

  constructor(private http: HttpClient) {}

  create(data: CreatePhysiotherapistDTO): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getById(id: number): Observable<Physiotherapist> {
    return this.http.get<Physiotherapist>(`${this.apiUrl}/${id}`);
  }
}