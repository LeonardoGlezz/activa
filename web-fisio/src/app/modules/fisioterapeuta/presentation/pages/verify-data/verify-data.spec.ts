import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyData } from './verify-data';

describe('VerifyData', () => {
  let component: VerifyData;
  let fixture: ComponentFixture<VerifyData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyData],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyData);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
