import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginFisio } from './login-fisio';

describe('LoginFisio', () => {
  let component: LoginFisio;
  let fixture: ComponentFixture<LoginFisio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginFisio],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginFisio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
