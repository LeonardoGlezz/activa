import { Routes } from '@angular/router';
import { Menu } from './components/menu/menu';
import { BancoEjerciciosComponent } from './components/banco-ejercicios/banco-ejercicios';
import { PatientListComponent } from './modules/fisioterapeuta/presentation/pages/patient-list/patient-list';
import { PatientCreateComponent } from './modules/fisioterapeuta/presentation/pages/patient-create/patient-create';
import { RegistroFisioComponent } from './modules/fisioterapeuta/presentation/pages/registro-fisio/registro-fisio'; 
import { AppointmentsComponent } from './modules/fisioterapeuta/presentation/pages/appointments/appointments';
import { AppointmentCreateComponent } from './modules/fisioterapeuta/presentation/pages/appointment-create/appointment-create';
import { AppointmentDetailComponent } from './modules/fisioterapeuta/presentation/pages/appointment-detail/appointment-detail';
import { AppointmentListComponent } from './modules/fisioterapeuta/presentation/pages/appointment-list/appointment-list';
import { PatientViewComponent } from './modules/fisioterapeuta/presentation/pages/patient-view/patient-view';
import { RoutineLibraryComponent } from './modules/fisioterapeuta/presentation/pages/routine-library/routine-library';
import { LoginFisioComponent } from './modules/fisioterapeuta/presentation/pages/login-fisio/login-fisio'; 
import { VerifyDataComponent } from './modules/fisioterapeuta/presentation/pages/verify-data/verify-data'; 
import { HomeComponent } from './modules/fisioterapeuta/presentation/pages/home/home';
import { PerfilComponent } from './modules/fisioterapeuta/presentation/pages/profile/profile';
import { SubscriptionComponent } from './modules/fisioterapeuta/presentation/pages/subscription/subscription';

// IMPORTAMOS EL CADENERO
import { authGuard } from './core/auth/application/auth.guard';



export const routes: Routes = [
  
  // =========================================================
  // 🟢 RUTAS PÚBLICAS (Cualquiera puede entrar)
  // =========================================================
  { path: 'login', component: LoginFisioComponent },
  { path: 'registro-fisio', component: RegistroFisioComponent },

  // =========================================================
  // 🔴 RUTAS PRIVADAS (Solo entran con Token JWT)
  // =========================================================
  {
    path: 'fisioterapeuta',
    loadChildren: () => import('./modules/fisioterapeuta/fisioterapeuta.routes').then(m => m.FISIOTERAPEUTA_ROUTES),
    canActivate: [authGuard] // Protegemos el módulo lazy load
  },
  { 
    path: 'verificar-datos', 
    component: VerifyDataComponent,
    canActivate: [authGuard] // Protegido: Solo fisios registrados suben documentos
  },
  { 
    path: 'Ejercicios', 
    component: BancoEjerciciosComponent,
    canActivate: [authGuard] // Protegido
  },
  
  // DASHBOARD PRINCIPAL Y SUS SUB-PANTALLAS
  { 
    path: 'dashboard', 
    component: Menu, 
    canActivate: [authGuard], // 🛡️ MAGIA: Al proteger el padre, proteges a todos los hijos automáticamente
    children: [
      { path: 'inicio', component: HomeComponent },
      { path: 'ejercicios', component: BancoEjerciciosComponent },
      { path: 'pacientes', component: PatientListComponent },
      { path: 'nuevo-paciente', component: PatientCreateComponent },
      { path: 'perfil', component: PerfilComponent },
      { path: 'subscription', component: SubscriptionComponent },
      
      // Módulo de Agenda
      { path: 'citas', component: AppointmentsComponent },
      { path: 'rutinas', component: RoutineLibraryComponent },
      { path: 'nueva-cita', component: AppointmentCreateComponent },
      { path: 'detalle-cita', component: AppointmentDetailComponent },
      { path: 'historial-citas', component: AppointmentListComponent },
      { path: 'ver-paciente/:id', component: PatientViewComponent },
    ]
  },

  // =========================================================
  // ⚙️ REDIRECCIONES DE SEGURIDAD
  // =========================================================
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];