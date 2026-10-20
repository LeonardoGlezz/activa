import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExerciseUseCase } from '../../../core/exercises/application/exercise.use-case';
import { Exercise } from '../../../core/exercises/domain/exercise.model';
import { ExerciseMediaKind, getEmbedUrl, getMediaKind, resolveMediaUrl } from '../../../core/exercises/domain/exercise-media';

/** Enlace http(s) o archivo ya subido al backend */
const MEDIA_URL_PATTERN = /^(https?:\/\/\S+|\/uploads\/exercise-media\/[\w.-]+)$/i;
const MAX_UPLOAD_MB = 50;

@Component({
  selector: 'app-agregar-ejercicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './agregar-ejercicio.html',
  styleUrl: './agregar-ejercicio.scss',
})
export class AgregarEjercicio implements OnInit {
  form!: FormGroup;
  loading = false;
  uploading = false;
  successMessage = '';
  errorMessage = '';
  /** Si viene en la ruta, el formulario edita ese ejercicio */
  exerciseId: string | null = null;
  readonly maxUploadMb = MAX_UPLOAD_MB;

  constructor(
    private fb: FormBuilder,
    private exerciseUseCase: ExerciseUseCase,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.exerciseId = this.route.snapshot.paramMap.get('id');
    if (this.exerciseId) this.loadExercise(this.exerciseId);
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      bodyZone: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      videoUrl: ['', [Validators.pattern(MEDIA_URL_PATTERN)]],
    });
    this.videoUrl?.valueChanges.subscribe(() => this.updatePreview());
  }

  loadExercise(id: string): void {
    this.loading = true;
    this.exerciseUseCase.getExercise(id).subscribe({
      next: (resp: any) => {
        const e = resp?.data ?? resp;
        this.form.patchValue({
          name: e.name ?? '',
          bodyZone: e.bodyZone ?? e.body_zone ?? '',
          description: e.description ?? '',
          videoUrl: e.videoUrl ?? e.video_url ?? '',
        });
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar el ejercicio.';
        this.cd.detectChanges();
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      this.errorMessage = `El archivo pesa más de ${MAX_UPLOAD_MB} MB. Recorta el video o grábalo en menor calidad.`;
      return;
    }

    this.uploading = true;
    this.errorMessage = '';
    this.exerciseUseCase.uploadMedia(file).subscribe({
      next: (resp) => {
        this.uploading = false;
        this.form.patchValue({ videoUrl: resp.url });
        this.videoUrl?.markAsTouched();
        this.cd.detectChanges();
      },
      error: (err: any) => {
        this.uploading = false;
        this.errorMessage = err?.error?.message || 'No se pudo subir el archivo.';
        this.cd.detectChanges();
      },
    });
  }

  clearMedia(): void {
    this.form.patchValue({ videoUrl: '' });
  }

  // ---------- Vista previa ----------
  // Se calcula solo cuando cambia el enlace: un SafeResourceUrl nuevo en cada
  // detección de cambios haría que el iframe se recargue sin parar.
  mediaUrl = '';
  mediaKind: ExerciseMediaKind = 'none';
  embedUrl: SafeResourceUrl | null = null;

  private updatePreview(): void {
    const control = this.videoUrl;
    this.mediaUrl = control?.valid ? resolveMediaUrl(control.value) : '';
    this.mediaKind = getMediaKind(this.mediaUrl);
    const embed = getEmbedUrl(this.mediaUrl);
    this.embedUrl = embed ? this.sanitizer.bypassSecurityTrustResourceUrl(embed) : null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const exercise: Exercise = { ...this.form.value, videoUrl: (this.form.value.videoUrl || '').trim() || null };
    const request = this.exerciseId
      ? this.exerciseUseCase.updateExercise(this.exerciseId, exercise)
      : this.exerciseUseCase.addExercise(exercise);

    request.subscribe({
      next: () => {
        this.loading = false;
        if (this.exerciseId) {
          this.router.navigate(['/dashboard/ejercicios']);
          return;
        }
        this.successMessage = `Ejercicio "${exercise.name}" creado exitosamente`;
        this.form.reset({ name: '', bodyZone: '', description: '', videoUrl: '' });
        this.cd.detectChanges();
        setTimeout(() => {
          this.successMessage = '';
          this.cd.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Error al guardar el ejercicio';
        console.error('Error:', err);
        this.cd.detectChanges();
      },
    });
  }

  get name() {
    return this.form.get('name');
  }

  get bodyZone() {
    return this.form.get('bodyZone');
  }

  get description() {
    return this.form.get('description');
  }

  get videoUrl() {
    return this.form.get('videoUrl');
  }
}
