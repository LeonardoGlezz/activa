import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { LegalApiService } from '../core/infrastructure/api/legal-api.service';

@Component({
  selector: 'app-consentimiento',
  templateUrl: 'consentimiento.page.html',
  styleUrls: ['consentimiento.page.scss'],
  standalone: false,
})
export class ConsentimientoPage {
  readonly privacyUrl = LegalApiService.privacyUrl;
  readonly termsUrl = LegalApiService.termsUrl;

  aceptaPrivacidad = false;
  aceptaTerminos = false;
  enviando = false;

  constructor(
    private legal: LegalApiService,
    private router: Router,
    private storage: Storage,
    private toastController: ToastController
  ) {}

  get puedeContinuar(): boolean {
    return this.aceptaPrivacidad && this.aceptaTerminos && !this.enviando;
  }

  aceptar() {
    if (!this.puedeContinuar) return;
    this.enviando = true;
    this.legal.acceptAll().subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/tabs/your-progress'], { replaceUrl: true });
      },
      error: async () => {
        this.enviando = false;
        const toast = await this.toastController.create({
          message: 'No pudimos guardar tu respuesta. Revisa tu conexión e inténtalo de nuevo.',
          duration: 3000,
          position: 'bottom',
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  /** Sin consentimiento no se puede usar la app: se cierra la sesión. */
  async noAcepto() {
    await this.storage.create();
    await this.storage.remove('patient_token');
    await this.storage.remove('currentPatientId');
    await this.storage.remove('currentPatient');
    this.legal.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
