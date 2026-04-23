import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../../models/Paginación/PagedResponse';

export interface PagoCxc {
  id: string;           // hash-encoded (never a raw number)
  monto: number;
  formaPago: string;
  formaPagoLabel: string;
  fecha: string;
  referencia?: string;
  cfdiComplementoId?: number;
  cfdiComplementoUuid?: string;
  complementoEstado?: string; // null=N/A | 'Pendiente' | 'Timbrado' | 'Error'
  comprobanteUrl?: string;
  createdAt: string;
}

export interface CxcItem {
  id: string;           // hash-encoded (used as route param)
  cfdiId: number;
  cfdiUuid?: string;
  receptorNombre: string;
  receptorRfc: string;
  metodoPago: string;
  monto: number;
  saldoPendiente: number;
  totalPagado: number;
  estado: 'Pendiente' | 'ParcialmentePagado' | 'Pagado' | 'Vencido';
  fechaVencimiento?: string;
  createdAt: string;
  pagos: PagoCxc[];
}

export interface CxcResumen {
  totalPendiente: number;
  totalVencido:   number;
  totalParcial:   number;
  totalCobrado:   number;
  countPendiente: number;
  countVencido:   number;
  countParcial:   number;
  countCobrado:   number;
}

@Injectable({ providedIn: 'root' })
export class CxcService {
  private readonly BASE = `${environment.facturacionUrl}/api/Cxc`;

  constructor(private http: HttpClient) {}

  listar(filtros?: {
    rfcId?: number; estado?: string;
    desde?: string; hasta?: string;
    page?: number; pageSize?: number;
  }): Observable<PagedResponse<CxcItem>> {
    let params = new HttpParams();
    if (filtros?.rfcId)  params = params.set('rfcId',  filtros.rfcId);
    if (filtros?.estado) params = params.set('estado', filtros.estado);
    if (filtros?.desde)  params = params.set('desde',  filtros.desde);
    if (filtros?.hasta)  params = params.set('hasta',  filtros.hasta);
    params = params.set('page',     filtros?.page     ?? 1);
    params = params.set('pageSize', filtros?.pageSize ?? 20);
    return this.http.get<PagedResponse<CxcItem>>(this.BASE, { params });
  }

  resumen(rfcId?: number): Observable<CxcResumen> {
    let params = new HttpParams();
    if (rfcId) params = params.set('rfcId', rfcId);
    return this.http.get<CxcResumen>(`${this.BASE}/resumen`, { params });
  }

  obtener(id: string): Observable<CxcItem> {
    return this.http.get<CxcItem>(`${this.BASE}/${id}`);
  }

  actualizarVencimiento(id: string, fechaVencimiento: string): Observable<CxcItem> {
    return this.http.put<CxcItem>(`${this.BASE}/${id}/vencimiento`, { fechaVencimiento });
  }

  registrarPago(id: string, pago: {
    monto: number; formaPago: string; fecha: string; referencia?: string;
    generarComplementoPago?: boolean;
    comprobanteBase64?: string; comprobanteExtension?: string;
  }): Observable<CxcItem> {
    return this.http.post<CxcItem>(`${this.BASE}/${id}/pagos`, pago);
  }

  eliminarPago(id: string, pagoId: string): Observable<CxcItem> {
    return this.http.delete<CxcItem>(`${this.BASE}/${id}/pagos/${pagoId}`);
  }

  reintentarComplemento(id: string, pagoId: string): Observable<CxcItem> {
    return this.http.post<CxcItem>(`${this.BASE}/${id}/pagos/${pagoId}/complemento`, {});
  }

  descargarRecibo(id: string, pagoId: string): Observable<Blob> {
    return this.http.get(`${this.BASE}/${id}/pagos/${pagoId}/recibo`,
      { responseType: 'blob' });
  }

  descargarComprobante(id: string, pagoId: string): Observable<Blob> {
    return this.http.get(`${this.BASE}/${id}/pagos/${pagoId}/comprobante`,
      { responseType: 'blob' });
  }
}
