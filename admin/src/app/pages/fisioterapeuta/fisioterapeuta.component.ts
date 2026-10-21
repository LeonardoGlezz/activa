import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, PhysioRow, PhysioStatus } from '../../services/admin.service';

interface Tab {
  status: PhysioStatus;
  label: string;
}

@Component({
  selector: 'app-fisioterapeuta',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './fisioterapeuta.component.html',
  styleUrls: ['./fisioterapeuta.component.scss'],
})
export class FisioterapeutaComponent implements OnInit {
  readonly tabs: Tab[] = [
    { status: 'pending_approval', label: 'Por validar' },
    { status: 'approved', label: 'Aprobados' },
    { status: 'rejected', label: 'Rechazados' },
    { status: 'pending_profile', label: 'Sin documentos' },
  ];

  active: PhysioStatus = 'pending_approval';
  physios: PhysioRow[] = [];
  cargando = false;
  error = '';
  aviso = '';
  procesando: number | null = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.cargar();
  }

  seleccionar(status: PhysioStatus): void {
    if (status === this.active) return;
    this.active = status;
    this.aviso = '';
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.adminService.listPhysios(this.active).subscribe({
      next: (rows) => {
        this.physios = rows;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err.message;
        this.cargando = false;
      },
    });
  }

  nombre(p: PhysioRow): string {
    return [p.first_name, p.last_name_paternal, p.last_name_maternal].filter(Boolean).join(' ');
  }

  documento(fileName?: string | null): string | null {
    return fileName ? this.adminService.documentUrl(fileName) : null;
  }

  cambiarEstado(p: PhysioRow, action: 'approved' | 'rejected'): void {
    const verbo = action === 'approved' ? 'aprobar' : 'rechazar';
    if (!confirm(`¿Seguro que quieres ${verbo} a ${this.nombre(p)}?`)) return;
    this.procesando = p.id_physio;
    this.adminService.setPhysioStatus(p.id_physio, action).subscribe({
      next: (resp) => {
        this.procesando = null;
        this.aviso = resp.message;
        this.physios = this.physios.filter((x) => x.id_physio !== p.id_physio);
      },
      error: (err) => {
        this.procesando = null;
        this.error = err.message;
      },
    });
  }
}
