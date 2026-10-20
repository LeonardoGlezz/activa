import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const messageService = inject(MessageService);
  const token = localStorage.getItem('token');

  let peticionClonada = req;

  if (token) {
    peticionClonada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(peticionClonada).pipe(
    catchError((error: HttpErrorResponse) => {
      
      if (error.status === 401) {
        console.warn('El token ha expirado o es inválido. Cerrando sesión por seguridad...');
        
        // 1. Limpiamos la basura del navegador
        localStorage.removeItem('token');
        localStorage.removeItem('documentos_subidos');
        
        // 2. Mostramos el mensaje (durará 3 segundos en pantalla)
        messageService.add({ 
          severity: 'error', 
          summary: 'Sesión Expirada', 
          detail: 'Tu sesión ha caducado por seguridad. Redirigiendo al inicio de sesión...',
          life: 3000 
        });
        
        // 3. ✨ EL FRENO: Esperamos 3 segundos ANTES de mandarlo al login
        setTimeout(() => {
          router.navigate(['/login']);
        }, 3000);
      }

      return throwError(() => error);
    })
  );
};