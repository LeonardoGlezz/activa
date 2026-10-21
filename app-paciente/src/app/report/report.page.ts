import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Storage } from '@ionic/storage-angular';
import { RouteAnimationService } from '../core/services/route-animation.service';
import { RegisterPainLevelUseCase } from '../../core/usecases/register-pain-level.usecase';
import { RoutineApiService } from '../core/infrastructure/api/routine-api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
  standalone: false
})
export class Tab6Page {
  reportForm: FormGroup;
  selectedPainLevel: number | null = null;
  isLoading = false;
  currentRoutineId: number | null = null;
  readonly levels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private routeAnimationService: RouteAnimationService,
    private registerPainLevelUseCase: RegisterPainLevelUseCase,
    private routineApi: RoutineApiService
  ) {
    this.reportForm = this.formBuilder.group({
      painLevel: [null, Validators.required],
      observations: ['']
    });
  }

  ionViewWillLeave() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  async ionViewWillEnter() {
    // Inicializar storage
    await this.storage.create();

    // Intentar obtener routineId de diferentes fuentes
    await this.loadCurrentRoutineId();
    
    // Limpiamos el formulario cada vez que el usuario vuelve a esta pantalla
    this.reportForm.reset();
    this.selectedPainLevel = null;
  }

  private async loadCurrentRoutineId() {
    // 1. Primero intentar desde parámetros de ruta
    const routeRoutineId = this.route.snapshot.paramMap.get('routineId');
    if (routeRoutineId) {
      this.currentRoutineId = parseInt(routeRoutineId, 10);
      return;
    }

    // 2. Intentar desde query params
    const queryRoutineId = this.route.snapshot.queryParamMap.get('routineId');
    if (queryRoutineId) {
      this.currentRoutineId = parseInt(queryRoutineId, 10);
      return;
    }

    // 3. Intentar desde storage local
    const storedRoutineId = await this.storage.get('currentRoutineId');
    if (storedRoutineId) {
      this.currentRoutineId = storedRoutineId;
      return;
    }

    // 4. La rutina vigente del paciente
    const patientId = await this.storage.get('currentPatientId');
    if (patientId) {
      const routines = await firstValueFrom(this.routineApi.getRoutines(patientId));
      this.currentRoutineId = routines[0]?.id || null;
    }
  }

  tone(level: number): 'low' | 'mid' | 'high' {
    return level <= 3 ? 'low' : level <= 6 ? 'mid' : 'high';
  }

  describe(level: number): string {
    if (level === 0) return 'sin dolor';
    if (level <= 3) return 'dolor leve';
    if (level <= 6) return 'dolor moderado';
    if (level <= 8) return 'dolor fuerte';
    return 'dolor muy fuerte';
  }

  selectPainLevel(level: number) {
    this.selectedPainLevel = level;
    this.reportForm.patchValue({ painLevel: level });
  }

  async sendReport() {
    if (this.reportForm.invalid) {
      const toast = await this.toastController.create({
        message: 'Por favor selecciona un nivel de dolor',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Guardando...'
    });
    await loading.present();

    const formValue = this.reportForm.value;
    const routineId = Number(this.currentRoutineId) || 0;

    if (routineId < 1) {
      await loading.dismiss();
      this.isLoading = false;
      const toast = await this.toastController.create({
        message: 'No encontramos tu rutina. Ábrela desde "Mi Rutina" y vuelve a intentar.',
        duration: 3000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const tracking = {
      startTime: new Date().toTimeString().split(' ')[0],
      endTime: new Date().toTimeString().split(' ')[0],
      painLevel: Number(formValue.painLevel),
      postObservations: formValue.observations || '',
      intraObservations: '',
      alert: 0,
      routineId
    };

    this.registerPainLevelUseCase.execute(tracking).subscribe({
      next: async () => {
        await loading.dismiss();
        this.isLoading = false;

        const toast = await this.toastController.create({
          message: Number(formValue.painLevel) >= 7
            ? 'Guardado. Si el dolor sigue fuerte, descansa y escríbele a tu fisio.'
            : 'Guardado. ¡Buen trabajo!',
          duration: 3000,
          position: 'bottom',
          color: 'success',
          cssClass: 'custom-toast'
        });

        await toast.present();

        // Resetear formulario
        this.reportForm.reset();
        this.selectedPainLevel = null;

        // Navegar después del toast
        setTimeout(() => {
          this.routeAnimationService.navigateWithAnimation(['/tabs/your-progress'], 'slide');
        }, 1500);
      },
      error: async (error) => {
        await loading.dismiss();
        this.isLoading = false;

        const msg = error?.error?.details || error?.error?.message || error?.message || 'No se pudo guardar';
        const toast = await this.toastController.create({
          message: typeof msg === 'string' ? msg : 'No se pudo guardar. Inténtalo de nuevo.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
      }
    });
  }
}