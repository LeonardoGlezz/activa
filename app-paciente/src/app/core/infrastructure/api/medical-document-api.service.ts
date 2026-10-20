import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface MedicalDocument {
  id: number;
  patientId: number;
  name: string;
  type: string;
  fileUrl: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MedicalDocumentApiService {
  private baseUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  list(patientId: number, limit = 100): Observable<MedicalDocument[]> {
    return this.http
      .get<{ success: boolean; rows?: any[] }>(`${this.baseUrl}`, { params: { patientId: String(patientId), limit: String(limit) } })
      .pipe(
        map((res) => (res.rows || []).map((d) => this.mapDoc(d))),
        catchError(() => of([]))
      );
  }

  create(data: { patientId: number; name: string; type?: string; fileUrl: string }): Observable<MedicalDocument | null> {
    return this.http.post<{ success: boolean; data?: any }>(`${this.baseUrl}`, data).pipe(
      map((res) => (res.data ? this.mapDoc(res.data) : null)),
      catchError(() => of(null))
    );
  }

  delete(id: number, patientId: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean }>(`${this.baseUrl}/${id}`, { params: { patientId: String(patientId) } })
      .pipe(
        map((res) => res.success === true),
        catchError(() => of(false))
      );
  }

  private mapDoc(d: any): MedicalDocument {
    return {
      id: d.id,
      patientId: d.patientId ?? d.patient_id,
      name: d.name ?? '',
      type: d.type ?? 'otro',
      fileUrl: d.fileUrl ?? d.file_url ?? '',
      createdAt: d.createdAt ?? d.created_at,
    };
  }
}
