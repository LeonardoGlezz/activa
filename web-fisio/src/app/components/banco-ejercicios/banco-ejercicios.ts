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
import { environment } from '../../../environments/environment.development';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-banco-ejercicios',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputTextModule, FormsModule, DialogModule, ListboxModule, ToastModule],
  providers: [MessageService],
  templateUrl: './banco-ejercicios.html',
  styleUrl: './banco-ejercicios.scss'
})
export class BancoEjerciciosComponent implements OnInit {
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  searchTerm: string = '';
  loading: boolean = false;
  selectedCategory: string = 'Todos';

  // Organización por Zonas de Tratamiento - EXPANDIDO
  categories = [
    { label: 'Todos', muscles: [] },
    { 
      label: 'Tren Superior', 
      muscles: ['hombro', 'espalda', 'brazo', 'pecho', 'cervical', 'dorsal', 'escapula', 'escapulohumeral',
                'acromioclavicular', 'rotador', 'coracoides', 'manguito', 'trapecio', 'deltoides', 'bíceps',
                'tríceps', 'antebrazo', 'muñeca', 'cuello', 'clavícula', 'escapular', 'lumbalgia', 'dorso']
    },
    { 
      label: 'Tren Inferior', 
      muscles: ['cadera', 'rodilla', 'tobillo', 'gluteo', 'pierna', 'pie', 'muslo', 'isquio', 'femoral',
                'tibial', 'perone', 'sóleo', 'gemelos', 'aductor', 'abductor', 'cuadriceps', 'anca',
                'pelvis', 'sacro', 'articulación', 'metatarso', 'tarso', 'calcáneo']
    },
    { 
      label: 'Núcleo (Core)', 
      muscles: ['core', 'abdomen', 'lumbar', 'columna', 'pelvis', 'transverso', 'recto',
                'oblicuo', 'psoas', 'cuadrado', 'piso', 'esfinter', 'abdominales', 'tronco',
                'tóracoabdominal', 'lumbosacra', 'sacroilíaca']
    }
  ];

  patients: any[] = [];
  showAssignModal: boolean = false;
  showPreviewModal: boolean = false;
  selectedExercise?: Exercise;
  previewExercise?: Exercise;
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
  placeholderImg = 'https://placehold.co/600x400/0d9488/ffffff?text=ACTIVA+Fisio';

  constructor(
    private exerciseUseCase: ExerciseUseCase,
    private patientUseCase: PatientUseCase,
    private http: HttpClient,
    private messageService: MessageService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExercises();
    this.loadPatients();
  }

  loadExercises(): void {
    this.loading = true;
    this.exerciseUseCase.listExercises(1, 100).subscribe({
      next: (result) => {
        this.exercises = (result.rows || []).map((exercise: any) => ({
          id: exercise.id ?? exercise.id_exercise,
          name: exercise.name,
          bodyZone: exercise.bodyZone ?? exercise.body_zone,
          description: exercise.description,
          videoUrl: exercise.videoUrl ?? exercise.video_url,
        }));
        // Se muestran todos inmediatamente al entrar
        this.filteredExercises = [...this.exercises]; 
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

  /**
   * Normalización avanzada con sinónimos y variaciones
   * Maneja: tildes, plurales, singulares, variaciones comunes
   */
  private normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quita acentos
      .replace(/[^a-zA-Z\s]/g, '')    // Elimina números y caracteres especiales
      .trim();
  }

  /**
   * Genera variaciones de una palabra (plurales, singulares, etc)
   */
  private getWordVariations(word: string): string[] {
    const normalized = this.normalizeText(word);
    const variations = [normalized];
    
    // Agregar plural simple (agregar 's')
    variations.push(normalized + 's');
    
    // Agregar singular (quitar 's' si termina en 's')
    if (normalized.endsWith('s') && normalized.length > 2) {
      variations.push(normalized.slice(0, -1));
    }
    
    // Agregar variaciones comunes
    if (normalized.endsWith('es')) {
      variations.push(normalized.slice(0, -2)); // "coxalgia" de "coxalgias"
    }
    
    return [...new Set(variations)]; // Eliminar duplicados
  }

  /**
   * Verifica si cualquier variación de la palabra se encuentra en el texto
   */
  private matchesKeyword(text: string, keyword: string): boolean {
    const normalizedText = this.normalizeText(text);
    const variations = this.getWordVariations(keyword);
    
    return variations.some(variation => normalizedText.includes(variation));
  }

  filterByZone(category: any): void {
    this.selectedCategory = category.label;
    this.searchTerm = '';
    
    if (category.label === 'Todos') {
      this.filteredExercises = [...this.exercises];
    } else {
      this.filteredExercises = this.exercises.filter(ex => {
        const zone = ex.bodyZone || '';
        return category.muscles.some((m: string) => this.matchesKeyword(zone, m));
      });
    }
    this.cd.detectChanges();
  }

  onSearch(): void {
    // Limpia el input de números o símbolos mientras escribes o pegas texto
    this.searchTerm = this.searchTerm.replace(/[^a-zA-Z\s]/g, '');
    
    this.selectedCategory = 'Todos';
    const term = this.normalizeText(this.searchTerm);

    if (!term) {
      this.filteredExercises = [...this.exercises];
    } else {
      const searchTerms = term.split(/\s+/); // Dividir por espacios en blanco
      
      this.filteredExercises = this.exercises.filter(ex => {
        const exerciseName = this.normalizeText(ex.name);
        const exerciseZone = this.normalizeText(ex.bodyZone || '');
        
        // Buscar si TODOS los términos de búsqueda coinciden
        return searchTerms.every(searchTerm => 
          exerciseName.includes(searchTerm) || 
          exerciseZone.includes(searchTerm) ||
          // También buscar variaciones de keywords
          this.categories.some(cat => 
            cat.muscles.some((m: string) => this.matchesKeyword(ex.bodyZone || '', m))
          )
        );
      });
    }
    this.cd.detectChanges();
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

  openPreview(exercise: Exercise): void {
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