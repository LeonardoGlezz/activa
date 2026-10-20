import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DetailPageRoutingModule } from './detail-routing.module';
import { DetailPage } from './detail.page';
import { SafeUrlPipe } from '../core/pipes/safe-url.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule,
    DetailPageRoutingModule,
    SafeUrlPipe
  ],
  declarations: [DetailPage]
})
export class DetailPageModule {}