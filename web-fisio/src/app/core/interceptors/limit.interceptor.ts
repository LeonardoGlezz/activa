import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api'; // 🪄 Inyectamos ConfirmationService
import { catchError, throwError, EMPTY } from 'rxjs';

export const limitInterceptor: HttpInterceptorFn = (req, next) => {
  const confirmationService = inject(ConfirmationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // 🛡️ CASO 1: Bloqueo por pasarse de su límite (Error 403)
      if (error.status === 403 && error.error?.code === 'LIMIT_REACHED') {
        
        // Lanzamos la ventana elegante en lugar de redirigir de golpe
        confirmationService.confirm({
          header: '¡Límite Alcanzado!',
          message: error.error.message || 'Has alcanzado el límite de tu plan actual. ¿Deseas mejorar tu membresía para desbloquear más capacidad?',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Mejorar Plan',
          rejectLabel: 'Cancelar',
          acceptButtonStyleClass: 'p-button-primary',
          rejectButtonStyleClass: 'p-button-outlined p-button-secondary',
          accept: () => {
            router.navigate(['/dashboard/subscription']);
          }
        });
        return EMPTY; // Matamos la petición para que no crashee la pantalla actual
      }

      // 🛡️ CASO 2: Bloqueo por suscripción inactiva/vencida (Error 402)
      if (error.status === 402) {
        confirmationService.confirm({
          header: 'Suscripción Inactiva',
          message: 'Necesitas renovar tu plan para acceder a esta información.',
          icon: 'pi pi-lock',
          acceptLabel: 'Ir a Membresías',
          rejectVisible: false, // Escondemos el botón cancelar para obligarlo a ir
          accept: () => {
            router.navigate(['/dashboard/subscription']);
          }
        });
        return EMPTY; 
      }

      return throwError(() => error);
    })
  );
};