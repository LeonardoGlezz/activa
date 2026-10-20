import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LegalService } from './legal.service';

/** Pide aceptar el aviso de privacidad y los términos antes de usar el panel. Va después de authGuard. */
export const legalGuard: CanActivateFn = () => {
  const legal = inject(LegalService);
  const router = inject(Router);
  return legal.isAccepted().pipe(
    map((accepted) => (accepted ? true : router.parseUrl('/aceptar-avisos'))),
    catchError(() => of(router.parseUrl('/aceptar-avisos')))
  );
};
