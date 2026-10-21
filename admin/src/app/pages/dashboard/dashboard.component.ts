import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService, AdminOverview, ActivityEvent } from '../../services/admin.service';
import { activityIcon, formatWhen } from '../../shared/format';

const APPOINTMENT_LABELS: Record<string, string> = {
  pending: 'Pendientes',
  confirmed: 'Confirmadas',
  completed: 'Realizadas',
  cancelled: 'Canceladas',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  overview: AdminOverview | null = null;
  activity: ActivityEvent[] = [];
  cargando = true;
  error = '';

  readonly icon = activityIcon;
  readonly when = formatWhen;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarOverview();
  }

  cargarOverview(): void {
    this.cargando = true;
    this.error = '';
    forkJoin({ overview: this.adminService.getOverview(), activity: this.adminService.getActivity(30) }).subscribe({
      next: ({ overview, activity }) => {
        this.overview = overview;
        this.activity = activity.slice(0, 8);
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar datos.';
        this.cargando = false;
      },
    });
  }

  get porValidar(): number {
    return this.overview?.physiotherapists.pending_approval ?? 0;
  }

  /** Barras de sesiones por día: altura relativa al día con más sesiones */
  get barras(): { label: string; sessions: number; height: number }[] {
    const days = this.overview?.usage.sessions_per_day ?? [];
    const max = Math.max(1, ...days.map((d) => d.sessions));
    return days.map((d) => ({
      label: new Date(`${d.date}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'narrow', day: 'numeric' }),
      sessions: d.sessions,
      height: Math.round((d.sessions / max) * 100),
    }));
  }

  get citas(): { label: string; total: number }[] {
    const byStatus = this.overview?.appointments.by_status ?? {};
    return Object.keys(APPOINTMENT_LABELS).map((k) => ({ label: APPOINTMENT_LABELS[k], total: byStatus[k] ?? 0 }));
  }
}
