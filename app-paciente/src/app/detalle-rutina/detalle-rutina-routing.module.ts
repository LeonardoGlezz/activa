import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DetalleRutinaPage } from './detalle-rutina.page';

const routes: Routes = [
  {
    path: '',
    component: DetalleRutinaPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class detalleRutinaPageRoutingModule {}
