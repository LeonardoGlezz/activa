import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private storage: Storage, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.storage.create().then(() => this.storage.get('patient_token'))).pipe(
      switchMap((token: string | null) => {
        if (token) {
          const cloned = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
          return next.handle(cloned).pipe(
            catchError((err: HttpErrorResponse) => {
              // Token vencido o inválido: cerrar sesión y volver al login.
              if (err.status === 401) {
                Promise.all([
                  this.storage.remove('patient_token'),
                  this.storage.remove('currentPatientId'),
                  this.storage.remove('currentPatient'),
                ]).then(() => this.router.navigate(['/login']));
              }
              return throwError(() => err);
            })
          );
        }
        return next.handle(req);
      })
    );
  }
}
