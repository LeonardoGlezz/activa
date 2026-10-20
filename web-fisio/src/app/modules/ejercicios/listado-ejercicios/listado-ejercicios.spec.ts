import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListadoEjercicios } from './listado-ejercicios';

describe('ListadoEjercicios', () => {
  let component: ListadoEjercicios;
  let fixture: ComponentFixture<ListadoEjercicios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoEjercicios],
    }).compileComponents(); 


    fixture = TestBed.createComponent(ListadoEjercicios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
