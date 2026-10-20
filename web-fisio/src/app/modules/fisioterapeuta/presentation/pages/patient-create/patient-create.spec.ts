import { ComponentFixture, TestBed } from '@angular/core/testing';

// 1. CORRECCIÓN: Agregamos "Component" al nombre
import { PatientCreateComponent } from './patient-create'; 

describe('PatientCreateComponent', () => {
  let component: PatientCreateComponent;
  let fixture: ComponentFixture<PatientCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});