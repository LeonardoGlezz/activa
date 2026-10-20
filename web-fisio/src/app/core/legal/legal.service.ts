import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_ROOT, WS_BASE_URL } from '../api-url';

const LEGAL_BASE = `${WS_BASE_URL.replace(/\/$/, '')}/legal`;

/** Enlaces públicos a los avisos legales (los sirve el backend). */
export const LEGAL_URLS = {
  privacidadFisio: `${LEGAL_BASE}/aviso-privacidad-fisioterapeutas.html`,
  privacidadPacientes: `${LEGAL_BASE}/aviso-privacidad-pacientes.html`,
  terminos: `${LEGAL_BASE}/terminos-de-uso.html`,
  indice: `${LEGAL_BASE}/index.html`,
};

/** Aceptación del aviso de privacidad y los términos por el fisio con sesión iniciada. */
@Injectable({ providedIn: 'root' })
export class LegalService {
  private readonly url = `${API_ROOT}/legal/consent`;
  // Se recuerda por token para no consultar en cada cambio de pantalla.
  private acceptedToken: string | null = null;

  constructor(private http: HttpClient) {}

  isAccepted(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (token && token === this.acceptedToken) return of(true);
    return this.http.get<{ accepted: boolean }>(this.url).pipe(
      map((res) => !!res.accepted),
      tap((accepted) => (this.acceptedToken = accepted ? token : null))
    );
  }

  acceptAll(): Observable<boolean> {
    return this.http.post<{ accepted: boolean }>(this.url, { acceptAll: true }).pipe(
      map((res) => !!res.accepted),
      tap((accepted) => (this.acceptedToken = accepted ? localStorage.getItem('token') : null))
    );
  }
}
