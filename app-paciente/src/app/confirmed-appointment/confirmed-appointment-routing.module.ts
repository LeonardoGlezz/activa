import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfirmedAppointmentPage } from './confirmed-appointment.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmedAppointmentPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfirmedAppointmentPageRoutingModule {}
