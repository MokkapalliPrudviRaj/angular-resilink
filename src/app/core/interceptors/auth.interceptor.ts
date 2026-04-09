import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getAuthToken();

    console.log(`[AuthInterceptor] Intercepting: ${req.method} ${req.url}`);

    if (token) {
        console.log(`[AuthInterceptor] Attaching token (length: ${token.length}) to ${req.url}`);
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        return next(cloned);
    } else {
        console.warn(`[AuthInterceptor] !!! NO TOKEN FOR REQUEST !!!: ${req.url}`);
    }

    return next(req);
};
