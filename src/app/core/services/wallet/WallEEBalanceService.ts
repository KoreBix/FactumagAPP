import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../Auth/AuthService';

export interface WallEEBalance {
  walletId:      number;
  walletType:    'tenant' | 'personal';
  ownerId:       number;
  saldoBolsa:    number;
  saldoPlan:     number;
  saldoTotal:    number;
  planMesActual: string | null;
  fallbackEnabled?: boolean;
}

export interface WallEETx {
  id:        number;
  tipo:      'credito' | 'debito';
  fuente:    'bolsa' | 'plan' | 'bonus';
  cantidad:  number;
  saldoNuevo:number;
  concepto:  string;
  appSource:  string;
  createdAt: string;
}

export interface WallEEPagedTx {
  data:       WallEETx[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class WallEEBalanceService {

  private readonly base = environment.walletUrl;

  private _tenant   = signal<WallEEBalance | null>(null);
  private _personal = signal<WallEEBalance | null>(null);
  private _loaded   = signal(false);

  tenantBalance   = this._tenant.asReadonly();
  personalBalance = this._personal.asReadonly();
  loaded          = this._loaded.asReadonly();

  total = computed(() =>
    (this._tenant()?.saldoTotal  ?? 0) +
    (this._personal()?.saldoTotal ?? 0)
  );

  alerta = computed(() => {
    const t = this._tenant()?.saldoTotal   ?? 0;
    const p = this._personal()?.saldoTotal ?? 0;
    if (t === 0 && p === 0) return 'Sin timbres disponibles';
    if (t > 0 && t <= 10)  return `Empresa: ${t} timbres restantes`;
    if (t === 0 && p <= 10 && p > 0) return `Bolsa general: ${p} timbres`;
    return null;
  });

  constructor(private http: HttpClient, private auth: AuthService) {}

  load(): void {
    const user = this.auth.currentUser();
    const tenantId = user?.tenantId;
    const userId   = user?.id;

    if (tenantId) {
      this.http.get<WallEEBalance>(
        `${this.base}/balance/tenant/${tenantId}`,
        { headers: this.headers() }
      ).subscribe({ next: b => this._tenant.set(b), error: () => {} });
    }

    if (userId) {
      this.http.get<WallEEBalance>(
        `${this.base}/balance/personal/${userId}`,
        { headers: this.headers() }
      ).subscribe({
        next: b => { this._personal.set(b); this._loaded.set(true); },
        error: () => this._loaded.set(true)
      });
    }
  }

  getTransactions(walletId: number, page = 1, pageSize = 20): Observable<WallEEPagedTx> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<WallEEPagedTx>(
      `${this.base}/transactions/${walletId}`,
      { headers: this.headers(), params }
    );
  }

  private headers(): HttpHeaders {
    const token = this.auth.getToken() ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}
