import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// 🪄 1. IMPORTAMOS TU CASO DE USO
import { AppointmentUseCase } from '../../../../../core/appointment/application/appointment.use-case';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, DialogModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: './appointments.html',
  styleUrl: './appointments.scss'
})
export class AppointmentsComponent implements OnInit {
  searchString: string = '';
  
  currentDate: Date = new Date();
  currentMonthName: string = '';
  currentYear: number = 0;
  daysOfWeek: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  calendarGrid: any[] = [];

  appointmentsDB: any = {};
  upcomingAppointments: any[] = [];

  displayDayModal: boolean = false;
  selectedDateObj: Date = new Date();
  selectedDayAppointments: any[] = [];
  selectedDayIsPast: boolean = false;

  constructor(
    private appointmentUseCase: AppointmentUseCase,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarCitasReales();
  }

  cargarCitasReales() {
    this.appointmentUseCase.getAllAppointments().subscribe({
      next: (res: any) => {
        const citasRaw = res.rows || res || [];
        const ahora = new Date();
        
        // Reiniciamos nuestra "base de datos" del calendario
        this.appointmentsDB = {};
        const proximasTemp: any[] = [];

        citasRaw.forEach((apiApp: any) => {
          // 1. Datos del paciente
          const p = apiApp.Patient || apiApp.patient || {};
          const nombre = p.first_name || p.firstName || '';
          const apellido = p.last_name_paternal || p.lastNameP || '';
          const nombreAbreviado = nombre ? `${nombre} ${apellido.charAt(0)}.` : `Paciente (ID: ${apiApp.id_patient})`;

          // 2. Extraemos el servicio de las notas
          const serviceName = this.extraerServicio(apiApp.notes);
          const colorBase = this.asignarColor(serviceName); // Ej: 'teal', 'orange'

          // 3. Formateamos la hora
          const { horaLimpia, ampm } = this.separarHora(apiApp.start_time);
          const rawDateObj = new Date(`${apiApp.date}T${apiApp.start_time || '00:00:00'}`);

          const citaCalendario = {
            id: apiApp.id_appointment || apiApp.id,
            time: `${horaLimpia} ${ampm}`,
            patient: nombreAbreviado,
            title: serviceName,
            type: colorBase, 
            status: apiApp.status || 'Pendiente'
          };

          // 🪄 AGRUPACIÓN POR FECHA PARA EL CALENDARIO (Usa la fecha cruda YYYY-MM-DD como llave)
          if (!this.appointmentsDB[apiApp.date]) {
            this.appointmentsDB[apiApp.date] = [];
          }
          this.appointmentsDB[apiApp.date].push(citaCalendario);

          // 🪄 FILTRO PARA LA LISTA LATERAL (Próximas)
          if (rawDateObj >= ahora && apiApp.status !== 'cancelled' && apiApp.status !== 'completed') {
            proximasTemp.push({
              id: apiApp.id_appointment || apiApp.id, // <-- Faltaba el ID aquí para el enlace
              _rawDate: rawDateObj,
              time: horaLimpia,
              ampm: ampm,
              patient: nombreAbreviado,
              status: apiApp.status === 'pending' ? 'Pendiente' : apiApp.status,
              dot: `bg-${colorBase}-500` 
            });
          }
        });

        // Ordenamos las próximas citas por fecha (la más cercana primero) y tomamos las 5 primeras
        this.upcomingAppointments = proximasTemp
          .sort((a, b) => a._rawDate.getTime() - b._rawDate.getTime())
          .slice(0, 5);

        // Ya que tenemos los datos, AHORA SÍ pintamos el calendario
        this.renderCalendar(this.currentDate);
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar citas del calendario:", err)
    });
  }

  // --- Helpers de Formato ---

  private extraerServicio(notes: string): string {
    if (!notes) return 'Consulta General';
    const match = notes.match(/Servicio:\s*(.+?)(?=\n|$)/);
    return match ? match[1].trim() : 'Consulta General';
  }

  private asignarColor(servicio: string): string {
    const s = servicio.toLowerCase();
    if (s.includes('valoración')) return 'orange';
    if (s.includes('masaje')) return 'purple';
    if (s.includes('rehabilitación') || s.includes('terapia')) return 'teal'; 
    return 'teal'; 
  }

  private separarHora(horaBd: string): { horaLimpia: string, ampm: string } {
    if (!horaBd) return { horaLimpia: '12:00', ampm: 'AM' };
    const partes = horaBd.split(':'); 
    let hora = parseInt(partes[0], 10);
    const min = partes[1];
    const ampm = hora >= 12 ? 'PM' : 'AM';
    
    hora = hora % 12;
    hora = hora ? hora : 12; 
    return { horaLimpia: `${hora}:${min}`, ampm: ampm };
  }

  // --- Lógica original del Calendario ---

  renderCalendar(date: Date) {
    this.currentYear = date.getFullYear();
    const monthIndex = date.getMonth();
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.currentMonthName = monthNames[monthIndex];

    const firstDayOfMonth = new Date(this.currentYear, monthIndex, 1).getDay();
    const daysInMonth = new Date(this.currentYear, monthIndex + 1, 0).getDate();
    
    this.calendarGrid = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      this.calendarGrid.push({ empty: true });
    }

    const hoy = new Date();
    const todayDate = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    for (let day = 1; day <= daysInMonth; day++) {
      // Formato YYYY-MM-DD para buscar en el diccionario (Asegura mes y día a 2 dígitos)
      const dateStr = `${this.currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const cellDate = new Date(this.currentYear, monthIndex, day);
      
      const isToday = (day === hoy.getDate() && monthIndex === hoy.getMonth() && this.currentYear === hoy.getFullYear());
      const isPast = cellDate < todayDate; 
      
      // Busca en el diccionario. Si no hay citas, devuelve arreglo vacío
      const dayAppointments = this.appointmentsDB[dateStr] || [];

      // Ordenar las citas del día por hora (opcional pero se ve mejor en el modal)
      dayAppointments.sort((a: any, b: any) => {
        return new Date(`1970-01-01T${a.time.replace(' PM', '').replace(' AM', '')}`).getTime() - 
               new Date(`1970-01-01T${b.time.replace(' PM', '').replace(' AM', '')}`).getTime();
      });

      this.calendarGrid.push({
        empty: false,
        dayNumber: day,
        dateStr: dateStr,
        fullDate: cellDate,
        isToday: isToday,
        isPast: isPast, 
        appointmentCount: dayAppointments.length,
        appointments: dayAppointments
      });
    }
  }

  changeMonth(offset: number) {
    this.currentDate = new Date(this.currentYear, this.currentDate.getMonth() + offset, 1);
    this.renderCalendar(this.currentDate);
  }

  changeYear(offset: number) {
    this.currentDate = new Date(this.currentYear + offset, this.currentDate.getMonth(), 1);
    this.renderCalendar(this.currentDate);
  }

  irAHoy() {
    this.currentDate = new Date();
    this.renderCalendar(this.currentDate);
  }

  openDayDetails(dayObj: any) {
    if (dayObj.empty) return;
    this.selectedDateObj = dayObj.fullDate;
    this.selectedDayAppointments = dayObj.appointments;
    this.selectedDayIsPast = dayObj.isPast; 
    this.displayDayModal = true;
  }

  get fechaFormateada(): string {
    return this.selectedDateObj.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }
}