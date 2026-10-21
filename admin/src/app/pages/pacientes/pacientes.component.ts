import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService, PatientRow } from '../../services/admin.service';
import { formatWhen } from '../../shared/format';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss'],
})
export class PacientesComponent implements OnInit {
  all: PatientRow[] = [];
  buscar = '';
  fisio = '';
  cargando = true;
  error = '';

  readonly when = formatWhen;

  constructor(private adminService: AdminService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      this.buscar = q.get('buscar') ?? this.buscar;
      this.fisio = q.get('fisio') ?? '';
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.adminService.listPatients().subscribe({
      next: (rows) => {
        this.all = rows;
        const seen = new Map<number, string>();
        rows.forEach((p) => seen.set(p.id_physio, p.physio_name));
        this.fisios = [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.message;
        this.cargando = false;
      },
    });
  }

  /** Fisios que tienen pacientes, para el filtro (se calcula una vez al cargar) */
  fisios: { id: number; name: string }[] = [];

  get pacientes(): PatientRow[] {
    const q = this.normalize(this.buscar);
    return this.all.filter(
      (p) =>
        (!this.fisio || String(p.id_physio) === this.fisio) &&
        (!q || this.normalize(`${p.name} ${p.email ?? ''}`).includes(q))
    );
  }

  get sinRutina(): number {
    return this.pacientes.filter((p) => p.active_routines === 0).length;
  }

  abrir(p: PatientRow): void {
    this.router.navigate(['/pacientes', p.id_patient]);
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
