import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminOverview } from '../../services/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  overview: AdminOverview | null = null;
  cargando = true;
  error = '';

  // Getters de conveniencia para el template
  get fisiosSuscritos(): number    { return this.overview?.physiotherapists.approved ?? 0; }
  get fisiosValidar(): number      { return this.overview?.physiotherapists.pending_approval ?? 0; }
  get fisiosRechazados(): number   { return this.overview?.physiotherapists.rejected ?? 0; }
  get totalPacientes(): number     { return this.overview?.users.patient_accounts ?? 0; }
  get totalCitas(): number         { return this.overview?.appointments.total ?? 0; }
  get gananciasTotal(): number     { return this.overview?.ganancias.total ?? 0; }
  get citasCompletadas(): number   { return this.overview?.ganancias.citas_completadas ?? 0; }

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargarOverview();
  }

  cargarOverview(): void {
    this.cargando = true;
    this.error = '';
    this.adminService.getOverview().subscribe({
      next: (data) => {
        this.overview = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar datos.';
        this.cargando = false;
      },
    });
  }
}
