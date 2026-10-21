import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { ButtonModule } from 'primeng/button'; 
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { readTokenPayload } from '../../core/auth/application/token-payload';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ButtonModule,
    MenuModule,
    ConfirmDialogModule,
  ],
  templateUrl: './menu.html'
})
export class Menu implements OnInit {
  isMobileMenuOpen: boolean = false;
  isDesktopCollapsed: boolean = false;


  estadoCuenta: any = 'pending_approval';
  

  userName: string = 'Cargando...';
  userMenuItems: MenuItem[] = [];
  /** Solo se muestra "Membresía" si Activa cobra (Stripe configurado) */
  billingEnabled = false;

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.checkScreenSize();
    this.verificarEstadoCuenta();
    this.http.get<any>(`${environment.webservice.baseUrl}/api/publico/planes`).subscribe({
      next: (resp) => (this.billingEnabled = Boolean(resp?.billingEnabled)),
      error: () => (this.billingEnabled = false),
    });

    this.userMenuItems = [
      {
        label: 'Perfil',
        icon: 'pi pi-user',
        command: () => {
          this.router.navigate(['/dashboard/perfil']);
        }
      },
      { separator: true }, 
      {
        label: 'Cerrar Sesión',
        icon: 'pi pi-sign-out',
        styleClass: 'text-red-500', 
        command: () => {
          this.cerrarSesion();
        }
      }
    ];
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    if (typeof window !== 'undefined') {
      if (window.innerWidth <= 768) {
        this.isDesktopCollapsed = false; 
      } else {
        this.isMobileMenuOpen = false;
      }
    }
  }

  toggleMenu() {
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    } else {
      this.isDesktopCollapsed = !this.isDesktopCollapsed;
    }
  }

  closeMenu() {
    this.isMobileMenuOpen = false;
  }

  verificarEstadoCuenta() {
    const token = localStorage.getItem('token');
    if (!token) return;
    this.aplicarToken(token);
    // El estado del token puede ser viejo (p. ej. el admin lo aprobó después de entrar).
    // Se pide un token nuevo con el estado real de la base.
    this.http.post<any>(`${environment.webservice.baseUrl}/api/auth/refresh`, {}).subscribe({
      next: (res) => {
        if (res?.token) {
          localStorage.setItem('token', res.token);
          this.aplicarToken(res.token);
        }
      },
      error: () => {}
    });
  }

  private aplicarToken(token: string) {
    const payload = readTokenPayload(token);
    if (!payload) {
      this.estadoCuenta = 'pending_approval';
      return;
    }
    const capitalize = (str: string) => str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';
    const rawFirstName = payload.first_name || '';
    const rawLastName = payload.last_name_paternal || '';
    if (rawFirstName) {
      const inicialApellido = rawLastName ? ` ${rawLastName.charAt(0).toUpperCase()}.` : '';
      this.userName = `${capitalize(rawFirstName.trim())}${inicialApellido}`;
    } else {
      this.userName = payload.email ? payload.email.split('@')[0] : 'Fisioterapeuta';
    }
    this.estadoCuenta = payload.status === 'approved' || payload.status === 'rejected' ? payload.status : 'pending_approval';
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}