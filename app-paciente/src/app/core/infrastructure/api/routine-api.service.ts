import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Routine {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  physiotherapistId: number;
  patientId: number;
}

export interface RoutineExercise {
  id: number;
  name: string;
  bodyZone: string;
  description: string;
  videoUrl: string;
  series?: number;
  reps?: number;
  duration?: string;
  consejo?: string;
}

export interface RoutineWithExercises extends Routine {
  exercises: RoutineExercise[];
}

// ─── Mapper interno ──────────────────────────────────────────────────────────
// El back devuelve snake_case directo de Sequelize.toJSON().
// Todos los campos se normalizan aquí para que el resto del front
// solo use camelCase y nunca dependa de los nombres de columna de BD.

function mapExercise(e: any): RoutineExercise {
  const rel = e.routine_exercise ?? e.routineExercise ?? e.RoutineExercise ?? {};
  return {
    id:          e.id_exercise ?? e.id ?? 0,
    name:        e.name        ?? '',
    bodyZone:    e.body_zone   ?? e.bodyZone   ?? '',
    description: e.description ?? '',
    videoUrl:    e.video_url   ?? e.videoUrl   ?? '',
    series:      rel.sets         ?? e.sets         ?? 3,
    reps:        rel.repetitions  ?? e.repetitions  ?? 10,
    duration:    rel.notes        ?? e.notes        ?? '',
    consejo:     rel.notes        ?? e.consejo       ?? '',
  };
}

function mapRoutine(r: any): Routine {
  return {
    id:                 r.id_routine        ?? r.id                 ?? 0,
    name:               r.name              ?? '',
    startDate:          r.start_date        ?? r.startDate          ?? '',
    endDate:            r.end_date          ?? r.endDate            ?? '',
    physiotherapistId:  r.id_physio         ?? r.physiotherapistId  ?? 0,
    patientId:          r.id_patient        ?? r.patientId          ?? 0,
  };
}

function mapRoutineWithExercises(r: any): RoutineWithExercises {
  return {
    ...mapRoutine(r),
    exercises: (r.exercises ?? []).map(mapExercise),
  };
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RoutineApiService {
  private baseUrl = `${environment.apiUrl}/routines`;

  constructor(private http: HttpClient) {}

  /** GET /routines/:id  →  detalle completo con ejercicios */
  getRoutineById(id: number): Observable<RoutineWithExercises | null> {
    return this.http
      .get<{ success: boolean; data?: any }>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => res.data ? mapRoutineWithExercises(res.data) : null),
        catchError(() => of(null))
      );
  }

  /**
   * GET /routines/patient/:patientId
   *
   * ⚠️  El back devuelve UN OBJETO (la rutina más reciente), no un array.
   *    Se normaliza a array para que el componente siempre itere sin romper.
   */
  getRoutines(patientId: number): Observable<Routine[]> {
    return this.http
      .get<{ success: boolean; data?: any }>(`${this.baseUrl}/patient/${patientId}`)
      .pipe(
        map((res) => {
          const raw = res.data;
          if (!raw) return [];
          // Si el back algún día devuelve array, también funciona
          const rows: any[] = Array.isArray(raw) ? raw : [raw];
          return rows.map(mapRoutine);
        }),
        catchError(() => of([]))
      );
  }
}
