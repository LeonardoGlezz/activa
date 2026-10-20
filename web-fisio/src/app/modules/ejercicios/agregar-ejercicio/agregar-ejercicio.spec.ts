import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarEjercicio } from './agregar-ejercicio';

describe('AgregarEjercicio', () => {
  let component: AgregarEjercicio;
  let fixture: ComponentFixture<AgregarEjercicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarEjercicio],
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarEjercicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
