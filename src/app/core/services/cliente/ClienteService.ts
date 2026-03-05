import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { MessageResponse } from "../../models/Paginación/MessageResponse";
import { Cliente } from "../../models/cliente/Cliente";
import { CrearClienteRequest } from "../../models/cliente/CrearClienteRequest";
import { ClienteListDto } from "../../models/cliente/ClienteListDto";
import { ImportarClientesResult } from "../../models/cliente/ImportarClientesResult";

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly BASE = `${environment.facturacionUrl}/api/Clientes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<ClienteListDto[]> {
    return this.http.get<ClienteListDto[]>(this.BASE);
  }

  obtener(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.BASE}/${id}`);
  }

  crear(req: CrearClienteRequest): Observable<Cliente> {
    return this.http.post<Cliente>(this.BASE, req);
  }

  actualizar(id: number, req: CrearClienteRequest): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.BASE}/${id}`, req);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  importarXml(xmlContent: string, omitirExistentes: boolean): Observable<ImportarClientesResult> {
    return this.http.post<ImportarClientesResult>(`${this.BASE}/importar-xml`, {
      xmlContent, omitirExistentes
    });
  }
}

