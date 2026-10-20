import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';

import { DetalleRutinaPage } from './detalle-rutina.page';

describe('DetalleRutinaPage', () => {
  let component: DetalleRutinaPage;
  let fixture: ComponentFixture<DetalleRutinaPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetalleRutinaPage],
      imports: [IonicModule.forRoot(), ExploreContainerComponentModule]
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleRutinaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
