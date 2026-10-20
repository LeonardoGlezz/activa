import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { ExerciseUseCase } from '../../../../../core/exercises/application/exercise.use-case';
import { PatientUseCase } from '../../../../../core/patient/application/patient.use-case';
import { environment } from '../../../../../../environments/environment.development';

@Component({
  selector: 'app-routine-library',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, ButtonModule, ToastModule, DialogModule],
  providers: [MessageService],
  templateUrl: './routine-library.html',
  styleUrl: './routine-library.scss'
})
export class RoutineLibraryComponent implements OnInit {
  routineTemplates: any[] = [];
  loading = false;
  searchTerm = '';

  exerciseCatalog: any[] = [];
  exerciseSearch = '';
  selectedExerciseIds: number[] = [];
  showExercisePreviewModal = false;
  previewExercise: any = null;
  previewContext: 'builder' | 'editor' = 'builder';
  exerciseConfigMap: Record<number, { repetitions: number; sets: number; notes: string }> = {};
  showTemplateEditorModal = false;
  loadingTemplateDetail = false;
  editingTemplate: any = null;
  editingExerciseSearch = '';
  editingForm = {
    name: '',
    tag: 'General',
    startDate: '',
    endDate: '',
    exerciseIds: [] as number[]
  };
  editingExerciseConfigMap: Record<number, { repetitions: number; sets: number; notes: string }> = {};
  patients: any[] = [];
  filteredPatients: any[] = [];
  patientSearch = '';
  selectedAssignPatientId: number | null = null;
  editingInitialSnapshot = '';
  showEditorConfirmModal = false;
  editorConfirmMode: 'close-with-save' | 'save-without-changes' = 'close-with-save';

  form = {
    name: '',
    tag: 'General'
  };
  placeholderImg = 'https://placehold.co/1000x600/0d9488/ffffff?text=ACTIVA+Fisio';

  constructor(
    private http: HttpClient,
    private exerciseUseCase: ExerciseUseCase,
    private patientUseCase: PatientUseCase,
    private router: Router,
    private sanitizer: DomSanitizer,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.loadExercises();
    this.loadPatients();
  }

  private readonly TEMPLATES_CACHE_KEY = 'activa_routine_templates_cache';

  loadTemplates(): void {
    const physioId = this.resolvePhysioId();
    if (!physioId) {
      this.messageService.add({ severity: 'error', summary: 'Sin sesión', detail: 'No se pudo resolver el fisioterapeuta.' });
      return;
    }

    // Mostrar caché inmediatamente si existe
    const cached = localStorage.getItem(this.TEMPLATES_CACHE_KEY + '_' + physioId);
    if (cached) {
      try {
        this.routineTemplates = JSON.parse(cached);
      } catch { /* caché corrupta, se ignora */ }
    }

    this.loading = this.routineTemplates.length === 0;
    this.http.get<any>(`${environment.webservice.baseUrl}/api/routines/templates?physiotherapistId=${physioId}`).subscribe({
      next: (resp) => {
        const fresh = (resp?.data || []).map((item: any) => ({
          id_template: item.id_template,
          name: item.name,
          tag: item.tag || 'General',
          created_at: item.created_at,
          exercises: item.exercises || []
        }));
        this.routineTemplates = fresh;
        this.loading = false;
        localStorage.setItem(this.TEMPLATES_CACHE_KEY + '_' + physioId, JSON.stringify(fresh));
      },
      error: () => {
        this.loading = false;
        if (this.routineTemplates.length === 0) {
          this.messageService.add({ severity: 'warn', summary: 'Sin conexión', detail: 'No se pudo actualizar la lista de rutinas. Verifica el servidor.' });
        }
      }
    });
  }

  loadExercises(): void {
    this.exerciseUseCase.listExercises(1, 300).subscribe({
      next: (resp: any) => {
        this.exerciseCatalog = (resp.rows || []).map((exercise: any) => ({
          id: exercise.id ?? exercise.id_exercise,
          name: exercise.name,
          bodyZone: exercise.bodyZone ?? exercise.body_zone,
          description: exercise.description,
          videoUrl: exercise.videoUrl ?? exercise.video_url,
        }));
        if (!this.previewExercise && this.exerciseCatalog.length > 0) {
          this.previewExercise = this.exerciseCatalog[0];
        }
      }
    });
  }

  loadPatients(): void {
    this.patientUseCase.getPatients().subscribe({
      next: (resp: any) => {
        const rows = resp?.rows || [];
        this.patients = rows.map((p: any) => ({
          id: p.id_patient || p.id,
          name: `${p.first_name || p.firstName || ''} ${p.last_name_paternal || p.lastNameP || ''} ${p.last_name_maternal || p.lastNameM || ''}`.replace(/\s+/g, ' ').trim(),
          email: p.email || p.user?.email || ''
        }));
        this.filteredPatients = [...this.patients];
      }
    });
  }

  get visibleRoutineTemplates(): any[] {
    const term = this.normalize(this.searchTerm || '');
    if (!term) return this.routineTemplates;
    return this.routineTemplates.filter((item: any) =>
      this.normalize(item.name).includes(term) || this.normalize(item.tag).includes(term)
    );
  }

  get filteredExercises(): any[] {
    const term = this.normalize(this.exerciseSearch);
    if (!term) return this.exerciseCatalog;
    return this.exerciseCatalog.filter((item: any) =>
      this.normalize(item.name).includes(term) || this.normalize(item.bodyZone).includes(term)
    );
  }

  toggleExercise(id: number): void {
    if (this.selectedExerciseIds.includes(id)) {
      this.selectedExerciseIds = this.selectedExerciseIds.filter(x => x !== id);
      return;
    }

    this.selectedExerciseIds = [...this.selectedExerciseIds, id];
    if (!this.exerciseConfigMap[id]) {
      this.exerciseConfigMap[id] = { repetitions: 10, sets: 3, notes: '' };
    }
  }

  setPreviewExercise(exercise: any): void {
    this.previewExercise = exercise;
  }

  isEditingExerciseSelected(id: number): boolean {
    return (this.editingForm.exerciseIds || []).includes(id);
  }

  toggleEditingExercise(id: number): void {
    const selected = this.editingForm.exerciseIds || [];
    if (selected.includes(id)) {
      this.editingForm.exerciseIds = selected.filter((x: number) => x !== id);
      return;
    }

    this.editingForm.exerciseIds = [...selected, id];
    if (!this.editingExerciseConfigMap[id]) {
      this.editingExerciseConfigMap[id] = { repetitions: 10, sets: 3, notes: '' };
    }
  }

  openExercisePreview(exercise: any, context: 'builder' | 'editor' = 'builder'): void {
    this.previewExercise = exercise;
    this.previewContext = context;
    this.showExercisePreviewModal = true;
  }

  getPreviewConfig(): { repetitions: number; sets: number; notes: string } {
    const exerciseId = Number(this.previewExercise?.id ?? this.previewExercise?.id_exercise);
    if (!exerciseId) {
      return { repetitions: 10, sets: 3, notes: '' };
    }

    return this.previewContext === 'editor'
      ? this.getEditingExerciseConfig(exerciseId)
      : this.getExerciseConfig(exerciseId);
  }

  getSafeMediaUrl(url: string): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.toEmbedUrl(url));
  }

  isDirectVideoFile(url: string): boolean {
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url || '');
  }

  isEmbeddableVideo(url: string): boolean {
    const value = (url || '').toLowerCase();
    return value.includes('youtube.com') || value.includes('youtu.be') || value.includes('vimeo.com');
  }

  getExerciseConfig(id: number): { repetitions: number; sets: number; notes: string } {
    if (!this.exerciseConfigMap[id]) {
      this.exerciseConfigMap[id] = { repetitions: 10, sets: 3, notes: '' };
    }
    return this.exerciseConfigMap[id];
  }

  saveTemplate(): void {
    const physioId = this.resolvePhysioId();
    if (!physioId) return;

    if (!this.form.name || this.form.name.trim().length < 3) {
      this.messageService.add({ severity: 'warn', summary: 'Nombre requerido', detail: 'Ingresa un nombre válido.' });
      return;
    }

    if (this.selectedExerciseIds.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin ejercicios', detail: 'Selecciona al menos un ejercicio.' });
      return;
    }

    const payload = {
      name: this.form.name.trim(),
      tag: this.form.tag || 'General',
      physiotherapistId: physioId,
      exerciseIds: this.selectedExerciseIds,
      exerciseItems: this.selectedExerciseIds.map((exerciseId, index) => ({
        exerciseId,
        sets: Number(this.getExerciseConfig(exerciseId).sets) || 3,
        repetitions: Number(this.getExerciseConfig(exerciseId).repetitions) || 10,
        exerciseOrder: index + 1,
        notes: this.getExerciseConfig(exerciseId).notes || undefined,
      }))
    };

    this.http.post<any>(`${environment.webservice.baseUrl}/api/routines/templates`, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Rutina guardada', detail: 'Se agregó a tu biblioteca.' });
        this.form = { name: '', tag: 'General' };
        this.selectedExerciseIds = [];
        this.exerciseConfigMap = {};
        this.loadTemplates();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo guardar la rutina.' });
      }
    });
  }

  openTemplateEditor(template: any): void {
    this.editingTemplate = template;
    this.showTemplateEditorModal = true;
    this.loadingTemplateDetail = true;
    this.selectedAssignPatientId = null;
    this.patientSearch = '';
    this.filteredPatients = [...this.patients];

    this.http.get<any>(`${environment.webservice.baseUrl}/api/routines/templates/${template.id_template}`).subscribe({
      next: (resp) => {
        const data = resp?.data || template;
        const exercises = data.exercises || [];
        const today = new Date();
        const end = new Date();
        end.setDate(end.getDate() + 14);

        this.editingForm = {
          name: data.name || 'Rutina',
          tag: data.tag || 'General',
          startDate: today.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          exerciseIds: exercises.map((e: any) => e.id_exercise || e.id).filter((id: any) => !!id),
        };

        this.editingExerciseConfigMap = {};
        exercises.forEach((ex: any) => {
          const id = ex.id_exercise || ex.id;
          if (!id) return;
          const rel = ex.RoutineTemplateExercise || ex.routineTemplateExercise || {};
          this.editingExerciseConfigMap[id] = {
            sets: Number(rel.sets || 3),
            repetitions: Number(rel.repetitions || 10),
            notes: rel.notes || '',
          };
        });

        this.editingInitialSnapshot = this.buildEditingSnapshot();

        this.loadingTemplateDetail = false;
      },
      error: () => {
        this.loadingTemplateDetail = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle de la rutina.' });
      }
    });
  }

  get filteredEditingExercises(): any[] {
    const term = this.normalize(this.editingExerciseSearch || '');
    const source = !term
      ? [...this.exerciseCatalog]
      : this.exerciseCatalog.filter((item: any) =>
      this.normalize(item.name).includes(term) || this.normalize(item.bodyZone).includes(term)
    );

    const selectedSet = new Set(this.editingForm.exerciseIds || []);
    return source.sort((a: any, b: any) => {
      const aSelected = selectedSet.has(a.id) ? 0 : 1;
      const bSelected = selectedSet.has(b.id) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }

  getEditingExerciseConfig(id: number): { repetitions: number; sets: number; notes: string } {
    if (!this.editingExerciseConfigMap[id]) {
      this.editingExerciseConfigMap[id] = { repetitions: 10, sets: 3, notes: '' };
    }
    return this.editingExerciseConfigMap[id];
  }

  filterPatients(): void {
    const term = this.normalize(this.patientSearch || '');
    if (!term) {
      this.filteredPatients = [...this.patients];
      return;
    }
    this.filteredPatients = this.patients.filter((p: any) =>
      this.normalize(p.name).includes(term) || this.normalize(p.email).includes(term)
    );
  }

  selectAssignPatient(patientId: number): void {
    this.selectedAssignPatientId = patientId;
  }

  saveTemplateEditor(): void {
    if (!this.editingTemplate?.id_template) {
      this.messageService.add({ severity: 'warn', summary: 'Sin rutina', detail: 'No hay una rutina seleccionada para guardar.' });
      return;
    }

    if (!this.editingForm.name || this.editingForm.name.trim().length < 3) {
      this.messageService.add({ severity: 'warn', summary: 'Nombre requerido', detail: 'Ingresa un nombre válido para la rutina.' });
      return;
    }

    if (!Array.isArray(this.editingForm.exerciseIds) || this.editingForm.exerciseIds.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin ejercicios', detail: 'Agrega al menos un ejercicio en la rutina.' });
      return;
    }

    if (!this.hasEditingChanges()) {
      this.editorConfirmMode = 'save-without-changes';
      this.showEditorConfirmModal = true;
      return;
    }

    this.persistTemplateEditorChanges({ closeAfterSave: false, showSuccessToast: true });
  }

  requestCloseTemplateEditor(): void {
    if (!this.hasEditingChanges()) {
      this.showTemplateEditorModal = false;
      return;
    }

    this.editorConfirmMode = 'close-with-save';
    this.showEditorConfirmModal = true;
  }

  cancelEditorConfirm(): void {
    this.showEditorConfirmModal = false;
  }

  confirmEditorAction(): void {
    if (this.editorConfirmMode === 'save-without-changes') {
      this.showEditorConfirmModal = false;
      this.showTemplateEditorModal = false;
      return;
    }

    this.persistTemplateEditorChanges({ closeAfterSave: true, showSuccessToast: true });
  }

  private persistTemplateEditorChanges(opts: { closeAfterSave: boolean; showSuccessToast: boolean }): void {
    this.showEditorConfirmModal = false;

    this.http.put<any>(`${environment.webservice.baseUrl}/api/routines/templates/${this.editingTemplate.id_template}`, {
      ...this.buildEditingTemplatePayload(),
      replaceExisting: true,
    }).subscribe({
      next: () => {
        if (opts.showSuccessToast) {
          this.messageService.add({ severity: 'success', summary: 'Rutina guardada', detail: 'Se actualizaron los cambios en la biblioteca.' });
        }
        this.editingInitialSnapshot = this.buildEditingSnapshot();
        if (opts.closeAfterSave) {
          this.showTemplateEditorModal = false;
        }
        this.loadTemplates();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo guardar la rutina.' });
      }
    });
  }

  assignToPatientEditor(): void {
    if (!this.selectedAssignPatientId || !this.editingTemplate?.id_template) {
      this.messageService.add({ severity: 'warn', summary: 'Falta paciente', detail: 'Selecciona un paciente para continuar.' });
      return;
    }

    if (!this.editingForm.name || this.editingForm.name.trim().length < 3) {
      this.messageService.add({ severity: 'warn', summary: 'Nombre requerido', detail: 'Ingresa un nombre válido para la rutina antes de asignar.' });
      return;
    }

    if (!Array.isArray(this.editingForm.exerciseIds) || this.editingForm.exerciseIds.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Sin ejercicios', detail: 'Agrega al menos un ejercicio antes de asignar al paciente.' });
      return;
    }

    this.http.put<any>(`${environment.webservice.baseUrl}/api/routines/templates/${this.editingTemplate.id_template}`, {
      ...this.buildEditingTemplatePayload(),
      replaceExisting: true,
    }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard/ver-paciente', this.selectedAssignPatientId], {
          queryParams: {
            openRoutineEditor: '1',
            templateId: this.editingTemplate.id_template
          }
        });
        this.showTemplateEditorModal = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'No se pudo asignar', detail: err.error?.message || 'Guarda la rutina antes de asignarla al paciente.' });
      }
    });
  }

  private buildEditingTemplatePayload(): any {
    const exerciseIds = [...(this.editingForm.exerciseIds || [])];
    const exerciseItems = exerciseIds.map((exerciseId: number, index: number) => ({
      exerciseId,
      sets: Number(this.getEditingExerciseConfig(exerciseId).sets) || 3,
      repetitions: Number(this.getEditingExerciseConfig(exerciseId).repetitions) || 10,
      exerciseOrder: index + 1,
      notes: this.getEditingExerciseConfig(exerciseId).notes || undefined,
    }));

    return {
      name: this.editingForm.name.trim(),
      tag: this.editingForm.tag || 'General',
      exerciseIds,
      exerciseItems,
    };
  }

  private hasEditingChanges(): boolean {
    return this.buildEditingSnapshot() !== this.editingInitialSnapshot;
  }

  private buildEditingSnapshot(): string {
    const ids = [...(this.editingForm.exerciseIds || [])]
      .map((id: any) => Number(id))
      .filter((id: number) => Number.isFinite(id))
      .sort((a: number, b: number) => a - b);

    const exerciseItems = ids.map((exerciseId: number) => {
      const cfg = this.getEditingExerciseConfig(exerciseId);
      return {
        exerciseId,
        sets: Number(cfg.sets) || null,
        repetitions: Number(cfg.repetitions) || null,
        notes: (cfg.notes || '').trim(),
      };
    });

    return JSON.stringify({
      name: (this.editingForm.name || '').trim(),
      tag: (this.editingForm.tag || '').trim(),
      exerciseItems,
    });
  }

  private normalize(value: string): string {
    return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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
      return parsed?.id_physio ? Number(parsed.id_physio) : null;
    } catch {
      return null;
    }
  }
}