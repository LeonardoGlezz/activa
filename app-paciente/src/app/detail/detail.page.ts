import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Storage } from '@ionic/storage-angular';
import { RoutineApiService, RoutineExercise } from '../core/infrastructure/api/routine-api.service';
import { RouteAnimationService } from '../core/services/route-animation.service';
import { getExerciseVideoUrl, getExerciseYouTubeEmbedUrl } from '../core/helpers/exercise-media.helper';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
  standalone: false,
  animations: [
    trigger('exerciseTransition', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('220ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class DetailPage implements OnInit {
  currentExercise: RoutineExercise | null = null;
  exercises: RoutineExercise[] = [];
  exerciseIndex = 0;
  routineId: number | null = null;
  loading = true;

  constructor(
    private storage: Storage,
    private routineApi: RoutineApiService,
    private routeAnimationService: RouteAnimationService
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const routineId = await this.storage.get('currentRoutineId');
    if (!routineId) {
      this.loading = false;
      return;
    }
    this.routineId = routineId;
    this.routineApi.getRoutineById(routineId).subscribe((routine) => {
      this.exercises = routine?.exercises ?? [];
      if (this.exercises.length > 0) {
        this.currentExercise = this.exercises[0];
        this.exerciseIndex = 0;
      }
      this.loading = false;
    });
  }

  goToReport() {
    this.routeAnimationService.navigateWithAnimation(['/tabs/report'], 'slide');
  }

  onExerciseDone() {
    if (this.isLastExercise()) {
      this.goToReport();
    } else {
      this.nextExercise();
    }
  }

  isLastExercise(): boolean {
    return this.exercises.length === 0 || this.exerciseIndex >= this.exercises.length - 1;
  }

  hasSeriesReps(ex: RoutineExercise | null): boolean {
    return !!(ex && ((ex.series != null && ex.series > 0) || (ex.reps != null && ex.reps > 0)));
  }

  nextExercise() {
    if (this.exerciseIndex < this.exercises.length - 1) {
      this.exerciseIndex++;
      this.currentExercise = this.exercises[this.exerciseIndex];
    }
  }

  prevExercise() {
    if (this.exerciseIndex > 0) {
      this.exerciseIndex--;
      this.currentExercise = this.exercises[this.exerciseIndex];
    }
  }

  getExerciseVideoUrl = getExerciseVideoUrl;
  getExerciseYouTubeEmbedUrl = getExerciseYouTubeEmbedUrl;

  ionViewWillLeave() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }
}
