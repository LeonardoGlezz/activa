import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

import { PatientUseCase } from '../../../../../core/patient/application/patient.use-case';
import { AppointmentUseCase } from '../../../../../core/appointment/application/appointment.use-case';
import { ExerciseUseCase } from '../../../../../core/exercises/application/exercise.use-case';
import { environment } from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-patient-view',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    ButtonModule, DialogModule, ToastModule,
    InputTextModule, InputTextareaModule, DropdownModule, KeyFilterModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './patient-view.html',
  styleUrl: './patient-view.scss'
})
export class PatientViewComponent implements OnInit {

  patientId!: number;
  patient: any = null;
  loading = true;

  // ===== CITAS =====
  appointments: any[] = [];
  loadingAppointments = true;
  showNewAppointmentModal = false;
  showEditAppointmentModal = false;
  newAppointment: any = { serviceType: '', date: '', start_time: '09:00', duration: 60, notes: '' };
  editingAppointment: any = {};

  serviceOptions = [
    { label: 'Valoración Inicial', value: 'Valoración Inicial' },
    { label: 'Terapia Fisica', value: 'Terapia Fisica' },
    { label: 'Masaje Descontracturante', value: 'Masaje Descontracturante' },
    { label: 'Rehabilitación Post_Operatoria', value: 'Rehabilitación Post_Operatoria' },
  ];

  durationOptions = [
    { label: '30 minutos', value: 30 },
    { label: '1 hora', value: 60 },
    { label: '1 hr 30 min', value: 90 },
    { label: '2 horas', value: 120 },
  ];

  // ===== BITÁCORAS =====
  logbooks: any[] = [];
  showLogModal = false;
  editingLog: any = null;
  logForm: any = { title: '', date: '', content: '', type: '' };
  logTypes = [
    { label: 'Evaluación', value: 'Evaluación' },
    { label: 'Seguimiento', value: 'Seguimiento' },
    { label: 'Alta', value: 'Alta' },
    { label: 'Observación', value: 'Observación' },
    { label: 'Incidencia', value: 'Incidencia' },
  ];

  // ===== RUTINAS =====
  routines: any[] = [];
  loadingRoutines = true;
  showRoutineModal = false;
  editingRoutine: any = null;
  routineForm: any = {
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    exerciseIds: [] as number[]
  };
  exerciseConfigMap: Record<number, { repetitions: number; sets: number; notes: string }> = {};
  exerciseCatalog: any[] = [];
  loadingExercises = false;
  exerciseSearch = '';
  routineTemplates: any[] = [];
  filteredRoutineTemplates: any[] = [];
  loadingRoutineTemplates = false;
  routineTemplateSearch = '';
  templateSourceLabel = '';
  showExercisePreviewModal = false;
  previewExercise: any = null;
  placeholderImg = 'https://placehold.co/1200x800/0d9488/ffffff?text=ACTIVA+Fisio';
  pendingOpenRoutineFromRoute = false;
  pendingTemplateId: number | null = null;
  private initialRoutineSnapshot = '';

  // ===== EDITAR PACIENTE =====
  showEditPatientModal = false;
  editingPatient: any = {};
  regexLetras: RegExp = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private patientUseCase: PatientUseCase,
    private appointmentUseCase: AppointmentUseCase,
    private exerciseUseCase: ExerciseUseCase,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(query => {
      this.pendingOpenRoutineFromRoute = String(query['openRoutineEditor'] || '') === '1';
      const templateId = Number(query['templateId']);
      this.pendingTemplateId = !Number.isNaN(templateId) && templateId > 0 ? templateId : null;
      this.tryOpenRoutineFromRoute();
    });

    this.route.params.subscribe(params => {
      this.patientId = +params['id'];
      this.loadPatient();
      this.loadAppointments();
      this.loadRoutines();
      this.loadExercises();
      this.loadLogbooks();
      this.tryOpenRoutineFromRoute();
    });
  }

  private tryOpenRoutineFromRoute(): void {
    if (!this.pendingOpenRoutineFromRoute || !this.patientId) return;
    if (this.showRoutineModal) return;

    this.openNewRoutine();
    if (this.pendingTemplateId) {
      this.applyTemplateById(this.pendingTemplateId);
    }
    this.pendingOpenRoutineFromRoute = false;
  }

  // ===================================================
  // CARGA DE DATOS
  // ===================================================
  loadPatient(): void {
    this.loading = true;
    this.patientUseCase.getPatients().subscribe({
      next: (resp: any) => {
        const list = resp.rows || resp || [];
        const found = list.find((p: any) => (p.id_patient || p.id) === this.patientId);
        if (found) {
          this.patient = this.mapPatient(found);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapPatient(p: any): any {
    const cap = (s: string) => s ? s.toLowerCase().split(' ').map((w: string) =>
      w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
    const resolvedEmail = p.email || p.user?.email || p.User?.email || p.user_email || '';
    const nombre = cap(p.first_name || p.firstName || '');
    const apP = cap(p.last_name_paternal || p.lastNameP || '');
    const apM = cap(p.last_name_maternal || p.lastNameM || '');
    return {
      id: p.id_patient || p.id,
      name: `${nombre} ${apP}${apM ? ' ' + apM : ''}`.trim(),
      first_name: nombre,
      last_name_p: apP,
      last_name_m: apM,
      email: resolvedEmail,
      birth_year: (p.birth_date || p.birthYear || '').toString().substring(0, 4),
      height: p.height,
      weight: p.weight,
      id_physio: p.id_physio || p.physiotherapist?.id_physio || null,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre + '+' + apP)}&background=0D8B97&color=fff&rounded=true`
    };
  }

  loadExercises(): void {
    this.loadingExercises = true;
    this.exerciseUseCase.listExercises(1, 300).subscribe({
      next: (resp: any) => {
        const list = resp.rows || [];
        this.exerciseCatalog = list.map((e: any) => ({
          id: e.id_exercise || e.id,
          name: e.name,
          body_zone: e.body_zone || e.bodyZone || 'General',
          description: e.description || '',
          video_url: e.video_url || e.videoUrl || '',
        }));
        this.loadingExercises = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.exerciseCatalog = [];
        this.loadingExercises = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRoutines(): void {
    this.loadingRoutines = true;
    const baseUrl = `${environment.webservice.baseUrl}/api`;

    this.http.get<any>(`${baseUrl}/routines/history/patient/${this.patientId}`).subscribe({
      next: (resp) => {
        const history = resp?.data || [];
        if (Array.isArray(history) && history.length > 0) {
          this.routines = history.map((r: any) => this.mapRoutineCard(r));
          this.loadingRoutines = false;
          this.cdr.detectChanges();
          return;
        }
        this.loadActiveRoutine(baseUrl);
      },
      error: () => this.loadActiveRoutine(baseUrl)
    });
  }

  private loadActiveRoutine(baseUrl: string): void {
    this.http.get<any>(`${baseUrl}/routines/patient/${this.patientId}`).subscribe({
      next: (resp) => {
        const active = resp?.data;
        this.routines = active ? [this.mapRoutineCard(active)] : [];
        this.loadingRoutines = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.routines = [];
        this.loadingRoutines = false;
        this.cdr.detectChanges();
      }
    });
  }

  private mapRoutineCard(r: any): any {
    const exercises = r.exercises || r.Exercises || [];
    const startDate = r.start_date || r.startDate || '';
    const endDate = r.end_date || r.endDate || '';
    const now = new Date();
    const isExpired = endDate ? new Date(endDate) < now : false;

    return {
      id: r.id_routine || r.id,
      name: r.name,
      status: isExpired ? 'Finalizada' : 'Activa',
      description: `Vigencia: ${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
      startDate,
      endDate,
      exercisesCount: exercises.length,
      exercisesDetail: exercises.map((e: any) => ({
        id: e.id_exercise || e.id,
        name: e.name,
        body_zone: e.body_zone || e.bodyZone || 'General',
        repetitions: e.RoutineExercise?.repetitions ?? e.routineExercise?.repetitions ?? null,
        sets: e.RoutineExercise?.sets ?? e.routineExercise?.sets ?? null,
        exercise_order: e.RoutineExercise?.exercise_order ?? e.routineExercise?.exercise_order ?? null,
        notes: e.RoutineExercise?.notes ?? e.routineExercise?.notes ?? ''
      }))
    };
  }

  loadAppointments(): void {
    this.loadingAppointments = true;
    this.appointmentUseCase.getPatientAppointments(this.patientId).subscribe({
      next: (resp: any) => {
        this.appointments = resp.rows || resp || [];
        this.loadingAppointments = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.appointments = [];
        this.loadingAppointments = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/pacientes']);
  }

  // ===================================================
  // EDITAR PACIENTE
  // ===================================================
  openEditPatient(): void {
    this.editingPatient = { ...this.patient };
    this.showEditPatientModal = true;
  }

  savePatient(): void {
    if (!this.editingPatient.first_name || !this.editingPatient.last_name_p) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombre y apellido son obligatorios.' });
      return;
    }
    const payload = {
      firstName: this.editingPatient.first_name,
      lastNameP: this.editingPatient.last_name_p,
      lastNameM: this.editingPatient.last_name_m || undefined,
      email: this.editingPatient.email,
      birthYear: Number(this.editingPatient.birth_year),
      height: Number(this.editingPatient.height),
      weight: Number(this.editingPatient.weight),
    };
    this.patientUseCase.executeUpdate(this.patient.id, payload as any).subscribe({
      next: () => {
        this.patient = {
          ...this.patient,
          first_name: this.editingPatient.first_name,
          last_name_p: this.editingPatient.last_name_p,
          last_name_m: this.editingPatient.last_name_m,
          email: this.editingPatient.email,
          birth_year: this.editingPatient.birth_year,
          height: this.editingPatient.height,
          weight: this.editingPatient.weight,
          name: `${this.editingPatient.first_name} ${this.editingPatient.last_name_p}${this.editingPatient.last_name_m ? ' ' + this.editingPatient.last_name_m : ''}`.trim()
        };
        this.showEditPatientModal = false;
        this.cdr.detectChanges();
        this.messageService.add({ severity: 'success', summary: '¡Actualizado!', detail: 'Datos del paciente guardados.' });
        this.loadPatient();
      },
      error: (err: any) => {
        const msg = err.error?.message || 'Error al guardar.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }

  // ===================================================
  // CITAS
  // ===================================================
  openNewAppointment(): void {
    this.newAppointment = { serviceType: '', date: '', start_time: '09:00', duration: 60, notes: '' };
    this.showNewAppointmentModal = true;
  }

  openEditAppointment(apt: any): void {
    this.editingAppointment = { ...apt };
    this.showEditAppointmentModal = true;
  }

  saveNewAppointment(): void {
    if (!this.newAppointment.serviceType || !this.newAppointment.date || !this.newAppointment.start_time) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Servicio, fecha y hora son obligatorios.' });
      return;
    }
    const startTimeStr = this.newAppointment.start_time + ':00';
    const [sh, sm] = this.newAppointment.start_time.split(':').map(Number);
    const totalMinutes = sh * 60 + sm + (this.newAppointment.duration || 60);
    const eh = Math.floor(totalMinutes / 60) % 24;
    const em = totalMinutes % 60;
    const endTimeStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`;
    const notasFinales = this.newAppointment.notes
      ? `Servicio: ${this.newAppointment.serviceType}\n\nNotas: ${this.newAppointment.notes}`
      : `Servicio: ${this.newAppointment.serviceType}`;
    const payload = {
      id_patient: this.patientId,
      date: this.newAppointment.date,
      start_time: startTimeStr,
      end_time: endTimeStr,
      status: 'pending',
      notes: notasFinales,
    };
    this.appointmentUseCase.executeCreate(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Cita creada', detail: 'La cita fue programada correctamente.' });
        this.showNewAppointmentModal = false;
        this.loadAppointments();
      },
      error: (err: any) => {
        const msg = err.error?.message || 'Error al crear la cita.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }

  saveEditAppointment(): void {
    this.appointmentUseCase.executeUpdate(this.editingAppointment.id_appointment || this.editingAppointment.id, this.editingAppointment).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Actualizada', detail: 'Cita modificada correctamente.' });
        this.showEditAppointmentModal = false;
        this.loadAppointments();
      },
      error: (err: any) => {
        const msg = err.error?.message || 'Error al actualizar la cita.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }

  // ===================================================
  // BITÁCORAS
  // ===================================================
  openNewLog(): void {
    this.editingLog = null;
    this.logForm = { title: '', date: this.getTodayDate(), content: '', type: '' };
    this.showLogModal = true;
  }

  openEditLog(log: any): void {
    this.editingLog = { ...log };
    this.logForm = { ...log };
    this.showLogModal = true;
  }

  saveLog(): void {
    if (!this.logForm.title || !this.logForm.content) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Título y contenido son obligatorios.' });
      return;
    }
    if (this.editingLog) {
      const idx = this.logbooks.findIndex(l => l.id === this.editingLog.id);
      if (idx > -1) this.logbooks[idx] = { ...this.logForm, id: this.editingLog.id };
    } else {
      this.logbooks.unshift({ ...this.logForm, id: Date.now() });
    }
    this.persistLogbooks();
    this.showLogModal = false;
    this.messageService.add({ severity: 'success', summary: 'Bitácora guardada', detail: '' });
    this.cdr.detectChanges();
  }

  deleteLog(id: number): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: '¿Deseas eliminar esta bitácora? Esta acción no se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.logbooks = this.logbooks.filter(l => l.id !== id);
        this.persistLogbooks();
        this.messageService.add({ severity: 'info', summary: 'Eliminada', detail: 'Bitácora eliminada.' });
      }
    });
  }

  private loadLogbooks(): void {
    const key = this.getLogbookStorageKey();
    const saved = localStorage.getItem(key);
    if (!saved) {
      this.logbooks = [];
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      this.logbooks = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.logbooks = [];
    }
  }

  private persistLogbooks(): void {
    const key = this.getLogbookStorageKey();
    localStorage.setItem(key, JSON.stringify(this.logbooks || []));
  }

  private getLogbookStorageKey(): string {
    return `activa_logbooks_patient_${this.patientId}`;
  }

  // ===================================================
  // RUTINAS
  // ===================================================
  openNewRoutine(): void {
    this.editingRoutine = null;
    const today = this.getTodayDate();
    const end = new Date();
    end.setDate(end.getDate() + 14);
    this.routineForm = {
      name: '',
      startDate: today,
      endDate: end.toISOString().split('T')[0],
      patientId: this.patientId,
      exerciseIds: []
    };
    this.templateSourceLabel = '';
    this.routineTemplateSearch = '';
    this.loadRoutineTemplates();
    this.exerciseConfigMap = {};
    this.initialRoutineSnapshot = this.buildRoutineSnapshot();
    this.showRoutineModal = true;
  }

  openEditRoutine(routine: any): void {
    this.editingRoutine = { ...routine };
    this.routineForm = {
      name: routine.name,
      startDate: routine.startDate || this.getTodayDate(),
      endDate: routine.endDate || this.getTodayDate(),
      patientId: this.patientId,
      exerciseIds: (routine.exercisesDetail || []).map((e: any) => e.id)
    };
    this.templateSourceLabel = '';
    this.exerciseConfigMap = {};
    (routine.exercisesDetail || []).forEach((e: any) => {
      this.exerciseConfigMap[e.id] = {
        repetitions: Number(e.repetitions || 10),
        sets: Number(e.sets || 3),
        notes: e.notes || ''
      };
    });
    this.loadRoutineTemplates();
    this.initialRoutineSnapshot = this.buildRoutineSnapshot();
    this.showRoutineModal = true;
  }

  loadRoutineTemplates(): void {
    const physioId = this.resolvePhysioId();
    if (!physioId) {
      this.routineTemplates = [];
      this.filteredRoutineTemplates = [];
      return;
    }

    this.loadingRoutineTemplates = true;
    this.http.get<any>(`${environment.webservice.baseUrl}/api/routines/templates?physiotherapistId=${physioId}`).subscribe({
      next: (resp) => {
        const list = resp?.data || [];
        this.routineTemplates = list.map((item: any) => ({
          id_template: item.id_template,
          name: item.name,
          tag: item.tag || 'General',
          created_at: item.created_at,
          exercises: item.exercises || [],
        }));
        this.filterRoutineTemplates();
        this.loadingRoutineTemplates = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.routineTemplates = [];
        this.filteredRoutineTemplates = [];
        this.loadingRoutineTemplates = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterRoutineTemplates(): void {
    const q = this.normalizeText(this.routineTemplateSearch || '').trim();
    if (!q) {
      this.filteredRoutineTemplates = [...this.routineTemplates];
      return;
    }

    this.filteredRoutineTemplates = this.routineTemplates.filter((t: any) => {
      const name = this.normalizeText(t.name || '');
      const tag = this.normalizeText(t.tag || '');
      return name.includes(q) || tag.includes(q);
    });
  }

  applyTemplateToRoutine(template: any): void {
    if (!template?.id_template) return;
    this.applyTemplateById(template.id_template, template.name, template.tag);
  }

  private applyTemplateById(templateId: number, fallbackName?: string, fallbackTag?: string): void {
    this.http.get<any>(`${environment.webservice.baseUrl}/api/routines/templates/${templateId}`).subscribe({
      next: (resp) => {
        const data = resp?.data;
        const templateExercises = data?.exercises || [];
        const today = this.getTodayDate();
        const end = new Date();
        end.setDate(end.getDate() + 14);

        this.editingRoutine = null;
        this.templateSourceLabel = data?.name || fallbackName || '';
        this.routineForm = {
          name: `${data?.name || fallbackName || 'Rutina'} - ${this.patient?.first_name || 'Paciente'}`,
          startDate: today,
          endDate: end.toISOString().split('T')[0],
          patientId: this.patientId,
          exerciseIds: templateExercises.map((e: any) => e.id_exercise || e.id).filter((id: any) => !!id),
        };

        this.exerciseConfigMap = {};
        templateExercises.forEach((ex: any) => {
          const id = ex.id_exercise || ex.id;
          if (!id) return;
          const rel = ex.RoutineTemplateExercise || ex.routineTemplateExercise || {};
          this.exerciseConfigMap[id] = {
            repetitions: Number(rel.repetitions || 10),
            sets: Number(rel.sets || 3),
            notes: rel.notes || ''
          };
        });

        this.messageService.add({
          severity: 'success',
          summary: 'Plantilla cargada',
          detail: ''
        });
        this.initialRoutineSnapshot = this.buildRoutineSnapshot();
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la plantilla seleccionada.' });
      }
    });
  }

  saveRoutine(): void {
    const patientIdNum = Number(this.patientId);
    if (!patientIdNum || Number.isNaN(patientIdNum)) {
      this.messageService.add({ severity: 'error', summary: 'Paciente inválido', detail: 'No se pudo resolver el ID del paciente.' });
      return;
    }

    if (!this.routineForm.name || !this.routineForm.startDate || !this.routineForm.endDate) {
      this.messageService.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombre, fecha inicio y fecha fin son obligatorios.' });
      return;
    }

    const normalizedName = this.normalizeText(this.routineForm.name || '').trim();
    const duplicatedName = (this.routines || []).some((routine: any) => {
      const isCurrentEditing = Boolean(this.editingRoutine?.id) && Number(routine.id) === Number(this.editingRoutine.id);
      if (isCurrentEditing) return false;
      return this.normalizeText(routine?.name || '').trim() === normalizedName;
    });

    if (duplicatedName) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nombre duplicado',
        detail: 'No puede haber dos rutinas con el mismo nombre para este paciente.',
      });
      return;
    }

    if (!Array.isArray(this.routineForm.exerciseIds) || this.routineForm.exerciseIds.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin ejercicios', detail: 'Debes seleccionar al menos un ejercicio.' });
      return;
    }

    const physioId = this.resolvePhysioId();
    if (!physioId) {
      this.messageService.add({ severity: 'error', summary: 'Falta id del fisio', detail: 'No se pudo resolver el fisioterapeuta para guardar la rutina.' });
      return;
    }

    const exerciseItems = this.routineForm.exerciseIds.map((exerciseId: number, index: number) => {
      const config = this.getExerciseConfig(exerciseId);
      return {
        exerciseId,
        repetitions: Number(config.repetitions) || undefined,
        sets: Number(config.sets) || undefined,
        exerciseOrder: index + 1,
        notes: config.notes || undefined,
      };
    });

    const payload = {
      name: this.routineForm.name,
      startDate: this.routineForm.startDate,
      endDate: this.routineForm.endDate,
      physiotherapistId: physioId,
      patientId: patientIdNum,
      exerciseIds: this.routineForm.exerciseIds,
      exerciseItems,
    };

    if (this.editingRoutine?.id) {
      if (!this.hasRoutineChanges()) {
        this.confirmationService.confirm({
          header: 'Sin cambios',
          message: 'No se realizaron cambios en la rutina.',
          icon: 'pi pi-info-circle',
          acceptLabel: 'Continuar',
          rejectLabel: 'Cancelar',
          rejectButtonStyleClass: 'p-button-text',
          accept: () => {
            this.showRoutineModal = false;
          },
          reject: () => {
            this.showRoutineModal = true;
          }
        });
        return;
      }

      this.http.put<any>(`${environment.webservice.baseUrl}/api/routines/${this.editingRoutine.id}`, {
        name: this.routineForm.name,
        startDate: this.routineForm.startDate,
        endDate: this.routineForm.endDate,
        replaceExisting: true,
        exerciseIds: this.routineForm.exerciseIds,
        exerciseItems,
      }).subscribe({
        next: () => {
          this.showRoutineModal = false;
          this.messageService.add({ severity: 'success', summary: 'Rutina actualizada', detail: 'Se actualizaron los ejercicios de la rutina.' });
          this.loadRoutines();
        },
        error: (err) => {
          const msg = err.error?.message || 'No se pudo actualizar la rutina.';
          this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
        }
      });
      return;
    }

    this.http.post<any>(`${environment.webservice.baseUrl}/api/routines`, payload).subscribe({
      next: () => {
        this.showRoutineModal = false;
        this.messageService.add({ severity: 'success', summary: 'Rutina creada', detail: 'La rutina se creó con éxito.' });
        this.loadRoutines();
      },
      error: (err) => {
        const msg = err.error?.message || 'No se pudo guardar la rutina.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
      }
    });
  }

  deleteRoutine(id: number): void {
    this.confirmationService.confirm({
      header: 'Confirmar eliminación',
      message: '¿Deseas eliminar esta rutina? Esta acción no se puede deshacer.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.routines = this.routines.filter(r => r.id !== id);
        this.messageService.add({ severity: 'info', summary: 'Eliminada', detail: 'Rutina eliminada.' });
      }
    });
  }

  isExerciseSelected(id: number): boolean {
    return this.routineForm.exerciseIds?.includes(id);
  }

  toggleExerciseSelection(id: number): void {
    const selected = this.routineForm.exerciseIds || [];
    if (selected.includes(id)) {
      this.routineForm.exerciseIds = selected.filter((x: number) => x !== id);
    } else {
      this.routineForm.exerciseIds = [...selected, id];
      if (!this.exerciseConfigMap[id]) {
        this.exerciseConfigMap[id] = { repetitions: 10, sets: 3, notes: '' };
      }
    }
  }

  getExerciseConfig(id: number): { repetitions: number; sets: number; notes: string } {
    if (!this.exerciseConfigMap[id]) {
      this.exerciseConfigMap[id] = { repetitions: 10, sets: 3, notes: '' };
    }
    return this.exerciseConfigMap[id];
  }

  openExercisePreview(exercise: any): void {
    this.previewExercise = exercise;
    this.showExercisePreviewModal = true;
  }

  getPreviewExerciseConfig(): { repetitions: number; sets: number; notes: string } {
    const exerciseId = Number(this.previewExercise?.id ?? this.previewExercise?.id_exercise);
    if (!exerciseId) {
      return { repetitions: 10, sets: 3, notes: '' };
    }

    return this.getExerciseConfig(exerciseId);
  }

  isDirectVideoFile(url: string): boolean {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url || '');
  }

  isEmbeddableVideo(url: string): boolean {
    const value = (url || '').toLowerCase();
    return value.includes('youtube.com') || value.includes('youtu.be') || value.includes('vimeo.com');
  }

  get filteredExercises(): any[] {
    const q = this.normalizeText(this.exerciseSearch || '');
    if (!q) return this.exerciseCatalog;
    return this.exerciseCatalog.filter((e: any) => {
      const name = this.normalizeText(e.name || '');
      const zone = this.normalizeText(e.body_zone || '');
      return name.includes(q) || zone.includes(q);
    });
  }

  private hasRoutineChanges(): boolean {
    return this.buildRoutineSnapshot() !== this.initialRoutineSnapshot;
  }

  private buildRoutineSnapshot(): string {
    const ids = Array.isArray(this.routineForm?.exerciseIds)
      ? this.routineForm.exerciseIds.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
      : [];

    const exerciseConfig = ids
      .sort((a: number, b: number) => a - b)
      .map((id: number) => {
        const config = this.getExerciseConfig(id);
        return {
          id,
          sets: Number(config.sets) || null,
          repetitions: Number(config.repetitions) || null,
          notes: (config.notes || '').trim(),
        };
      });

    return JSON.stringify({
      name: (this.routineForm?.name || '').trim(),
      startDate: this.routineForm?.startDate || '',
      endDate: this.routineForm?.endDate || '',
      exerciseConfig,
    });
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private resolvePhysioId(): number | null {
    if (this.patient?.id_physio) return Number(this.patient.id_physio);

    const direct = localStorage.getItem('id_physio') || localStorage.getItem('physioId');
    if (direct && !isNaN(Number(direct))) return Number(direct);

    const tokenPhysio = this.getPhysioIdFromToken();
    if (tokenPhysio) return tokenPhysio;

    try {
      const userRaw = localStorage.getItem('user') || localStorage.getItem('auth_user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const nested = user?.id_physio || user?.physiotherapist?.id_physio || user?.physio?.id;
        if (nested && !isNaN(Number(nested))) return Number(nested);
      }
    } catch {
      // Ignorar parse errors de localStorage
    }

    return null;
  }

  private getPhysioIdFromToken(): number | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '==='.slice((normalized.length + 3) % 4);
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded);
      const id = parsed?.id_physio;
      return id && !isNaN(Number(id)) ? Number(id) : null;
    } catch {
      return null;
    }
  }

  getSafeVideoUrl(url: string): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.toEmbedUrl(url));
  }

  private toEmbedUrl(url: string): string {
    if (!url) return 'about:blank';
    if (this.isDirectVideoFile(url)) return url;

    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/i);
    if (youtubeMatch?.[1]) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
    if (vimeoMatch?.[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return url;
  }

  // ===================================================
  // HELPERS
  // ===================================================
  getStatusClass(status: string): string {
    const map: any = {
      'programada': 'status-scheduled',
      'completada': 'status-completed',
      'cancelada': 'status-cancelled',
      'pendiente': 'status-scheduled',
    };
    return map[status?.toLowerCase()] || 'status-scheduled';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  get logModalTitle(): string {
    return this.editingLog ? 'Editar Bitácora' : 'Nueva Bitácora';
  }

  get routineModalTitle(): string {
    return this.editingRoutine ? 'Editar Rutina' : 'Nueva Rutina';
  }
}
