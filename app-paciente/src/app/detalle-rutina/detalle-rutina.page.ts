import { EXERCISE_PLACEHOLDER } from '../core/placeholder';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouteAnimationService } from '../core/services/route-animation.service';
import { RoutineApiService, RoutineWithExercises, RoutineExercise } from '../core/infrastructure/api/routine-api.service';
import { Storage } from '@ionic/storage-angular';
import { getExerciseDirectVideoUrl, getExerciseImageUrl, getExerciseVideoUrl, getExerciseYouTubeEmbedUrl } from '../core/helpers/exercise-media.helper';

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
    const patientId = await this.storage.get('currentPatientId');
    if (!patientId) {
      this.loading = false;
      return;
    }

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

  /** Imagen del ejercicio o un dibujo neutro si no tiene */
  getExerciseDemoImage(ex: RoutineExercise): string {
    return (ex as any).imageUrl || EXERCISE_PLACEHOLDER;
  }

  getExerciseVideoUrl = getExerciseVideoUrl;
  getExerciseYouTubeEmbedUrl = getExerciseYouTubeEmbedUrl;
  getExerciseDirectVideoUrl = getExerciseDirectVideoUrl;
  getExerciseImageUrl = getExerciseImageUrl;

  ionViewWillLeave() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
