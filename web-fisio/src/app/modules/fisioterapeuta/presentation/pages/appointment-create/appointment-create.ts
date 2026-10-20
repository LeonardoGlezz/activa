import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api'; 
import { ConfirmDialogModule } from 'primeng/confirmdialog'; 
import { OverlayPanelModule } from 'primeng/overlaypanel'; 

import { AppointmentUseCase } from '../../../../../core/appointment/application/appointment.use-case';
import { PatientUseCase } from '../../../../../core/patient/application/patient.use-case';

@Component({
  selector: 'app-appointment-create',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, DropdownModule, CalendarModule, 
    InputTextareaModule, ToastModule, ConfirmDialogModule,
    OverlayPanelModule, 
    InputTextModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './appointment-create.html',
  styleUrl: './appointment-create.scss'
})
export class AppointmentCreateComponent implements OnInit {
  
  appointment: any = {
    id: null,
    patientId: null,
    serviceType: null,
    date: null,
    duration: 60, 
    notes: ''
  };

  patientsList: any[] = [];
  servicesList: any[] = [];
  durationOptions: any[] = [];

  isEditMode: boolean = false;
  minDate: Date = new Date(); 
  isSaving: boolean = false; 
  
  fechaTemporal: Date | null = null;

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private router: Router,
    private appointmentUseCase: AppointmentUseCase,
    private patientUseCase: PatientUseCase,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit() {
    this.minDate.setHours(0,0,0,0); 
    this.cargarPacientesReales();

    this.servicesList = [
      { code: 'VAL', name: 'Valoración Inicial', color: 'orange' },
      { code: 'TER', name: 'Terapia Física', color: 'teal' },
      { code: 'MAS', name: 'Masaje Descontracturante', color: 'purple' },
      { code: 'REH', name: 'Rehabilitación Post-Operatoria', color: 'teal' }
    ];

    this.durationOptions = [
      { label: '30 Minutos', value: 30 },
      { label: '1 Hora', value: 60 },
      { label: '1 Hora 30 Minutos', value: 90 },
      { label: '2 Horas', value: 120 }
    ];

    // 🪄 MAGIA RESTAURADA: Leemos la URL para saber si estamos editando o agendando desde un día vacío
    this.route.queryParams.subscribe(params => {
      if (params['date']) {
        this.fechaTemporal = new Date(params['date']);
        this.appointment.date = this.fechaTemporal;
      }
      
      if (params['edit']) {
        this.isEditMode = true;
        this.cargarCitaParaEditar(params['edit']);
      }
    });
  }

  cargarPacientesReales() {
    this.patientUseCase.getPatients().subscribe({
      next: (res: any) => {
        const list = res.rows || [];
        this.patientsList = list.map((p: any) => {
          const capitalizar = (str: string) => str ? str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
          const nombre = capitalizar(p.first_name || p.firstName);
          const apellido = capitalizar(p.last_name_paternal || p.lastNameP);
          return {
            id: p.id_patient || p.id,
            name: `${nombre} ${apellido}`,
            email: p.email || p.user?.email || p.User?.email || ''
          };
        });
        this.cdr.detectChanges(); 
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la lista de pacientes.' });
      }
    });
  }

  // 🪄 MAGIA RESTAURADA: Función que precarga los datos para reprogramar
  cargarCitaParaEditar(id: string) {
    this.appointmentUseCase.getAllAppointments().subscribe({
      next: (res: any) => {
        const citasRaw = res.rows || res || [];
        const cita = citasRaw.find((c: any) => c.id_appointment == id || c.id == id);
        
        if (cita) {
          this.appointment.id = cita.id_appointment || cita.id;
          this.appointment.patientId = cita.id_patient;
          
          this.appointment.date = new Date(`${cita.date}T${cita.start_time}`);
          this.fechaTemporal = this.appointment.date;
          
          const notasOriginales = cita.notes || '';
          const matchService = notasOriginales.match(/Servicio:\s*(.+?)(?=\n|$)/);
          const serviceName = matchService ? matchService[1].trim() : '';
          this.appointment.serviceType = this.servicesList.find(s => s.name === serviceName) || this.servicesList[0];
          
          let notasLimpias = notasOriginales.replace(/Servicio:\s*.+?(?=\n|$)/, '').replace('Notas:', '').trim();
          this.appointment.notes = notasLimpias;

          this.cdr.detectChanges();
        }
      }
    });
  }

  confirmarFechaOverlay(op: any) {
    if (this.fechaTemporal) {
      this.appointment.date = this.fechaTemporal;
    }
    op.hide(); 
  }

  irANuevoPaciente() {
    const hayDatos = this.appointment.patientId || this.appointment.serviceType || this.appointment.date || this.appointment.notes;
    
    if (hayDatos && !this.isEditMode) {
      this.confirmationService.confirm({
        message: 'Estás agendando una cita y tienes datos sin guardar. ¿Seguro que deseas salir? Los datos se perderán.',
        header: 'Confirmar navegación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, salir',
        rejectLabel: 'Cancelar',
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-text text-color-secondary',
        accept: () => {
          this.router.navigate(['/dashboard/nuevo-paciente']);
        }
      });
    } else {
      this.router.navigate(['/dashboard/nuevo-paciente']);
    }
  }

 saveAppointment() {
    // 🪄 MAGIA ANTI-SPAM: Borra cualquier notificación vieja antes de mostrar una nueva
    this.messageService.clear(); 

    if (!this.appointment.patientId || !this.appointment.serviceType || !this.appointment.date) {
      this.messageService.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Por favor selecciona el paciente, servicio y fecha.' });
      return;
    }

    this.isSaving = true;

    const jsDate = this.appointment.date as Date;
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getDate()).padStart(2, '0');
    
    const startHours = String(jsDate.getHours()).padStart(2, '0');
    const startMins = String(jsDate.getMinutes()).padStart(2, '0');
    const startTimeStr = `${startHours}:${startMins}:00`;

    const endDate = new Date(jsDate.getTime() + (this.appointment.duration * 60000));
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMins = String(endDate.getMinutes()).padStart(2, '0');
    const endTimeStr = `${endHours}:${endMins}:00`;

    const notasFinales = this.appointment.notes 
      ? `Servicio: ${this.appointment.serviceType.name}\n\nNotas: ${this.appointment.notes}`
      : `Servicio: ${this.appointment.serviceType.name}`;

    const payloadParaBackend = {
      id_patient: this.appointment.patientId,
      date: `${year}-${month}-${day}`,
      start_time: startTimeStr,
      end_time: endTimeStr,
      status: 'pending', 
      notes: notasFinales
    };

    if (this.isEditMode) {
      this.appointmentUseCase.executeUpdate(this.appointment.id, payloadParaBackend).subscribe({
        next: (res: any) => {
          
          if (res && res.sin_cambios) {
             // 🪄 1. Limpiamos para evitar que se apilen
             this.messageService.clear();
             
             // 🪄 2. Lanzamos el aviso informativo
             this.messageService.add({ 
               severity: 'info', 
               summary: 'Sin modificaciones', 
               detail: 'No se realizaron cambios.' 
             });

             // 🪄 3. Lo redirigimos a la tabla de citas como si hubiera sido un éxito normal
             setTimeout(() => { this.router.navigate(['/dashboard/citas']); }, 1500);
          } 
          else {
            this.messageService.clear();
            this.messageService.add({ 
              severity: 'success', 
              summary: 'Reprogramada', 
              detail: 'La cita se actualizó correctamente.' 
            });
            setTimeout(() => { this.router.navigate(['/dashboard/citas']); }, 1500);
          }
        },
        error: (err) => {
          this.isSaving = false;
          // Limpiamos también en caso de error por si el usuario dio muchos clics
          this.messageService.clear(); 
          const msg = err.error?.message || 'Error de conexión.';
          this.messageService.add({ severity: 'error', summary: 'Error al reprogramar', detail: msg });
        }
      });
    } else {
      this.appointmentUseCase.executeCreate(payloadParaBackend).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Agendada', detail: 'La cita se guardó correctamente.' });
          setTimeout(() => { this.router.navigate(['/dashboard/citas']); }, 1500);
        },
        error: (err) => {
          this.isSaving = false;
          const msg = err.error?.message || 'Error de conexión.';
          this.messageService.add({ severity: 'error', summary: 'Error al guardar', detail: msg });
        }
      });
    }
  }
}