import { Component, ChangeDetectionStrategy, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouteAnimationService } from '../core/services/route-animation.service';
import { PatientRepository } from '../../core/domain/repositories/patient.repository';
import { RoutineApiService } from '../core/infrastructure/api/routine-api.service';
import { AppointmentApiService } from '../core/infrastructure/api/appointment-api.service';
import { NotificationApiService } from '../core/infrastructure/api/notification-api.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-your-progress',
  templateUrl: './your-progress.page.html',
  styleUrls: ['./your-progress.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Tab4Page implements OnInit {
  user = signal({
    fullName: 'Cargando...',
    routineName: ''
  });

  nextAppointment = signal<{ fecha: string; hora: string; tipo: string } | null>(null);
  unreadCount = signal(0);

  constructor(
    private router: Router,
    private routeAnimationService: RouteAnimationService,
    private patientRepo: PatientRepository,
    private routineApi: RoutineApiService,
    private appointmentApi: AppointmentApiService,
    private notificationApi: NotificationApiService,
    private storage: Storage
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const patientId = await this.storage.get('currentPatientId');
    const id = patientId ?? 1;

    // Nombre del paciente
    this.patientRepo.getPatientById(id).subscribe({
      next: (patient) => {
        const fullName = [patient.firstName, patient.lastNameP, patient.lastNameM]
          .filter(Boolean).join(' ') || 'Paciente';
        this.user.update(u => ({ ...u, fullName }));
      },
      error: () => this.user.update(u => ({ ...u, fullName: 'Inicia sesión' }))
    });

    // Rutina real asignada por el fisio
    this.routineApi.getRoutines(id).subscribe((routines) => {
      if (routines.length > 0) {
        this.user.update(u => ({ ...u, routineName: routines[0].name }));
      }
    });

    // Próxima cita — el mapper ya normaliza date/starttime del back
    this.appointmentApi.getNext(id).subscribe((apt) => {
      if (apt && apt.appointmentDate) {
        const dateObj = new Date(apt.appointmentDate + 'T12:00:00');
        const fecha = dateObj.toLocaleDateString('es-MX', {
          weekday: 'long', day: 'numeric', month: 'long'
        });
        // Capitalizar primera letra
        const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);
        const hora = apt.appointmentTime
          ? apt.appointmentTime.substring(0, 5)   // HH:MM
          : '';
        const tipo = (apt.notes && apt.notes.length < 60) ? apt.notes : 'Sesión de fisioterapia';
        this.nextAppointment.set({ fecha: fechaCap, hora, tipo });
      } else {
        this.nextAppointment.set(null);
      }
    });

    this.notificationApi.getUnreadCount(id).subscribe((c) => this.unreadCount.set(c));
  }

  ionViewWillEnter() {
    this.storage.get('currentPatientId').then((id) => {
      if (id) this.notificationApi.getUnreadCount(id).subscribe((c) => this.unreadCount.set(c));
    });
  }

  goToProfile() {
    this.routeAnimationService.navigateWithAnimation(['/tabs/profile'], 'slide');
  }

  goToNotifications() {
    this.router.navigate(['/tabs/notifications']);
  }

  ionViewWillLeave() {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }
}
