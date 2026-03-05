import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ConceptoCatalogoFullDto } from "../../models/concepto/ConceptoCatalogoFullDto";
import { CrearConceptoCatalogoFullRequest } from "../../models/concepto/CrearConceptoCatalogoFullRequest";

@Injectable({ providedIn: 'root' })
export class ConceptoCatalogoService {
  private readonly BASE = `${environment.facturacionUrl}/api/ConceptosCatalogo`;

  constructor(private http: HttpClient) {}

  listar(rfcId?: number): Observable<ConceptoCatalogoFullDto[]> {
    const p = rfcId ? `?rfcId=${rfcId}` : '';
    return this.http.get<ConceptoCatalogoFullDto[]>(`${this.BASE}${p}`);
  }

  obtener(id: number): Observable<ConceptoCatalogoFullDto> {
    return this.http.get<ConceptoCatalogoFullDto>(`${this.BASE}/${id}`);
  }

  crear(req: CrearConceptoCatalogoFullRequest): Observable<ConceptoCatalogoFullDto> {
    return this.http.post<ConceptoCatalogoFullDto>(this.BASE, req);
  }

  actualizar(id: number, req: CrearConceptoCatalogoFullRequest): Observable<ConceptoCatalogoFullDto> {
    return this.http.put<ConceptoCatalogoFullDto>(`${this.BASE}/${id}`, req);
  }

  archivar(id: number): Observable<ConceptoCatalogoFullDto> {
    return this.http.post<ConceptoCatalogoFullDto>(`${this.BASE}/${id}/archivar`, {});
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}




























