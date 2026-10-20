import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabViewModule } from 'primeng/tabview';

import { AppointmentUseCase } from '../../../../../core/appointment/application/appointment.use-case';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, 
    ButtonModule, InputTextModule, TabViewModule
  ],
  templateUrl: './appointment-list.html',
  styleUrl: './appointment-list.scss'
})
export class AppointmentListComponent implements OnInit {
  
  searchString: string = '';
  
  upcomingAppointments: any[] = [];
  pastAppointments: any[] = [];

  constructor(
    private appointmentUseCase: AppointmentUseCase,
    private cdr: ChangeDetectorRef // 🪄 1. INYECTAMOS EL DETECTOR DE CAMBIOS
  ) {}

  ngOnInit() {
    this.cargarHistorial();
  }

  // 🪄 REEMPLAZA ESTA FUNCIÓN EN TU appointment-list.ts
  cargarHistorial() {
    this.appointmentUseCase.getAllAppointments().subscribe({
      next: (res: any) => {
        const citasRaw = res.rows || res || [];
        const ahora = new Date();

        const citasMapeadas = citasRaw.map((apiApp: any) => {
          const p = apiApp.Patient || apiApp.patient || {};
          const capitalizar = (str: string) => str ? str.toLowerCase().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
          
          const nombre = capitalizar(p.first_name || p.firstName || '');
          const apellido = capitalizar(p.last_name_paternal || p.lastNameP || '');
          const nombreCompleto = nombre || apellido ? `${nombre} ${apellido}` : `Paciente (ID: ${apiApp.id_patient})`;

          const serviceName = this.extraerServicio(apiApp.notes);
          const rawDateObj = new Date(`${apiApp.date}T${apiApp.start_time || '00:00:00'}`);

          // 🪄 DETECTAMOS SI LA CITA YA CADUCÓ O FUE CANCELADA
          const estaCerrada = apiApp.status === 'cancelled' || apiApp.status === 'completed';

          return {
            id: apiApp.id_appointment || apiApp.id,
            date: this.formatearFecha(apiApp.date),
            time: this.formatearHora(apiApp.start_time),
            patient: nombreCompleto,
            service: serviceName,
            type: this.asignarColor(serviceName),
            status: apiApp.status || 'Pendiente',
            _rawDate: rawDateObj,
            isPast: (rawDateObj < ahora) || estaCerrada // Guardamos esta bandera
          };
        });

        // PRÓXIMAS: Solo citas en el futuro que NO estén canceladas ni completadas
        this.upcomingAppointments = citasMapeadas
          .filter((c: any) => !c.isPast)
          .sort((a: any, b: any) => a._rawDate.getTime() - b._rawDate.getTime());

        // PASADAS: Citas del pasado O citas canceladas/completadas en el futuro
        this.pastAppointments = citasMapeadas
          .filter((c: any) => c.isPast)
          .sort((a: any, b: any) => b._rawDate.getTime() - a._rawDate.getTime());

        this.cdr.detectChanges(); 
      },
      error: (err) => console.error("Error al cargar el historial:", err)
    });
  }

  private extraerServicio(notes: string): string {
    if (!notes) return 'Consulta General';
    const match = notes.match(/Servicio:\s*(.+?)(?=\n|$)/);
    return match ? match[1].trim() : 'Consulta General';
  }

  private asignarColor(servicio: string): string {
    const s = servicio.toLowerCase();
    if (s.includes('valoración')) return 'bordered-orange';
    if (s.includes('masaje')) return 'bordered-purple';
    if (s.includes('rehabilitación') || s.includes('terapia')) return 'solid-teal'; 
    return 'solid-teal'; 
  }

  private formatearFecha(fechaBd: string): string {
    if (!fechaBd) return '';
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const partes = fechaBd.split('-'); 
    if (partes.length !== 3) return fechaBd;
    
    const dia = parseInt(partes[2], 10);
    const mes = meses[parseInt(partes[1], 10) - 1];
    const anio = partes[0];
    return `${dia} ${mes}, ${anio}`;
  }

  private formatearHora(horaBd: string): string {
    if (!horaBd) return '';
    const partes = horaBd.split(':'); 
    let hora = parseInt(partes[0], 10);
    const min = partes[1];
    const ampm = hora >= 12 ? 'PM' : 'AM';
    
    hora = hora % 12;
    hora = hora ? hora : 12; 
    return `${hora}:${min} ${ampm}`;
  }
  
  get filteredUpcoming() {
    if (!this.searchString) return this.upcomingAppointments;
    const term = this.searchString.toLowerCase();
    return this.upcomingAppointments.filter(app => 
      app.patient.toLowerCase().includes(term) || 
      app.service.toLowerCase().includes(term)
    );
  }

  get filteredPast() {
    if (!this.searchString) return this.pastAppointments;
    const term = this.searchString.toLowerCase();
    return this.pastAppointments.filter(app => 
      app.patient.toLowerCase().includes(term) || 
      app.service.toLowerCase().includes(term)
    );
  }
}