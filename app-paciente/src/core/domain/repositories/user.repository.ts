import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})

export abstract class UserRepository {
  abstract getUserById(id: number): Observable<User>;
}
