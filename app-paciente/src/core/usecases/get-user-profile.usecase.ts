import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../domain/models/user.model';
import { UserRepository } from '../domain/repositories/user.repository';

@Injectable({ providedIn: 'root' })
export class GetUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  execute(id: number): Observable<User> {
    return this.userRepository.getUserById(id);
  }
}
