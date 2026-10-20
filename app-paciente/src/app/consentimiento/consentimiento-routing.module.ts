import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConsentimientoPage } from './consentimiento.page';

const routes: Routes = [
  {
    path: '',
    component: ConsentimientoPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConsentimientoPageRoutingModule {}
