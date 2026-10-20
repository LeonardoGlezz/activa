import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmedAppointmentPage } from './confirmed-appointment.page';

describe('ConfirmedAppointmentPage', () => {
  let component: ConfirmedAppointmentPage;
  let fixture: ComponentFixture<ConfirmedAppointmentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmedAppointmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
