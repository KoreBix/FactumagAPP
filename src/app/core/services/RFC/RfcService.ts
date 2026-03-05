
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RfcList } from '../../models/RFC/RfcList';
import { Rfc } from '../../models/RFC/Rfc';
import { CrearRfcRequest } from '../../models/RFC/CrearRfcRequest';
import { SubirCsdRequest } from '../../models/RFC/SubirCsdRequest.';
import { MessageResponse } from '../../models/Paginación/MessageResponse';
import { Wallet } from '../../models/Wallet/Wallet';
import { PagedResponse } from '../../models/Paginación/PagedResponse';
import { Transaccion } from '../../models/Wallet/Transaccion';


@Injectable({ providedIn: 'root' })
export class RfcService {
  private readonly BASE = `${environment.facturacionUrl}/api/Rfc`;

  constructor(private http: HttpClient) {}

  listar(): Observable<RfcList[]> {
    return this.http.get<RfcList[]>(this.BASE);
  }

  obtener(id: number): Observable<Rfc> {
    return this.http.get<Rfc>(`${this.BASE}/${id}`);
  }

  crear(req: CrearRfcRequest): Observable<Rfc> {
    return this.http.post<Rfc>(this.BASE, req);
  }

  actualizar(id: number, req: Partial<CrearRfcRequest>): Observable<Rfc> {
    return this.http.put<Rfc>(`${this.BASE}/${id}`, req);
  }

  subirCsd(id: number, req: SubirCsdRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.BASE}/${id}/csd`, req);
  }

  subirLogo(id: number, logoBase64: string, extension: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.BASE}/${id}/logo`, { logoBase64, extension });
  }

  eliminarLogo(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.BASE}/${id}/logo`);
  }
}