import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentaVerificada } from './cuenta-verificada';

describe('CuentaVerificada', () => {
  let component: CuentaVerificada;
  let fixture: ComponentFixture<CuentaVerificada>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentaVerificada],
    }).compileComponents();

    fixture = TestBed.createComponent(CuentaVerificada);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
