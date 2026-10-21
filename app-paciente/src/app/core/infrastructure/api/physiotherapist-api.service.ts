import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/** Lo que el paciente puede ver de su fisio (lo decide el servidor) */
export interface MyPhysio {
  fullName: string;
  firstName: string;
  professionalLicense: string | null;
  /** Número con lada de México (52…) o null si el fisio no lo muestra */
  whatsapp: string | null;
  phone: string | null;
}

@Injectable({ providedIn: 'root' })
export class PhysiotherapistApiService {
  private cache$?: Observable<MyPhysio | null>;

  constructor(private http: HttpClient) {}

  /** GET /patient/my-physio: nombre, cédula y WhatsApp del fisio del paciente en sesión */
  getMine(): Observable<MyPhysio | null> {
    if (!this.cache$) {
      this.cache$ = this.http.get<any>(`${environment.apiUrl}/patient/my-physio`).pipe(
        map((p) => ({
          fullName: p?.name || 'Tu fisioterapeuta',
          firstName: p?.firstName || '',
          professionalLicense: p?.professionalLicense ?? null,
          whatsapp: p?.whatsapp ?? null,
          phone: p?.phone ?? null,
        })),
        catchError(() => {
          this.cache$ = undefined;
          return of(null);
        }),
        shareReplay(1)
      );
    }
    return this.cache$;
  }

  /** Olvida los datos guardados (al cerrar sesión) */
  clear() {
    this.cache$ = undefined;
  }

  whatsappUrl(physio: MyPhysio | null, patientName = ''): string | null {
    if (!physio?.whatsapp) return null;
    const hello = patientName ? `Hola, soy ${patientName}. ` : 'Hola. ';
    return `https://wa.me/${physio.whatsapp}?text=${encodeURIComponent(hello + 'Te escribo desde Activa.')}`;
  }
}
