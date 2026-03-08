import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/welcome/welcome.component').then(m => m.WelcomeComponent),
    canActivate: [publicGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/resident/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { role: 'resident' }
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard],
    data: { role: 'admin' },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/overview/admin-overview.component').then(m => m.AdminOverviewComponent)
      },
      {
        path: 'issues',
        loadComponent: () => import('./features/admin/issues/admin-issues.component').then(m => m.AdminIssuesComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./features/admin/staff/admin-staff.component').then(m => m.AdminStaffComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
