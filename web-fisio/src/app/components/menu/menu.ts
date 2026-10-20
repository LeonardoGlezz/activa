import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; 
import { ButtonModule } from 'primeng/button'; 
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

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

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkScreenSize();
    this.verificarEstadoCuenta(); 

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
    const acabaDeSubirDocs = localStorage.getItem('documentos_subidos') === 'true';
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        const rawFirstName = payload.first_name || payload.firstName || payload.name || '';
        const rawLastName = payload.last_name_paternal || payload.lastNameP || payload.lastName || '';
        
        const capitalize = (str: string) => str ? str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : '';

        if (rawFirstName) {
          const nombreLimpio = capitalize(rawFirstName.trim());
          const inicialApellido = rawLastName ? ` ${rawLastName.charAt(0).toUpperCase()}.` : '';
          
          this.userName = `Dr. ${nombreLimpio}${inicialApellido}`;
        } else if (payload.email) {
          this.userName = payload.email.split('@')[0]; 
        } else {
          this.userName = 'Fisioterapeuta';
        }

        // 🪄 2. LÓGICA DE RUTEO BASADA EN STATUS
        if (payload.status === 'approved') {
          this.estadoCuenta = 'approved'; 
        } 
        else if (payload.status === 'rejected') {
          this.estadoCuenta = 'rejected'; // <-- ATRAPAMOS EL RECHAZO
        }
        else if (payload.status === 'pending_approval' || acabaDeSubirDocs) {
          this.estadoCuenta = 'pending_approval'; 
        } 
        else if (payload.status === 'pending_profile') {
          this.router.navigate(['/verificar-datos']);
        }
      } catch (error) {
        console.error('Error leyendo el token', error);
        this.estadoCuenta = 'pending_approval'; 
      }
    }
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('documentos_subidos');
    this.router.navigate(['/login']);
  }
}