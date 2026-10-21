import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService, ActivityEvent, ActivityType } from '../../services/admin.service';
import { ACTIVITY_LABELS, activityIcon, formatWhen } from '../../shared/format';

@Component({
  selector: 'app-actividad',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './actividad.component.html',
})
export class ActividadComponent implements OnInit {
  events: ActivityEvent[] = [];
  tipo: ActivityType | '' = '';
  dias = 30;
  cargando = true;
  error = '';

  readonly tipos = Object.entries(ACTIVITY_LABELS) as [ActivityType, string][];
  readonly icon = activityIcon;
  readonly when = formatWhen;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.adminService.getActivity(this.dias).subscribe({
      next: (rows) => {
        this.events = rows;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.message;
        this.cargando = false;
      },
    });
  }

  get filtrados(): ActivityEvent[] {
    return this.tipo ? this.events.filter((e) => e.type === this.tipo) : this.events;
  }
}
