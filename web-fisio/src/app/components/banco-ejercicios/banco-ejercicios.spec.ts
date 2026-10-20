import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BancoEjerciciosComponent } from './banco-ejercicios';

describe('BancoEjerciciosComponent', () => {
  let component: BancoEjerciciosComponent;
  let fixture: ComponentFixture<BancoEjerciciosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BancoEjerciciosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BancoEjerciciosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
