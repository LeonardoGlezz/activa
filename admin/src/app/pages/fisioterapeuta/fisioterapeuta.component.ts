import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AdminService, PhysioForm, PhysioRow, PhysioStatus } from '../../services/admin.service';
import { temporaryPassword } from '../../shared/format';

type TabKey = PhysioStatus | 'all';

interface Tab {
  key: TabKey;
  label: string;
}

/** Cuenta recién creada o contraseña nueva, para que el admin la comparta */
interface Credentials {
  name: string;
  email: string;
  password: string;
}

const CURP_RE =
  /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]\d$/;

const STATUS_LABELS: Record<PhysioStatus, string> = {
  pending_approval: 'Por validar',
  approved: 'Con acceso',
  rejected: 'Rechazado',
  pending_profile: 'Sin documentos',
};

function emptyForm(): PhysioForm {
  return { firstName: '', lastNameP: '', lastNameM: '', birthDate: '', email: '', professionalLicense: '', curp: '', password: '' };
}

@Component({
  selector: 'app-fisioterapeuta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './fisioterapeuta.component.html',
  styleUrls: ['./fisioterapeuta.component.scss'],
})
export class FisioterapeutaComponent implements OnInit {
  readonly tabs: Tab[] = [
    { key: 'pending_approval', label: 'Por validar' },
    { key: 'approved', label: 'Con acceso' },
    { key: 'rejected', label: 'Rechazados' },
    { key: 'pending_profile', label: 'Sin documentos' },
    { key: 'all', label: 'Todos' },
  ];
  readonly statusLabels = STATUS_LABELS;
  /** Consulta oficial de cédulas profesionales (SEP) */
  readonly sepUrl = 'https://www.cedulaprofesional.sep.gob.mx/';
  readonly fisioUrl = `${location.origin}/fisio/`;

  active: TabKey = 'pending_approval';
  all: PhysioRow[] = [];
  buscar = '';
  cargando = false;
  error = '';
  aviso = '';
  procesando: number | null = null;

  // Alta de un fisio nuevo
  mostrarAlta = false;
  alta: PhysioForm = emptyForm();
  errorAlta = '';
  guardandoAlta = false;

  // Edición y contraseña, una tarjeta a la vez
  editando: number | null = null;
  edicion: PhysioForm = emptyForm();
  errorEdicion = '';
  cambiandoPassword: number | null = null;
  passwordNueva = '';

  credenciales: Credentials | null = null;
  copiado = false;

  constructor(private adminService: AdminService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      if (q.get('alta')) this.abrirAlta();
      if (q.get('buscar') !== null) {
        this.buscar = q.get('buscar') ?? '';
        this.active = 'all';
      }
    });
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';
    this.adminService.listAllPhysios().subscribe({
      next: (rows) => {
        this.all = rows;
        this.cargando = false;
        // Si no hay nada por validar, abre directo los que tienen acceso
        if (this.active === 'pending_approval' && this.count('pending_approval') === 0 && this.count('approved') > 0) {
          this.active = 'approved';
        }
      },
      error: (err) => {
        this.error = err.message;
        this.cargando = false;
      },
    });
  }

  count(key: TabKey): number {
    return key === 'all' ? this.all.length : this.all.filter((p) => p.status === key).length;
  }

  get physios(): PhysioRow[] {
    const q = this.normalize(this.buscar);
    return this.all.filter(
      (p) =>
        (this.active === 'all' || p.status === this.active) &&
        (!q || this.normalize(`${this.nombre(p)} ${p.email ?? ''} ${p.professional_license ?? ''} ${p.curp ?? ''}`).includes(q))
    );
  }

  seleccionar(key: TabKey): void {
    this.active = key;
    this.aviso = '';
  }

  nombre(p: PhysioRow): string {
    return [p.first_name, p.last_name_paternal, p.last_name_maternal].filter(Boolean).join(' ');
  }

  documento(fileName?: string | null): string | null {
    return fileName ? this.adminService.documentUrl(fileName) : null;
  }

  /** Avisos para validar los datos antes de aprobar */
  revisiones(p: PhysioRow): string[] {
    const out: string[] = [];
    const curp = (p.curp ?? '').toUpperCase();
    if (!p.professional_license) out.push('No tiene cédula profesional capturada.');
    if (!curp) out.push('No tiene CURP capturada.');
    else if (!CURP_RE.test(curp)) out.push('La CURP no tiene un formato válido.');
    else if (p.birth_date) {
      const [y, m, d] = p.birth_date.slice(0, 10).split('-');
      if (curp.slice(4, 10) !== `${y.slice(2)}${m}${d}`) out.push('La fecha de nacimiento no coincide con la CURP.');
    }
    if (p.status === 'pending_approval' && (!p.ine_doc_url || !p.license_doc_url)) out.push('Falta algún documento.');
    return out;
  }

  cambiarEstado(p: PhysioRow, action: 'approved' | 'rejected'): void {
    const verbo = action === 'approved' ? (p.status === 'rejected' ? 'devolverle el acceso a' : 'aprobar a') : p.status === 'approved' ? 'quitarle el acceso a' : 'rechazar a';
    if (!confirm(`¿Seguro que quieres ${verbo} ${this.nombre(p)}?`)) return;
    this.procesando = p.id_physio;
    this.error = '';
    this.adminService.setPhysioStatus(p.id_physio, action).subscribe({
      next: (resp) => {
        this.procesando = null;
        this.aviso = resp.message;
        p.status = action;
      },
      error: (err) => {
        this.procesando = null;
        this.error = err.message;
      },
    });
  }

  // ----- Alta -----

  abrirAlta(): void {
    this.mostrarAlta = true;
    this.alta = { ...emptyForm(), password: temporaryPassword() };
    this.errorAlta = '';
    this.credenciales = null;
  }

  generarPasswordAlta(): void {
    this.alta.password = temporaryPassword();
  }

  guardarAlta(): void {
    this.errorAlta = this.validar(this.alta, true);
    if (this.errorAlta) return;
    this.guardandoAlta = true;
    this.adminService.createPhysio(this.limpio(this.alta)).subscribe({
      next: (resp) => {
        this.guardandoAlta = false;
        this.mostrarAlta = false;
        this.aviso = resp.message;
        this.credenciales = { name: `${this.alta.firstName} ${this.alta.lastNameP}`, email: this.alta.email.trim().toLowerCase(), password: this.alta.password! };
        this.active = 'approved';
        this.buscar = '';
        this.cargar();
      },
      error: (err) => {
        this.guardandoAlta = false;
        this.errorAlta = err.message;
      },
    });
  }

  // ----- Edición -----

  editar(p: PhysioRow): void {
    this.cambiandoPassword = null;
    this.editando = p.id_physio;
    this.errorEdicion = '';
    this.edicion = {
      firstName: p.first_name ?? '',
      lastNameP: p.last_name_paternal ?? '',
      lastNameM: p.last_name_maternal ?? '',
      birthDate: p.birth_date?.slice(0, 10) ?? '',
      email: p.email ?? '',
      professionalLicense: p.professional_license ?? '',
      curp: p.curp ?? '',
    };
  }

  guardarEdicion(p: PhysioRow): void {
    this.errorEdicion = this.validar(this.edicion, false);
    if (this.errorEdicion) return;
    this.procesando = p.id_physio;
    const data = this.limpio(this.edicion);
    this.adminService.updatePhysio(p.id_physio, data).subscribe({
      next: (resp) => {
        this.procesando = null;
        this.editando = null;
        this.aviso = resp.message;
        Object.assign(p, {
          first_name: data.firstName,
          last_name_paternal: data.lastNameP,
          last_name_maternal: data.lastNameM || null,
          birth_date: data.birthDate || null,
          email: data.email,
          professional_license: data.professionalLicense || null,
          curp: data.curp || null,
        });
      },
      error: (err) => {
        this.procesando = null;
        this.errorEdicion = err.message;
      },
    });
  }

  // ----- Contraseña -----

  abrirPassword(p: PhysioRow): void {
    this.editando = null;
    this.cambiandoPassword = p.id_physio;
    this.passwordNueva = temporaryPassword();
  }

  guardarPassword(p: PhysioRow): void {
    if (this.passwordNueva.length < 8) {
      this.error = 'La contraseña debe tener al menos 8 caracteres.';
      return;
    }
    this.procesando = p.id_physio;
    this.adminService.setPhysioPassword(p.id_physio, this.passwordNueva).subscribe({
      next: (resp) => {
        this.procesando = null;
        this.cambiandoPassword = null;
        this.aviso = resp.message;
        this.credenciales = { name: this.nombre(p), email: p.email ?? '', password: this.passwordNueva };
      },
      error: (err) => {
        this.procesando = null;
        this.error = err.message;
      },
    });
  }

  copiarCredenciales(): void {
    if (!this.credenciales) return;
    const c = this.credenciales;
    const text = `Hola ${c.name}, ya tienes acceso a Activa.\nEntra en: ${this.fisioUrl}\nCorreo: ${c.email}\nContraseña: ${c.password}\nTe recomiendo cambiarla al entrar, en tu perfil.`;
    navigator.clipboard?.writeText(text).then(() => {
      this.copiado = true;
      setTimeout(() => (this.copiado = false), 2500);
    });
  }

  // ----- Utilidades -----

  private validar(f: PhysioForm, conPassword: boolean): string {
    if (f.firstName.trim().length < 2) return 'Escribe el nombre.';
    if (f.lastNameP.trim().length < 2) return 'Escribe el apellido paterno.';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return 'Escribe un correo válido.';
    if (f.curp && f.curp.trim().length !== 18) return 'La CURP debe tener 18 caracteres (o déjala vacía).';
    if (conPassword && (f.password ?? '').length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    return '';
  }

  private limpio(f: PhysioForm): PhysioForm {
    return {
      ...f,
      firstName: f.firstName.trim(),
      lastNameP: f.lastNameP.trim(),
      lastNameM: f.lastNameM?.trim(),
      email: f.email.trim().toLowerCase(),
      professionalLicense: f.professionalLicense?.trim(),
      curp: f.curp?.trim().toUpperCase(),
    };
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
