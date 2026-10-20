import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PhysiotherapistProfilePageRoutingModule } from './physiotherapist-profile-routing.module';

import { PhysiotherapistProfilePage } from './physiotherapist-profile.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PhysiotherapistProfilePageRoutingModule
  ],
  declarations: [PhysiotherapistProfilePage]
})
export class PhysiotherapistProfilePageModule {}
