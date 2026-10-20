import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Tab6Page } from './report.page';

const routes: Routes = [
  {
    path: '',
    component: Tab6Page
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Tab6PageRoutingModule {}
