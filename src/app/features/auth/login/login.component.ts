import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ButtonComponent } from '../../../shared/components/button/button.component';
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
    // ButtonComponent
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
    private route: ActivatedRoute,
    private toast: ToastService
  ) {
    this.loginForm = this.fb.group({
      username: [''],
      clientId: ['KANHA1'],
      email: [''],
      password: ['', Validators.required]
    });

    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Determine mode based on URL
    const url = this.router.url;
    this.isSignup = url.includes('signup');
  }

  toggleMode(): void {
    this.isSignup = !this.isSignup;
    this.showPassword = false;
    this.showConfirmPassword = false;

    // Reset forms when switching
    this.loginForm.reset();
    this.signupForm.reset();

    // Update URL without reloading component
    const path = this.isSignup ? '/signup' : '/login';
    this.router.navigate([path], { replaceUrl: true });
  }

  setLoginMethod(method: 'username' | 'email') {
    this.loginMethod = method;
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { username, clientId, email, password } = this.loginForm.value;

    let payload: any = {};
    if (this.loginMethod === 'username') {
      if (!username) { this.toast.error('Username is required'); this.loading = false; return; }
      payload = { loginType: 'USER_ID_PASSWORD', clientId, username, userId: username, password };
    } else {
      if (!clientId || !email) { this.toast.error('Client ID and Email are required'); this.loading = false; return; }
      payload = { loginType: 'CLIENT_EMAIL_PASSWORD', clientId, email, password };
    }

    this.authService.login(payload).subscribe({
      next: (user) => {
        this.toast.success(`Welcome back, ${user.name}!`);
        const path = user.role === 'admin' ? '/admin' : '/dashboard';
        this.router.navigate([path]);
      },
      error: (error) => {
        this.toast.error('Invalid credentials. Please try again.');
        this.loading = false;
      }
    });
  }

  onSignup(): void {
    if (this.signupForm.invalid) return;

    const { email, password, confirmPassword } = this.signupForm.value;

    if (password !== confirmPassword) {
      this.toast.error('Passwords do not match');
      return;
    }

    this.loading = true;

    this.authService.signup(email, password, confirmPassword).subscribe({
      next: (user) => {
        this.toast.success(`Account created successfully! Please login with username: ${user.username}`);
        this.toggleMode();
        // pre-fill the username in the login form
        this.loginForm.patchValue({ username: user.username });
      },
      error: (error) => {
        this.toast.error(error.message || 'Signup failed. Please try again.');
        this.loading = false;
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
