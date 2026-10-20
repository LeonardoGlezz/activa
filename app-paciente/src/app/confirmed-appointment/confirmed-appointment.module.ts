import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmedAppointmentPage } from './confirmed-appointment.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { ConfirmedAppointmentPageRoutingModule } from './confirmed-appointment-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    ConfirmedAppointmentPageRoutingModule
  ],
  declarations: [ConfirmedAppointmentPage]
})
export class ConfirmedAppointmentPageModule {}
