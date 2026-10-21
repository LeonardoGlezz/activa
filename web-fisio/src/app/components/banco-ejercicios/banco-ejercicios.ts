import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // *** CAMBIO CLAVE: Importar ChangeDetectorRef ***
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ListboxModule } from 'primeng/listbox';
import { ToastModule } from 'primeng/toast';
import { ExerciseUseCase } from '../../core/exercises/application/exercise.use-case';
import { Exercise } from '../../core/exercises/domain/exercise.model';
import { PatientUseCase } from  '../../core/patient/application/patient.use-case';
import { environment } from '../../../environments/environment';
import { MessageService } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExerciseMediaKind, getEmbedUrl, getMediaKind, getMediaThumbnail, resolveMediaUrl } from '../../core/exercises/domain/exercise-media';
import { BODY_ZONES } from '../../core/exercises/domain/exercise.model';
import { Router } from '@angular/router';

/** Ejercicio con su material de demostración ya preparado para la vista */
type BankExercise = Exercise & {
  mediaUrl: string;
  mediaKind: ExerciseMediaKind;
  thumbnail: string | null;
  embedUrl: SafeResourceUrl | null;
};


import { EXERCISE_PLACEHOLDER } from '../../core/placeholder';
@Component({
  selector: 'app-banco-ejercicios',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, InputTextModule, FormsModule, DialogModule, ListboxModule, ToastModule],
  providers: [MessageService],
  templateUrl: './banco-ejercicios.html',
  styleUrl: './banco-ejercicios.scss'
})
export class BancoEjerciciosComponent implements OnInit {
  exercises: BankExercise[] = [];
  filteredExercises: BankExercise[] = [];
  searchTerm: string = '';
  loading: boolean = false;

  /** De dónde vienen: todo, el banco base de Activa o Mis ejercicios */
  readonly sources = [
    { value: 'all', label: 'Todos' },
    { value: 'base', label: 'Banco base' },
    { value: 'mine', label: 'Mis ejercicios' },
  ] as const;
  selectedSource: 'all' | 'base' | 'mine' = 'all';
  zones: string[] = [...BODY_ZONES];
  selectedZone = '';
  deletingId: number | string | null = null;

  patients: any[] = [];
  showAssignModal: boolean = false;
  showPreviewModal: boolean = false;
  selectedExercise?: Exercise;
  previewExercise?: BankExercise;
  selectedPatient?: any;
  selectedRoutineTemplateId: number | null = null;
  savingToRoutine: boolean = false;
  showCreateRoutineBox: boolean = false;
  routineTemplates: any[] = [];
  filteredRoutineTemplates: any[] = [];
  routineSearchTerm: string = '';
  creatingRoutine: boolean = false;
  loadingRoutineTemplates: boolean = false;
  newRoutineTemplate: any = {
    name: '',
    tag: 'General',
  };
  placeholderImg = EXERCISE_PLACEHOLDER;

  constructor(
    private exerciseUseCase: ExerciseUseCase,
    private patientUseCase: PatientUseCase,
    private http: HttpClient,
    private messageService: MessageService,
    private cd: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExercises();
    this.loadPatients();
  }

  loadExercises(): void {
    this.loading = true;
    this.exerciseUseCase.listExercises(1, 500).subscribe({
      next: (result) => {
        if (result.zones?.length) this.zones = result.zones;
        this.exercises = (result.rows || []).map((exercise: any) => {
          const videoUrl = exercise.videoUrl ?? exercise.video_url;
          const mediaUrl = resolveMediaUrl(videoUrl);
          const embed = getEmbedUrl(mediaUrl);
          return {
            id: exercise.id ?? exercise.id_exercise,
            name: exercise.name,
            bodyZone: exercise.bodyZone ?? exercise.body_zone,
            description: exercise.description,
            videoUrl,
            scope: exercise.scope ?? 'base',
            editable: Boolean(exercise.editable),
            mediaUrl,
            mediaKind: getMediaKind(mediaUrl),
            thumbnail: getMediaThumbnail(mediaUrl),
            embedUrl: embed ? this.sanitizer.bypassSecurityTrustResourceUrl(embed) : null,
          };
        });
        this.applyFilters();
        this.loading = false;
        this.cd.detectChanges(); // Forzar renderizado inicial
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  loadPatients(): void {
    this.patientUseCase.getPatients().subscribe({
      next: (response: any) => {
        this.patients = response.rows || [];
        this.cd.detectChanges();
      }
    });
  }

  /** Minúsculas y sin acentos, para buscar "rodilla" o "Rodílla" igual */
  private normalizeText(text: string): string {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  selectSource(source: 'all' | 'base' | 'mine'): void {
    this.selectedSource = source;
    this.applyFilters();
  }

  selectZone(zone: string): void {
    this.selectedZone = this.selectedZone === zone ? '' : zone;
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  get mineCount(): number {
    return this.exercises.filter((e) => e.scope === 'mine').length;
  }

  /** Filtra por origen, zona y por todas las palabras escritas (en nombre, zona o descripción) */
  applyFilters(): void {
    const words = this.normalizeText(this.searchTerm).split(/\s+/).filter(Boolean);
    this.filteredExercises = this.exercises.filter((ex) => {
      if (this.selectedSource !== 'all' && ex.scope !== this.selectedSource) return false;
      if (this.selectedZone && ex.bodyZone !== this.selectedZone) return false;
      if (!words.length) return true;
      const text = this.normalizeText(`${ex.name} ${ex.bodyZone || ''} ${ex.description || ''}`);
      return words.every((w) => text.includes(w));
    });
    this.cd.detectChanges();
  }

  /** Copia un ejercicio del banco base a Mis ejercicios y abre la copia para editarla */
  copyToMine(exercise: BankExercise): void {
    this.exerciseUseCase.copyToMine(exercise.id!).subscribe({
      next: (resp: any) => {
        const id = resp?.data?.id_exercise;
        this.messageService.add({ severity: 'success', summary: 'Copiado', detail: 'Ahora está en Mis ejercicios. Puedes cambiarlo.' });
        if (id) this.router.navigate(['/dashboard/ejercicios', id, 'editar']);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'No se pudo copiar', detail: err?.error?.message || 'Intenta de nuevo.' });
      },
    });
  }

  deleteExercise(exercise: BankExercise): void {
    if (!confirm(`¿Borrar "${exercise.name}" de Mis ejercicios?`)) return;
    this.deletingId = exercise.id!;
    this.exerciseUseCase.deleteExercise(exercise.id!).subscribe({
      next: () => {
        this.deletingId = null;
        this.exercises = this.exercises.filter((e) => e.id !== exercise.id);
        this.applyFilters();
        this.messageService.add({ severity: 'success', summary: 'Borrado', detail: `"${exercise.name}" ya no está en Mis ejercicios.` });
      },
      error: (err) => {
        this.deletingId = null;
        this.messageService.add({ severity: 'warn', summary: 'No se borró', detail: err?.error?.message || 'Intenta de nuevo.' });
        this.cd.detectChanges();
      },
    });
  }

  openAssignModal(exercise: Exercise): void {
    this.selectedExercise = exercise;
    this.routineSearchTerm = '';
    this.selectedRoutineTemplateId = null;
    this.showCreateRoutineBox = false;
    this.showAssignModal = true;
    this.loadRoutineTemplates();
    this.cd.detectChanges();
  }

  openPreview(exercise: BankExercise): void {
    this.previewExercise = exercise;
    this.showPreviewModal = true;
    this.cd.detectChanges();
  }

  confirmAssignment(): void {
    if (this.selectedPatient && this.selectedExercise) {
      // Lógica de guardado...
      this.showAssignModal = false;
      this.selectedPatient = null;
      this.cd.detectChanges();
    }
  }

  loadRoutineTemplates(): void {
    const physioId = this.resolvePhysioId();
    if (!physioId) {
      this.routineTemplates = [];
      this.filteredRoutineTemplates = [];
      this.cd.detectChanges();
      return;
    }

    this.loadingRoutineTemplates = true;
    const url = `${environment.webservice.baseUrl}/api/routines/templates?physiotherapistId=${physioId}`;

    this.http.get<any>(url).subscribe({
      next: (resp) => {
        const templates = resp?.data || [];
        this.routineTemplates = templates
          .map((t: any) => ({
            id_template: t.id_template,
            name: t.name,
            tag: t.tag || 'General',
            created_at: t.created_at,
            exercisesCount: (t.exercises || []).length,
            exerciseIds: (t.exercises || [])
              .map((ex: any) => Number(ex?.id_exercise ?? ex?.id))
              .filter((id: number) => Number.isFinite(id)),
          }))
          .sort((a: any, b: any) => {
            const dA = new Date(a.created_at || 0).getTime();
            const dB = new Date(b.created_at || 0).getTime();
            return dB - dA;
          });

        this.filteredRoutineTemplates = [...this.routineTemplates];
        this.loadingRoutineTemplates = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.routineTemplates = [];
        this.filteredRoutineTemplates = [];
        this.loadingRoutineTemplates = false;
        this.cd.detectChanges();
      }
    });
  }

  onRoutineSearch(): void {
    const term = this.normalizeText(this.routineSearchTerm || '');
    if (!term) {
      this.filteredRoutineTemplates = [...this.routineTemplates];
      return;
    }
    this.filteredRoutineTemplates = this.routineTemplates.filter((r: any) => {
      const name = this.normalizeText(r.name || '');
      const tag = this.normalizeText(r.tag || '');
      return name.includes(term) || tag.includes(term);
    });
  }

  openCreateRoutineTemplate(): void {
    this.newRoutineTemplate = {
      name: '',
      tag: 'General',
    };
    this.showCreateRoutineBox = true;
    this.selectedRoutineTemplateId = null;
  }

  selectRoutineTemplate(templateId: number): void {
    const routine = this.filteredRoutineTemplates.find((r: any) => r.id_template === templateId);
    if (!routine) return;

    if (this.isRoutineDisabledForSelectedExercise(routine)) {
      this.selectedRoutineTemplateId = null;
      this.messageService.add({
        severity: 'warn',
        summary: 'Ejercicio duplicado',
        detail: 'Este ejercicio ya existe en la rutina seleccionada.',
      });
      return;
    }

    this.selectedRoutineTemplateId = templateId;
  }

  isRoutineDisabledForSelectedExercise(routine: any): boolean {
    const exerciseId = Number(this.selectedExercise?.id);
    if (!exerciseId || Number.isNaN(exerciseId)) return false;

    const ids = Array.isArray(routine?.exerciseIds) ? routine.exerciseIds : [];
    return ids.includes(exerciseId);
  }

  saveExerciseInRoutineTemplate(): void {
    if (!this.selectedExercise) return;

    if (!this.selectedRoutineTemplateId) {
      this.messageService.add({ severity: 'warn', summary: 'Selecciona una rutina', detail: 'Primero elige una rutina disponible.' });
      return;
    }

    const exerciseId = Number(this.selectedExercise.id);
    if (!exerciseId || Number.isNaN(exerciseId)) {
      this.messageService.add({ severity: 'error', summary: 'Ejercicio inválido', detail: 'El ejercicio no tiene un identificador válido.' });
      return;
    }

    this.savingToRoutine = true;
    this.http.put<any>(`${environment.webservice.baseUrl}/api/routines/templates/${this.selectedRoutineTemplateId}`, {
      exerciseIds: [exerciseId],
      exerciseItems: [
        {
          exerciseId,
          exerciseOrder: 1,
        }
      ]
    }).subscribe({
      next: () => {
        this.savingToRoutine = false;
        this.showAssignModal = false;
        this.selectedRoutineTemplateId = null;
        this.messageService.add({ severity: 'success', summary: 'Ejercicio guardado', detail: 'El ejercicio fue agregado a la rutina seleccionada.' });
        this.loadRoutineTemplates();
      },
      error: (err) => {
        this.savingToRoutine = false;
        const msg = err.error?.message || 'No se pudo guardar el ejercicio en la rutina.';
        this.messageService.add({ severity: 'error', summary: 'Error al guardar', detail: msg });
      }
    });
  }

  createRoutineTemplate(): void {
    if (!this.newRoutineTemplate.name || this.newRoutineTemplate.name.trim().length < 3) {
      this.messageService.add({ severity: 'warn', summary: 'Nombre requerido', detail: 'La rutina debe tener al menos 3 caracteres.' });
      return;
    }

    const physioId = this.resolvePhysioId();
    if (!physioId) {
      this.messageService.add({ severity: 'error', summary: 'Falta fisioterapeuta', detail: 'No se pudo identificar el id del fisioterapeuta.' });
      return;
    }

    const payload = {
      name: this.newRoutineTemplate.name.trim(),
      tag: this.newRoutineTemplate.tag || 'General',
      physiotherapistId: physioId,
    };

    this.creatingRoutine = true;
    this.http.post<any>(`${environment.webservice.baseUrl}/api/routines/templates`, payload).subscribe({
      next: (resp) => {
        this.creatingRoutine = false;
        this.showCreateRoutineBox = false;
        this.selectedRoutineTemplateId = resp?.data?.id_template ?? null;
        this.messageService.add({ severity: 'success', summary: 'Rutina creada', detail: 'La rutina base quedó guardada. Ahora puedes asignarle ejercicios.' });
        this.loadRoutineTemplates();
      },
      error: (err) => {
        this.creatingRoutine = false;
        const msg = err.error?.message || 'No se pudo guardar la rutina.';
        this.messageService.add({ severity: 'error', summary: 'Error al guardar', detail: msg });
      }
    });
  }

  private resolvePhysioId(): number | null {
    const direct = localStorage.getItem('id_physio') || localStorage.getItem('physioId');
    if (direct && !isNaN(Number(direct))) return Number(direct);

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
}