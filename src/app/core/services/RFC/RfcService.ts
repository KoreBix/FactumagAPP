
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

const LOG = '[RfcService]';
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
    console.group(`${LOG} subirCsd — RFC #${id}`);
    console.log('Endpoint:', `${this.BASE}/${id}/csd`);
    console.log('Vigencia:', req.vigencia);
    console.log('CER length:', req.certificadoBase64?.length ?? 0, 'chars base64');
    console.log('KEY length:', req.llaveBase64?.length ?? 0, 'chars base64');
    console.log('Password presente:', !!req.password);
    console.groupEnd();

    return this.http.post<MessageResponse>(`${this.BASE}/${id}/csd`, req).pipe(
      tap(res  => console.log(`${LOG} subirCsd ✅`, res)),
      catchError(err => {
        console.error(`${LOG} subirCsd ❌ status=${err.status}`, err.error);
        return throwError(() => err);
      })
    );
  }

  subirLogo(id: number, logoBase64: string, extension: string): Observable<MessageResponse> {
    console.group(`${LOG} subirLogo — RFC #${id}`);
    console.log('Endpoint:', `${this.BASE}/${id}/logo`);
    console.log('Extensión:', extension);
    console.log('Base64 length:', logoBase64?.length ?? 0, 'chars');
    console.log('Hora:', new Date().toISOString());
    console.groupEnd();

    return this.http.post<MessageResponse>(`${this.BASE}/${id}/logo`, { logoBase64, extension }).pipe(
      tap(res  => console.log(`${LOG} subirLogo ✅`, res)),
      catchError(err => {
        console.error(`${LOG} subirLogo ❌ status=${err.status}`, err.error);
        return throwError(() => err);
      })
    );
  }

  setDefault(id: number): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.BASE}/${id}/set-default`, {});
  }

  eliminarLogo(id: number): Observable<MessageResponse> {
    console.log(`${LOG} eliminarLogo — RFC #${id}`);
    return this.http.delete<MessageResponse>(`${this.BASE}/${id}/logo`).pipe(
      tap(res  => console.log(`${LOG} eliminarLogo ✅`, res)),
      catchError(err => {
        console.error(`${LOG} eliminarLogo ❌ status=${err.status}`, err.error);
        return throwError(() => err);
      })
    );
  }
}