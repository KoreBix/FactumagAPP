import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { MessageResponse } from "../../models/Paginación/MessageResponse";
import { SerieConfig } from "../../models/serie/SerieConfig";
import { CrearSerieRequest } from "../../models/serie/CrearSerieRequest";
import { ActualizarSerieRequest } from "../../models/serie/ActualizarSerieRequest";

@Injectable({ providedIn: 'root' })
export class SerieService {
  private readonly BASE = `${environment.facturacionUrl}/api/Series`;

  constructor(private http: HttpClient) {}

  listar(rfcId?: number): Observable<SerieConfig[]> {
    const params = rfcId ? `?rfcId=${rfcId}` : '';
    return this.http.get<SerieConfig[]>(`${this.BASE}${params}`);
  }

  listarPorRfc(rfcId: number): Observable<SerieConfig[]> {
    return this.http.get<SerieConfig[]>(`${this.BASE}?rfcId=${rfcId}`);
  }

  obtener(id: number): Observable<SerieConfig> {
    return this.http.get<SerieConfig>(`${this.BASE}/${id}`);
  }

  crear(req: CrearSerieRequest): Observable<SerieConfig> {
    return this.http.post<SerieConfig>(this.BASE, req);
  }

  actualizar(id: number, req: ActualizarSerieRequest): Observable<SerieConfig> {
    return this.http.put<SerieConfig>(`${this.BASE}/${id}`, req);
  }

  archivar(id: number): Observable<SerieConfig> {
    return this.http.post<SerieConfig>(`${this.BASE}/${id}/archivar`, {});
  }

  resetFolio(id: number): Observable<SerieConfig> {
    return this.http.post<SerieConfig>(`${this.BASE}/${id}/reset-folio`, {});
  }
}
