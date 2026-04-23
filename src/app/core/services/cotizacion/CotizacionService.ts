import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Cotizacion, CotizacionList,
  CrearCotizacionRequest, ActualizarCotizacionRequest
} from '../../models/cotizacion/Cotizacion';

@Injectable({ providedIn: 'root' })
export class CotizacionService {
  private readonly BASE = `${environment.facturacionUrl}/api/Cotizaciones`;

  constructor(private http: HttpClient) {}

  listar(): Observable<CotizacionList[]> {
    return this.http.get<CotizacionList[]>(this.BASE);
  }

  obtener(id: number): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.BASE}/${id}`);
  }

  crear(req: CrearCotizacionRequest): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(this.BASE, req);
  }

  actualizar(id: number, req: ActualizarCotizacionRequest): Observable<Cotizacion> {
    return this.http.put<Cotizacion>(`${this.BASE}/${id}`, req);
  }

  cambiarEstado(id: number, accion: string): Observable<Cotizacion> {
    return this.http.patch<Cotizacion>(`${this.BASE}/${id}/estado`, { accion });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  pdfUrl(id: number): string {
    return `${this.BASE}/${id}/pdf`;
  }
}
