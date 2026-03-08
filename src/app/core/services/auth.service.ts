import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, tap, catchError, map } from 'rxjs/operators';
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
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        this.userSubject.next(user);
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
  }

  /**
   * Login with real API integration
   * POST http://localhost:8080/auth/login
   */
  login(username: string, password: string): Observable<User> {
    return this.http.post<any>(`${this.API_URL}/auth/login`, {
      username,
      password
    }).pipe(
      map(response => {
        // Map API response to User model
        const user: User = {
          id: response.id || response.userId || username,
          customerId: response.customerId || '',
          clientId: response.clientId || '',
          name: response.name || response.fullName || username,
          email: response.email || `${username}@apartment.com`,
          phone: response.phone || '',
          role: response.role || (response.isAdmin ? 'admin' : 'resident'),
          apartment: response.roomNumber || response.apartmentNumber,
          username: username,
          token: response.token || response.accessToken
        };

        this.setUser(user);

        // Store token separately
        if (user.token) {
          localStorage.setItem(this.TOKEN_KEY, user.token);
        }

        return user;
      }),
      catchError(error => {
        console.error('Login API error:', error);

        // Fallback to demo users if API is unavailable
        if (error.status === 0) {
          console.warn('API not available, using demo credentials');
          return this.fallbackLogin(username, password);
        }

        return throwError(() => new Error(error.error?.message || 'Invalid credentials'));
      })
    );
  }

  /**
   * Fallback login for demo purposes when API is unavailable
   */
  private fallbackLogin(username: string, password: string): Observable<User> {
    // Demo users
    if ((username === 'admin' || username === 'admin@apartment.com') && password === 'admin123') {
      const adminUser: User = {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@apartment.com',
        phone: '+1234567890',
        role: 'admin',
        username: 'admin',
        clientId: 'KANHA1',
        customerId: 'customer-1'
      };
      return of(adminUser).pipe(
        delay(500),
        tap(user => this.setUser(user))
      );
    }

    if ((username === 'resident' || username === 'resident@apartment.com') && password === 'resident123') {
      const residentUser: User = {
        id: 'resident-1',
        name: 'John Resident',
        email: 'resident@apartment.com',
        phone: '+1234567891',
        role: 'resident',
        apartment: 'Apt 204',
        username: 'resident',
        clientId: 'KANHA1',
        customerId: '2026KANHC5A835757DAB4D98'
      };
      return of(residentUser).pipe(
        delay(500),
        tap(user => this.setUser(user))
      );
    }

    return throwError(() => new Error('Invalid credentials')).pipe(delay(500));
  }

  /**
   * Sign up with real API integration
   * POST http://localhost:8080/auth/register
   */
  signup(email: string, password: string, confirmPassword: string): Observable<User> {
    if (password !== confirmPassword) {
      return throwError(() => new Error('Passwords do not match'));
    }

    if (password.length < 6) {
      return throwError(() => new Error('Password must be at least 6 characters'));
    }

    return this.http.post<any>(`${this.API_URL}/auth/register`, {
      email,
      password,
      newPassword: password,
      role: 'USER'
    }).pipe(
      map(response => {
        // Map API response to User model
        const user: User = {
          id: response.id || response.userId || email,
          customerId: response.customerId || `CUST-${Date.now()}`,
          clientId: response.clientId || 'KANHA1',
          name: response.name || response.fullName || email.split('@')[0],
          email: response.email || email,
          phone: response.phone || '',
          role: 'resident',
          apartment: response.roomNumber || response.apartmentNumber,
          token: response.token || response.accessToken
        };

        this.setUser(user);

        // Store token separately
        if (user.token) {
          localStorage.setItem(this.TOKEN_KEY, user.token);
        }

        return user;
      }),
      catchError(error => {
        console.error('Signup API error:', error);

        // Fallback to mock signup if API is unavailable
        if (error.status === 0) {
          console.warn('API not available, using mock signup');
          return this.fallbackSignup(email, password);
        }

        return throwError(() => new Error(error.error?.message || 'Registration failed'));
      })
    );
  }

  /**
   * Fallback signup for demo purposes when API is unavailable
   */
  private fallbackSignup(email: string, password: string): Observable<User> {
    const newUser: User = {
      id: `resident-${Date.now()}`,
      name: email.split('@')[0],
      email,
      phone: '',
      role: 'resident',
      apartment: `Apt ${Math.floor(Math.random() * 500) + 100}`,
      clientId: 'KANHA1',
      customerId: '2026KANHC5A835757DAB4D98'
    };

    return of(newUser).pipe(
      delay(500),
      tap(user => this.setUser(user))
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

  isAuthenticated(): boolean {
    return this.userSubject.value !== null;
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