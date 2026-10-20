import { TestBed } from '@angular/core/testing';

import { ApiAdapter } from './api-adapter';

describe('ApiAdapter', () => {
  let service: ApiAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiAdapter);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
