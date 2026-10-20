import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router'; 
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppointmentUseCase } from '../../../../../core/appointment/application/appointment.use-case';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './appointment-detail.html',
  styleUrl: './appointment-detail.scss'
})
export class AppointmentDetailComponent implements OnInit {
  
  appointmentData: any;
  referrer: string = 'calendar'; 
  appointmentId: number | null = null;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private appointmentUseCase: AppointmentUseCase,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.referrer = params['referrer'] || 'calendar';
      
      if (params['id']) {
        this.appointmentId = Number(params['id']);
        this.cargarCitaReal(this.appointmentId);
      } else {
        this.router.navigate(['/dashboard/citas']);
      }
    });
  }

  cargarCitaReal(id: number) {
    this.appointmentUseCase.getAllAppointments().subscribe({
      next: (res: any) => {
        const citasRaw = res.rows || res || [];
        const citaEncontrada = citasRaw.find((c: any) => c.id_appointment === id || c.id === id);

        if (!citaEncontrada) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Cita no encontrada.' });
          setTimeout(() => this.router.navigate(['/dashboard/citas']), 1500);
          return;
        }

        // 🪄 MAPEADO DINÁMICO PARA NOMBRE COMPLETO Y CORREO
        const p = citaEncontrada.Patient || citaEncontrada.patient || {};
        
        // 1. Nombre Completo
        const nombre = p.first_name || p.firstName || '';
        const apellidoP = p.last_name_paternal || p.lastNameP || '';
        const apellidoM = p.last_name_maternal || p.lastNameM || '';
        const nombreCompleto = `${nombre} ${apellidoP} ${apellidoM}`.trim();

        // 2. Correo (Buscamos en Patient o en el User anidado)
        const email = p.email || p.User?.email || p.user?.email || 'Sin correo registrado';

        const serviceName = this.extraerServicio(citaEncontrada.notes);
        const fechaFinObj = new Date(`${citaEncontrada.date}T${citaEncontrada.end_time || citaEncontrada.start_time || '00:00:00'}`);
        const ahora = new Date();

        this.appointmentData = {
          id: id,
          status: this.traducirStatus(citaEncontrada.status), 
          statusColor: this.asignarColorStatus(citaEncontrada.status), 
          dateStr: this.formatearFechaLarga(citaEncontrada.date),
          time: this.formatearHora(citaEncontrada.start_time),
          duration: this.calcularDuracion(citaEncontrada.start_time, citaEncontrada.end_time),
          service: serviceName,
          isPast: (fechaFinObj < ahora) || (citaEncontrada.status === 'cancelled' || citaEncontrada.status === 'completed'), 
          patient: {
            name: nombreCompleto || 'Paciente Desconocido',
            email: email,
          },
          notes: citaEncontrada.notes || 'No hay notas registradas.'
        };
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo conectar con el servidor.' });
      }
    });
  }
  
  iniciarConsulta() {
    this.cambiarEstadoCita('completed', 'Consulta Iniciada', 'La cita ha cambiado su estado a "Asistió/Completada".');
  }

  cancelarCita() {
    this.cambiarEstadoCita('cancelled', 'Cita Cancelada', 'La cita ha cambiado su estado a "Cancelada".');
  }

  private cambiarEstadoCita(nuevoStatus: string, tituloExito: string, mensajeExito: string) {
    if (!this.appointmentId) return;

    const payload = { status: nuevoStatus };

    this.appointmentUseCase.executeUpdate(this.appointmentId, payload).subscribe({
      next: () => {
        this.appointmentData.status = this.traducirStatus(nuevoStatus);
        this.appointmentData.statusColor = this.asignarColorStatus(nuevoStatus);
        
        // Al actualizar el estado, bloqueamos los botones de acción
        this.appointmentData.isPast = true; 
        
        this.messageService.add({ severity: 'success', summary: tituloExito, detail: mensajeExito });
        this.cdr.detectChanges();
      },
      error: (err) => {
        const msg = err.error?.message || 'Error al actualizar el estado.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }

  private extraerServicio(notes: string): string {
    if (!notes) return 'Consulta General';
    const match = notes.match(/Servicio:\s*(.+?)(?=\n|$)/);
    return match ? match[1].trim() : 'Consulta General';
  }

  private traducirStatus(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'pending' || s === 'scheduled') return 'Confirmada';
    if (s === 'completed') return 'Completada';
    if (s === 'cancelled') return 'Cancelada';
    return 'Pendiente';
  }

  private asignarColorStatus(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'pending' || s === 'scheduled') return 'bordered-teal bg-teal-50 text-teal-600 border-teal-500';
    if (s === 'completed') return 'bg-teal-500 text-white border-teal-500';
    if (s === 'cancelled') return 'bordered-red bg-red-50 text-red-600 border-red-500';
    return 'bordered-teal bg-teal-50 text-teal-600 border-teal-500';
  }

  private calcularDuracion(inicio: string, fin: string): string {
    if (!inicio || !fin) return '1 Hora';
    const m1 = parseInt(inicio.split(':')[0]) * 60 + parseInt(inicio.split(':')[1]);
    const m2 = parseInt(fin.split(':')[0]) * 60 + parseInt(fin.split(':')[1]);
    const diff = m2 - m1;
    if (diff === 30) return '30 Minutos';
    if (diff === 60) return '1 Hora';
    if (diff === 90) return '1 Hora 30 Minutos';
    if (diff === 120) return '2 Horas';
    return `${diff} Minutos`;
  }

  private formatearFechaLarga(fechaBd: string): string {
    if (!fechaBd) return '';
    const date = new Date(`${fechaBd}T12:00:00`);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase());
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
}