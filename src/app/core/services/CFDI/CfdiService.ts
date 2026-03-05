
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CfdiList } from '../../models/CFDI/CfdiList';
import { PagedResponse } from '../../models/Paginación/PagedResponse';
import { CfdiDetalle } from '../../models/CFDI/CfdiDetalle';
import { EmitirCfdiRequest } from '../../models/CFDI/EmitirCfdiRequest';
import { MessageResponse } from '../../models/Paginación/MessageResponse';

@Injectable({ providedIn: 'root' })
export class CfdiService {
  private readonly BASE = `${environment.facturacionUrl}/api/Cfdi`;

  constructor(private http: HttpClient) {}

  listar(filtros?: {
    rfcId?: number; estado?: string; tipo?: string;
    desde?: string; hasta?: string; page?: number; pageSize?: number;
  }): Observable<PagedResponse<CfdiList>> {
    let params = new HttpParams();
    if (filtros?.rfcId)    params = params.set('rfcId',    filtros.rfcId);
    if (filtros?.estado)   params = params.set('estado',   filtros.estado);
    if (filtros?.tipo)     params = params.set('tipo',     filtros.tipo);
    if (filtros?.desde)    params = params.set('desde',    filtros.desde);
    if (filtros?.hasta)    params = params.set('hasta',    filtros.hasta);
    params = params.set('page',     filtros?.page     ?? 1);
    params = params.set('pageSize', filtros?.pageSize ?? 20);
    return this.http.get<PagedResponse<CfdiList>>(this.BASE, { params });
  }

  obtener(id: number): Observable<CfdiDetalle> {
    return this.http.get<CfdiDetalle>(`${this.BASE}/${id}`);
  }

  emitir(req: EmitirCfdiRequest): Observable<CfdiDetalle> {
    return this.http.post<CfdiDetalle>(`${this.BASE}/emitir`, req);
  }

  cancelar(id: number, motivo: string, folioSustitucion?: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.BASE}/${id}/cancelar`,
      { motivo, folioSustitucion });
  }

  descargarXml(id: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/${id}/descargar/xml`, { responseType: 'blob' });
  }

  descargarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/${id}/descargar/pdf`, { responseType: 'blob' });
  }

  descargarArchivo(blob: Blob, nombre: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
  preview(req: any): Observable<Blob> {
    return this.http.post(`${this.BASE}/preview`, req, { responseType: 'blob' });
  }
}















