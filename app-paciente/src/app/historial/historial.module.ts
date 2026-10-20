import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HistorialPageRoutingModule } from './historial-routing.module';
import { HistorialPage } from './historial.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    HistorialPageRoutingModule
  ],
  declarations: [HistorialPage]
})
export class HistorialPageModule {}
