import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatIconModule,
        RouterLink,
        ButtonComponent
    ],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
    forgotForm: FormGroup;
    loading = false;
    submitted = false;
    email = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private toast: ToastService
    ) {
        this.forgotForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    async handleSubmit() {
        if (this.forgotForm.invalid) return;

        this.loading = true;
        this.email = this.forgotForm.value.email;

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        this.toast.success('Check your email for password reset instructions.');

        this.submitted = true;
        this.loading = false;
    }

    toggleSubmitted() {
        this.submitted = !this.submitted;
        if (!this.submitted) {
            this.forgotForm.reset();
        }
    }

    goBackToLogin() {
        this.router.navigate(['/login']);
    }
}
