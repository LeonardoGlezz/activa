import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { patientSessionGuard } from './core/guards/patient-session.guard';
import { patientConsentGuard } from './core/guards/patient-consent.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  },    
  {
    path: 'welcome',
    loadChildren: () => import('./welcome/welcome.module').then( m => m.WelcomePageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'consentimiento',
    canActivate: [patientSessionGuard],
    loadChildren: () => import('./consentimiento/consentimiento.module').then( m => m.ConsentimientoPageModule)
  },
  {
    path: 'tabs',
    canActivate: [patientSessionGuard, patientConsentGuard],
    loadChildren: () => import('./tabs/tabs.module').then( m => m.TabsPageModule)
  },
  {
    path: 'physiotherapist-profile',
    canActivate: [patientSessionGuard, patientConsentGuard],
    loadChildren: () => import('./physiotherapist-profile/physiotherapist-profile.module').then( m => m.PhysiotherapistProfilePageModule)
  },

 
  

]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, useHash: true })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}