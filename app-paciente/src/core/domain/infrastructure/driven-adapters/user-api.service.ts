import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../../../domain/models/user.model';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserApiService implements UserRepository {
  private readonly baseUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUserById(id: number): Observable<User> {
    return this.http.get<any>(`${this.baseUrl}/${id}`).pipe(
      map(apiUser => ({
        id: apiUser.id as number,
        fullName: apiUser.name as string,
        email: apiUser.email as string,
        nextAppointment: undefined,
        progress: 0
      })),
      catchError(err => throwError(() => new Error(err.message ?? 'Error fetching user')))
    );
  }
}
