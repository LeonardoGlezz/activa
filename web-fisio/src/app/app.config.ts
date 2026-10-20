import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { PatientRepository } from './core/patient/domain/patient.repository';
import { PatientHttpRepository } from './core/patient/infraestructure/patient-http.repository';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ExerciseRepository } from './core/exercises/domain/exercise.repository';
import { ExerciseHttpRepository } from './core/exercises/infraestructure/exercise-http.repository';
import { AuthRepository } from './core/auth/domain/auth.repository';
import { AuthHttpRepository } from './core/auth/infrastructure/auth-http.repository';
import { jwtInterceptor } from './core/auth/application/jwt.interceptor';
import { limitInterceptor } from './core/interceptors/limit.interceptor';
import { ConfirmationService, MessageService } from 'primeng/api';
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, limitInterceptor])),
    provideAnimationsAsync(),
    { provide: AuthRepository, useClass: AuthHttpRepository },
    { provide: PatientRepository, useClass: PatientHttpRepository },
    { provide: ExerciseRepository, useClass: ExerciseHttpRepository },
    MessageService,
    ConfirmationService
  ]
};
