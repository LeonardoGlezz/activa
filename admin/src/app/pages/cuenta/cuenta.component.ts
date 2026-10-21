import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cuenta.component.html',
})
export class CuentaComponent {
  email: string;
  nuevoEmail: string;
  passwordActual = '';
  passwordNueva = '';
  passwordConfirmar = '';

  avisoEmail = '';
  errorEmail = '';
  avisoPassword = '';
  errorPassword = '';
  guardando = false;

  constructor(private adminService: AdminService, private auth: AuthService, private router: Router) {
    this.email = this.auth.getCurrentUser()?.email ?? '';
    this.nuevoEmail = this.email;
  }

  guardarEmail(): void {
    this.avisoEmail = this.errorEmail = '';
    const email = this.nuevoEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      this.errorEmail = 'Escribe un correo válido.';
      return;
    }
    this.guardando = true;
    this.adminService.updateEmail(email).subscribe({
      next: (resp) => {
        this.guardando = false;
        this.email = email;
        this.auth.updateCurrentUser({ email });
        this.avisoEmail = `${resp.message} Desde ahora entras con ${email}. En Render cambia también ADMIN_EMAIL para que no se cree otra cuenta.`;
      },
      error: (err) => {
        this.guardando = false;
        this.errorEmail = err.message;
      },
    });
  }

  guardarPassword(): void {
    this.avisoPassword = this.errorPassword = '';
    if (this.passwordNueva.length < 8) {
      this.errorPassword = 'La contraseña nueva debe tener al menos 8 caracteres.';
      return;
    }
    if (this.passwordNueva !== this.passwordConfirmar) {
      this.errorPassword = 'Las contraseñas nuevas no coinciden.';
      return;
    }
    this.guardando = true;
    this.adminService.updatePassword(this.passwordActual, this.passwordNueva).subscribe({
      next: (resp) => {
        this.guardando = false;
        this.passwordActual = this.passwordNueva = this.passwordConfirmar = '';
        this.avisoPassword = resp.message;
      },
      error: (err) => {
        this.guardando = false;
        this.errorPassword = err.message;
      },
    });
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
