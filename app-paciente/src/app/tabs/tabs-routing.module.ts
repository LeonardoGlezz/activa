import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '', // Al entrar a /tabs...
    component: TabsPage,
    children: [
      {
        path: 'your-progress',
        loadChildren: () => import('../your-progress/your-progress.module').then(m => m.Tab4PageModule)
      },
      {
        path: 'confirmed-appointment',
        loadChildren: () => import('../confirmed-appointment/confirmed-appointment.module').then(m => m.ConfirmedAppointmentPageModule)
      },
      {
        path: 'detalle-rutina',
        loadChildren: () => import('../detalle-rutina/detalle-rutina.module').then(m => m.DetalleRutinaPageModule)
      },
      {
        path: 'detail',
        loadChildren: () => import('../detail/detail.module').then( m => m.DetailPageModule)
      },
      {
        path: 'report',
        loadChildren: () => import('../report/report.module').then( m => m.Tab6PageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../profile/profile.module').then( m => m.ProfilePageModule)
      },
      {
        path: 'historial',
        loadChildren: () => import('../historial/historial.module').then(m => m.HistorialPageModule)
      },
      {
        path: 'notifications',
        loadChildren: () => import('../notifications/notifications.module').then(m => m.NotificationsPageModule)
      },
      {
        path: 'documents',
        loadChildren: () => import('../documents/documents.module').then(m => m.DocumentsPageModule)
      },
      {
        path: 'physiotherapist-profile',
        loadChildren: () => import('../physiotherapist-profile/physiotherapist-profile.module').then(m => m.PhysiotherapistProfilePageModule)
      },
      {
        path: '',
        redirectTo: 'your-progress', // Si entras a /tabs, te manda directo a your-progress 
        pathMatch: 'full'
      }
    ]
    
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
