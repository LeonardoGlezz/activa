import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExerciseUseCase } from '../../../core/exercises/application/exercise.use-case';
import { Exercise } from '../../../core/exercises/domain/exercise.model';

@Component({
  selector: 'app-agregar-ejercicio',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agregar-ejercicio.html',
  styleUrl: './agregar-ejercicio.scss',
})
export class AgregarEjercicio implements OnInit {
  form!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private exerciseUseCase: ExerciseUseCase
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      bodyZone: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      videoUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const exercise: Exercise = this.form.value;

    this.exerciseUseCase.addExercise(exercise).subscribe({
      next: (result: any) => {
        this.loading = false;
        this.successMessage = `Ejercicio "${result.name}" creado exitosamente`;
        this.form.reset();
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Error al crear el ejercicio';
        console.error('Error:', err);
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
