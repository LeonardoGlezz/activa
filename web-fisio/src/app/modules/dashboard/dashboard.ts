import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // <-- Importamos el Router
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu'; 
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MenuModule, ButtonModule, AvatarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  items: MenuItem[] | undefined;
  
  // 🔥 NUEVA VARIABLE: Controla qué cara del dashboard se muestra
  estadoCuenta: 'pending_approval' | 'approved' = 'pending_approval';

  constructor(private router: Router) {}

  ngOnInit() {
    this.items = [ 
      { label: 'Pacientes', icon: 'pi pi-users' },
      { label: 'Calendario', icon: 'pi pi-calendar' },
      { label: 'Ejercicios', icon: 'pi pi-arrows-alt' }
    ];

    // Revisamos el estado en cuanto carga el componente
    this.verificarEstadoCuenta();
  }

  verificarEstadoCuenta() {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Magia de JS: "Rompemos" la encriptación base64 del token para leer los datos que trae adentro
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // ✨ EL CHISMOSO: Imprimimos exactamente qué traía el token por dentro
        console.log("🕵️‍♂️ EL ESTATUS QUE LLEGÓ EN EL TOKEN ES:", payload.status);
        
        // Leemos el estatus exacto que viene desde la base de datos
        if (payload.status === 'pending_approval') {
          this.estadoCuenta = 'pending_approval'; // Mostrar sala de espera
        } else if (payload.status === 'approved') {
          this.estadoCuenta = 'approved'; // Mostrar el dashboard completo
        } else if (payload.status === 'pending_profile') {
          // Si por algún milagro se coló sin subir archivos, lo pateamos de regreso
          this.router.navigate(['/verificar-datos']);
        }
      } catch (error) {
        console.error('Error leyendo el token', error);
        this.estadoCuenta = 'pending_approval'; // Por seguridad, si falla, lo dejamos en espera
      }
    }
  }

  // Función para el botón de salir en la sala de espera
  cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('documentos_subidos');
    this.router.navigate(['/login']);
  }
}