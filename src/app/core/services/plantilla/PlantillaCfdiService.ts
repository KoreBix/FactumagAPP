import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PlantillaCfdi, CrearPlantillaCfdiRequest, ActualizarPlantillaCfdiRequest } from '../../models/plantilla/PlantillaCfdi';

@Injectable({ providedIn: 'root' })
export class PlantillaCfdiService {
  private readonly BASE = `${environment.facturacionUrl}/api/PlantillasCfdi`;

  constructor(private http: HttpClient) {}

  listar(): Observable<PlantillaCfdi[]> {
    return this.http.get<PlantillaCfdi[]>(this.BASE);
  }

  obtener(id: number): Observable<PlantillaCfdi> {
    return this.http.get<PlantillaCfdi>(`${this.BASE}/${id}`);
  }

  crear(req: CrearPlantillaCfdiRequest): Observable<PlantillaCfdi> {
    return this.http.post<PlantillaCfdi>(this.BASE, req);
  }

  actualizar(id: number, req: ActualizarPlantillaCfdiRequest): Observable<PlantillaCfdi> {
    return this.http.put<PlantillaCfdi>(`${this.BASE}/${id}`, req);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
