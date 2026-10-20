import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhysiotherapistProfilePage } from './physiotherapist-profile.page';

describe('PhysiotherapistProfilePage', () => {
  let component: PhysiotherapistProfilePage;
  let fixture: ComponentFixture<PhysiotherapistProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PhysiotherapistProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
