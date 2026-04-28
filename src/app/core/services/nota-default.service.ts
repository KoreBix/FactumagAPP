import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const CLAVE = 'nota_default_cfdi';
const LS_KEY = 'factumag_nota_default';
const BASE = `${environment.facturacionUrl}/api/config`;

@Injectable({ providedIn: 'root' })
export class NotaDefaultService {
  constructor(private http: HttpClient) {}

  /** Returns cached value immediately, refreshes from API in background */
  getCached(): string {
    return localStorage.getItem(LS_KEY) ?? '';
  }

  /** Fetches from API; updates localStorage cache */
  loadFromApi(): Observable<string> {
    return this.http.get<{ valor: string | null }>(`${BASE}/${CLAVE}`).pipe(
      map(r => r.valor ?? ''),
      tap(v => {
        if (v) localStorage.setItem(LS_KEY, v);
        else   localStorage.removeItem(LS_KEY);
      }),
      catchError(() => of(this.getCached()))
    );
  }

  /** Saves to API and updates localStorage cache */
  save(text: string): Observable<void> {
    const v = text.trim();
    if (v) localStorage.setItem(LS_KEY, v);
    else   localStorage.removeItem(LS_KEY);

    return this.http.put<void>(`${BASE}/${CLAVE}`, { valor: v }).pipe(
      catchError(() => of(undefined))
    );
  }
}
