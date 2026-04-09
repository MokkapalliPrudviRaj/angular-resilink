import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.getCurrentUser();
  
  if (!user) {
    router.navigate(['/']);
    return false;
  }
  
  const requiredRole = route.data['role'] as 'resident' | 'admin' | undefined;
  
  if (requiredRole && user.role !== requiredRole) {
    // If user is admin and page needs resident, allow it
    if (user.role === 'admin' && requiredRole === 'resident') {
      return true;
    }
    
    const path = user.role === 'admin' ? '/admin' : '/dashboard';
    router.navigate([path]);
    return false;
  }
  
  return true;
};

export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.getCurrentUser();
  
  if (user) {
    const path = user.role === 'admin' ? '/admin' : '/dashboard';
    router.navigate([path]);
    return false;
  }
  
  return true;
};
