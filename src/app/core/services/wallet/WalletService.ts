import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Wallet } from '../../models/Wallet/Wallet';
import { Transaccion } from '../../models/Wallet/Transaccion';
import { PagedResponse } from '../../models/Paginación/PagedResponse';
import { MessageResponse } from '../../models/Paginación/MessageResponse';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly BASE = `${environment.facturacionUrl}/api/Wallet`;

  constructor(private http: HttpClient) {}

  saldos(): Observable<Wallet[]> {
    return this.http.get<Wallet[]>(`${this.BASE}/saldos`);
  }

  transacciones(walletId: number, page = 1, pageSize = 20): Observable<PagedResponse<Transaccion>> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<PagedResponse<Transaccion>>(
      `${this.BASE}/${walletId}/transacciones`, { params });
  }

  asignarARfc(rfcId: number, cantidad: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.BASE}/asignar-a-rfc`, { rfcId, cantidad });
  }
}