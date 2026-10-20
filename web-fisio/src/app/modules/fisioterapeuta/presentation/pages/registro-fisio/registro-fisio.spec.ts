import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistroFisioComponent } from './registro-fisio';

describe('RegistroFisioComponent', () => {
  let component: RegistroFisioComponent;
  let fixture: ComponentFixture<RegistroFisioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistroFisioComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroFisioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});