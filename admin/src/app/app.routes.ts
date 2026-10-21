import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { FisioterapeutaComponent } from './pages/fisioterapeuta/fisioterapeuta.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PacientesComponent } from './pages/pacientes/pacientes.component';
import { PacienteDetalleComponent } from './pages/paciente-detalle/paciente-detalle.component';
import { ActividadComponent } from './pages/actividad/actividad.component';
import { CuentaComponent } from './pages/cuenta/cuenta.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const appRoutes: Routes = [
  // La página de inicio pública está en la raíz del sitio; aquí se entra directo al login
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'fisioterapeuta', component: FisioterapeutaComponent, canActivate: [authGuard] },
  { path: 'pacientes', component: PacientesComponent, canActivate: [authGuard] },
  { path: 'pacientes/:id', component: PacienteDetalleComponent, canActivate: [authGuard] },
  { path: 'actividad', component: ActividadComponent, canActivate: [authGuard] },
  { path: 'cuenta', component: CuentaComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
