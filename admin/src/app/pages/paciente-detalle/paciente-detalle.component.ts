import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AdminService, PatientDetail } from '../../services/admin.service';
import { formatWhen, temporaryPassword } from '../../shared/format';

@Component({
  selector: 'app-paciente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './paciente-detalle.component.html',
  styleUrls: ['./paciente-detalle.component.scss'],
})
export class PacienteDetalleComponent implements OnInit {
  paciente: PatientDetail | null = null;
  cargando = true;
  error = '';
  aviso = '';

  cambiandoPassword = false;
  passwordNueva = '';
  guardando = false;
  passwordGuardada = '';

  readonly when = formatWhen;
  readonly pacienteUrl = `${location.origin}/paciente/`;

  constructor(private adminService: AdminService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((p) => this.cargar(Number(p.get('id'))));
  }

  cargar(id = this.paciente?.id_patient ?? 0): void {
    this.cargando = true;
    this.error = '';
    this.adminService.getPatient(id).subscribe({
      next: (data) => {
        this.paciente = data;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.message;
        this.cargando = false;
      },
    });
  }

  vigente(r: { start_date: string | null; end_date: string | null }): boolean {
    const hoy = new Date().toLocaleDateString('en-CA');
    return (!r.start_date || r.start_date <= hoy) && (!r.end_date || r.end_date >= hoy);
  }

  get ultimaSesion(): string | null {
    return this.paciente?.sessions.length ? this.paciente.sessions[0].date : null;
  }

  get sesiones30(): number {
    const desde = new Date(Date.now() - 29 * 86400000).toLocaleDateString('en-CA');
    return this.paciente?.sessions.filter((s) => s.date >= desde).length ?? 0;
  }

  abrirPassword(): void {
    this.cambiandoPassword = true;
    this.passwordNueva = temporaryPassword();
    this.passwordGuardada = '';
  }

  guardarPassword(): void {
    if (!this.paciente) return;
    if (this.passwordNueva.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }
    this.guardando = true;
    this.adminService.setPatientPassword(this.paciente.id_patient, this.passwordNueva).subscribe({
      next: (resp) => {
        this.guardando = false;
        this.cambiandoPassword = false;
        this.aviso = resp.message;
        this.passwordGuardada = this.passwordNueva;
        if (this.paciente) this.paciente.can_login = true;
      },
      error: (err) => {
        this.guardando = false;
        this.error = err.message;
      },
    });
  }
}
