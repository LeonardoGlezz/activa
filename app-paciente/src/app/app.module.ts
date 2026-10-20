import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Interceptor
import { AuthInterceptor } from './core/interceptors/auth.interceptor';

// Repositories
import { PatientRepository } from '../core/domain/repositories/patient.repository';
import { ExerciseRepository } from '../core/domain/repositories/exercise.repository';
import { RoutineRepository } from '../core/domain/repositories/routine.repository';
import { TrackingRepository } from '../core/domain/repositories/tracking.repository';
import { UserRepository } from '../core/domain/repositories/user.repository';

// Services
import { PatientApiService } from '../core/domain/infrastructure/driven-adapters/patient-api.service';
import { ExerciseApiService } from '../core/domain/infrastructure/driven-adapters/exercise-api.service';
import { RoutineApiService } from '../core/domain/infrastructure/driven-adapters/routine-api.service';
import { TrackingApiService } from '../core/domain/infrastructure/driven-adapters/tracking-api.service';
import { UserApiService } from '../core/domain/infrastructure/driven-adapters/user-api.service';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    IonicStorageModule.forRoot()
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: PatientRepository, useClass: PatientApiService },
    { provide: ExerciseRepository, useClass: ExerciseApiService },
    { provide: RoutineRepository, useClass: RoutineApiService },
    { provide: TrackingRepository, useClass: TrackingApiService },
    { provide: UserRepository, useClass: UserApiService }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
