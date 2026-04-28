import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardResumen {
  cfdisMes:      number;
  cfdisHoy:      number;
  clientesTotal: number;
  rfcsTotal:     number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly BASE = `${environment.facturacionUrl}/api/Dashboard`;

  constructor(private http: HttpClient) {}

  getResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(`${this.BASE}/resumen`);
  }
}
