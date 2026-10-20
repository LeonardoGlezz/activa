import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LegalApiService } from '../infrastructure/api/legal-api.service';

/**
 * Pide aceptar el aviso de privacidad y los términos antes de entrar.
 * Va después de patientSessionGuard, así que ya hay token.
 */
export const patientConsentGuard: CanActivateFn = () => {
  const legal = inject(LegalApiService);
  const router = inject(Router);
  return legal.getStatus().pipe(
    map((status) => (status.accepted ? true : router.parseUrl('/consentimiento'))),
    // Si falla la consulta, se vuelve a pedir el consentimiento antes que dejar pasar sin él.
    catchError(() => of(router.parseUrl('/consentimiento')))
  );
};
