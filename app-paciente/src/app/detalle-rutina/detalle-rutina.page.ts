import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouteAnimationService } from '../core/services/route-animation.service';
import { RoutineApiService, RoutineWithExercises, RoutineExercise } from '../core/infrastructure/api/routine-api.service';
import { Storage } from '@ionic/storage-angular';
import { getExerciseVideoUrl, getExerciseYouTubeEmbedUrl } from '../core/helpers/exercise-media.helper';

@Component({
  selector: 'app-detalle-rutina',
  templateUrl: 'detalle-rutina.page.html',
  styleUrls: ['detalle-rutina.page.scss'],
  standalone: false,
})
export class DetalleRutinaPage implements OnInit {
  routines: Array<{ id: number; name: string; startDate: string; endDate: string; physiotherapistId: number }> = [];
  selectedRoutine: RoutineWithExercises | null = null;
  exercises: RoutineExercise[] = [];
  loading = true;
  selectedExercise: RoutineExercise | null = null;
  isModalOpen = false;
  constructor(
    private router: Router,
    private routeAnimationService: RouteAnimationService,
    private routineApi: RoutineApiService,
    private storage: Storage
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const patientId = (await this.storage.get('currentPatientId')) ?? 1;

    this.routineApi.getRoutines(patientId).subscribe(async (routines) => {
      this.routines = routines.map((r) => ({
        id: r.id,
        name: r.name,
        startDate: this.formatDate(r.startDate),
        endDate: this.formatDate(r.endDate),
        physiotherapistId: r.physiotherapistId,
      }));

      if (routines.length > 0) {
        const first = routines[0];
        this.routineApi.getRoutineById(first.id).subscribe((full) => {
          this.selectedRoutine = full ?? null;
          this.exercises = full?.exercises ?? [];
          this.loading = false;
        });
      } else {
        this.loading = false;
      }
    });
  }

  selectRoutine(r: { id: number }) {
    this.routineApi.getRoutineById(r.id).subscribe((full) => {
      this.selectedRoutine = full ?? null;
      this.exercises = full?.exercises ?? [];
    });
  }

  formatDate(val: string | Date): string {
    if (!val) return '—';
    const d = typeof val === 'string' ? new Date(val) : val;
    return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  openModal(exercise: RoutineExercise) {
    this.selectedExercise = exercise;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedExercise = null;
  }

  async startRoutine() {
    if (!this.selectedRoutine) return;
    await this.storage.set('currentRoutineId', this.selectedRoutine.id);
    this.routeAnimationService.navigateWithAnimation(['/tabs/detail'], 'slide');
  }

  getExerciseImage(ex: RoutineExercise): string {
    const url = ex?.videoUrl?.trim();
    // No usar URLs de Cloudinary demo (404) ni videos .mp4 como imagen
    if (url && !url.includes('cloudinary.com/demo') && !url.includes('cloudinary.com/video1') && !url.endsWith('.mp4')) {
      return url;
    }
    return this.getExerciseDemoImage(ex);
  }

  /** Imagen fija del ejercicio para el modal (nunca muestra el logo ACTIVA) */
  getExerciseDemoImage(ex: RoutineExercise): string {
    const img = (ex as any).imageUrl;
    if (img) return img;
    const name = (ex.name || '').toLowerCase();
    if (name.includes('elevación') && name.includes('pierna')) return 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600';
    if (name.includes('estiramiento') && name.includes('hombro')) return 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600';
    return 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600';
  }

  getExerciseVideoUrl = getExerciseVideoUrl;
  getExerciseYouTubeEmbedUrl = getExerciseYouTubeEmbedUrl;

  ionViewWillLeave() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
