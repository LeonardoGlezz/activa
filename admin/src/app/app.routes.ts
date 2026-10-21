import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { FisioterapeutaComponent } from './pages/fisioterapeuta/fisioterapeuta.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'fisioterapeuta',
    component: FisioterapeutaComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
