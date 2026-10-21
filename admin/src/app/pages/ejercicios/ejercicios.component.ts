import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, BaseExercise, BaseExerciseForm } from '../../services/admin.service';

const EMPTY_FORM: BaseExerciseForm = { name: '', bodyZone: '', description: '', videoUrl: '' };

/** Banco base de ejercicios: lo ven todos los fisios; solo el admin lo cambia */
@Component({
  selector: 'app-ejercicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ejercicios.component.html',
})
export class EjerciciosComponent implements OnInit {
  exercises: BaseExercise[] = [];
  zones: string[] = [];
  search = '';
  zone = '';
  loading = true;
  error = '';
  notice = '';

  editingId: number | null = null;
  showForm = false;
  form: BaseExerciseForm = { ...EMPTY_FORM };
  saving = false;
  formError = '';

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.admin.listBaseExercises().subscribe({
      next: (resp) => {
        this.exercises = resp.rows;
        this.zones = resp.zones;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      },
    });
  }

  get filtered(): BaseExercise[] {
    const words = normalize(this.search).split(/\s+/).filter(Boolean);
    return this.exercises.filter((e) => {
      if (this.zone && e.body_zone !== this.zone) return false;
      const text = normalize(`${e.name} ${e.body_zone} ${e.description}`);
      return words.every((w) => text.includes(w));
    });
  }

  newExercise(): void {
    this.editingId = null;
    this.form = { ...EMPTY_FORM, bodyZone: this.zone };
    this.formError = '';
    this.showForm = true;
  }

  edit(e: BaseExercise): void {
    this.editingId = e.id_exercise;
    this.form = { name: e.name, bodyZone: e.body_zone, description: e.description, videoUrl: e.video_url ?? '' };
    this.formError = '';
    this.showForm = true;
  }

  save(): void {
    this.formError = '';
    if (this.form.name.trim().length < 3) return void (this.formError = 'El nombre debe tener al menos 3 letras.');
    if (!this.form.bodyZone) return void (this.formError = 'Elige la zona del cuerpo.');
    if (this.form.description.trim().length < 10) return void (this.formError = 'Escribe una descripción más completa.');
    const data = { ...this.form, videoUrl: (this.form.videoUrl || '').trim() || null };
    this.saving = true;
    const req = this.editingId
      ? this.admin.updateBaseExercise(this.editingId, data)
      : this.admin.createBaseExercise(data);
    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.notice = this.editingId ? 'Ejercicio actualizado.' : 'Ejercicio agregado al banco base.';
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.message;
      },
    });
  }

  remove(e: BaseExercise): void {
    if (!confirm(`¿Borrar "${e.name}" del banco base? Los fisios ya no lo verán.`)) return;
    this.admin.deleteBaseExercise(e.id_exercise).subscribe({
      next: () => {
        this.notice = `"${e.name}" se borró del banco base.`;
        this.exercises = this.exercises.filter((x) => x.id_exercise !== e.id_exercise);
      },
      error: (err) => (this.notice = '❌ ' + err.message),
    });
  }
}

function normalize(text: string): string {
  return (text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
