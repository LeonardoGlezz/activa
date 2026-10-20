import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface LegalDocument {
  id: string;
  title: string;
  version: string;
  path: string;
  accepted: boolean;
}

export interface LegalStatus {
  accepted: boolean;
  documents: LegalDocument[];
}

/** Aviso de privacidad y términos: enlaces públicos y aceptación del paciente. */
@Injectable({ providedIn: 'root' })
export class LegalApiService {
  private baseUrl = `${environment.apiUrl}/legal/consent`;
  // Se recuerda durante la sesión para no consultar en cada cambio de pantalla.
  private acceptedInSession = false;

  static readonly privacyUrl = `${environment.backendUrl}/legal/aviso-privacidad-pacientes.html`;
  static readonly termsUrl = `${environment.backendUrl}/legal/terminos-de-uso.html`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<LegalStatus> {
    if (this.acceptedInSession) return of({ accepted: true, documents: [] });
    return this.http
      .get<{ success: boolean } & LegalStatus>(this.baseUrl)
      .pipe(
        map((res) => ({ accepted: !!res.accepted, documents: res.documents ?? [] })),
        tap((status) => (this.acceptedInSession = status.accepted))
      );
  }

  acceptAll(): Observable<boolean> {
    return this.http
      .post<{ success: boolean; accepted: boolean }>(this.baseUrl, { acceptAll: true })
      .pipe(
        map((res) => !!res.accepted),
        tap((accepted) => (this.acceptedInSession = accepted))
      );
  }

  clearSession(): void {
    this.acceptedInSession = false;
  }
}
