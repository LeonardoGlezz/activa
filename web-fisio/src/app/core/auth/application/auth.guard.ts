import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Buscamos si el usuario tiene su "Gafete" guardado
  const token = localStorage.getItem('token'); 

  if (token) {
    // Si tiene token, lo dejamos pasar a la pantalla
    return true;
  } else {
    // Si NO tiene token, lo rebotamos al login
    router.navigate(['/login']);
    return false;
  }
};