import { Component, OnInit, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { WelcomeComponent } from '../../welcome/welcome.component';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    RouterLink,
    WelcomeComponent
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;
  signupForm: FormGroup;

  isSignup = false;
  loading = false;

  showPassword = false;
  showConfirmPassword = false;

  loginMethod: 'username' | 'email' = 'username';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private renderer: Renderer2
  ) {

    this.loginForm = this.fb.group({
      username: [''],
      clientId: ['KANHA1'],
      email: [''],
      password: ['', Validators.required]
    });

    this.signupForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {

    // detect route mode
    this.isSignup = this.router.url.includes('signup');

    // prevent background scroll
    this.renderer.addClass(document.body, 'overflow-hidden');
  }

  ngOnDestroy(): void {

    // restore scroll
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }

  toggleMode(): void {

    this.isSignup = !this.isSignup;

    this.showPassword = false;
    this.showConfirmPassword = false;

    this.loginForm.reset({
      clientId: 'KANHA1'
    });

    this.signupForm.reset();

    const path = this.isSignup ? '/signup' : '/login';

    this.router.navigate([path], {
      replaceUrl: true
    });
  }

  setLoginMethod(method: 'username' | 'email'): void {
    this.loginMethod = method;
  }

  onLogin(): void {

    if (this.loginForm.invalid) return;

    this.loading = true;

    const {
      username,
      clientId,
      email,
      password
    } = this.loginForm.value;

    let payload: any = {};

    if (this.loginMethod === 'username') {

      if (!username) {
        this.toast.error('Username is required');
        this.loading = false;
        return;
      }

      payload = {
        loginType: 'USER_ID_PASSWORD',
        clientId,
        username,
        userId: username,
        password
      };

    } else {

      if (!clientId || !email) {
        this.toast.error('Client ID and Email are required');
        this.loading = false;
        return;
      }

      payload = {
        loginType: 'CLIENT_EMAIL_PASSWORD',
        clientId,
        email,
        password
      };
    }

    this.authService.login(payload).subscribe({

      next: (user) => {

        this.toast.success(`Welcome back, ${user.name}!`);

        const path =
          user.role === 'admin'
            ? '/admin'
            : '/dashboard';

        this.router.navigate([path]);
      },

      error: () => {

        this.toast.error(
          'Invalid credentials. Please try again.'
        );

        this.loading = false;
      }
    });
  }

  onSignup(): void {

    if (this.signupForm.invalid) return;

    const {
      fullName,
      email,
      password
    } = this.signupForm.value;

    this.loading = true;

    this.authService
      .signup(email, password, password, fullName)
      .subscribe({

        next: (user) => {

          this.toast.success(
            `Account created successfully!`
          );

          this.toggleMode();

          this.loginForm.patchValue({
            username: user.username
          });

          this.loading = false;
        },

        error: (error) => {

          this.toast.error(
            error.message || 'Signup failed'
          );

          this.loading = false;
        }
      });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}