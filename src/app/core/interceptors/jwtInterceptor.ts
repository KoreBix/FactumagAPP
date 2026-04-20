import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/Auth/AuthService';

const LOG = '[JwtInterceptor]';

// ── JWT Interceptor ───────────────────────────────────────────────────────────
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // ── Rutas SSO no necesitan token ni manejo de 401 ─────────────────────────
    if (req.url.includes('/sso/') || window.location.pathname.startsWith('/sso/')) {
      return next.handle(req);
    }

    const token = this.auth.getToken();

    // ── Log de salida ─────────────────────────────────────────────────────────
    const tokenResumen = token
      ? `${token.substring(0, 20)}... (${token.length} chars)`
      : 'SIN TOKEN';
    console.groupCollapsed(`${LOG} → ${req.method} ${req.url}`);
    console.log('Token:', tokenResumen);
    console.log('Hora:', new Date().toISOString());
    console.groupEnd();

    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(req).pipe(
      tap({
        next: (event: any) => {
          if (event?.status) {
            console.log(`${LOG} ✅ ${req.method} ${req.url} → ${event.status}`);
          }
        }
      }),
      catchError((err: HttpErrorResponse) => {
        // ── Log detallado de error ────────────────────────────────────────────
        console.group(`${LOG} ❌ ERROR ${err.status} — ${req.method} ${req.url}`);
        console.log('Status:', err.status, err.statusText);
        console.log('URL:', err.url);
        console.log('Hora:', new Date().toISOString());
        console.log('Token enviado:', tokenResumen);
        console.log('Body del error:', err.error);
        console.log('Headers de la request:', req.headers.keys());

        if (err.status === 401) {
          const path = window.location.pathname;
          console.warn(`${LOG} 🔐 401 detectado en "${path}" — se va a hacer logout`);
          console.warn('Posibles causas: token expirado, token inválido, endpoint requiere auth diferente');

          if (!path.startsWith('/sso/') && !path.startsWith('/auth/')) {
            console.warn(`${LOG} 🚪 Ejecutando logout...`);
            this.auth.logout();
          } else {
            console.warn(`${LOG} ⏭ Logout omitido (ruta pública: ${path})`);
          }
        }
        console.groupEnd();

        return throwError(() => err);
      })
    );
  }
}

// ── Auth Guard ────────────────────────────────────────────────────────────────
export const authGuard: CanActivateFn = (route, state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  // ── Rutas públicas — no requieren auth ───────────────────────────────────
  if (state.url.startsWith('/sso/')) return true;
  if (state.url.startsWith('/auth/')) return true;

  if (auth.isLoggedIn()) return true;

  // ── Leer token del SSO si viene en la URL ────────────────────────────────
  const params    = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') ?? '';
  let token       = params.get('token');

  if (!token && returnUrl) {
    const match = decodeURIComponent(returnUrl).match(/[?&]token=([^&]+)/);
    if (match) token = match[1];
  }

  if (token) {
    auth.inicializarDesdeSso(token);
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// ── Guest Guard ───────────────────────────────────────────────────────────────
export const guestGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return true;
  router.navigate(['/dashboard']);
  return false;
};