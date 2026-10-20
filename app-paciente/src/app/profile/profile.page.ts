import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { ToastController } from '@ionic/angular';
import { RoutineApiService } from '../core/infrastructure/api/routine-api.service';
import { PhysiotherapistApiService, Physiotherapist } from '../core/infrastructure/api/physiotherapist-api.service';
import { PatientRepository } from '../../core/domain/repositories/patient.repository';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  userName      = 'Cargando...';
  patient: any  = null;
  currentYear   = new Date().getFullYear();
  physio: Physiotherapist | null = null;
  pacienteDesde = '—';
  clinicName    = (environment as any).clinicName ?? 'ACTIVA Health Center';

  // Stats
  edad   = '—';
  peso   = '—';
  altura = '—';

  // IMC
  imc: number | null = null;
  imcLabel = '';
  imcColor = 'medium';

  constructor(
    private router: Router,
    private storage: Storage,
    private routineApi: RoutineApiService,
    private physioApi: PhysiotherapistApiService,
    private patientRepo: PatientRepository,
    private toast: ToastController
  ) {}

  async ngOnInit() {
    await this.storage.create();

    // Intentar cargar desde storage primero (objeto crudo del back)
    const stored = await this.storage.get('currentPatient');
    const patientId = await this.storage.get('currentPatientId');
    const id = patientId ?? stored?.id ?? stored?.idpatient ?? 1;

    // Siempre traer datos frescos del back para tener todos los campos
    this.patientRepo.getPatientById(id).subscribe({
      next: (p: any) => {
        this.patient = p;
        this.userName = [p.firstName, p.lastNameP, p.lastNameM].filter(Boolean).join(' ') || 'Paciente';
        this.calcularStats(p);

        const physioId = p.physiotherapistId ?? p.idphysio;
        if (physioId) {
          this.physioApi.getById(physioId).subscribe((ph) => (this.physio = ph));
        }
      },
      error: () => {
        // Fallback al objeto en storage si falla el back
        if (stored) {
          this.patient = stored;
          this.userName = [stored.firstName, stored.lastNameP, stored.lastNameM,
                           stored.firstname, stored.lastnamepaternal, stored.lastnamematernal]
            .filter(Boolean).join(' ') || 'Paciente';
          this.calcularStats(stored);
        }
      }
    });

    // Rutina para "Paciente desde"
    this.routineApi.getRoutines(id).subscribe((routines) => {
      if (routines.length > 0 && routines[0].startDate) {
        const d = new Date(routines[0].startDate);
        this.pacienteDesde = d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
      }
    });
  }

  private calcularStats(p: any) {
    // EDAD: soporta birthYear (modelo), birthdate y birth_date (raw back)
    const by = p.birthYear;
    const bd = p.birthdate ?? p.birth_date ?? p.birthDate;
    if (by && !isNaN(Number(by))) {
      this.edad = `${this.currentYear - Number(by)} años`;
    } else if (bd) {
      const year = new Date(bd).getFullYear();
      this.edad = `${this.currentYear - year} años`;
    }

    // PESO
    const w = parseFloat(p.weight);
    if (!isNaN(w)) this.peso = `${w} kg`;

    // ALTURA
    const h = parseFloat(p.height);
    if (!isNaN(h)) this.altura = `${h} m`;

    // IMC
    if (!isNaN(w) && !isNaN(h) && h > 0) {
      this.imc = w / (h * h);
      if      (this.imc < 18.5) { this.imcLabel = 'Bajo peso';  this.imcColor = 'warning'; }
      else if (this.imc < 25)   { this.imcLabel = 'Normal';     this.imcColor = 'success'; }
      else if (this.imc < 30)   { this.imcLabel = 'Sobrepeso';  this.imcColor = 'warning'; }
      else                      { this.imcLabel = 'Obesidad';   this.imcColor = 'danger';  }
    }
  }

  goToHistorial()     { this.router.navigate(['/tabs/historial']); }
  goToPhysioProfile() { this.router.navigate(['/tabs/physiotherapist-profile']); }
  goToNotifications() { this.router.navigate(['/tabs/notifications']); }

  async cerrarSesion() {
    await this.storage.create();
    await this.storage.remove('currentPatientId');
    await this.storage.remove('currentPatient');
    await this.storage.remove('currentRoutineId');
    this.router.navigate(['/login']);
  }

  ionViewWillLeave() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }
}
