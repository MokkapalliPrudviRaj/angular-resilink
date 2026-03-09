import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'maintenance_user';
  private readonly TOKEN_KEY = 'maintenance_token';
  private readonly API_URL = environment.apiUrl;

  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem(this.STORAGE_KEY);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.userSubject.next(user);

        if (user.token && !localStorage.getItem(this.TOKEN_KEY)) {
          localStorage.setItem(this.TOKEN_KEY, user.token);
        }
      } catch (e) {
        console.error('Failed to parse stored user', e);
        this.logout();
      }
    }
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, {
      username,
      password
    }).pipe(
      tap(resp => console.log('[AuthDiagnostic] Login raw response:', resp)),
      map(response => {
        // More robust token extraction from various common API response patterns
        const token = response.token ||
          response.accessToken ||
          response.data?.token ||
          response.data?.accessToken ||
          response.jwt ||
          response.access_token;

        console.log('[AuthDiagnostic] Extracted token present:', !!token);

        const user: User = {
          id: response.id || response.userId || response.data?.id || username,
          customerId: response.customerId || response.customer_id || response.data?.customerId || response.id || '',
          clientId: response.clientId || response.client_id || response.data?.clientId || 'KANHA1',
          name: response.name || response.fullName || response.data?.name || username,
          email: response.email || response.data?.email || `${username}@apartment.com`,
          phone: response.phone || response.data?.phone || '',
          role: response.role || (response.isAdmin ? 'admin' : 'resident'),
          apartment: response.roomNumber || response.apartment || response.apartmentNumber || response.data?.roomNumber,
          username: username,
          token: token
        };

        this.setUser(user);

        if (token) {
          localStorage.setItem(this.TOKEN_KEY, token);
        }

        return user;
      }),
      catchError(error => {
        console.error('Login API error:', error);
        return throwError(() => new Error(error.error?.message || 'Invalid credentials'));
      })
    );
  }

  signup(email: string, password: string, confirmPassword: string): Observable<User> {
    return this.http.post(`${this.API_URL}/auth/register`, {
      email,
      password,
      newPassword: password,
      role: 'USER'
    }, { responseType: 'text', observe: 'response' }).pipe(
      map(response => {
        const customerId = response.body || '';
        const user: User = {
          id: customerId,
          username: email,
          customerId: customerId,
          clientId: 'KANHA1',
          name: email.split('@')[0],
          email: email,
          phone: '',
          role: 'resident'
        };
        return user;
      }),
      catchError(error => {
        console.error('Signup API error:', error);
        return throwError(() => new Error('Registration failed'));
      })
    );
  }

  logout(): void {
    this.userSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  private setUser(user: User): void {
    this.userSubject.next(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }
}