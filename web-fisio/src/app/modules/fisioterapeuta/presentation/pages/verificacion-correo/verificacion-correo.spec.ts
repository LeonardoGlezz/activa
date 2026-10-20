import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificacionCorreo } from './verificacion-correo';

describe('VerificacionCorreo', () => {
  let component: VerificacionCorreo;
  let fixture: ComponentFixture<VerificacionCorreo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificacionCorreo],
    }).compileComponents();

    fixture = TestBed.createComponent(VerificacionCorreo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
