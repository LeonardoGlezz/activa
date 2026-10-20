import { Routes } from '@angular/router';
import { RegistroComponent } from './presentation/pages/registro/registro';
import { RegistroFisioComponent } from './presentation/pages/registro-fisio/registro-fisio';
import { CuentaVerificadaComponent } from './presentation/pages/cuenta-verificada/cuenta-verificada';

export const FISIOTERAPEUTA_ROUTES: Routes = [
  { path: 'registro', component: RegistroComponent, title: 'Crear Cuenta | ACTIVA' },
  { path: 'completar-perfil', component: RegistroFisioComponent, title: 'Casi Listo | ACTIVA' },
  { path: 'cuenta-verificada', component: CuentaVerificadaComponent, title: 'Cuenta Verificada | ACTIVA' },
  { path: '', redirectTo: 'registro', pathMatch: 'full' }
];