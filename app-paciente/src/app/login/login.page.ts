import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { PatientRepository } from '../../core/domain/repositories/patient.repository';
import { Storage } from '@ionic/storage-angular';
import { LegalApiService } from '../core/infrastructure/api/legal-api.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage {
  loginForm: FormGroup;
  readonly privacyUrl = LegalApiService.privacyUrl;
  readonly termsUrl = LegalApiService.termsUrl;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private toastController: ToastController,
    private patientRepo: PatientRepository,
    private storage: Storage
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  async ionViewWillEnter() {
    await this.storage.create();
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      const toast = await this.toastController.create({
        message: 'Ingresa tu correo y tu contraseña',
        duration: 2000,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    const email = this.loginForm.value.email.trim();
    const password = this.loginForm.value.password;
    this.patientRepo.login(email, password).subscribe({
      next: async (patient) => {
        if (patient) {
          // Guardar datos del paciente en Storage
          // El token ya fue guardado en Ionic Storage por patient-api.service.ts
          await this.storage.set('currentPatientId', patient.id);
          await this.storage.set('currentPatient', patient);
          const toast = await this.toastController.create({
            message: `Bienvenido, ${patient.firstName}`,
            duration: 1500,
            position: 'bottom',
            color: 'success',
          });
          await toast.present();
          this.router.navigate(['/tabs/your-progress']);
        } else {
          const toast = await this.toastController.create({
            message: 'Correo o contraseña incorrectos',
            duration: 2500,
            position: 'bottom',
            color: 'danger',
          });
          await toast.present();
        }
      },
      error: async () => {
        const toast = await this.toastController.create({
          message: 'Correo o contraseña incorrectos, o error de conexión.',
          duration: 3000,
          position: 'bottom',
          color: 'danger',
        });
        await toast.present();
      },
    });
  }
}
