import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PhysiotherapistProfilePage } from './physiotherapist-profile.page';

const routes: Routes = [
  {
    path: '',
    component: PhysiotherapistProfilePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PhysiotherapistProfilePageRoutingModule {}
