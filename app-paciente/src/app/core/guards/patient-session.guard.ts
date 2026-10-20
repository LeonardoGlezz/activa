import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';

/** Solo deja entrar a las pestañas si hay un paciente con sesión iniciada. */
export const patientSessionGuard: CanActivateFn = async () => {
  const storage = inject(Storage);
  const router = inject(Router);
  await storage.create();
  const token = await storage.get('patient_token');
  const patientId = await storage.get('currentPatientId');
  return token && patientId ? true : router.parseUrl('/login');
};
